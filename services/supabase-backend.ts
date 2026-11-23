import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { validateGamertag } from "@/lib/gamertag";
import { weekEndUtc, weekStartUtc } from "@/lib/time";
import type {
  AnswerResult,
  GameModeId,
  LeaderboardEntry,
  LeaderboardPeriod,
  LeaderboardResult,
  PlayerState,
  RankSnapshot,
  RoundKind,
  RoundResult,
  XpReason,
} from "@/types";
import { type Backend, type CompleteRoundInput, GamertagTakenError, type SubmitAnswerInput } from "./backend";

/**
 * Live backend. Identity is a Supabase anonymous session persisted in this browser.
 * All competitive writes go through SECURITY DEFINER database functions that validate
 * answers and award XP server-side; the client never sends XP values.
 */
export class SupabaseBackend implements Backend {
  readonly mode = "live" as const;
  private sb: SupabaseClient;

  constructor(url: string, anonKey: string) {
    this.sb = createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: "designxp-auth" },
    });
  }

  private async userId(): Promise<string | null> {
    const { data } = await this.sb.auth.getSession();
    return data.session?.user.id ?? null;
  }

  private async ensureSession(): Promise<string> {
    const existing = await this.userId();
    if (existing) return existing;
    const { data, error } = await this.sb.auth.signInAnonymously();
    if (error || !data.user) throw new Error(error?.message ?? "Could not start an anonymous session.");
    return data.user.id;
  }

  async loadPlayer(): Promise<PlayerState | null> {
    const uid = await this.userId();
    if (!uid) return null;
    const [player, attempts, xp, concepts, achievements, activity, rounds] = await Promise.all([
      this.sb.from("players").select("*").eq("id", uid).maybeSingle(),
      this.sb.from("question_attempts").select("*").eq("player_id", uid).order("created_at"),
      this.sb.from("xp_transactions").select("*").eq("player_id", uid).order("created_at"),
      this.sb.from("unlocked_concepts").select("*").eq("player_id", uid),
      this.sb.from("achievements").select("*").eq("player_id", uid),
      this.sb.from("daily_activity").select("*").eq("player_id", uid),
      this.sb.from("round_completions").select("*").eq("player_id", uid).order("completed_at"),
    ]);
    const firstError = [player, attempts, xp, concepts, achievements, activity, rounds].find((r) => r.error)?.error;
    if (firstError) throw new Error(firstError.message);
    if (!player.data) return null;
    const weekStart = weekStartUtc().toISOString();
    const xpRows = (xp.data ?? []).map((t) => ({
      amount: t.amount as number,
      reason: t.reason as XpReason,
      ref: t.ref as string,
      at: t.created_at as string,
    }));
    return {
      profile: {
        id: player.data.id,
        gamertag: player.data.gamertag,
        characterId: player.data.character_id,
        createdAt: player.data.created_at,
      },
      totalXp: player.data.total_xp,
      weeklyXp: xpRows.filter((t) => new Date(t.at).toISOString() >= weekStart).reduce((s, t) => s + t.amount, 0),
      attempts: (attempts.data ?? []).map((a) => ({
        questionId: a.question_id,
        roundId: a.round_id,
        selected: a.selected,
        correct: a.is_correct,
        gameMode: a.game_mode as GameModeId,
        at: a.created_at,
      })),
      xp: xpRows,
      unlockedConcepts: (concepts.data ?? []).map((c) => ({ conceptId: c.concept_id, at: c.unlocked_at })),
      achievements: (achievements.data ?? []).map((a) => ({ achievementId: a.achievement_id, at: a.unlocked_at })),
      activityDates: (activity.data ?? []).map((d) => d.activity_date),
      rounds: (rounds.data ?? []).map((r) => ({
        roundId: r.id,
        kind: r.kind as RoundKind,
        gameMode: r.game_mode,
        questionCount: r.question_count,
        correctCount: r.correct_count,
        xpEarned: r.xp_earned,
        at: r.completed_at,
      })),
    };
  }

  async isGamertagAvailable(tag: string) {
    await this.ensureSession();
    const { data, error } = await this.sb.rpc("is_gamertag_available", { p_gamertag: tag.trim() });
    if (error) throw new Error(error.message);
    return Boolean(data);
  }

  private mapError(message: string): Error {
    if (message.includes("GAMERTAG_TAKEN")) return new GamertagTakenError();
    if (message.includes("GAMERTAG_INVALID")) return new Error("That gamertag isn't valid.");
    return new Error(message);
  }

  async createPlayer(tag: string, characterId: string) {
    const v = validateGamertag(tag);
    if (!v.ok) throw new Error(v.message);
    await this.ensureSession();
    const { error } = await this.sb.rpc("create_player", { p_gamertag: tag.trim(), p_character_id: characterId });
    if (error) throw this.mapError(error.message);
    const p = await this.loadPlayer();
    if (!p) throw new Error("Player was not created.");
    return p;
  }

  async updateProfile(changes: { gamertag?: string; characterId?: string }) {
    if (changes.gamertag !== undefined) {
      const v = validateGamertag(changes.gamertag);
      if (!v.ok) throw new Error(v.message);
    }
    const { error } = await this.sb.rpc("update_player_profile", {
      p_gamertag: changes.gamertag?.trim() ?? null,
      p_character_id: changes.characterId ?? null,
    });
    if (error) throw this.mapError(error.message);
    const p = await this.loadPlayer();
    if (!p) throw new Error("Player not found.");
    return p;
  }

  async submitAnswer({ roundId, questionId, selected }: SubmitAnswerInput): Promise<AnswerResult> {
    const { data, error } = await this.sb.rpc("submit_answer", {
      p_round_id: roundId,
      p_question_id: questionId,
      p_selected: selected,
    });
    if (error) throw new Error(error.message);
    const player = await this.loadPlayer();
    if (!player) throw new Error("Player not found.");
    return {
      correct: data.correct,
      correctAnswers: data.correct_answers,
      xpForAnswer: data.xp_answer,
      conceptUnlocked: data.concept_unlocked,
      xpForConcept: data.xp_concept,
      alreadyEarned: data.already_earned,
      newAchievements: data.new_achievements ?? [],
      player,
    };
  }

  async completeRound({ roundId, kind, gameMode }: CompleteRoundInput): Promise<RoundResult> {
    const { data, error } = await this.sb.rpc("complete_round", {
      p_round_id: roundId,
      p_kind: kind,
      p_game_mode: gameMode,
    });
    if (error) throw new Error(error.message);
    const [player, rank] = await Promise.all([this.loadPlayer(), this.getMyRanks()]);
    if (!player) throw new Error("Player not found.");
    return {
      roundBonus: data.round_bonus,
      dailyBonus: data.daily_bonus,
      roundBonusAlreadyClaimed: data.round_bonus_already_claimed,
      newAchievements: data.new_achievements ?? [],
      player,
      rank,
    };
  }

  async getLeaderboard(period: LeaderboardPeriod, limit = 10): Promise<LeaderboardResult> {
    const uid = await this.userId();
    const p = period === "weekly" ? "weekly" : "all_time";
    const [board, me, count] = await Promise.all([
      this.sb.rpc("get_leaderboard", { p_period: p, p_limit: limit }),
      uid ? this.sb.rpc("get_my_rank", { p_period: p }) : Promise.resolve({ data: null, error: null }),
      this.sb.rpc("count_players"),
    ]);
    const err = board.error ?? me.error ?? count.error;
    if (err) throw new Error(err.message);
    type Row = { rank: number; player_id: string; gamertag: string; character_id: string; current_level: number; xp: number };
    const map = (r: Row): LeaderboardEntry => ({
      rank: Number(r.rank),
      playerId: r.player_id,
      gamertag: r.gamertag,
      characterId: r.character_id,
      level: r.current_level,
      xp: Number(r.xp),
      isDemo: false,
      isCurrentPlayer: r.player_id === uid,
    });
    const meRow = Array.isArray(me.data) ? (me.data[0] as Row | undefined) : undefined;
    return {
      period,
      entries: ((board.data ?? []) as Row[]).map(map),
      me: meRow ? map(meRow) : null,
      totalPlayers: Number(count.data ?? 0),
      weekStart: weekStartUtc().toISOString(),
      weekEnd: weekEndUtc().toISOString(),
    };
  }

  async getMyRanks(): Promise<RankSnapshot> {
    const [w, a] = await Promise.all([
      this.sb.rpc("get_my_rank", { p_period: "weekly" }),
      this.sb.rpc("get_my_rank", { p_period: "all_time" }),
    ]);
    if (w.error || a.error) return { weekly: null, allTime: null };
    const rank = (d: unknown) => (Array.isArray(d) && d[0] ? Number((d[0] as { rank: number }).rank) : null);
    return { weekly: rank(w.data), allTime: rank(a.data) };
  }

  async resetLocal() {
    await this.sb.auth.signOut();
    window.localStorage.removeItem("designxp-auth");
  }
}

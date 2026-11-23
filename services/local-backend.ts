import { DEMO_PLAYERS } from "@/data/demo-leaderboard";
import { XP_RULES } from "@/data/progression";
import { validateGamertag, normalizeGamertag } from "@/lib/gamertag";
import { levelForXp } from "@/lib/levels";
import { qualifyingAchievements } from "@/lib/player-stats";
import { dailyQuestion, getQuestion, isAnswerCorrect } from "@/lib/quiz-engine";
import { utcDateKey, weekEndUtc, weekStartUtc } from "@/lib/time";
import type {
  AnswerResult,
  LeaderboardEntry,
  LeaderboardPeriod,
  LeaderboardResult,
  PlayerState,
  RankSnapshot,
  RoundResult,
  XpReason,
} from "@/types";
import { type Backend, type CompleteRoundInput, GamertagTakenError, type SubmitAnswerInput } from "./backend";

const STORAGE_KEY = "designxp:demo-player:v1";

type StoredPlayer = Omit<PlayerState, "weeklyXp" | "totalXp">;

function read(): StoredPlayer | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredPlayer) : null;
  } catch {
    return null;
  }
}

function write(p: StoredPlayer) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

function hydrate(p: StoredPlayer): PlayerState {
  const weekStart = weekStartUtc().toISOString();
  return {
    ...p,
    totalXp: p.xp.reduce((s, t) => s + t.amount, 0),
    weeklyXp: p.xp.filter((t) => t.at >= weekStart).reduce((s, t) => s + t.amount, 0),
  };
}

function hasTx(p: StoredPlayer, reason: XpReason, ref: string) {
  return p.xp.some((t) => t.reason === reason && t.ref === ref);
}

function award(p: StoredPlayer, amount: number, reason: XpReason, ref: string): number {
  // Mirrors the unique (player_id, reason, ref) constraint in the database.
  if (hasTx(p, reason, ref)) return 0;
  p.xp.push({ amount, reason, ref, at: new Date().toISOString() });
  return amount;
}

function syncAchievements(p: StoredPlayer): string[] {
  const state = hydrate(p);
  const have = new Set(p.achievements.map((a) => a.achievementId));
  const fresh = qualifyingAchievements(state).filter((id) => !have.has(id));
  const at = new Date().toISOString();
  for (const id of fresh) p.achievements.push({ achievementId: id, at });
  return fresh;
}

function isDemoNameTaken(tag: string): boolean {
  const n = normalizeGamertag(tag);
  return DEMO_PLAYERS.some((d) => normalizeGamertag(d.gamertag) === n);
}

/**
 * Demo-mode backend: everything is stored in this browser's localStorage.
 * The XP rules are identical to the Supabase functions, but nothing here is shared or global.
 */
export class LocalBackend implements Backend {
  readonly mode = "demo" as const;

  async loadPlayer() {
    const p = read();
    return p ? hydrate(p) : null;
  }

  async isGamertagAvailable(tag: string) {
    const current = read();
    if (current && normalizeGamertag(current.profile.gamertag) === normalizeGamertag(tag)) return true;
    return !isDemoNameTaken(tag);
  }

  async createPlayer(tag: string, characterId: string) {
    const v = validateGamertag(tag);
    if (!v.ok) throw new Error(v.message);
    if (isDemoNameTaken(tag)) throw new GamertagTakenError();
    const p: StoredPlayer = {
      profile: {
        id: `local-${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Date.now()}`,
        gamertag: tag.trim(),
        characterId,
        createdAt: new Date().toISOString(),
      },
      attempts: [],
      xp: [],
      unlockedConcepts: [],
      achievements: [],
      activityDates: [],
      rounds: [],
    };
    write(p);
    return hydrate(p);
  }

  async updateProfile(changes: { gamertag?: string; characterId?: string }) {
    const p = read();
    if (!p) throw new Error("No player found.");
    if (changes.gamertag !== undefined) {
      const v = validateGamertag(changes.gamertag);
      if (!v.ok) throw new Error(v.message);
      if (isDemoNameTaken(changes.gamertag)) throw new GamertagTakenError();
      p.profile.gamertag = changes.gamertag.trim();
    }
    if (changes.characterId) p.profile.characterId = changes.characterId;
    write(p);
    return hydrate(p);
  }

  async submitAnswer({ roundId, questionId, selected }: SubmitAnswerInput): Promise<AnswerResult> {
    const p = read();
    if (!p) throw new Error("No player found.");
    const q = getQuestion(questionId);
    if (!q) throw new Error("Unknown question.");
    // One answer per question per round.
    const existing = p.attempts.find((a) => a.roundId === roundId && a.questionId === questionId);
    if (existing) throw new Error("This question was already answered in this round.");

    const answeredAt = new Date().toISOString();
    const correct = isAnswerCorrect(q, selected);
    const alreadyEarned = hasTx(p, "correct_answer", q.id);
    const xpForAnswer = correct ? award(p, XP_RULES.correctAnswer, "correct_answer", q.id) : 0;

    const conceptUnlocked = !p.unlockedConcepts.some((c) => c.conceptId === q.conceptId);
    let xpForConcept = 0;
    if (conceptUnlocked) {
      p.unlockedConcepts.push({ conceptId: q.conceptId, at: new Date().toISOString() });
      xpForConcept = award(p, XP_RULES.conceptUnlock, "concept_unlock", q.conceptId);
    }

    p.attempts.push({ questionId, roundId, selected, correct, gameMode: q.gameMode, at: answeredAt });
    const today = utcDateKey();
    if (!p.activityDates.includes(today)) p.activityDates.push(today);

    const newAchievements = syncAchievements(p);
    write(p);
    return {
      correct,
      correctAnswers: q.correctAnswers,
      xpForAnswer,
      conceptUnlocked,
      xpForConcept,
      alreadyEarned: correct && alreadyEarned,
      newAchievements,
      player: hydrate(p),
    };
  }

  async completeRound({ roundId, kind, gameMode }: CompleteRoundInput): Promise<RoundResult> {
    const p = read();
    if (!p) throw new Error("No player found.");
    const attempts = p.attempts.filter((a) => a.roundId === roundId);
    const today = utcDateKey();
    let roundBonus = 0;
    let dailyBonus = 0;
    let roundBonusAlreadyClaimed = false;

    if (!p.rounds.some((r) => r.roundId === roundId)) {
      const distinct = new Set(attempts.map((a) => a.questionId)).size;
      if (kind === "standard" && distinct >= XP_RULES.roundSize) {
        roundBonus = award(p, XP_RULES.roundComplete, "round_bonus", today);
        roundBonusAlreadyClaimed = roundBonus === 0;
      }
      if (kind === "daily" && attempts.some((a) => a.questionId === dailyQuestion().id)) {
        dailyBonus = award(p, XP_RULES.dailyChallenge, "daily_challenge", today);
      }
      // XP earned since the round's first answer (answer + concept XP + bonuses).
      const since = attempts.map((a) => a.at).sort()[0];
      const roundXp = since
        ? p.xp.filter((t) => t.at >= since).reduce((s, t) => s + t.amount, 0)
        : roundBonus + dailyBonus;
      p.rounds.push({
        roundId,
        kind,
        gameMode,
        questionCount: attempts.length,
        correctCount: attempts.filter((a) => a.correct).length,
        xpEarned: roundXp,
        at: new Date().toISOString(),
      });
    }
    const newAchievements = syncAchievements(p);
    write(p);
    return {
      roundBonus,
      dailyBonus,
      roundBonusAlreadyClaimed,
      newAchievements,
      player: hydrate(p),
      rank: await this.getMyRanks(),
    };
  }

  private board(period: LeaderboardPeriod): LeaderboardEntry[] {
    const p = read();
    const me = p ? hydrate(p) : null;
    const rows = DEMO_PLAYERS.map((d) => ({
      playerId: d.id,
      gamertag: d.gamertag,
      characterId: d.characterId,
      level: levelForXp(d.totalXp).level,
      xp: period === "weekly" ? d.weeklyXp : d.totalXp,
      isDemo: true,
      isCurrentPlayer: false,
    }));
    if (me)
      rows.push({
        playerId: me.profile.id,
        gamertag: me.profile.gamertag,
        characterId: me.profile.characterId,
        level: levelForXp(me.totalXp).level,
        xp: period === "weekly" ? me.weeklyXp : me.totalXp,
        isDemo: false,
        isCurrentPlayer: true,
      });
    // Ties: the earlier entry keeps the higher rank; the player is listed last so sample players win ties.
    // Weekly boards only rank players who earned XP this week (same rule as the SQL).
    return rows
      .filter((r) => period !== "weekly" || r.xp > 0)
      .sort((a, b) => b.xp - a.xp)
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }

  async getLeaderboard(period: LeaderboardPeriod, limit = 10): Promise<LeaderboardResult> {
    const all = this.board(period);
    return {
      period,
      entries: all.slice(0, limit),
      me: all.find((e) => e.isCurrentPlayer) ?? null,
      totalPlayers: all.length,
      weekStart: weekStartUtc().toISOString(),
      weekEnd: weekEndUtc().toISOString(),
    };
  }

  async getMyRanks(): Promise<RankSnapshot> {
    return {
      weekly: this.board("weekly").find((e) => e.isCurrentPlayer)?.rank ?? null,
      allTime: this.board("all-time").find((e) => e.isCurrentPlayer)?.rank ?? null,
    };
  }

  async resetLocal() {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

import { ACHIEVEMENTS } from "@/data/progression";
import type { GameModeId, PlayerState } from "@/types";
import { levelForXp } from "./levels";
import { currentStreak } from "./time";

export interface PlayerStats {
  questionsAnswered: number;
  uniqueQuestionsAnswered: number;
  correctAnswers: number;
  accuracy: number;
  conceptsUnlocked: number;
  achievements: number;
  streak: number;
  roundsCompleted: number;
  level: number;
  answeredByMode: Record<GameModeId, number>;
}

export function computeStats(p: PlayerState): PlayerStats {
  const answeredByMode = {
    "spot-the-ux": 0,
    "what-would-you-do": 0,
    "design-lingo": 0,
    "research-detective": 0,
    "copy-doctor": 0,
    "product-detective": 0,
  } as Record<GameModeId, number>;
  for (const a of p.attempts) answeredByMode[a.gameMode]++;
  const correct = p.attempts.filter((a) => a.correct).length;
  return {
    questionsAnswered: p.attempts.length,
    uniqueQuestionsAnswered: new Set(p.attempts.map((a) => a.questionId)).size,
    correctAnswers: correct,
    accuracy: p.attempts.length ? Math.round((correct / p.attempts.length) * 100) : 0,
    conceptsUnlocked: p.unlockedConcepts.length,
    achievements: p.achievements.length,
    streak: currentStreak(p.activityDates),
    // A completed round is a full standard round (same rule as the SQL).
    roundsCompleted: p.rounds.filter((r) => r.kind === "standard" && r.questionCount >= 5).length,
    level: levelForXp(p.totalXp).level,
    answeredByMode,
  };
}

/**
 * Achievement rules (mirrored by `refresh_achievements` in SQL).
 * Returns ids of every achievement the player currently qualifies for.
 */
export function qualifyingAchievements(p: PlayerState): string[] {
  const s = computeStats(p);
  const last5 = [...p.attempts].sort((a, b) => a.at.localeCompare(b.at)).slice(-5);
  const out: string[] = [];
  if (s.roundsCompleted >= 1) out.push("first-quest");
  if (last5.length === 5 && last5.every((a) => a.correct)) out.push("quick-thinker");
  if (p.rounds.some((r) => r.kind === "standard" && r.questionCount >= 5 && r.correctCount === r.questionCount))
    out.push("perfect-round");
  if (s.conceptsUnlocked >= 10) out.push("knowledge-hunter");
  if (s.answeredByMode["spot-the-ux"] >= 10) out.push("ux-detective");
  if (s.answeredByMode["what-would-you-do"] + s.answeredByMode["product-detective"] >= 10) out.push("product-mind");
  if (s.streak >= 3) out.push("design-streak");
  if (s.level >= 3) out.push("level-up");
  return out.filter((id) => ACHIEVEMENTS.some((a) => a.id === id));
}

export function recentQuestionIds(p: PlayerState, limit = 30): string[] {
  return [...p.attempts]
    .sort((a, b) => b.at.localeCompare(a.at))
    .map((a) => a.questionId)
    .filter((id, i, arr) => arr.indexOf(id) === i)
    .slice(0, limit);
}

export function masteredQuestionIds(p: PlayerState): Set<string> {
  return new Set(p.attempts.filter((a) => a.correct).map((a) => a.questionId));
}

import { QUESTIONS, QUESTIONS_BY_ID } from "@/data/questions";
import { XP_RULES } from "@/data/progression";
import type { GameModeId, QuestionWithConcept } from "@/types";
import { dayNumber } from "./time";

export function questionsForMode(mode: GameModeId | "quick-play"): QuestionWithConcept[] {
  return mode === "quick-play" ? QUESTIONS : QUESTIONS.filter((q) => q.gameMode === mode);
}

function shuffle<T>(arr: T[], rand: () => number = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface SelectOptions {
  mode: GameModeId | "quick-play";
  count?: number;
  /** Question ids seen recently, most recent first. They are pushed to the back of the queue. */
  recentIds?: string[];
  /** Question ids already answered correctly; fresh questions are preferred. */
  masteredIds?: Set<string>;
  rand?: () => number;
}

/**
 * Picks a round of unique questions:
 *  - never repeats a question within a round
 *  - prefers unseen, then unmastered, then least-recently-seen questions
 *  - balances subjects by taking at most one question per concept category before repeating a category
 */
export function selectRound({ mode, count = XP_RULES.roundSize, recentIds = [], masteredIds = new Set(), rand }: SelectOptions) {
  const pool = questionsForMode(mode);
  const recentRank = new Map(recentIds.map((id, i) => [id, i]));
  const scored = shuffle(pool, rand).map((q) => {
    const recent = recentRank.get(q.id);
    // Higher score = picked earlier.
    let score = 0;
    if (recent === undefined) score += 1000;
    else score += Math.min(recent, 999);
    if (!masteredIds.has(q.id)) score += 500;
    return { q, score };
  });
  scored.sort((a, b) => b.score - a.score);

  const picked: QuestionWithConcept[] = [];
  const usedCategories = new Set<string>();
  // First pass: one per category for balance.
  for (const { q } of scored) {
    if (picked.length >= count) break;
    if (usedCategories.has(q.category)) continue;
    usedCategories.add(q.category);
    picked.push(q);
  }
  // Second pass: fill remaining slots in score order.
  for (const { q } of scored) {
    if (picked.length >= count) break;
    if (!picked.includes(q)) picked.push(q);
  }
  return shuffle(picked, rand);
}

export function isAnswerCorrect(question: QuestionWithConcept, selected: string[]): boolean {
  const a = [...new Set(selected)].sort();
  const b = [...question.correctAnswers].sort();
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

/** The featured daily challenge question. Mirrored by `daily_question_id()` in SQL. */
export function dailyQuestion(date = new Date()): QuestionWithConcept {
  const ordered = [...QUESTIONS].sort((a, b) => a.sortOrder - b.sortOrder);
  return ordered[dayNumber(date) % ordered.length];
}

export function getQuestion(id: string): QuestionWithConcept | undefined {
  return QUESTIONS_BY_ID[id];
}

export function modeQuestionCount(mode: GameModeId): number {
  return questionsForMode(mode).length;
}

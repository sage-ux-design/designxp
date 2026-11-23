import { describe, expect, it } from "vitest";
import { CONCEPTS } from "@/data/concepts";
import { GAME_MODES } from "@/data/game-modes";
import { QUESTIONS } from "@/data/questions";
import source from "@/data/source-questions.json";
import { dailyQuestion, isAnswerCorrect, questionsForMode, selectRound } from "@/lib/quiz-engine";

describe("question database", () => {
  const pdf = QUESTIONS.filter((q) => q.source === "pdf");

  it("imports all 50 PDF questions exactly once", () => {
    expect(source).toHaveLength(50);
    expect(pdf).toHaveLength(50);
    expect(new Set(pdf.map((q) => q.sourceNumber)).size).toBe(50);
  });

  it("preserves PDF text, options, answers, explanations and takeaways verbatim", () => {
    for (const s of source) {
      const q = pdf.find((x) => x.sourceNumber === s.number)!;
      expect(q.question).toBe(s.question);
      expect(q.options).toEqual(s.options);
      expect(q.options).toHaveLength(4);
      expect(q.correctAnswers).toEqual([s.answer]);
      expect(q.explanation).toBe(s.why);
      expect(q.takeaway).toBe(s.takeaway);
    }
  });

  it("has unique ids and unique question text", () => {
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
    expect(new Set(QUESTIONS.map((q) => q.question)).size).toBe(QUESTIONS.length);
    expect(new Set(QUESTIONS.map((q) => q.sortOrder)).size).toBe(QUESTIONS.length);
  });

  it("gives every question complete learning metadata", () => {
    for (const q of QUESTIONS) {
      expect(q.concept, q.id).toBeTruthy();
      for (const k of ["simpleDefinition", "whyItMatters", "realWorldExample", "designerPhrase"] as const)
        expect(q.concept[k].length, `${q.id} ${k}`).toBeGreaterThan(10);
      expect(["easy", "medium", "hard"]).toContain(q.difficulty);
      expect(GAME_MODES.map((m) => m.id)).toContain(q.gameMode);
      expect(q.correctAnswers.length).toBeGreaterThan(0);
      for (const a of q.correctAnswers) expect(q.options.map((o) => o.key)).toContain(a);
      if (q.questionType === "true-false") expect(q.options.map((o) => o.key)).toEqual(["T", "F"]);
      if (q.questionType === "visual") expect(q.visual).toBeTruthy();
    }
  });

  it("only defines concepts that questions use", () => {
    const used = new Set(QUESTIONS.map((q) => q.conceptId));
    for (const c of CONCEPTS) expect(used.has(c.id), c.id).toBe(true);
    expect(new Set(CONCEPTS.map((c) => c.id)).size).toBe(CONCEPTS.length);
  });

  it("gives every game mode at least one full round of distinct questions", () => {
    for (const m of GAME_MODES) expect(questionsForMode(m.id).length, m.id).toBeGreaterThanOrEqual(5);
  });

  it("covers every question format", () => {
    const types = new Set(QUESTIONS.map((q) => q.questionType));
    expect([...types].sort()).toEqual(["multi", "single", "true-false", "visual"]);
  });
});

describe("quiz engine", () => {
  it("builds rounds of 5 unique questions from the selected mode only", () => {
    for (const m of GAME_MODES) {
      for (let i = 0; i < 25; i++) {
        const round = selectRound({ mode: m.id });
        expect(round).toHaveLength(5);
        expect(new Set(round.map((q) => q.id)).size).toBe(5);
        for (const q of round) expect(q.gameMode).toBe(m.id);
      }
    }
  });

  it("avoids recently seen questions when fresh ones exist", () => {
    const pool = questionsForMode("spot-the-ux");
    const recent = pool.slice(0, 5).map((q) => q.id);
    for (let i = 0; i < 20; i++) {
      const round = selectRound({ mode: "spot-the-ux", recentIds: recent });
      for (const q of round) expect(recent).not.toContain(q.id);
    }
  });

  it("marks every question's own answer key as correct and other answers as incorrect", () => {
    for (const q of QUESTIONS) {
      expect(isAnswerCorrect(q, q.correctAnswers), q.id).toBe(true);
      const wrong = q.options.find((o) => !q.correctAnswers.includes(o.key))!;
      expect(isAnswerCorrect(q, [wrong.key]), q.id).toBe(false);
      if (q.questionType === "multi") {
        expect(isAnswerCorrect(q, q.correctAnswers.slice(1)), `${q.id} partial`).toBe(false);
        expect(isAnswerCorrect(q, [...q.correctAnswers, wrong.key]), `${q.id} extra`).toBe(false);
      }
    }
  });

  it("rotates the daily question deterministically by UTC day", () => {
    const a = dailyQuestion(new Date("2026-11-23T00:00:01Z"));
    const b = dailyQuestion(new Date("2026-11-23T23:59:59Z"));
    const c = dailyQuestion(new Date("2026-11-24T00:00:01Z"));
    expect(a.id).toBe(b.id);
    expect(c.id).not.toBe(a.id);
  });
});

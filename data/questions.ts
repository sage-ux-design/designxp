import type { ConceptCategory, Difficulty, GameModeId, Question, QuestionType, QuestionWithConcept, VisualMockId } from "../types";
import { CONCEPTS_BY_ID } from "./concepts";
import sourceQuestions from "./source-questions.json";
import questionMeta from "./question-meta.json";
import originalQuestions from "./original-questions.json";

/**
 * Question database.
 *
 * 1. `source-questions.json` is extracted verbatim from
 *    content/design_arcade_50_product_design_situational_quiz.pdf by scripts/extract-questions.mjs.
 *    Question text, options, answers, explanations and takeaways are never edited by hand.
 * 2. `question-meta.json` adds game mode, difficulty, category and concept for each PDF question.
 * 3. `original-questions.json` holds DesignXP original questions (clearly marked with source
 *    "designxp-original") that exercise multi-select, true/false and visual formats.
 *
 * To expand the bank, append to original-questions.json (or add another source file) — the quiz
 * engine reads only this merged list.
 */

type Meta = { conceptId: string; category: string; gameMode: string; difficulty: string; questionType: string };
const meta = questionMeta as Record<string, Meta>;

const fromPdf: Question[] = sourceQuestions.map((q) => {
  const m = meta[String(q.number)];
  return {
    id: `pdf-${String(q.number).padStart(2, "0")}`,
    sortOrder: q.number,
    source: "pdf",
    sourceNumber: q.number,
    module: q.module,
    question: q.question,
    options: q.options,
    correctAnswers: [q.answer],
    explanation: q.why,
    takeaway: q.takeaway,
    conceptId: m.conceptId,
    category: m.category as ConceptCategory,
    difficulty: m.difficulty as Difficulty,
    gameMode: m.gameMode as GameModeId,
    questionType: m.questionType as QuestionType,
  };
});

const originals: Question[] = originalQuestions.map((q, i) => ({
  ...q,
  sortOrder: 100 + i,
  source: "designxp-original",
  category: q.category as ConceptCategory,
  difficulty: q.difficulty as Difficulty,
  gameMode: q.gameMode as GameModeId,
  questionType: q.questionType as QuestionType,
  visual: (q as { visual?: string }).visual as VisualMockId | undefined,
}));

export const QUESTIONS: QuestionWithConcept[] = [...fromPdf, ...originals]
  .sort((a, b) => a.sortOrder - b.sortOrder)
  .map((q) => {
    const concept = CONCEPTS_BY_ID[q.conceptId];
    if (!concept) throw new Error(`Question ${q.id} references unknown concept ${q.conceptId}`);
    return { ...q, concept };
  });

export const QUESTIONS_BY_ID: Record<string, QuestionWithConcept> = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));

export const PDF_QUESTION_COUNT = fromPdf.length;
export const ORIGINAL_QUESTION_COUNT = originals.length;

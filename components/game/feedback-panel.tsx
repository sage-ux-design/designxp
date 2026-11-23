"use client";

import { Lightbulb, MessageSquareQuote, Sparkles, Target, Telescope } from "lucide-react";
import type { QuestionWithConcept } from "@/types";
import { cn } from "@/lib/utils";

const CORRECT_LINES = ["Nailed it!", "Critical hit!", "Sharp eye!", "That's the move!", "Combo unlocked!"];

export interface FeedbackData {
  correct: boolean;
  correctAnswers: string[];
  xpForAnswer: number;
  xpForConcept: number;
  conceptUnlocked: boolean;
  alreadyEarned: boolean;
}

/** The learning moment after each answer: never just "correct" or "wrong". */
export function FeedbackPanel({ question, data }: { question: QuestionWithConcept; data: FeedbackData }) {
  const c = question.concept;
  const headline = data.correct
    ? CORRECT_LINES[question.sortOrder % CORRECT_LINES.length]
    : `Not quite! This is where ${c.name} comes in.`;
  const correctText = question.options
    .filter((o) => data.correctAnswers.includes(o.key))
    .map((o) => (question.questionType === "true-false" ? o.text : `${o.key}. ${o.text}`));
  const xp = data.xpForAnswer + data.xpForConcept;

  return (
    <section
      aria-live="polite"
      aria-label="Answer feedback"
      className={cn("pixel-frame animate-rise space-y-6 p-5 sm:p-7", data.correct ? "bg-success/10" : "bg-danger/5")}
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <p className={cn("font-pixel text-[10px]", data.correct ? "text-success" : "text-danger")}>
            {data.correct ? "✓ CORRECT" : "✗ NOT THIS TIME"}
          </p>
          <h2 className="text-xl font-bold text-cream sm:text-2xl">{headline}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.xpForAnswer > 0 && <XpChip label={`+${data.xpForAnswer} XP`} sub="Correct answer" />}
          {data.xpForConcept > 0 && <XpChip label={`+${data.xpForConcept} XP`} sub="New concept" />}
          {xp === 0 && (
            <span className="bg-surface-2 px-3 py-2 text-xs text-muted-foreground">
              {data.alreadyEarned ? "XP already earned for this question" : "+0 XP · no XP lost"}
            </span>
          )}
        </div>
      </header>

      <div className="space-y-1">
        <p className="font-pixel text-[9px] text-lavender">{correctText.length > 1 ? "CORRECT ANSWERS" : "CORRECT ANSWER"}</p>
        <ul className="space-y-1">
          {correctText.map((t) => (
            <li key={t} className="font-bold text-success">
              {t}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-base leading-relaxed text-cream/90">{question.explanation}</p>

      <div className="grid gap-4 md:grid-cols-2">
        <LearnBlock icon={<Target className="size-4" />} title="WHY IT MATTERS">
          {c.whyItMatters}
        </LearnBlock>
        <LearnBlock icon={<Telescope className="size-4" />} title="IN THE REAL WORLD">
          {c.realWorldExample}
        </LearnBlock>
      </div>

      <div className="bg-primary/15 p-4 outline-2 outline-primary/60">
        <p className="mb-2 flex items-center gap-2 font-pixel text-[9px] text-lavender">
          <MessageSquareQuote className="size-4" aria-hidden="true" /> DESIGNER SPEAK
        </p>
        <p className="text-lg italic text-cream">&ldquo;{c.designerPhrase}&rdquo;</p>
      </div>

      <p className="flex items-start gap-2 text-sm">
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber" aria-hidden="true" />
        <span>
          <span className="font-bold text-amber">Takeaway: </span>
          <span className="text-cream/90">{question.takeaway}</span>
        </span>
      </p>

      {data.conceptUnlocked && (
        <p className="flex items-start gap-2 bg-gold/10 px-3 py-2 text-sm text-amber animate-pop">
          <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            Knowledge card unlocked: <strong>{c.name}</strong>
          </span>
        </p>
      )}
    </section>
  );
}

function XpChip({ label, sub }: { label: string; sub: string }) {
  return (
    <span className="flex flex-col items-center bg-gold px-3 py-1.5 text-[#261527] animate-pop">
      <span className="font-pixel text-[11px]">{label}</span>
      <span className="text-[10px] font-bold">{sub}</span>
    </span>
  );
}

function LearnBlock({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 bg-surface-2 p-4">
      <p className="flex items-center gap-2 font-pixel text-[9px] text-lavender">
        <span aria-hidden="true">{icon}</span>
        {title}
      </p>
      <p className="text-sm leading-relaxed text-cream/90">{children}</p>
    </div>
  );
}

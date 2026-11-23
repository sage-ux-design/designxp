"use client";

import { Check, X } from "lucide-react";
import type { QuestionWithConcept } from "@/types";
import { cn } from "@/lib/utils";

export type OptionState = "idle" | "selected" | "correct" | "missed" | "wrong" | "dim";

/**
 * Answer options. Single/true-false/visual use radio semantics, multi-select uses checkboxes.
 * States after submission are shown with icon + text + color (never color alone).
 */
export function AnswerOptions({
  question,
  selected,
  onToggle,
  revealed,
  correctAnswers,
}: {
  question: QuestionWithConcept;
  selected: string[];
  onToggle: (key: string) => void;
  revealed: boolean;
  correctAnswers: string[];
}) {
  const multi = question.questionType === "multi";
  const tf = question.questionType === "true-false";

  const stateFor = (key: string): OptionState => {
    const isSel = selected.includes(key);
    const isCorrect = correctAnswers.includes(key);
    if (!revealed) return isSel ? "selected" : "idle";
    if (isCorrect && isSel) return "correct";
    if (isCorrect && !isSel) return "missed";
    if (!isCorrect && isSel) return "wrong";
    return "dim";
  };

  return (
    <div
      role={multi ? "group" : "radiogroup"}
      aria-label={multi ? "Answer options, select all that apply" : "Answer options"}
      className={cn("grid gap-4", tf ? "sm:grid-cols-2" : "grid-cols-1")}
    >
      {question.options.map((o, i) => {
        const st = stateFor(o.key);
        return (
          <button
            key={o.key}
            type="button"
            role={multi ? "checkbox" : "radio"}
            aria-checked={selected.includes(o.key)}
            aria-disabled={revealed}
            onClick={() => !revealed && onToggle(o.key)}
            className={cn(
              "group flex min-h-16 w-full items-center gap-4 rounded-md px-4 py-3 text-left outline-4 transition-colors duration-150",
              "bg-paper-2 outline-ink",
              !revealed && "hover:bg-paper-3 hover:outline-cyan active:scale-[0.99]",
              st === "selected" && "bg-blue/30 outline-cyan",
              st === "correct" && "bg-success/15 outline-success",
              st === "missed" && "bg-success/10 outline-success outline-dashed",
              st === "wrong" && "bg-danger/15 outline-danger animate-shake",
              st === "dim" && "opacity-60",
              revealed && "cursor-default",
            )}
          >
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-full border-2 border-ink font-pixel text-[11px]",
                st === "idle" && "bg-paper-3 text-lavender",
                st === "selected" && "bg-cyan text-ink",
                (st === "correct" || st === "missed") && "bg-success text-[#0d0b1e]",
                st === "wrong" && "bg-danger text-white",
                st === "dim" && "bg-surface-2 text-muted-foreground",
              )}
              aria-hidden="true"
            >
              {st === "correct" || st === "missed" ? (
                <Check className="size-5" />
              ) : st === "wrong" ? (
                <X className="size-5" />
              ) : multi ? (
                selected.includes(o.key) ? <Check className="size-5" /> : i + 1
              ) : tf ? (
                o.key
              ) : (
                o.key
              )}
            </span>
            <span className="flex-1 text-base leading-snug text-cream sm:text-lg">{o.text}</span>
            {st === "correct" && <span className="shrink-0 font-pixel text-[9px] text-success">YOUR PICK ✓</span>}
            {st === "missed" && <span className="shrink-0 font-pixel text-[9px] text-success">CORRECT</span>}
            {st === "wrong" && <span className="shrink-0 font-pixel text-[9px] text-danger">YOUR PICK</span>}
          </button>
        );
      })}
    </div>
  );
}

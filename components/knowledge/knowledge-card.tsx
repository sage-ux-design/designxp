import { Bookmark, Lock } from "lucide-react";
import type { Concept } from "@/types";
import { cn } from "@/lib/utils";

export const CATEGORY_COLORS: Record<string, string> = {
  "Problem Framing": "#8f5bff",
  "User Research": "#5be37d",
  "UX Psychology": "#ff8a4c",
  "UX Laws": "#4cc9f0",
  "Information Architecture": "#3fd6b5",
  "Visual Design": "#ff6fae",
  "Design Systems": "#c3b4ff",
  Accessibility: "#62a8ff",
  "Product Strategy": "#f6c544",
  Metrics: "#f2a93b",
  Collaboration: "#b48cff",
  Ethics: "#ff5f6d",
  "UX Writing": "#f08ad0",
};

/** Collectible knowledge card (front face). */
export function KnowledgeCard({
  concept,
  number,
  unlocked,
  bookmarked,
  onOpen,
}: {
  concept: Concept;
  number: number;
  unlocked: boolean;
  bookmarked: boolean;
  onOpen: () => void;
}) {
  const color = CATEGORY_COLORS[concept.category] ?? "#8f5bff";
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={unlocked ? `${concept.name}, ${concept.category}. Open card.` : `Locked card number ${number}, ${concept.category}. See how to unlock.`}
      className={cn(
        "group relative flex aspect-[3/4] w-full flex-col overflow-hidden text-left outline-4 transition-transform",
        "hover:-translate-y-1 focus-visible:outline-gold",
        unlocked ? "bg-surface outline-ring hover:outline-lavender" : "bg-[#110e24] outline-[#2a2450]",
      )}
    >
      <span className="h-2 w-full shrink-0" style={{ background: unlocked ? color : "#2a2450" }} aria-hidden="true" />
      <span className="flex items-center justify-between px-3 pt-2">
        <span className="font-pixel text-[9px] text-muted-foreground">#{String(number).padStart(3, "0")}</span>
        {bookmarked && <Bookmark className="size-4 fill-gold text-amber" aria-label="Bookmarked" />}
      </span>
      {unlocked ? (
        <>
          <span className="mx-3 mt-3 grid flex-1 place-items-center" aria-hidden="true" style={{ background: `${color}22` }}>
            <span className="font-pixel text-2xl" style={{ color }}>
              {concept.name
                .replace(/[^A-Za-z ]/g, "")
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase()}
            </span>
          </span>
          <span className="space-y-1 p-3">
            <span className="block text-[11px] font-bold" style={{ color }}>
              {concept.category}
            </span>
            <span className="block font-bold leading-tight text-cream">{concept.name}</span>
          </span>
        </>
      ) : (
        <>
          <span className="mx-3 mt-3 grid flex-1 place-items-center bg-[#0b0919]" aria-hidden="true">
            <Lock className="size-8 text-[#3a3266]" />
          </span>
          <span className="space-y-1 p-3">
            <span className="block text-[11px] text-muted-foreground">{concept.category}</span>
            <span className="block font-pixel text-[11px] text-[#5b5390]">? ? ? ?</span>
          </span>
        </>
      )}
    </button>
  );
}

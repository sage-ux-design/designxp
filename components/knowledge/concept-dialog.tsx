"use client";

import Link from "next/link";
import { Bookmark, Lock, MessageSquareQuote, Target, Telescope } from "lucide-react";
import { Button } from "@/components/game/game-button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/8bit/dialog";
import { GAME_MODES_BY_ID } from "@/data/game-modes";
import { QUESTIONS } from "@/data/questions";
import type { Concept } from "@/types";
import { CATEGORY_COLORS } from "./knowledge-card";

export function ConceptDialog({
  concept,
  unlocked,
  bookmarked,
  onToggleBookmark,
  onClose,
}: {
  concept: Concept | null;
  unlocked: boolean;
  bookmarked: boolean;
  onToggleBookmark: () => void;
  onClose: () => void;
}) {
  const modes = concept
    ? Array.from(new Set(QUESTIONS.filter((q) => q.conceptId === concept.id).map((q) => q.gameMode))).map(
        (m) => GAME_MODES_BY_ID[m],
      )
    : [];
  const color = concept ? CATEGORY_COLORS[concept.category] : undefined;

  return (
    <Dialog open={!!concept} onOpenChange={(o) => !o && onClose()}>
      <DialogContent font="normal" className="sm:max-w-xl">
        <div className="-mx-2 max-h-[75dvh] space-y-4 overflow-y-auto px-2 pb-3 pt-1">
        {concept && unlocked && (
          <>
            <DialogHeader className="space-y-2 text-left">
              <p className="font-pixel text-[9px]" style={{ color }}>
                CONCEPT · {concept.category.toUpperCase()}
              </p>
              <DialogTitle className="font-pixel text-base leading-relaxed text-cream">{concept.name.toUpperCase()}</DialogTitle>
              <DialogDescription className="text-base text-cream/90">{concept.simpleDefinition}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Block icon={<Target className="size-4" />} title="WHY IT MATTERS" body={concept.whyItMatters} />
              <Block icon={<Telescope className="size-4" />} title="REAL-WORLD EXAMPLE" body={concept.realWorldExample} />
              <div className="bg-primary/15 p-4 outline-2 outline-primary/60">
                <p className="mb-2 flex items-center gap-2 font-pixel text-[9px] text-lavender">
                  <MessageSquareQuote className="size-4" aria-hidden="true" /> DESIGNER SPEAK
                </p>
                <p className="text-lg italic text-cream">&ldquo;{concept.designerPhrase}&rdquo;</p>
              </div>
              <p className="text-xs text-muted-foreground">Found in: {modes.map((m) => m.title).join(", ")}</p>
              <Button onClick={onToggleBookmark} variant={bookmarked ? "secondary" : "default"} aria-pressed={bookmarked} className="font-pixel text-[10px]">
                <Bookmark className={bookmarked ? "size-4 fill-gold text-amber" : "size-4"} aria-hidden="true" />
                {bookmarked ? "BOOKMARKED" : "BOOKMARK"}
              </Button>
            </div>
          </>
        )}
        {concept && !unlocked && (
          <>
            <DialogHeader className="space-y-2 text-left">
              <p className="font-pixel text-[9px] text-muted-foreground">LOCKED · {concept.category.toUpperCase()}</p>
              <DialogTitle className="flex items-center gap-2 font-pixel text-base text-cream">
                <Lock className="size-5" aria-hidden="true" /> CARD LOCKED
              </DialogTitle>
              <DialogDescription className="text-base">
                Answer a question about this concept to add it to your collection (+5 XP the first time).
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-wrap gap-3">
              {modes.map((m) => (
                <Button key={m.id} asChild className="font-pixel text-[10px]">
                  <Link href={`/play/${m.id}`}>PLAY {m.title.toUpperCase()}</Link>
                </Button>
              ))}
            </div>
          </>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Block({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="space-y-1 bg-surface-2 p-4">
      <p className="flex items-center gap-2 font-pixel text-[9px] text-lavender">
        <span aria-hidden="true">{icon}</span> {title}
      </p>
      <p className="text-sm leading-relaxed text-cream/90">{body}</p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Bookmark, MessageSquareQuote } from "lucide-react";
import { Eyebrow, PageHeader } from "@/components/common/ui-bits";
import { Button } from "@/components/game/game-button";
import { CONCEPTS } from "@/data/concepts";
import { PHRASES, phraseOfTheDay } from "@/data/phrases";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { usePlayer } from "@/hooks/use-player";
import { cn } from "@/lib/utils";
import type { Phrase } from "@/types";

export default function DesignerSpeakPage() {
  const { player } = usePlayer();
  const marks = useBookmarks("phrases");
  const [onlySaved, setOnlySaved] = useState(false);
  const today = phraseOfTheDay();
  const unlocked = new Set(player?.unlockedConcepts.map((c) => c.conceptId));
  const discovered = CONCEPTS.filter((c) => unlocked.has(c.id));
  const list = PHRASES.filter((p) => p.id !== today.id && (!onlySaved || marks.has(p.id)));

  return (
    <div className="space-y-12">
      <PageHeader
        eyebrow="LEARN THE LINGO"
        title="DESIGNER SPEAK"
        subtitle="Phrases senior designers use in critiques, reviews and product discussions, with what they mean and when to say them."
      />

      <section aria-labelledby="potd" className="pixel-frame pixel-shadow space-y-6 bg-[linear-gradient(150deg,rgba(143,91,255,0.25),transparent_60%)] p-6 sm:p-8">
        <Eyebrow className="text-amber">★ PHRASE OF THE DAY</Eyebrow>
        <h2 id="potd" className="text-2xl font-bold leading-snug text-cream sm:text-3xl">
          &ldquo;{today.phrase}&rdquo;
        </h2>
        <PhraseBody phrase={today} />
        <SaveButton saved={marks.has(today.id)} onClick={() => marks.toggle(today.id)} />
      </section>

      <section aria-labelledby="book" className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="book" className="sign">PHRASE BOOK</h2>
          <button
            onClick={() => setOnlySaved((v) => !v)}
            aria-pressed={onlySaved}
            className={cn(
              "flex items-center gap-2 px-3 py-2 text-sm font-bold outline-2",
              onlySaved ? "bg-primary text-white outline-primary" : "bg-surface text-muted-foreground outline-ring",
            )}
          >
            <Bookmark className="size-4" aria-hidden="true" /> Saved only ({marks.ids.length})
          </button>
        </div>
        {list.length === 0 ? (
          <p className="text-muted-foreground">No saved phrases yet. Tap “Save phrase” on any card.</p>
        ) : (
          <ul className="grid gap-6 md:grid-cols-2">
            {list.map((p) => (
              <li key={p.id} className="pixel-frame flex flex-col gap-4 p-5">
                <p className="text-xl font-bold leading-snug text-cream">&ldquo;{p.phrase}&rdquo;</p>
                <PhraseBody phrase={p} />
                <div className="mt-auto">
                  <SaveButton saved={marks.has(p.id)} onClick={() => marks.toggle(p.id)} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="disc" className="space-y-6">
        <div className="space-y-2">
          <h2 id="disc" className="sign">PHRASES YOU&apos;VE DISCOVERED ({discovered.length})</h2>
          <p className="text-sm font-bold text-light">Every knowledge card you unlock teaches a phrase you can use at work.</p>
        </div>
        {discovered.length === 0 ? (
          <p className="text-muted-foreground">Play a round to start discovering phrases.</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {discovered.map((c) => (
              <li key={c.id} className="flex gap-3 bg-surface p-4 outline-2 outline-ring">
                <MessageSquareQuote className="mt-1 size-4 shrink-0 text-lavender" aria-hidden="true" />
                <div>
                  <p className="italic text-cream">&ldquo;{c.designerPhrase}&rdquo;</p>
                  <p className="mt-1 text-xs text-muted-foreground">{c.name}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function PhraseBody({ phrase }: { phrase: Phrase }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-3">
      <div className="space-y-1">
        <dt className="font-pixel text-[9px] text-lavender">MEANING</dt>
        <dd className="text-sm text-cream/90">{phrase.meaning}</dd>
      </div>
      <div className="space-y-1">
        <dt className="font-pixel text-[9px] text-lavender">WHEN TO USE IT</dt>
        <dd className="text-sm text-cream/90">{phrase.context}</dd>
      </div>
      <div className="space-y-1">
        <dt className="font-pixel text-[9px] text-lavender">IN A REVIEW</dt>
        <dd className="text-sm italic text-cream/90">{phrase.example}</dd>
      </div>
    </dl>
  );
}

function SaveButton({ saved, onClick }: { saved: boolean; onClick: () => void }) {
  return (
    <Button variant={saved ? "secondary" : "default"} onClick={onClick} aria-pressed={saved} className="font-pixel text-[10px]">
      <Bookmark className={saved ? "size-4 fill-gold text-amber" : "size-4"} aria-hidden="true" />
      {saved ? "SAVED" : "SAVE PHRASE"}
    </Button>
  );
}

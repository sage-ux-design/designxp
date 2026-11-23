"use client";

import { CHARACTERS, getCharacter } from "@/data/characters";
import { cn } from "@/lib/utils";
import { PixelScene } from "@/components/scene/pixel-scene";
import { PixelSprite } from "./pixel-sprite";

/**
 * Character selection: a radio group (arrow keys work natively) plus a large preview.
 * Characters are purely cosmetic.
 */
export function CharacterPicker({
  selected,
  onSelect,
  name = "character",
}: {
  selected: string;
  onSelect: (id: string) => void;
  name?: string;
}) {
  const current = getCharacter(selected);
  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_280px] md:items-start">
      <fieldset>
        <legend className="sr-only">Choose your character</legend>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-5">
          {CHARACTERS.map((c) => {
            const isSel = c.id === selected;
            return (
              <label
                key={c.id}
                className={cn(
                  "gbtn cursor-pointer flex-col gap-2 px-2 pb-4 pt-4",
                  "has-[:focus-visible]:outline-4 has-[:focus-visible]:outline-offset-4 has-[:focus-visible]:outline-yellow",
                  isSel && "gbtn-yellow",
                )}
              >
                <input
                  type="radio"
                  name={name}
                  value={c.id}
                  checked={isSel}
                  onChange={() => onSelect(c.id)}
                  className="sr-only"
                />
                <PixelSprite characterId={c.id} size={56} />
                <span className="text-center text-sm font-bold leading-tight">{c.name}</span>
                <span className="text-center text-xs opacity-75">{c.title}</span>
                {isSel && (
                  <span className="absolute -top-4 right-1 bg-ink px-1.5 py-1 font-pixel text-[8px] text-yellow">
                    P1
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      <aside className="pixel-frame pixel-shadow flex flex-col items-center gap-4 p-4 pb-6 text-center" aria-live="polite">
        {/* A tiny stage: the chosen hero stands on the level floor. */}
        <div className="relative h-48 w-full overflow-hidden border-4 border-ink">
          <PixelScene variant="jungle" />
          <div className="absolute inset-x-0 flex justify-center" style={{ bottom: "18%" }}>
            <PixelSprite characterId={current.id} size={112} className="animate-float" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="font-pixel text-sm text-cream">{current.name.toUpperCase()}</p>
          <p className="font-pixel text-[9px] text-lavender">{current.title.toUpperCase()}</p>
          <p className="text-sm text-muted-foreground">{current.bio}</p>
        </div>
        <p className="text-xs text-muted-foreground">Cosmetic only. Every character plays by the same rules.</p>
      </aside>
    </div>
  );
}

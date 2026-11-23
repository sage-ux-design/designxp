"use client";

import { useEffect } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/game/game-button";
import { PixelSprite } from "@/components/player/pixel-sprite";
import { PixelScene } from "@/components/scene/pixel-scene";

const PARTY = ["ember", "arcanist", "bolt-8", "nova", "gloop"];

/** Title screen: one painted level, the wordmark on the calm sky, the party on the floor. */
export function StartScreen({ onStart }: { onStart: () => void }) {
  // Classic arcade: Enter starts the game.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && document.activeElement === document.body) onStart();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onStart]);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <PixelScene variant="day" />
      <div className="relative flex flex-1 flex-col items-center px-4 pb-48 pt-16 text-center sm:pt-24">
        <p className="sign mb-8">PLAY · DISCOVER · LEARN · LEVEL UP</p>
        <h1 className="sr-only">DesignXP</h1>
        <Logo size="xl" />
        <p className="title-type is-small is-yellow mt-6 text-[11px] sm:text-base">LEVEL UP YOUR DESIGN THINKING</p>

        <div className="pixel-frame mt-10 max-w-md px-5 py-4">
          <p className="text-base font-bold leading-snug">
            Five-question quests for UX and product designers. Answer real situations, collect knowledge cards and
            climb the leaderboard.
          </p>
        </div>

        <Button size="lg" onClick={onStart} className="mt-10 h-16 px-10 text-sm" autoFocus>
          ▶ PRESS START
        </Button>
        <p className="mt-6 font-pixel text-[10px] text-light animate-blink">PRESS ENTER</p>
      </div>

      {/* The party stands on the floor line of the scene (floor = 18 of 90 scene rows). */}
      <div
        className="absolute inset-x-0 flex items-end justify-center gap-4 sm:gap-8"
        style={{ bottom: "calc(max(100vw / 160, 100dvh / 90) * 18 - 4px)" }}
        aria-hidden="true"
      >
        {PARTY.map((id, i) => (
          <PixelSprite key={id} characterId={id} size={i === 0 ? 96 : 72} className={i === 0 ? "animate-float" : undefined} />
        ))}
      </div>
    </div>
  );
}

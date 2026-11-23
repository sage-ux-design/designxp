"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/game/game-button";
import { GamertagField } from "./gamertag-field";
import { OnboardingFrame } from "./onboarding-frame";

export function GamertagStep({
  initial,
  externalError,
  onBack,
  onNext,
}: {
  initial: string;
  externalError: string | null;
  onBack: () => void;
  onNext: (tag: string) => void;
}) {
  const [value, setValue] = useState(initial);
  const [ready, setReady] = useState(false);
  const onReady = useCallback((r: boolean) => setReady(r), []);

  return (
    <OnboardingFrame step={1} onBack={onBack}>
      <form
        className="pixel-frame pixel-shadow mx-auto mt-6 flex w-full max-w-lg flex-col gap-8 p-6 sm:mt-12 sm:p-10"
        onSubmit={(e) => {
          e.preventDefault();
          if (ready) onNext(value.trim());
        }}
      >
        <div className="space-y-4 text-center">
          <p className="font-pixel text-[10px] text-lavender">PLAYER 1 · STEP 1 OF 3</p>
          <h1 className="font-pixel text-lg leading-relaxed text-cream sm:text-2xl">WHAT SHOULD WE CALL YOU?</h1>
          <p className="text-muted-foreground">
            Pick an in-game name. It appears on the leaderboard. No real name or email needed.
          </p>
        </div>
        <GamertagField
          value={value}
          onChange={setValue}
          onReadyChange={onReady}
          externalError={externalError}
          autoFocus
        />
        <Button type="submit" size="lg" disabled={!ready} className="h-14 font-pixel text-xs">
          CONTINUE ▶
        </Button>
      </form>
    </OnboardingFrame>
  );
}

"use client";

import { CharacterPicker } from "@/components/player/character-picker";
import { Button } from "@/components/game/game-button";
import { OnboardingFrame } from "./onboarding-frame";

export function CharacterStep({
  selected,
  onSelect,
  onBack,
  onNext,
  gamertag,
}: {
  selected: string;
  onSelect: (id: string) => void;
  onBack: () => void;
  onNext: () => void;
  gamertag: string;
}) {
  return (
    <OnboardingFrame step={2} onBack={onBack}>
      <div className="mt-6 space-y-8">
        <div className="space-y-4 text-center">
          <p className="sign">STEP 2 OF 3 · {gamertag.toUpperCase()}</p>
          <h1 className="title-type is-small text-xl sm:text-3xl">CHOOSE YOUR CHARACTER</h1>
          <p className="font-bold text-light">You can change this any time from your profile.</p>
        </div>
        <CharacterPicker selected={selected} onSelect={onSelect} />
        <div className="flex justify-center">
          <Button size="lg" onClick={onNext} className="h-14 w-full max-w-sm font-pixel text-xs">
            CONFIRM CHARACTER ▶
          </Button>
        </div>
      </div>
    </OnboardingFrame>
  );
}

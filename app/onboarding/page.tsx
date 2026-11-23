"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoadingScreen } from "@/components/common/loading-screen";
import { CharacterStep } from "@/components/onboarding/character-step";
import { ConfirmStep } from "@/components/onboarding/confirm-step";
import { GamertagStep } from "@/components/onboarding/gamertag-step";
import { StartScreen } from "@/components/onboarding/start-screen";
import { DEFAULT_CHARACTER_ID } from "@/data/characters";
import { usePlayer } from "@/hooks/use-player";

type Step = "start" | "name" | "character" | "confirm";

export default function OnboardingPage() {
  const { status, player } = usePlayer();
  const router = useRouter();
  const [step, setStep] = useState<Step>("start");
  const [gamertag, setGamertag] = useState("");
  const [characterId, setCharacterId] = useState(DEFAULT_CHARACTER_ID);
  const [nameError, setNameError] = useState<string | null>(null);
  const [created, setCreated] = useState(false);

  // Returning players skip onboarding.
  useEffect(() => {
    if (status === "ready" && player && !created) router.replace("/dashboard");
  }, [status, player, created, router]);

  if (status === "loading" || (player && !created)) return <LoadingScreen />;

  return (
    <main className="relative min-h-dvh overflow-hidden">
      {step === "start" && <StartScreen onStart={() => setStep("name")} />}
      {step === "name" && (
        <GamertagStep
          initial={gamertag}
          externalError={nameError}
          onBack={() => setStep("start")}
          onNext={(tag) => {
            setGamertag(tag);
            setNameError(null);
            setStep("character");
          }}
        />
      )}
      {step === "character" && (
        <CharacterStep
          selected={characterId}
          onSelect={setCharacterId}
          onBack={() => setStep("name")}
          onNext={() => setStep("confirm")}
          gamertag={gamertag}
        />
      )}
      {step === "confirm" && (
        <ConfirmStep
          gamertag={gamertag}
          characterId={characterId}
          onBack={() => setStep("character")}
          onCreated={() => setCreated(true)}
          onNameTaken={(msg) => {
            setNameError(msg);
            setStep("name");
          }}
        />
      )}
    </main>
  );
}

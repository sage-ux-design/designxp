"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";
import { PixelSprite } from "@/components/player/pixel-sprite";
import { Button } from "@/components/game/game-button";
import { getCharacter } from "@/data/characters";
import { usePlayer } from "@/hooks/use-player";
import { GamertagTakenError } from "@/services";
import { OnboardingFrame } from "./onboarding-frame";

export function ConfirmStep({
  gamertag,
  characterId,
  onBack,
  onCreated,
  onNameTaken,
}: {
  gamertag: string;
  characterId: string;
  onBack: () => void;
  onCreated: () => void;
  onNameTaken: (msg: string) => void;
}) {
  const { backend, setPlayer, mode } = usePlayer();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const c = getCharacter(characterId);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const p = await backend.createPlayer(gamertag, characterId);
      onCreated();
      setPlayer(p);
      router.push("/dashboard?welcome=1");
    } catch (e) {
      if (e instanceof GamertagTakenError) {
        onNameTaken("Someone just claimed that gamertag. Pick another one.");
        return;
      }
      setError(e instanceof Error ? e.message : "Couldn't create your player. Please try again.");
      setBusy(false);
    }
  }

  const rows: [string, string][] = [
    ["PLAYER", gamertag],
    ["CHARACTER", `${c.name} (${c.title})`],
    ["LEVEL", "01"],
    ["XP", "0"],
  ];

  return (
    <OnboardingFrame step={3} onBack={onBack}>
      <div className="mx-auto mt-6 flex w-full max-w-xl flex-col items-center gap-8 sm:mt-12">
        <div className="space-y-4 text-center">
          <p className="sign">STEP 3 OF 3</p>
          <h1 className="title-type is-small text-xl sm:text-3xl">READY, PLAYER ONE?</h1>
        </div>

        <section className="pixel-frame pixel-shadow flex w-full flex-col items-center gap-6 p-6 sm:flex-row sm:p-8">
          <div className="grid size-36 shrink-0 place-items-center border-4 border-ink bg-sky">
            <PixelSprite characterId={characterId} size={120} className="animate-float" />
          </div>
          <dl className="w-full space-y-3">
            {rows.map(([k, v]) => (
              <div key={k} className="flex items-baseline justify-between gap-4 border-b-2 border-dashed border-ink/30 pb-2">
                <dt className="font-pixel text-[10px] text-lavender">{k}:</dt>
                <dd className="truncate font-pixel text-xs text-cream">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {error && (
          <p role="alert" className="w-full bg-danger/15 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}

        <Button size="lg" onClick={start} disabled={busy} className="h-16 w-full max-w-sm font-pixel text-sm">
          {busy ? "LOADING..." : "▶ START GAME"}
        </Button>

        <p className="flex max-w-md items-start gap-2 bg-ink px-4 py-3 text-xs leading-relaxed text-light">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {mode === "live"
            ? "Your player is tied to an anonymous session in this browser. It won't transfer to other devices automatically; account linking can come later."
            : "Demo mode: your player and progress are saved in this browser only. Clearing site data removes them."}
        </p>
      </div>
    </OnboardingFrame>
  );
}

import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { PixelScene } from "@/components/scene/pixel-scene";
import { cn } from "@/lib/utils";

const STEPS = ["NAME", "CHARACTER", "CONFIRM"];

/** Shared chrome for onboarding steps: the level behind, an ink HUD bar, and a parchment card. */
export function OnboardingFrame({
  step,
  onBack,
  children,
}: {
  step: 1 | 2 | 3;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <PixelScene variant={step === 1 ? "day" : step === 2 ? "jungle" : "sunset"} className="opacity-90" />
      <div className="relative marquee text-cream">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4">
          <button
            onClick={onBack}
            className="gbtn h-10 gap-2 px-3 font-pixel text-[10px]"
            aria-label="Back"
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> BACK
          </button>
          <Logo size="sm" />
          <ol className="flex items-center gap-2" aria-label={`Step ${step} of 3`}>
            {STEPS.map((label, i) => (
              <li key={label}>
                <span
                  className={cn("block size-4 border-2 border-ink", i + 1 < step ? "bg-green" : i + 1 === step ? "bg-yellow" : "bg-transparent")}
                  aria-hidden="true"
                />
                <span className="sr-only">
                  {label} {i + 1 === step ? "(current)" : i + 1 < step ? "(done)" : ""}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-16 pt-8 sm:pt-12">{children}</div>
    </div>
  );
}

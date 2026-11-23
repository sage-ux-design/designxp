import { Logo } from "@/components/brand/logo";
import { PixelScene } from "@/components/scene/pixel-scene";

export function LoadingScreen({ label = "LOADING" }: { label?: string }) {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden" role="status" aria-live="polite">
      <PixelScene variant="day" />
      <div className="relative flex flex-col items-center gap-6 bg-ink px-8 py-6">
        <Logo size="md" />
        <p className="font-pixel text-xs text-light">
          {label}
          <span className="animate-blink">_</span>
        </p>
      </div>
    </div>
  );
}

export function ErrorScreen({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="grid min-h-[60dvh] place-items-center px-4 text-center" role="alert">
      <div className="pixel-frame max-w-md space-y-4 p-8">
        <p className="title-type is-small text-xl">GAME OVER?</p>
        <p className="text-muted-foreground">Not quite. Something went wrong loading the arcade: {message}</p>
        {onRetry && (
          <button onClick={onRetry} className="gbtn gbtn-yellow h-12 px-5 font-pixel text-[11px]">
            TRY AGAIN
          </button>
        )}
      </div>
    </div>
  );
}

import { Progress } from "@/components/ui/8bit/progress";
import { formatLevel, levelProgress } from "@/lib/levels";
import { cn } from "@/lib/utils";

/** Level + XP progress toward the next level, using the 8bitcn retro progress bar. */
export function XpMeter({ xp, compact, className }: { xp: number; compact?: boolean; className?: string }) {
  const lp = levelProgress(xp);
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-pixel text-[10px] text-amber">
          LV {formatLevel(lp.current.level)}
          {!compact && <span className="ml-2 text-lavender">{lp.current.title.toUpperCase()}</span>}
        </p>
        <p className="text-xs text-muted-foreground">
          {lp.next ? (
            <>
              <span className="text-cream">{lp.xpToNext} XP</span> to {compact ? `LV ${formatLevel(lp.next.level)}` : lp.next.title}
            </>
          ) : (
            "Max level reached"
          )}
        </p>
      </div>
      <Progress
        value={lp.percent}
        variant="retro"
        progressBg="bg-gold"
        className="h-4"
        aria-label={`Level progress ${lp.percent}%`}
      />
    </div>
  );
}

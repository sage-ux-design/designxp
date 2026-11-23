import { PixelSprite } from "@/components/player/pixel-sprite";
import { formatLevel } from "@/lib/levels";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types";

export function RankRow({ entry, standalone }: { entry: LeaderboardEntry; standalone?: boolean }) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 sm:gap-4 sm:px-4",
        entry.isCurrentPlayer ? "rounded-md bg-blue/30 outline-4 outline-cyan" : "rounded-md bg-paper outline-2 outline-ink",
        standalone && "outline-none",
      )}
      aria-current={entry.isCurrentPlayer ? "true" : undefined}
    >
      <span className="tabular w-12 shrink-0 font-led text-2xl text-lavender">{String(entry.rank).padStart(2, "0")}</span>
      <PixelSprite characterId={entry.characterId} size={36} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold text-cream">
          {entry.gamertag}
          {entry.isCurrentPlayer && <span className="ml-2 font-pixel text-[8px] text-amber">YOU</span>}
          {entry.isDemo && <span className="ml-2 text-[11px] font-normal text-muted-foreground">(demo)</span>}
        </span>
        <span className="block text-xs text-muted-foreground">Level {formatLevel(entry.level)}</span>
      </span>
      <span className="tabular shrink-0 font-led text-xl text-amber">{entry.xp.toLocaleString()} XP</span>
    </li>
  );
}

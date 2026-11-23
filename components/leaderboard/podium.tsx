import { Crown, Trophy } from "lucide-react";
import { PixelSprite } from "@/components/player/pixel-sprite";
import { formatLevel } from "@/lib/levels";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types";

const PLACES = {
  1: { label: "1ST", height: "h-32 sm:h-40" },
  2: { label: "2ND", height: "h-24 sm:h-28" },
  3: { label: "3RD", height: "h-16 sm:h-20" },
} as const;

/** Top-three podium: 2nd | 1st | 3rd with stepped heights. */
export function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  const byRank = (r: number) => entries.find((e) => e.rank === r);
  const order = [2, 1, 3] as const;
  return (
    <ol className="grid grid-cols-3 items-end gap-2 sm:gap-6" aria-label="Top three players">
      {order.map((r) => {
        const e = byRank(r);
        const p = PLACES[r];
        return (
          <li key={r} className="flex min-w-0 flex-col items-center" style={{ order: r === 1 ? 0 : undefined }}>
            {e ? (
              <>
                {r === 1 && <Crown className="mb-1 size-6 fill-yellow text-ink" aria-hidden="true" />}
                <PixelSprite characterId={e.characterId} size={r === 1 ? 80 : 60} className={r === 1 ? "animate-float" : ""} />
                <div className="mt-2 w-full rounded-md bg-ink/85 px-2 py-1.5 text-center">
                  <p className={cn("truncate text-sm font-bold sm:text-base", e.isCurrentPlayer ? "text-yellow" : "text-light")}>
                    {e.gamertag}
                  </p>
                  <p className="text-[11px] text-light/75">
                    LV {formatLevel(e.level)}
                    {e.isDemo && " · demo"}
                    {e.isCurrentPlayer && " · you"}
                  </p>
                  <p className="tabular font-led text-lg text-yellow sm:text-xl">{e.xp.toLocaleString()} XP</p>
                </div>
              </>
            ) : (
              <p className="mb-2 rounded-md bg-ink/85 px-2 py-1 text-xs text-light/75">Open spot</p>
            )}
            <div
              className={cn(
                "mt-3 flex w-full flex-col items-center justify-start gap-1 rounded-t-md border-4 border-b-0 border-ink pt-3",
                p.height,
                e?.isCurrentPlayer ? "bg-blue" : r === 1 ? "bg-yellow/90" : r === 2 ? "bg-paper-3" : "bg-[#c2552f]",
              )}
            >
              <Trophy className={cn("size-5", e?.isCurrentPlayer || r === 2 ? "text-light" : "text-ink")} aria-hidden="true" />
              <span className={cn("font-pixel text-xs sm:text-sm", e?.isCurrentPlayer || r === 2 ? "text-light" : "text-ink")}>{p.label}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { FlaskConical, RefreshCw, Trophy } from "lucide-react";
import { Podium } from "@/components/leaderboard/podium";
import { PixelScene } from "@/components/scene/pixel-scene";
import { RankRow } from "@/components/leaderboard/rank-row";
import { useLeaderboard } from "@/components/leaderboard/use-leaderboard";
import { Button } from "@/components/game/game-button";
import { Skeleton } from "@/components/ui/8bit/skeleton";
import { usePlayer } from "@/hooks/use-player";
import { formatWeekRange } from "@/lib/time";
import { cn } from "@/lib/utils";
import type { LeaderboardPeriod } from "@/types";

export default function LeaderboardPage() {
  const { mode } = usePlayer();
  const [period, setPeriod] = useState<LeaderboardPeriod>("weekly");
  const { data, status, error, reload } = useLeaderboard(period, 25);

  const top3 = data?.entries.slice(0, 3) ?? [];
  const rest = data?.entries.slice(3) ?? [];
  const meVisible = !!data?.entries.some((e) => e.isCurrentPlayer);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="flex flex-col items-center gap-4 text-center">
        <p className="title-type is-pink text-5xl sm:text-7xl" aria-hidden="true">HISCORE</p>
        <h1 className="sign">
          <Trophy className="size-4" aria-hidden="true" /> DESIGNXP LEADERBOARD
        </h1>
        <p className="font-pixel text-[10px] text-yellow sm:text-xs">WHO&apos;S LEVELING UP THE FASTEST?</p>
      </header>

      {mode === "demo" && (
        <p className="flex items-start gap-3 rounded-md border-4 border-ink bg-yellow px-4 py-3 text-sm text-ink">
          <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            <strong>Demo leaderboard.</strong> The other players here are sample data and this board is not live or
            global. Your own score is real and stored on this device. Connect Supabase to enable the shared leaderboard.
          </span>
        </p>
      )}

      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <div role="tablist" aria-label="Leaderboard period" className="flex rounded-lg border-4 border-ink bg-paper p-1">
          {(
            [
              ["weekly", "WEEKLY"],
              ["all-time", "ALL TIME"],
            ] as const
          ).map(([p, label]) => (
            <button
              key={p}
              role="tab"
              aria-selected={period === p}
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-md px-5 py-3 font-pixel text-[10px] transition-colors",
                period === p ? "bg-yellow text-ink" : "text-muted-foreground hover:text-cream",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm font-bold text-light">
            {period === "weekly" ? `Week of ${formatWeekRange()} · resets Monday 00:00 UTC` : "Lifetime XP · never resets"}
          </p>
          <Button variant="secondary" size="icon" onClick={() => reload()} aria-label="Refresh rankings" disabled={status === "loading"}>
            <RefreshCw className={cn("size-4", status === "loading" && "animate-spin")} aria-hidden="true" />
          </Button>
        </div>
      </div>

      <section role="tabpanel" aria-label={period === "weekly" ? "Weekly rankings" : "All-time rankings"} aria-busy={status === "loading"}>
        {status === "loading" && !data && (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        )}

        {status === "error" && (
          <div className="pixel-frame space-y-4 p-8 text-center" role="alert">
            <p className="font-pixel text-sm text-danger">CONNECTION LOST</p>
            <p className="text-muted-foreground">We couldn&apos;t load the rankings: {error}</p>
            <Button onClick={() => reload()} className="font-pixel text-[10px]">
              TRY AGAIN
            </Button>
          </div>
        )}

        {data && status !== "error" && (
          <div className={cn("space-y-8", status === "loading" && "opacity-60")}>
            {data.entries.length === 0 ? (
              <div className="pixel-frame space-y-4 p-10 text-center">
                <p className="font-pixel text-sm text-cream">THE BOARD IS EMPTY</p>
                <p className="text-muted-foreground">
                  {period === "weekly" ? "Nobody has earned XP this week yet. Claim the top spot!" : "No players yet. Be the first!"}
                </p>
                <Button asChild className="font-pixel text-[10px]">
                  <Link href="/play">PLAY NOW</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="pixel-frame relative overflow-hidden rounded-lg px-2 pt-10 sm:px-8">
                  <PixelScene variant="day" />
                  <div className="relative">
                    <Podium entries={top3} />
                  </div>
                </div>
                {rest.length > 0 && (
                  <ol className="space-y-2" aria-label="Ranks 4 and below">
                    {rest.map((e) => (
                      <RankRow key={e.playerId} entry={e} />
                    ))}
                  </ol>
                )}
              </>
            )}

            <section aria-labelledby="your-rank" className="pixel-frame space-y-3 bg-primary/10 p-5">
              <h2 id="your-rank" className="font-pixel text-[10px] text-lavender">
                YOUR RANK
              </h2>
              {data.me ? (
                <ol>
                  <RankRow entry={data.me} standalone />
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {period === "weekly"
                    ? "You haven't earned XP this week yet. Finish a round to get on the board."
                    : "Play a round to get ranked."}
                </p>
              )}
              {data.me && !meVisible && (
                <p className="text-xs text-muted-foreground">You&apos;re outside the top {data.entries.length}. Keep playing to climb!</p>
              )}
              <p className="text-xs text-muted-foreground">
                {data.totalPlayers} player{data.totalPlayers === 1 ? "" : "s"} {mode === "demo" ? "on this demo board" : "in the arcade"}.
              </p>
            </section>
          </div>
        )}
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { BookOpenText, CalendarDays, Check, ChevronRight, Flame, MessageSquareQuote, Play, Shuffle, Trophy } from "lucide-react";
import { Eyebrow, Panel, StatTile } from "@/components/common/ui-bits";
import { ModeCard } from "@/components/game/mode-card";
import { useLeaderboard } from "@/components/leaderboard/use-leaderboard";
import { PixelSprite } from "@/components/player/pixel-sprite";
import { Hud } from "@/components/scene/pixel-icons";
import { PixelScene } from "@/components/scene/pixel-scene";
import { XpMeter } from "@/components/player/xp-meter";
import { Button } from "@/components/game/game-button";
import { Skeleton } from "@/components/ui/8bit/skeleton";
import { CONCEPTS_BY_ID } from "@/data/concepts";
import { GAME_MODES } from "@/data/game-modes";
import { phraseOfTheDay } from "@/data/phrases";
import { XP_RULES } from "@/data/progression";
import { QUESTIONS } from "@/data/questions";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { usePlayer } from "@/hooks/use-player";
import { formatLevel, levelForXp } from "@/lib/levels";
import { computeStats } from "@/lib/player-stats";
import { dailyQuestion, modeQuestionCount } from "@/lib/quiz-engine";
import { utcDateKey } from "@/lib/time";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const { player, mode } = usePlayer();
  const weekly = useLeaderboard("weekly", 3);
  const phrase = phraseOfTheDay();
  const phraseMarks = useBookmarks("phrases");
  if (!player) return null;

  const stats = computeStats(player);
  const daily = dailyQuestion();
  const dailyDone = player.xp.some((t) => t.reason === "daily_challenge" && t.ref === utcDateKey());
  const answeredIds = new Set(player.attempts.map((a) => a.questionId));
  const recent = [...player.unlockedConcepts]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 4)
    .map((u) => CONCEPTS_BY_ID[u.conceptId])
    .filter(Boolean);

  return (
    <div className="space-y-10">
      {/* HERO: the one bright moment. The player's character stands in a pixel level, HUD on top. */}
      <section className="pixel-frame pixel-shadow relative overflow-hidden rounded-lg">
        <div className="relative h-56 sm:h-64">
          <PixelScene variant="day" />
          <div className="absolute inset-x-0 top-0 flex flex-wrap items-center justify-between gap-2 p-3 sm:p-4">
            <div className="flex flex-wrap gap-2">
              <Hud icon="coin" value={player.totalXp} label="Total XP" />
              <Hud icon="star" value={`LV ${formatLevel(levelForXp(player.totalXp).level)}`} label="Level" />
              <Hud icon="flame" value={stats.streak} label="Day streak" />
            </div>
            <Hud
              icon="heart"
              value={weekly.status === "ready" && weekly.data?.me ? `#${weekly.data.me.rank}` : "--"}
              label={`Weekly rank${mode === "demo" ? " (demo)" : ""}`}
            />
          </div>
          <div className="absolute inset-x-0 flex justify-center" style={{ bottom: "20%" }}>
            <PixelSprite characterId={player.profile.characterId} size={112} className="animate-float" />
          </div>
        </div>
        <div className="grid grid-cols-1 items-center gap-6 border-t-4 border-ink p-5 sm:p-6 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="min-w-0 space-y-4">
            <Eyebrow>{stats.questionsAnswered === 0 ? "PLAYER 1 READY" : "WELCOME BACK"}</Eyebrow>
            <h1 className="title-type is-yellow break-words text-3xl sm:text-5xl">HEY, {player.profile.gamertag.toUpperCase()}!</h1>
            <XpMeter xp={player.totalXp} />
            <p className="text-sm text-muted-foreground">
              <span className="font-bold text-cream">{player.weeklyXp} XP</span> this week ·{" "}
              <span className="font-bold text-cream">{player.totalXp} XP</span> all time
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-4">
            <Button asChild size="lg" className="h-16 px-8 text-sm">
              <Link href="/play">
                <Play className="size-5" aria-hidden="true" /> START PLAYING
              </Link>
            </Button>
            <Button asChild variant="blue" size="lg" className="h-12 text-[10px]">
              <Link href="/play/quick-play">
                <Shuffle className="size-4" aria-hidden="true" /> QUICK PLAY · 5 QS
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Daily challenge */}
        <Panel tone="raised" className="flex flex-col gap-4 bg-[linear-gradient(160deg,rgba(246,197,68,0.12),transparent_60%)]">
          <div className="flex items-center justify-between gap-3">
            <Eyebrow className="flex items-center gap-2 text-amber">
              <CalendarDays className="size-4" aria-hidden="true" /> DAILY CHALLENGE
            </Eyebrow>
            <span className={cn("font-pixel text-[9px]", dailyDone ? "text-success" : "text-amber")}>
              {dailyDone ? "✓ CLAIMED" : `+${XP_RULES.dailyChallenge} XP BONUS`}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {GAME_MODES.find((m) => m.id === daily.gameMode)?.title} · {daily.concept.category}
          </p>
          <p className="line-clamp-3 text-lg font-bold leading-snug text-cream">{daily.question}</p>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">New challenge every day at 00:00 UTC.</p>
            <Button asChild variant={dailyDone ? "secondary" : "default"} className="font-pixel text-[10px]">
              <Link href="/play/daily">{dailyDone ? "PRACTICE AGAIN" : "ACCEPT CHALLENGE"}</Link>
            </Button>
          </div>
        </Panel>

        {/* Leaderboard preview */}
        <Panel className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Eyebrow className="flex items-center gap-2 text-amber">
              <Trophy className="size-4" aria-hidden="true" /> THIS WEEK&apos;S TOP 3
            </Eyebrow>
            {mode === "demo" && <span className="font-pixel text-[8px] text-amber/80">DEMO DATA</span>}
          </div>
          {weekly.status === "loading" && (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          )}
          {weekly.status === "error" && (
            <p className="text-sm text-danger">
              Couldn&apos;t load rankings.{" "}
              <button className="underline" onClick={() => weekly.reload()}>
                Retry
              </button>
            </p>
          )}
          {weekly.status === "ready" && weekly.data && (
            <>
              {weekly.data.entries.length === 0 ? (
                <p className="text-sm text-muted-foreground">No XP earned this week yet. Be the first on the board!</p>
              ) : (
                <ol className="space-y-2">
                  {weekly.data.entries.map((e) => (
                    <li
                      key={e.playerId}
                      className={cn("flex items-center gap-3 bg-surface-2 px-3 py-2", e.isCurrentPlayer && "outline-2 outline-primary")}
                    >
                      <span className={cn("w-6 font-pixel text-[11px]", ["text-amber", "text-lavender", "text-[#d98b5f]"][e.rank - 1])}>
                        {e.rank}
                      </span>
                      <PixelSprite characterId={e.characterId} size={28} />
                      <span className="flex-1 truncate font-bold text-cream">{e.gamertag}</span>
                      <span className="font-pixel text-[10px] text-amber">{e.xp} XP</span>
                    </li>
                  ))}
                </ol>
              )}
              <p className="text-sm text-muted-foreground">
                You:{" "}
                <span className="font-bold text-cream">
                  {weekly.data.me ? `#${weekly.data.me.rank} with ${weekly.data.me.xp} XP` : "not ranked yet this week"}
                </span>
              </p>
            </>
          )}
          <Link href="/leaderboard" className="mt-auto flex items-center gap-1 text-sm font-bold text-amber hover:underline">
            Full leaderboard <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        </Panel>
      </div>

      {/* Game modes */}
      <section aria-labelledby="modes-h" className="space-y-5">
        <div className="flex items-end justify-between">
          <h2 id="modes-h" className="sign">GAME MODES</h2>
          <Link href="/play" className="text-sm font-bold text-light hover:underline">
            All modes
          </Link>
        </div>
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {GAME_MODES.map((m) => (
            <li key={m.id}>
              <ModeCard
                mode={m}
                compact
                questionCount={modeQuestionCount(m.id)}
                answered={QUESTIONS.filter((q) => q.gameMode === m.id && answeredIds.has(q.id)).length}
              />
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Designer Speak */}
        <Panel className="flex flex-col gap-4">
          <Eyebrow className="flex items-center gap-2">
            <MessageSquareQuote className="size-4" aria-hidden="true" /> DESIGNER SPEAK · PHRASE OF THE DAY
          </Eyebrow>
          <p className="text-2xl font-bold leading-snug text-cream">&ldquo;{phrase.phrase}&rdquo;</p>
          <p className="text-muted-foreground">{phrase.meaning}</p>
          <div className="mt-auto flex flex-wrap items-center gap-4">
            <button
              onClick={() => phraseMarks.toggle(phrase.id)}
              aria-pressed={phraseMarks.has(phrase.id)}
              className="flex items-center gap-2 bg-surface-2 px-3 py-2 text-sm font-bold text-cream outline-2 outline-ring hover:outline-primary"
            >
              {phraseMarks.has(phrase.id) ? <Check className="size-4 text-success" aria-hidden="true" /> : null}
              {phraseMarks.has(phrase.id) ? "Saved" : "Save phrase"}
            </button>
            <Link href="/designer-speak" className="flex items-center gap-1 text-sm font-bold text-lavender hover:underline">
              See how to use it <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </Panel>

        {/* Knowledge discovery */}
        <Panel className="flex flex-col gap-4">
          <Eyebrow className="flex items-center gap-2">
            <BookOpenText className="size-4" aria-hidden="true" /> RECENTLY UNLOCKED
          </Eyebrow>
          {recent.length === 0 ? (
            <p className="text-muted-foreground">
              Every question unlocks a knowledge card. Play your first round to start your collection.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {recent.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/knowledge?concept=${c.id}`}
                    className="block h-full bg-surface-2 p-3 outline-2 outline-ring hover:outline-gold"
                  >
                    <span className="block text-[11px] text-lavender">{c.category}</span>
                    <span className="block font-bold text-cream">{c.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href="/knowledge" className="mt-auto flex items-center gap-1 text-sm font-bold text-lavender hover:underline">
            Open Knowledge Library <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        </Panel>
      </div>

      {/* Learning progress */}
      <section aria-labelledby="progress-h" className="space-y-5">
        <h2 id="progress-h" className="sign">LEARNING PROGRESS</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          <StatTile label="Questions answered" value={stats.questionsAnswered} icon="Flag" />
          <StatTile label="Concepts unlocked" value={stats.conceptsUnlocked} icon="Library" accent="text-lavender" />
          <StatTile label="Day streak" value={stats.streak} icon="Flame" accent="text-[#ff8a4c]" />
          <StatTile label="Total XP" value={player.totalXp} icon="Star" accent="text-amber" />
          <StatTile label="Achievements" value={stats.achievements} icon="Trophy" accent="text-success" />
        </div>
        {stats.streak > 0 && (
          <p className="flex items-center gap-2 text-sm font-bold text-light">
            <Flame className="size-4 text-yellow" aria-hidden="true" />
            Play again tomorrow (UTC) to keep your {stats.streak}-day streak alive.
          </p>
        )}
      </section>
    </div>
  );
}

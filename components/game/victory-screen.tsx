"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpenText, Check, ChevronDown, House, MessageSquareQuote, Sparkles, Trophy, X } from "lucide-react";
import { Icon } from "@/components/common/ui-bits";
import { PixelSprite } from "@/components/player/pixel-sprite";
import { MODE_SCENES, PixelScene } from "@/components/scene/pixel-scene";
import { XpMeter } from "@/components/player/xp-meter";
import { Button } from "@/components/game/game-button";
import { ACHIEVEMENTS_BY_ID } from "@/data/progression";
import { usePlayer } from "@/hooks/use-player";
import { formatLevel, levelForXp } from "@/lib/levels";
import { cn } from "@/lib/utils";
import type { QuestionWithConcept, RankSnapshot, RoundResult } from "@/types";
import type { FeedbackData } from "./feedback-panel";
import type { RoundConfig } from "./round-runner";

export interface RoundAnswer extends FeedbackData {
  question: QuestionWithConcept;
  selected: string[];
  achievements: string[];
}

const CONFETTI_COLORS = ["#8f5bff", "#f6c544", "#5be37d", "#c3b4ff", "#ff6fae", "#4cc9f0"];

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        left: (i * 37) % 100,
        delay: (i % 9) * 0.18,
        dur: 2.4 + (i % 5) * 0.35,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        size: i % 3 === 0 ? 10 : 6,
      })),
    [],
  );
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-0"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            animation: `dx-confetti ${p.dur}s steps(24) ${p.delay}s 1 both`,
          }}
        />
      ))}
    </div>
  );
}

export function VictoryScreen({
  config,
  answers,
  result,
  rankBefore,
  startXp,
  startLevel,
  liveRanks,
  onPlayAgain,
}: {
  config: RoundConfig;
  answers: RoundAnswer[];
  result: RoundResult;
  rankBefore: RankSnapshot | null;
  startXp: number;
  startLevel: number;
  liveRanks: boolean;
  onPlayAgain: () => void;
}) {
  const { player } = usePlayer();
  const [review, setReview] = useState(false);
  const p = result.player;
  const correct = answers.filter((a) => a.correct).length;
  const score = answers.length ? Math.round((correct / answers.length) * 100) : 0;
  const xpEarned = Math.max(0, p.totalXp - startXp);
  const newConcepts = answers.filter((a) => a.conceptUnlocked).map((a) => a.question.concept);
  const level = levelForXp(p.totalXp);
  const leveledUp = level.level > startLevel;
  const achievements = Array.from(new Set([...answers.flatMap((a) => a.achievements), ...result.newAchievements]));

  // Rank change is only shown when the live backend confirms both positions.
  const climbed =
    liveRanks && rankBefore?.allTime && result.rank.allTime && rankBefore.allTime > result.rank.allTime
      ? rankBefore.allTime - result.rank.allTime
      : liveRanks && rankBefore?.weekly && result.rank.weekly && rankBefore.weekly > result.rank.weekly
        ? rankBefore.weekly - result.rank.weekly
        : 0;

  const headline = config.kind === "daily" ? "DAILY CHALLENGE COMPLETE!" : "QUEST COMPLETE!";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Confetti />
      <section className="pixel-frame pixel-shadow relative overflow-hidden rounded-lg text-center">
        {/* Title-screen moment: the level behind, LED headline, the hero on the floor. */}
        <div className="relative h-72 sm:h-80">
          <PixelScene variant={MODE_SCENES[config.gameMode] ?? "day"} />
          <div className="absolute inset-x-0 top-0 flex flex-col items-center gap-3 px-4 pt-6">
            <p className={cn("sign", config.accentText)}>
              <Icon name={config.icon} className="size-4" /> {config.title.toUpperCase()}
            </p>
            <h1 className="title-type is-yellow animate-pop text-4xl sm:text-6xl">{headline}</h1>
          </div>
          <div className="absolute inset-x-0 flex justify-center" style={{ bottom: "20%" }}>
            <PixelSprite characterId={player?.profile.characterId ?? "arcanist"} size={104} className="animate-float" />
          </div>
        </div>

        <div className="border-t-4 border-ink px-5 py-8 sm:px-10">
          {leveledUp ? (
            <p className="font-pixel text-xs text-success animate-pop">
              LEVEL UP! LV {formatLevel(level.level)} · {level.title.toUpperCase()}
            </p>
          ) : (
            <p className="text-muted-foreground">
              {score === 100
                ? "Flawless run. The arcade salutes you."
                : score >= 60
                  ? "Solid run. Every answer taught you something."
                  : "Every quest makes you sharper. Check the learning below."}
            </p>
          )}

          <dl className="mx-auto mt-6 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Answered" value={answers.length} />
            <Stat label="Correct" value={`${correct}/${answers.length}`} />
            <Stat label="Score" value={`${score}%`} />
            <Stat label="XP earned" value={`+${xpEarned}`} accent="text-amber" />
          </dl>

          {(result.roundBonus > 0 || result.dailyBonus > 0 || result.roundBonusAlreadyClaimed) && (
            <p className="mt-6 text-sm text-muted-foreground">
              {result.roundBonus > 0 && <span className="text-amber">+{result.roundBonus} XP round bonus. </span>}
              {result.dailyBonus > 0 && <span className="text-amber">+{result.dailyBonus} XP daily challenge bonus. </span>}
              {result.roundBonusAlreadyClaimed && "Today's round bonus was already claimed; it resets at 00:00 UTC."}
            </p>
          )}

          {/* Classic continue prompt. */}
          <div className="mt-8 flex flex-col items-center gap-4">
            <p className="font-led text-2xl text-cream">PLAY AGAIN?</p>
            <div className="flex gap-4">
              <Button onClick={onPlayAgain} className="h-12 px-6">
                <Check className="size-4" aria-hidden="true" /> YES
              </Button>
              <Button asChild variant="secondary" className="h-12 px-6">
                <Link href="/dashboard">
                  <X className="size-4" aria-hidden="true" /> NO
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="pixel-frame space-y-4 p-5">
          <h2 className="font-pixel text-[11px] text-lavender">LEVEL PROGRESS</h2>
          <XpMeter xp={p.totalXp} />
          <h2 className="pt-2 font-pixel text-[11px] text-lavender">LEADERBOARD</h2>
          <dl className="grid grid-cols-2 gap-3">
            <Stat label="Weekly rank" value={result.rank.weekly ? `#${result.rank.weekly}` : "–"} />
            <Stat label="All-time rank" value={result.rank.allTime ? `#${result.rank.allTime}` : "–"} />
          </dl>
          {climbed > 0 && (
            <p className="bg-success/15 px-3 py-2 text-center font-pixel text-[10px] text-success animate-pop">
              YOU CLIMBED {climbed} POSITION{climbed > 1 ? "S" : ""}!
            </p>
          )}
          {!liveRanks && (
            <p className="text-xs text-muted-foreground">
              Demo mode: ranks are against sample players on this device, not a live global board.
            </p>
          )}
        </section>

        <section className="pixel-frame space-y-4 p-5">
          <h2 className="font-pixel text-[11px] text-lavender">LOOT</h2>
          {newConcepts.length === 0 && achievements.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No new cards this time: you&apos;d already collected these concepts. Try another mode to find new ones.
            </p>
          )}
          {newConcepts.length > 0 && (
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-sm text-amber">
                <Sparkles className="size-4" aria-hidden="true" /> {newConcepts.length} knowledge card{newConcepts.length > 1 ? "s" : ""} unlocked
              </p>
              <ul className="flex flex-wrap gap-2">
                {newConcepts.map((c) => (
                  <li key={c.id} className="bg-gold/15 px-2 py-1 text-sm text-cream outline-2 outline-gold/50">
                    {c.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {newConcepts.length > 0 && (
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-sm text-lavender">
                <MessageSquareQuote className="size-4" aria-hidden="true" /> New phrases discovered
              </p>
              <ul className="space-y-2">
                {newConcepts.slice(0, 3).map((c) => (
                  <li key={c.id} className="border-l-4 border-primary pl-3 text-sm italic text-cream/90">
                    &ldquo;{c.designerPhrase}&rdquo;
                  </li>
                ))}
              </ul>
            </div>
          )}
          {achievements.length > 0 && (
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-sm text-success">
                <Trophy className="size-4" aria-hidden="true" /> Achievement{achievements.length > 1 ? "s" : ""} unlocked
              </p>
              <ul className="flex flex-wrap gap-2">
                {achievements.map((id) => (
                  <li key={id} className="flex items-center gap-2 bg-success/15 px-2 py-1 text-sm text-cream animate-pop">
                    <Icon name={ACHIEVEMENTS_BY_ID[id]?.icon ?? "Star"} className="size-4 text-success" />
                    {ACHIEVEMENTS_BY_ID[id]?.title ?? id}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <nav aria-label="What next" className="flex flex-wrap justify-center gap-4">
        <Button size="lg" variant="secondary" onClick={() => setReview((r) => !r)} aria-expanded={review} className="h-12 font-pixel text-[10px]">
          <ChevronDown className={cn("size-4 transition-transform", review && "rotate-180")} aria-hidden="true" /> REVIEW ANSWERS
        </Button>
        <Button asChild size="lg" variant="secondary" className="h-12 font-pixel text-[10px]">
          <Link href="/knowledge"><BookOpenText className="size-4" aria-hidden="true" /> EXPLORE KNOWLEDGE</Link>
        </Button>
        <Button asChild size="lg" variant="secondary" className="h-12 font-pixel text-[10px] text-amber">
          <Link href="/leaderboard"><Trophy className="size-4" aria-hidden="true" /> CHECK LEADERBOARD</Link>
        </Button>
        <Button asChild size="lg" variant="ghost" className="h-12 font-pixel text-[10px]">
          <Link href="/dashboard"><House className="size-4" aria-hidden="true" /> BACK TO HOME</Link>
        </Button>
      </nav>

      {review && (
        <section aria-label="Answer review" className="space-y-4">
          {answers.map((a, i) => (
            <article key={a.question.id} className="pixel-frame space-y-3 p-5">
              <p className={cn("flex items-center gap-2 font-pixel text-[9px]", a.correct ? "text-success" : "text-danger")}>
                {a.correct ? <Check className="size-4" aria-hidden="true" /> : <X className="size-4" aria-hidden="true" />}
                Q{i + 1} · {a.correct ? "CORRECT" : "INCORRECT"}
              </p>
              <h3 className="font-bold text-cream">{a.question.question}</h3>
              <p className="text-sm">
                <span className="text-muted-foreground">Your answer: </span>
                <span className={a.correct ? "text-success" : "text-danger"}>
                  {a.question.options.filter((o) => a.selected.includes(o.key)).map((o) => o.text).join(" · ")}
                </span>
              </p>
              {!a.correct && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Correct: </span>
                  <span className="text-success">
                    {a.question.options.filter((o) => a.correctAnswers.includes(o.key)).map((o) => o.text).join(" · ")}
                  </span>
                </p>
              )}
              <p className="text-sm text-cream/85">{a.question.explanation}</p>
              <p className="text-sm text-amber">{a.question.takeaway}</p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, accent = "text-cream" }: { label: string; value: React.ReactNode; accent?: string }) {
  return (
    <div className="flex flex-col-reverse bg-surface-2 px-3 py-4 outline-2 outline-ring">
      <dt className="mt-2 text-xs text-muted-foreground">{label}</dt>
      <dd className={cn("font-pixel text-base sm:text-lg", accent)}>{value}</dd>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { RoundRunner, type RoundConfig } from "@/components/game/round-runner";
import { Button } from "@/components/game/game-button";
import { GAME_MODES_BY_ID, isGameModeId } from "@/data/game-modes";
import { XP_RULES } from "@/data/progression";
import { usePlayer } from "@/hooks/use-player";
import { masteredQuestionIds, recentQuestionIds } from "@/lib/player-stats";
import { dailyQuestion, getQuestion, selectRound } from "@/lib/quiz-engine";
import { utcDateKey } from "@/lib/time";
import type { PlayerState } from "@/types";

function buildConfig(modeParam: string, player: PlayerState, nonce: number): RoundConfig | null {
  if (isGameModeId(modeParam)) {
    const m = GAME_MODES_BY_ID[modeParam];
    return {
      key: `${modeParam}-${nonce}`,
      title: m.title,
      accentText: m.accentText,
      icon: m.icon,
      kind: "standard",
      gameMode: m.id,
      questions: selectRound({
        mode: m.id,
        recentIds: recentQuestionIds(player),
        masteredIds: masteredQuestionIds(player),
      }),
    };
  }
  if (modeParam === "quick-play") {
    return {
      key: `quick-${nonce}`,
      title: "Quick Play",
      accentText: "text-lavender",
      icon: "Shuffle",
      kind: "standard",
      gameMode: "quick-play",
      questions: selectRound({ mode: "quick-play", recentIds: recentQuestionIds(player), masteredIds: masteredQuestionIds(player) }),
    };
  }
  if (modeParam === "daily") {
    return {
      key: `daily-${nonce}`,
      title: "Daily Challenge",
      accentText: "text-amber",
      icon: "CalendarDays",
      kind: "daily",
      gameMode: "daily",
      questions: [dailyQuestion()],
    };
  }
  if (modeParam === "review") {
    // Revisit previously answered questions, prioritising ones answered incorrectly.
    const missed = new Set(player.attempts.filter((a) => !a.correct).map((a) => a.questionId));
    const mastered = masteredQuestionIds(player);
    const ids = recentQuestionIds(player, 200)
      .sort((a, b) => Number(missed.has(b) && !mastered.has(b)) - Number(missed.has(a) && !mastered.has(a)))
      .slice(0, XP_RULES.roundSize);
    const questions = ids.map(getQuestion).filter((q) => q !== undefined);
    return {
      key: `review-${nonce}`,
      title: "Review Mode",
      accentText: "text-lavender",
      icon: "RotateCcw",
      kind: "review",
      gameMode: "review",
      questions,
    };
  }
  return null;
}

export default function RoundPage() {
  const params = useParams<{ mode: string }>();
  const { player } = usePlayer();
  const [nonce, setNonce] = useState(0);
  // Build once per round; useState keeps the selection stable while the player state updates.
  const [config, setConfig] = useState(() => (player ? buildConfig(params.mode, player, 0) : null));

  if (!player) return null;

  if (!config) {
    return (
      <EmptyRound title="UNKNOWN QUEST" body="That game mode doesn't exist. Pick one from the Play screen." />
    );
  }
  if (config.questions.length === 0) {
    return (
      <EmptyRound
        title="NOTHING TO REVIEW YET"
        body="Answer a few questions first, then come back to revisit them here."
      />
    );
  }

  const alreadyDoneDaily =
    config.kind === "daily" && player.xp.some((t) => t.reason === "daily_challenge" && t.ref === utcDateKey());

  return (
    <>
      {alreadyDoneDaily && (
        <p className="mx-auto mb-6 max-w-3xl bg-gold/10 px-4 py-3 text-sm text-amber">
          You&apos;ve already claimed today&apos;s daily bonus. You can still play it for practice; a new challenge
          arrives at 00:00 UTC.
        </p>
      )}
      <RoundRunner
        key={config.key}
        config={config}
        onPlayAgain={() => {
          const n = nonce + 1;
          setNonce(n);
          setConfig(buildConfig(params.mode === "daily" ? "quick-play" : params.mode, player, n));
        }}
      />
    </>
  );
}

function EmptyRound({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-lg space-y-6 py-16 text-center">
      <p className="font-pixel text-lg text-cream">{title}</p>
      <p className="text-muted-foreground">{body}</p>
      <Button asChild size="lg" className="font-pixel text-xs">
        <Link href="/play">CHOOSE A MODE</Link>
      </Button>
    </div>
  );
}

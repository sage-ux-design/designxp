"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Icon } from "@/components/common/ui-bits";
import { Button } from "@/components/game/game-button";
import { PixelSprite } from "@/components/player/pixel-sprite";
import { Hud } from "@/components/scene/pixel-icons";
import { MODE_SCENES, PixelScene } from "@/components/scene/pixel-scene";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/8bit/alert-dialog";
import { usePlayer } from "@/hooks/use-player";
import type { CompleteRoundInput } from "@/services";
import { useSettings } from "@/hooks/use-settings";
import { levelForXp } from "@/lib/levels";
import { playSfx } from "@/lib/sound";
import { cn } from "@/lib/utils";
import type { QuestionWithConcept, RankSnapshot, RoundKind, RoundResult } from "@/types";
import { AnswerOptions } from "./answer-options";
import { FeedbackPanel, type FeedbackData } from "./feedback-panel";
import { VictoryScreen, type RoundAnswer } from "./victory-screen";
import { VisualMock } from "./visual-mock";

export interface RoundConfig {
  key: string;
  title: string;
  accentText: string;
  icon: string;
  kind: RoundKind;
  gameMode: CompleteRoundInput["gameMode"];
  questions: QuestionWithConcept[];
}

type Phase = "answering" | "submitting" | "feedback" | "completing" | "complete";

function newRoundId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
        (Number(c) ^ (Math.random() * 16) >> (Number(c) / 4)).toString(16),
      );
}

export function RoundRunner({ config, onPlayAgain }: { config: RoundConfig; onPlayAgain: () => void }) {
  const { backend, player, setPlayer, mode } = usePlayer();
  const { settings } = useSettings();
  const router = useRouter();
  const [roundId] = useState(newRoundId);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>("answering");
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [answers, setAnswers] = useState<RoundAnswer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RoundResult | null>(null);
  const [rankBefore, setRankBefore] = useState<RankSnapshot | null>(null);
  const [exitOpen, setExitOpen] = useState(false);
  const [startXp] = useState(player?.totalXp ?? 0);
  const startLevel = levelForXp(startXp).level;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  const total = config.questions.length;
  const q = config.questions[index];

  // Capture leaderboard position before the round (only meaningful with live data).
  useEffect(() => {
    if (mode !== "live") return;
    backend.getMyRanks().then(setRankBefore).catch(() => setRankBefore(null));
  }, [backend, mode]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [index]);

  const toggle = useCallback(
    (key: string) => {
      playSfx("select", settings.sound);
      setSelected((prev) =>
        q.questionType === "multi" ? (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]) : [key],
      );
    },
    [q, settings.sound],
  );

  async function submit() {
    if (!selected.length || phase !== "answering") return;
    setPhase("submitting");
    setError(null);
    try {
      const res = await backend.submitAnswer({ roundId, roundKind: config.kind, questionId: q.id, selected });
      setPlayer(res.player);
      const fb: FeedbackData = {
        correct: res.correct,
        correctAnswers: res.correctAnswers,
        xpForAnswer: res.xpForAnswer,
        xpForConcept: res.xpForConcept,
        conceptUnlocked: res.conceptUnlocked,
        alreadyEarned: res.alreadyEarned,
      };
      setFeedback(fb);
      setAnswers((a) => [...a, { question: q, selected, ...fb, achievements: res.newAchievements }]);
      setPhase("feedback");
      playSfx(res.correct ? "correct" : "wrong", settings.sound);
      requestAnimationFrame(() => {
        feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        nextRef.current?.focus({ preventScroll: true });
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't submit your answer.");
      setPhase("answering");
    }
  }

  async function next() {
    if (index + 1 < total) {
      setIndex((i) => i + 1);
      setSelected([]);
      setFeedback(null);
      setPhase("answering");
      window.scrollTo({ top: 0 });
      return;
    }
    setPhase("completing");
    setError(null);
    try {
      const res = await backend.completeRound({ roundId, kind: config.kind, gameMode: config.gameMode });
      setPlayer(res.player);
      setResult(res);
      setPhase("complete");
      playSfx(levelForXp(res.player.totalXp).level > startLevel ? "levelup" : "victory", settings.sound);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't finish the round.");
      setPhase("feedback");
    }
  }

  // Keyboard: 1-4 / A-D / T-F select, Enter submits or continues.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (exitOpen || phase === "complete") return;
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return;
      if (phase === "answering") {
        const k = e.key.toUpperCase();
        const byIndex = /^[1-9]$/.test(k) ? q.options[Number(k) - 1] : undefined;
        const byKey = q.options.find((o) => o.key === k);
        const opt = byIndex ?? byKey;
        if (opt) {
          e.preventDefault();
          toggle(opt.key);
        } else if (e.key === "Enter" && selected.length && t.tagName !== "BUTTON") {
          e.preventDefault();
          void submit();
        }
      } else if (phase === "feedback" && e.key === "Enter" && t.tagName !== "BUTTON") {
        e.preventDefault();
        void next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (phase === "complete" && result && player) {
    return (
      <VictoryScreen
        config={config}
        answers={answers}
        result={result}
        rankBefore={rankBefore}
        startXp={startXp}
        startLevel={startLevel}
        liveRanks={mode === "live"}
        onPlayAgain={onPlayAgain}
      />
    );
  }

  const roundXp = answers.reduce((sum, a) => sum + a.xpForAnswer + a.xpForConcept, 0);
  const correctSoFar = answers.filter((a) => a.correct).length;
  const progress = Math.round(((index + (phase === "feedback" || phase === "completing" ? 1 : 0)) / total) * 100);
  const isLast = index + 1 === total;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Round HUD: the player's character walks across this mode's level as the round progresses. */}
      <div className="pixel-frame overflow-hidden rounded-lg">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-4 border-ink px-3 py-2">
          <p className={cn("flex items-center gap-2 font-pixel text-[10px]", config.accentText)}>
            <Icon name={config.icon} className="size-4" />
            {config.title.toUpperCase()}
          </p>
          <div className="flex items-center gap-2">
            <Hud icon="coin" value={`+${roundXp}`} label="XP this round" />
            <Hud icon="star" value={`${correctSoFar}/${answers.length}`} label="Correct so far" />
            <button
              onClick={() => setExitOpen(true)}
              className="flex h-9 items-center gap-1.5 rounded-md px-2 text-sm font-bold text-muted-foreground transition-colors hover:text-cream"
            >
              <LogOut className="size-4" aria-hidden="true" /> Exit
            </button>
          </div>
        </div>
        <div
          className="relative h-24 sm:h-28"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label={`Question ${index + 1} of ${total}`}
        >
          <PixelScene variant={MODE_SCENES[config.gameMode] ?? "day"} />
          <span className="absolute right-2 top-2 rounded-md bg-ink/85 px-2 py-0.5 font-led text-xl text-yellow sm:text-2xl" aria-hidden="true">
            Q{String(index + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
          </span>
          {/* Goal flag */}
          <span className="absolute right-[4%] h-10 w-1 bg-ink" style={{ bottom: "20%" }} aria-hidden="true">
            <span className="absolute left-1 top-0 h-4 w-5 bg-yellow" />
          </span>
          <span
            className="absolute transition-[left] duration-500 [transition-timing-function:var(--ease-in-out)]"
            style={{ left: `calc(${4 + progress * 0.82}% )`, bottom: "20%" }}
            aria-hidden="true"
          >
            <PixelSprite characterId={player?.profile.characterId ?? "arcanist"} size={44} />
          </span>
        </div>
      </div>

      {/* Question */}
      <section className="pixel-frame space-y-6 rounded-lg p-5 sm:p-7" aria-labelledby="question-heading">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="bg-surface-2 px-2 py-1">{q.concept.category}</span>
          {q.questionType === "multi" && <span className="bg-gold/15 px-2 py-1 text-amber">Select all that apply</span>}
          {q.questionType === "true-false" && <span className="bg-lavender/15 px-2 py-1 text-lavender">True or false</span>}
          {q.source === "designxp-original" && <span className="px-2 py-1">DesignXP original</span>}
        </div>
        <h1
          id="question-heading"
          ref={headingRef}
          tabIndex={-1}
          className="text-xl font-bold leading-snug text-cream outline-none sm:text-2xl"
        >
          {q.question}
        </h1>
        {q.visual && <VisualMock id={q.visual} />}
        <AnswerOptions
          question={q}
          selected={selected}
          onToggle={toggle}
          revealed={phase !== "answering" && phase !== "submitting"}
          correctAnswers={feedback?.correctAnswers ?? []}
        />
      </section>

      {error && (
        <p role="alert" className="bg-danger/15 px-4 py-3 text-sm text-danger">
          {error} Please try again.
        </p>
      )}

      {(phase === "answering" || phase === "submitting") && (
        <div className="sticky bottom-4 z-10 flex justify-end">
          <Button
            size="lg"
            onClick={submit}
            disabled={!selected.length || phase === "submitting"}
            className="h-14 w-full font-pixel text-xs sm:w-auto sm:px-10"
          >
            {phase === "submitting" ? "CHECKING..." : "CHECK ANSWER"}
          </Button>
        </div>
      )}

      {feedback && (phase === "feedback" || phase === "completing") && (
        <div ref={feedbackRef} className="scroll-mt-24 space-y-6">
          <FeedbackPanel question={q} data={feedback} />
          <div className="flex justify-end">
            <Button
              size="lg"
              ref={nextRef}
              onClick={next}
              disabled={phase === "completing"}
              className="h-14 w-full font-pixel text-xs sm:w-auto sm:px-10"
            >
              {phase === "completing" ? "SAVING..." : isLast ? "FINISH QUEST ▶" : "NEXT QUESTION ▶"}
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={exitOpen} onOpenChange={setExitOpen}>
        <AlertDialogContent font="normal">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-pixel text-sm">LEAVE THIS QUEST?</AlertDialogTitle>
            <AlertDialogDescription>
              XP for answers you&apos;ve already submitted is kept. The round won&apos;t count as completed, so no round
              bonus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep playing</AlertDialogCancel>
            <AlertDialogAction onClick={() => router.push("/play")}>Leave quest</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

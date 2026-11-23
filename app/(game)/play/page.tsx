"use client";

import Link from "next/link";
import { CalendarDays, RotateCcw, Shuffle } from "lucide-react";
import { PageHeader } from "@/components/common/ui-bits";
import { ModeCard } from "@/components/game/mode-card";
import { GAME_MODES } from "@/data/game-modes";
import { QUESTIONS } from "@/data/questions";
import { XP_RULES } from "@/data/progression";
import { usePlayer } from "@/hooks/use-player";
import { dailyQuestion, modeQuestionCount } from "@/lib/quiz-engine";
import { utcDateKey } from "@/lib/time";

export default function PlayPage() {
  const { player } = usePlayer();
  if (!player) return null;
  const answeredIds = new Set(player.attempts.map((a) => a.questionId));
  const answeredIn = (mode: string) => QUESTIONS.filter((q) => q.gameMode === mode && answeredIds.has(q.id)).length;
  const dailyDone = player.xp.some((t) => t.reason === "daily_challenge" && t.ref === utcDateKey());
  const daily = dailyQuestion();

  return (
    <div>
      <PageHeader
        eyebrow="SELECT YOUR CHALLENGE"
        title="CHOOSE A GAME MODE"
        subtitle={`Five questions per round, about 2–3 minutes. ${XP_RULES.correctAnswer} XP for each new correct answer, ${XP_RULES.conceptUnlock} XP for each new concept, and a daily round bonus.`}
      />

      <div className="mb-10 grid gap-4 md:grid-cols-3">
        <QuickTile
          href="/play/quick-play"
          icon={<Shuffle className="size-6" />}
          title="QUICK PLAY"
          body="Five random questions from every mode."
          tone="bg-paper outline-ink"
        />
        <QuickTile
          href="/play/daily"
          icon={<CalendarDays className="size-6" />}
          title="DAILY CHALLENGE"
          body={dailyDone ? "Bonus claimed today. Play again for practice." : `Today: ${daily.concept.category}. +${XP_RULES.dailyChallenge} XP bonus.`}
          tone="bg-yellow outline-ink"
        />
        <QuickTile
          href="/play/review"
          icon={<RotateCcw className="size-6" />}
          title="REVIEW MODE"
          body={player.attempts.length ? "Revisit questions you've answered, missed ones first." : "Unlocks after your first answers."}
          tone="bg-paper outline-ink"
        />
      </div>

      <h2 className="sign mb-6">GAME MODES</h2>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {GAME_MODES.map((m) => (
          <li key={m.id}>
            <ModeCard mode={m} questionCount={modeQuestionCount(m.id)} answered={answeredIn(m.id)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function QuickTile({ href, icon, title, body, tone }: { href: string; icon: React.ReactNode; title: string; body: string; tone: string }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-4 rounded-lg border-4 border-ink p-5 shadow-[0_6px_0_0_var(--ink)] transition-transform duration-150 hover:-translate-y-1 ${tone}`}
    >
      <span className="text-cream" aria-hidden="true">
        {icon}
      </span>
      <span className="space-y-1">
        <span className="block font-pixel text-[11px] text-cream">{title}</span>
        <span className="block text-sm text-muted-foreground">{body}</span>
      </span>
    </Link>
  );
}

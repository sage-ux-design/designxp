import { LEVELS } from "@/data/progression";
import type { LevelDef } from "@/types";

export interface LevelProgress {
  current: LevelDef;
  next: LevelDef | null;
  xpIntoLevel: number;
  xpForNext: number;
  percent: number;
  xpToNext: number;
}

export function levelForXp(xp: number): LevelDef {
  let current = LEVELS[0];
  for (const l of LEVELS) if (xp >= l.minXp) current = l;
  return current;
}

export function levelProgress(xp: number): LevelProgress {
  const current = levelForXp(xp);
  const next = LEVELS.find((l) => l.level === current.level + 1) ?? null;
  if (!next) return { current, next, xpIntoLevel: xp - current.minXp, xpForNext: 0, percent: 100, xpToNext: 0 };
  const span = next.minXp - current.minXp;
  const into = xp - current.minXp;
  return {
    current,
    next,
    xpIntoLevel: into,
    xpForNext: span,
    percent: Math.min(100, Math.round((into / span) * 100)),
    xpToNext: next.minXp - xp,
  };
}

export function formatLevel(level: number): string {
  return String(level).padStart(2, "0");
}

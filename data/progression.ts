import type { AchievementDef, LevelDef } from "../types";

export const LEVELS: LevelDef[] = [
  { level: 1, title: "Curious Newbie", minXp: 0 },
  { level: 2, title: "Pixel Apprentice", minXp: 100 },
  { level: 3, title: "UX Explorer", minXp: 250 },
  { level: 4, title: "Design Thinker", minXp: 450 },
  { level: 5, title: "Product Strategist", minXp: 700 },
  { level: 6, title: "Design Master", minXp: 1000 },
];

/** XP rules. Mirrored exactly by the Supabase functions in supabase/migrations. */
export const XP_RULES = {
  correctAnswer: 10,
  roundComplete: 5,
  conceptUnlock: 5,
  dailyChallenge: 15,
  roundSize: 5,
} as const;

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first-quest", title: "First Quest", description: "Complete your first round.", icon: "Flag" },
  { id: "quick-thinker", title: "Quick Thinker", description: "Answer five questions correctly in a row.", icon: "Zap" },
  { id: "perfect-round", title: "Flawless", description: "Score 5/5 in a single round.", icon: "Star" },
  { id: "knowledge-hunter", title: "Knowledge Hunter", description: "Unlock ten concepts.", icon: "Library" },
  { id: "ux-detective", title: "UX Detective", description: "Answer ten Spot the UX challenges.", icon: "ScanSearch" },
  { id: "product-mind", title: "Product Mind", description: "Answer ten product thinking challenges (What Would You Do? or Product Detective).", icon: "Brain" },
  { id: "design-streak", title: "Design Streak", description: "Play on three consecutive days.", icon: "Flame" },
  { id: "level-up", title: "Level Up", description: "Reach Level 3: UX Explorer.", icon: "TrendingUp" },
];

export const ACHIEVEMENTS_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

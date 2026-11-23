export type GameModeId =
  | "spot-the-ux"
  | "what-would-you-do"
  | "design-lingo"
  | "research-detective"
  | "copy-doctor"
  | "product-detective";

export type QuestionType = "single" | "multi" | "true-false" | "visual";
export type Difficulty = "easy" | "medium" | "hard";
export type QuestionSource = "pdf" | "designxp-original";

export type VisualMockId =
  | "proximity"
  | "error-message"
  | "empty-search"
  | "competing-buttons";

export interface QuestionOption {
  key: string;
  text: string;
}

export interface Question {
  id: string;
  /** Global ordering used for daily-challenge rotation (must match supabase seed). */
  sortOrder: number;
  source: QuestionSource;
  /** Number in the source PDF (1-50) for imported questions. */
  sourceNumber?: number;
  /** Module heading from the source PDF, e.g. "PROBLEM FRAMING & DISCOVERY". */
  module: string;
  question: string;
  options: QuestionOption[];
  correctAnswers: string[];
  explanation: string;
  takeaway: string;
  conceptId: string;
  category: ConceptCategory;
  difficulty: Difficulty;
  gameMode: GameModeId;
  questionType: QuestionType;
  visual?: VisualMockId;
}

/** Question joined with its concept learning fields. */
export interface QuestionWithConcept extends Question {
  concept: Concept;
}

export type ConceptCategory =
  | "Problem Framing"
  | "User Research"
  | "UX Psychology"
  | "UX Laws"
  | "Information Architecture"
  | "Visual Design"
  | "Design Systems"
  | "Accessibility"
  | "Product Strategy"
  | "Metrics"
  | "Collaboration"
  | "Ethics"
  | "UX Writing";

export interface Concept {
  id: string;
  name: string;
  category: ConceptCategory;
  simpleDefinition: string;
  whyItMatters: string;
  realWorldExample: string;
  designerPhrase: string;
}

export interface GameMode {
  id: GameModeId;
  number: string;
  title: string;
  tagline: string;
  description: string;
  topics: string[];
  /** Tailwind classes for the mode accent. */
  accent: string;
  accentText: string;
  icon: string;
}

export interface Phrase {
  id: string;
  phrase: string;
  meaning: string;
  context: string;
  example: string;
}

export interface CharacterDef {
  id: string;
  name: string;
  title: string;
  bio: string;
  palette: Record<string, string>;
  /** 16 rows of 8 characters: left half, mirrored to build a 16x16 sprite. */
  half: string[];
  /** Asymmetric pixel overrides: [x, y, paletteKey]. */
  overrides?: [number, number, string][];
}

export interface LevelDef {
  level: number;
  title: string;
  minXp: number;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
}

/* ---------- Player state ---------- */

export interface PlayerProfile {
  id: string;
  gamertag: string;
  characterId: string;
  createdAt: string;
}

export interface AttemptRecord {
  questionId: string;
  roundId: string;
  selected: string[];
  correct: boolean;
  gameMode: GameModeId;
  at: string;
}

export type XpReason = "correct_answer" | "concept_unlock" | "round_bonus" | "daily_challenge";

export interface XpTransaction {
  amount: number;
  reason: XpReason;
  ref: string;
  at: string;
}

export interface RoundRecord {
  roundId: string;
  kind: RoundKind;
  gameMode: GameModeId | "quick-play" | "daily" | "review";
  questionCount: number;
  correctCount: number;
  xpEarned: number;
  at: string;
}

export interface PlayerState {
  profile: PlayerProfile;
  totalXp: number;
  weeklyXp: number;
  attempts: AttemptRecord[];
  xp: XpTransaction[];
  unlockedConcepts: { conceptId: string; at: string }[];
  achievements: { achievementId: string; at: string }[];
  activityDates: string[];
  rounds: RoundRecord[];
}

export type RoundKind = "standard" | "daily" | "review";

export interface AnswerResult {
  correct: boolean;
  correctAnswers: string[];
  xpForAnswer: number;
  conceptUnlocked: boolean;
  xpForConcept: number;
  alreadyEarned: boolean;
  newAchievements: string[];
  player: PlayerState;
}

export interface RankSnapshot {
  weekly: number | null;
  allTime: number | null;
}

export interface RoundResult {
  roundBonus: number;
  dailyBonus: number;
  roundBonusAlreadyClaimed: boolean;
  newAchievements: string[];
  player: PlayerState;
  rank: RankSnapshot;
}

export type LeaderboardPeriod = "weekly" | "all-time";

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  gamertag: string;
  characterId: string;
  level: number;
  xp: number;
  isDemo: boolean;
  isCurrentPlayer: boolean;
}

export interface LeaderboardResult {
  period: LeaderboardPeriod;
  entries: LeaderboardEntry[];
  me: LeaderboardEntry | null;
  totalPlayers: number;
  weekStart: string;
  weekEnd: string;
}

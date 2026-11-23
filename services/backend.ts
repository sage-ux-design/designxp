import type {
  AnswerResult,
  GameModeId,
  LeaderboardPeriod,
  LeaderboardResult,
  PlayerState,
  RankSnapshot,
  RoundKind,
  RoundResult,
} from "@/types";

export type BackendMode = "demo" | "live";

export class GamertagTakenError extends Error {
  constructor() {
    super("That gamertag is already taken.");
    this.name = "GamertagTakenError";
  }
}

export interface SubmitAnswerInput {
  roundId: string;
  roundKind: RoundKind;
  questionId: string;
  selected: string[];
}

export interface CompleteRoundInput {
  roundId: string;
  kind: RoundKind;
  gameMode: GameModeId | "quick-play" | "daily" | "review";
}

/**
 * The frontend only talks to this interface. `LocalBackend` powers demo mode;
 * `SupabaseBackend` powers the shared leaderboard. Switching requires only env vars.
 */
export interface Backend {
  readonly mode: BackendMode;
  /** Returns the current player, or null if onboarding is needed. */
  loadPlayer(): Promise<PlayerState | null>;
  isGamertagAvailable(tag: string): Promise<boolean>;
  createPlayer(tag: string, characterId: string): Promise<PlayerState>;
  updateProfile(changes: { gamertag?: string; characterId?: string }): Promise<PlayerState>;
  submitAnswer(input: SubmitAnswerInput): Promise<AnswerResult>;
  completeRound(input: CompleteRoundInput): Promise<RoundResult>;
  getLeaderboard(period: LeaderboardPeriod, limit?: number): Promise<LeaderboardResult>;
  getMyRanks(): Promise<RankSnapshot>;
  /** Removes this browser's local player data (and signs out of the anonymous session in live mode). */
  resetLocal(): Promise<void>;
}

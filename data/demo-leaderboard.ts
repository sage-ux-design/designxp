/**
 * SAMPLE DATA — shown only in demo mode (no Supabase credentials configured).
 * These are fictional players used to preview the leaderboard. They are always labelled "DEMO"
 * in the UI and never presented as live or global rankings.
 */
export interface DemoPlayer {
  id: string;
  gamertag: string;
  characterId: string;
  totalXp: number;
  weeklyXp: number;
}

export const DEMO_PLAYERS: DemoPlayer[] = [
  { id: "demo-1", gamertag: "KerningQueen", characterId: "arcanist", totalXp: 940, weeklyXp: 120 },
  { id: "demo-2", gamertag: "PixelPusher", characterId: "bolt-8", totalXp: 815, weeklyXp: 165 },
  { id: "demo-3", gamertag: "WireframeWolf", characterId: "ember", totalXp: 690, weeklyXp: 95 },
  { id: "demo-4", gamertag: "HeuristicHero", characterId: "shade", totalXp: 560, weeklyXp: 140 },
  { id: "demo-5", gamertag: "GridGoblin", characterId: "gloop", totalXp: 455, weeklyXp: 60 },
  { id: "demo-6", gamertag: "FigmaFalcon", characterId: "nova", totalXp: 380, weeklyXp: 85 },
  { id: "demo-7", gamertag: "JTBD_Jedi", characterId: "dr-flux", totalXp: 300, weeklyXp: 45 },
  { id: "demo-8", gamertag: "AffordanceAce", characterId: "atlas", totalXp: 215, weeklyXp: 70 },
  { id: "demo-9", gamertag: "TokenTinker", characterId: "glitch", totalXp: 140, weeklyXp: 30 },
  { id: "demo-10", gamertag: "ZibZoomer", characterId: "zib", totalXp: 75, weeklyXp: 25 },
];

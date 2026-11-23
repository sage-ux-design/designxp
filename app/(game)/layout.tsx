import { GameGate } from "@/components/layout/game-gate";

// Player identity lives in the browser (local demo storage or an anonymous Supabase session),
// so in-game pages render after the client knows who is playing. Navigations may show the
// arcade loading screen briefly; opt out of instant-navigation validation for this group.
export const instant = false;

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return <GameGate>{children}</GameGate>;
}

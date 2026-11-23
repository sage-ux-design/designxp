import type { GameMode, GameModeId } from "../types";

export const GAME_MODES: GameMode[] = [
  {
    id: "spot-the-ux",
    number: "01",
    title: "Spot the UX",
    tagline: "Find what others miss.",
    description: "Hunt down usability problems in real interfaces and pick the fix that works.",
    topics: ["Heuristics", "Visual hierarchy", "Signifiers", "Accessibility", "Error prevention"],
    accent: "bg-[var(--mode-spot)]",
    accentText: "text-[var(--mode-spot-ink)]",
    icon: "ScanSearch",
  },
  {
    id: "what-would-you-do",
    number: "02",
    title: "What Would You Do?",
    tagline: "Think like a product designer.",
    description: "Real product situations. Stakeholders, trade-offs and scope. Pick your next move.",
    topics: ["Problem framing", "Trade-offs", "Stakeholders", "Scope", "Responsible AI"],
    accent: "bg-[var(--mode-wwyd)]",
    accentText: "text-[var(--mode-wwyd-ink)]",
    icon: "Swords",
  },
  {
    id: "design-lingo",
    number: "03",
    title: "Design Lingo",
    tagline: "Speak the language of design.",
    description: "Learn the terms senior designers use in reviews, from Hick's Law to design tokens.",
    topics: ["UX laws", "Gestalt", "Affordance", "Design systems", "Dark patterns"],
    accent: "bg-[var(--mode-lingo)]",
    accentText: "text-[var(--mode-lingo-ink)]",
    icon: "BookOpenText",
  },
  {
    id: "research-detective",
    number: "04",
    title: "Research Detective",
    tagline: "Find the right clues.",
    description: "Choose the right research method for the question in front of you.",
    topics: ["Interviews", "Usability testing", "Diary studies", "JTBD", "Card sorting"],
    accent: "bg-[var(--mode-research)]",
    accentText: "text-[var(--mode-research-ink)]",
    icon: "Search",
  },
  {
    id: "copy-doctor",
    number: "05",
    title: "Copy Doctor",
    tagline: "Every word matters.",
    description: "Diagnose weak microcopy, error messages and CTAs, then prescribe better words.",
    topics: ["Microcopy", "Error messages", "Empty states", "CTA wording", "Inclusive language"],
    accent: "bg-[var(--mode-copy)]",
    accentText: "text-[var(--mode-copy-ink)]",
    icon: "PenLine",
  },
  {
    id: "product-detective",
    number: "06",
    title: "Product Detective",
    tagline: "Think beyond the interface.",
    description: "Metrics, MVPs and strategy. Solve the case behind the numbers.",
    topics: ["MVP", "North Star", "Retention", "Funnels", "Experiments"],
    accent: "bg-[var(--mode-product)]",
    accentText: "text-[var(--mode-product-ink)]",
    icon: "ChartNoAxesCombined",
  },
];

export const GAME_MODES_BY_ID = Object.fromEntries(GAME_MODES.map((m) => [m.id, m])) as Record<GameModeId, GameMode>;

export function isGameModeId(v: string | null | undefined): v is GameModeId {
  return !!v && v in GAME_MODES_BY_ID;
}

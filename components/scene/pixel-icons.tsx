import { cn } from "@/lib/utils";

/** Small 8x8 pixel icons for HUD readouts. Decorative: pair them with text. */
type Px = [number, number, number, number, string];
const INK = "#261527";

const ICONS: Record<string, Px[]> = {
  coin: [
    [2, 0, 4, 1, INK], [1, 1, 1, 1, INK], [6, 1, 1, 1, INK], [0, 2, 1, 4, INK], [7, 2, 1, 4, INK],
    [1, 6, 1, 1, INK], [6, 6, 1, 1, INK], [2, 7, 4, 1, INK],
    [2, 1, 4, 1, "#fcd63a"], [1, 2, 6, 4, "#fcd63a"], [2, 6, 4, 1, "#fda405"],
    [3, 2, 1, 4, "#fff1a8"], [5, 2, 1, 4, "#fda405"],
  ],
  heart: [
    [1, 1, 2, 1, INK], [5, 1, 2, 1, INK], [0, 2, 1, 2, INK], [3, 2, 2, 1, INK], [7, 2, 1, 2, INK],
    [1, 4, 1, 1, INK], [6, 4, 1, 1, INK], [2, 5, 1, 1, INK], [5, 5, 1, 1, INK], [3, 6, 2, 1, INK],
    [1, 2, 2, 2, "#f25a4a"], [5, 2, 2, 2, "#f25a4a"], [3, 3, 2, 1, "#f25a4a"], [2, 4, 4, 1, "#f25a4a"], [3, 5, 2, 1, "#f25a4a"],
    [1, 2, 1, 1, "#ffb3b8"],
  ],
  star: [
    [3, 0, 2, 1, INK], [2, 1, 1, 2, INK], [5, 1, 1, 2, INK], [0, 3, 2, 1, INK], [6, 3, 2, 1, INK],
    [1, 4, 1, 1, INK], [6, 4, 1, 1, INK], [1, 5, 1, 2, INK], [6, 5, 1, 2, INK], [2, 7, 1, 1, INK], [5, 7, 1, 1, INK], [3, 6, 2, 1, INK],
    [3, 1, 2, 2, "#fcd63a"], [2, 3, 4, 1, "#fcd63a"], [2, 4, 4, 1, "#fcd63a"], [2, 5, 1, 2, "#fcd63a"], [5, 5, 1, 2, "#fcd63a"], [3, 5, 2, 1, "#fcd63a"],
  ],
  flame: [
    [3, 0, 1, 1, INK], [2, 1, 1, 2, INK], [4, 1, 1, 1, INK], [5, 2, 1, 1, INK], [1, 3, 1, 3, INK], [6, 3, 1, 3, INK],
    [2, 6, 1, 1, INK], [5, 6, 1, 1, INK], [3, 7, 2, 1, INK],
    [3, 1, 1, 2, "#fda405"], [4, 2, 1, 1, "#fda405"], [2, 3, 4, 3, "#fda405"], [3, 6, 2, 1, "#fda405"], [3, 4, 2, 2, "#fcd63a"],
  ],
  card: [
    [1, 0, 6, 1, INK], [0, 1, 1, 6, INK], [7, 1, 1, 6, INK], [1, 7, 6, 1, INK],
    [1, 1, 6, 6, "#4aa8f0"], [2, 2, 4, 2, "#ffffff"], [2, 5, 4, 1, "#261527"],
  ],
};

export function PixelIcon({ name, size = 16, className }: { name: keyof typeof ICONS | string; size?: number; className?: string }) {
  const px = ICONS[name] ?? ICONS.star;
  return (
    <svg viewBox="0 0 8 8" width={size} height={size} className={cn("pixel-render shrink-0", className)} aria-hidden="true">
      {px.map(([x, y, w, h, f], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={f} />
      ))}
    </svg>
  );
}

/** HUD readout: icon + value, styled like a game HUD counter. */
export function Hud({ icon, value, label, className }: { icon: string; value: React.ReactNode; label: string; className?: string }) {
  return (
    <span className={cn("hud", className)} aria-label={`${label}: ${typeof value === "string" || typeof value === "number" ? value : ""}`}>
      <span className="grid size-6 place-items-center rounded-sm bg-paper-3">
        <PixelIcon name={icon} size={16} />
      </span>
      <span aria-hidden="true">{value}</span>
    </span>
  );
}

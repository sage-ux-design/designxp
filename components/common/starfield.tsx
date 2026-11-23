import { cn } from "@/lib/utils";

/** Deterministic pixel starfield + skyline backdrop (decorative). */
const STARS = Array.from({ length: 46 }, (_, i) => {
  const r = (n: number) => {
    const v = Math.sin((i + 1) * 12.9898 + n * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };
  return {
    x: (r(1) * 100).toFixed(2),
    y: (r(2) * 70).toFixed(2),
    s: r(3) > 0.8 ? 3 : 2,
    d: (r(4) * 3).toFixed(2),
    gold: r(5) > 0.9,
  };
});

const SKYLINE = [6, 10, 7, 14, 9, 12, 5, 16, 11, 8, 13, 6, 10, 15, 7, 12, 9, 5, 11, 14, 8, 10, 6, 13];

export function Starfield({ className, skyline = true }: { className?: string; skyline?: boolean }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {STARS.map((s, i) => (
        <span
          key={i}
          className="absolute animate-twinkle"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.s}px`,
            height: `${s.s}px`,
            backgroundColor: s.gold ? "var(--gold)" : "var(--lavender)",
            animationDelay: `${s.d}s`,
          }}
        />
      ))}
      {skyline && (
        <svg
          className="pixel-render absolute bottom-0 left-0 h-[22%] w-full opacity-60"
          viewBox={`0 0 ${SKYLINE.length * 4} 18`}
          preserveAspectRatio="none"
        >
          {SKYLINE.map((h, i) => (
            <g key={i}>
              <rect x={i * 4} y={18 - h} width={4} height={h} fill="#1b1640" />
              {h > 8 && <rect x={i * 4 + 1} y={18 - h + 2} width={1} height={1} fill="#f6c544" opacity={0.7} />}
              {h > 11 && <rect x={i * 4 + 2} y={18 - h + 5} width={1} height={1} fill="#8f5bff" opacity={0.8} />}
            </g>
          ))}
          <rect x={0} y={17} width={SKYLINE.length * 4} height={1} fill="#8f5bff" opacity={0.5} />
        </svg>
      )}
    </div>
  );
}

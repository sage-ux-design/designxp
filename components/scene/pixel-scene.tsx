import { memo } from "react";
import { cn } from "@/lib/utils";

/**
 * Original pixel-art level scenery, drawn as crisp SVG rects on a 160x90 grid.
 * Each variant is a different "world" (time of day / biome) so screens and modes
 * feel like distinct levels. Purely decorative.
 */
export type SceneVariant = "day" | "sunset" | "jungle" | "night" | "candy" | "desert";

interface Palette {
  sky: string;
  skyBand: string;
  cloud: string;
  cloudShade: string;
  hill: string;
  floorA: string;
  floorB: string;
  floorTop: string;
  bush: string;
  bushShade: string;
  brick: string;
  brickLine: string;
  star: string;
}

const PALETTES: Record<SceneVariant, Palette> = {
  day: {
    sky: "#5a4ec8", skyBand: "#6352c9", cloud: "#fdf7ed", cloudShade: "#c8b8ea", hill: "#4b48bb",
    floorA: "#d878ca", floorB: "#b64a9d", floorTop: "#fcd6e5", bush: "#5fa04a", bushShade: "#336c39",
    brick: "#d0633a", brickLine: "#8a2f1a", star: "#fcd63a",
  },
  sunset: {
    sky: "#ff8f6b", skyBand: "#ffa77d", cloud: "#ffe3c2", cloudShade: "#ffc29b", hill: "#d9607a",
    floorA: "#7d3f8c", floorB: "#6c337b", floorTop: "#f0478f", bush: "#2fb455", bushShade: "#1f8a3e",
    brick: "#c8642a", brickLine: "#6e2c10", star: "#fff1a8",
  },
  jungle: {
    sky: "#3fb8c9", skyBand: "#55c7d6", cloud: "#e9fbff", cloudShade: "#b9e9f0", hill: "#2a9a6d",
    floorA: "#2f7a3a", floorB: "#286a32", floorTop: "#8fe05a", bush: "#5cd16b", bushShade: "#2f9a45",
    brick: "#b7792f", brickLine: "#6a3f12", star: "#fcd63a",
  },
  night: {
    sky: "#2b2a7a", skyBand: "#33328a", cloud: "#5b58b8", cloudShade: "#46439c", hill: "#22216a",
    floorA: "#1f1c5e", floorB: "#191650", floorTop: "#4cc3ff", bush: "#2f8f6a", bushShade: "#1f6b4f",
    brick: "#7a5bc9", brickLine: "#3c2a7a", star: "#fff1a8",
  },
  candy: {
    sky: "#ff8fc6", skyBand: "#ffa3d1", cloud: "#ffffff", cloudShade: "#ffd2ea", hill: "#e86aa8",
    floorA: "#a35fd6", floorB: "#9152c4", floorTop: "#4cc3ff", bush: "#7be08a", bushShade: "#43b85a",
    brick: "#ff8a2a", brickLine: "#9c4a12", star: "#fff1a8",
  },
  desert: {
    sky: "#ffc65c", skyBand: "#ffd27a", cloud: "#fff6dc", cloudShade: "#ffe3a3", hill: "#e9a03f",
    floorA: "#c9773a", floorB: "#b86b33", floorTop: "#fcd63a", bush: "#4fb85f", bushShade: "#2f8a43",
    brick: "#a85a2a", brickLine: "#5e2d10", star: "#ffffff",
  },
};

const INK = "#261527";
const W = 160;
const H = 90;

type R = [number, number, number, number, string];

function cloud(x: number, y: number, p: Palette): R[] {
  return [
    [x + 3, y, 8, 1, INK], [x + 1, y + 1, 2, 1, INK], [x + 11, y + 1, 3, 1, INK],
    [x, y + 2, 1, 3, INK], [x + 14, y + 2, 1, 1, INK], [x + 15, y + 3, 1, 2, INK],
    [x + 1, y + 5, 14, 1, INK],
    [x + 3, y + 1, 8, 1, p.cloud], [x + 1, y + 2, 13, 1, p.cloud], [x + 1, y + 3, 14, 1, p.cloud],
    [x + 1, y + 4, 14, 1, p.cloudShade],
  ];
}

function bush(x: number, y: number, w: number, p: Palette): R[] {
  return [
    [x + 2, y, w - 4, 1, INK], [x + 1, y + 1, 1, 1, INK], [x + w - 2, y + 1, 1, 1, INK],
    [x, y + 2, 1, 4, INK], [x + w - 1, y + 2, 1, 4, INK],
    [x + 2, y + 1, w - 4, 1, p.bush], [x + 1, y + 2, w - 2, 3, p.bush], [x + 1, y + 5, w - 2, 1, p.bushShade],
    // little dot eyes
    [x + Math.floor(w / 2) - 2, y + 2, 1, 2, INK], [x + Math.floor(w / 2) + 1, y + 2, 1, 2, INK],
  ];
}

function brickBlock(x: number, y: number, p: Palette): R[] {
  return [
    [x, y, 8, 8, INK], [x + 1, y + 1, 6, 6, p.brick],
    [x + 1, y + 3, 6, 1, p.brickLine], [x + 1, y + 5, 6, 0.6, p.brickLine],
    [x + 4, y + 1, 1, 2, p.brickLine], [x + 2, y + 4, 1, 1, p.brickLine], [x + 5, y + 4, 1, 1, p.brickLine],
    [x + 1, y + 1, 6, 0.6, "rgba(255,255,255,0.35)"],
  ];
}

function itemBlock(x: number, y: number, fill: string, glyph: "q" | "star" | "heart"): R[] {
  const out: R[] = [
    [x, y, 9, 9, INK], [x + 1, y + 1, 7, 7, fill],
    [x + 1, y + 1, 7, 1, "rgba(255,255,255,0.45)"], [x + 1, y + 7, 7, 1, "rgba(0,0,0,0.18)"],
  ];
  const g = "#ffffff";
  if (glyph === "q") out.push([x + 3, y + 2, 3, 1, INK], [x + 5, y + 3, 1, 1, INK], [x + 4, y + 4, 1, 1, INK], [x + 4, y + 6, 1, 1, INK]);
  if (glyph === "star")
    out.push([x + 4, y + 2, 1, 1, "#fcd63a"], [x + 2, y + 3, 5, 1, "#fcd63a"], [x + 3, y + 4, 3, 1, "#fcd63a"], [x + 3, y + 5, 1, 1, "#fcd63a"], [x + 5, y + 5, 1, 1, "#fcd63a"]);
  if (glyph === "heart")
    out.push([x + 2, y + 3, 2, 1, g], [x + 5, y + 3, 2, 1, g], [x + 2, y + 4, 5, 1, g], [x + 3, y + 5, 3, 1, g], [x + 4, y + 6, 1, 1, g]);
  return out;
}

function sparkle(x: number, y: number, c: string): R[] {
  return [[x, y - 1, 1, 3, c], [x - 1, y, 3, 1, c]];
}

function moon(x: number, y: number): R[] {
  return [[x + 1, y, 5, 1, "#fff6cf"], [x, y + 1, 7, 5, "#fff6cf"], [x + 1, y + 6, 5, 1, "#fff6cf"], [x + 2, y + 2, 1, 1, "#e8dca0"], [x + 4, y + 4, 1, 1, "#e8dca0"]];
}

function sun(x: number, y: number): R[] {
  return [[x + 2, y, 6, 1, "#fff1a8"], [x + 1, y + 1, 8, 1, "#fff1a8"], [x, y + 2, 10, 6, "#fff1a8"], [x + 1, y + 8, 8, 1, "#fff1a8"], [x + 2, y + 9, 6, 1, "#fff1a8"]];
}

function buildScene(variant: SceneVariant, floor: boolean): R[] {
  const p = PALETTES[variant];
  const r: R[] = [[0, 0, W, H, p.sky]];
  // Soft sky tiles.
  for (let y = 6; y < H; y += 12) r.push([0, y, W, 1, p.skyBand]);
  for (let x = 6; x < W; x += 12) r.push([x, 0, 1, H, p.skyBand]);

  if (variant === "night") r.push(...moon(124, 8));
  if (variant === "sunset" || variant === "desert") r.push(...sun(118, 10));

  // Keep the centre column calm: titles and panels sit there.
  r.push(...cloud(4, 8, p), ...cloud(136, 6, p), ...cloud(118, 30, p), ...cloud(22, 34, p));
  r.push(...sparkle(30, 20, p.star), ...sparkle(128, 22, "#ffffff"), ...sparkle(154, 40, p.star), ...sparkle(8, 48, "#ffffff"));

  const ground = floor ? 72 : H;
  // Stepped hills.
  const hills = [[0, 8], [10, 12], [22, 9], [34, 14], [48, 10], [60, 7], [72, 11], [86, 15], [100, 9], [114, 12], [128, 8], [140, 13], [152, 10]];
  for (const [x, h] of hills) r.push([x, ground - h, 14, h, p.hill]);

  if (floor) {
    // Checker floor with a bright edge.
    r.push([0, ground, W, 1, INK], [0, ground + 1, W, 2, p.floorTop], [0, ground + 3, W, 1, INK]);
    for (let y = ground + 4, row = 0; y < H; y += 6, row++)
      for (let x = 0, col = 0; x < W; x += 8, col++) r.push([x, y, 8, 6, (row + col) % 2 ? p.floorA : p.floorB]);
    r.push(...bush(4, ground - 6, 16, p), ...bush(98, ground - 6, 12, p), ...bush(140, ground - 6, 18, p));
    r.push(...brickBlock(28, ground - 8, p), ...brickBlock(36, ground - 8, p), ...brickBlock(120, ground - 8, p));
  }

  r.push(...itemBlock(12, 50, "#fda405", "q"), ...itemBlock(140, 44, "#fc65a7", "star"), ...itemBlock(149, 56, "#4aa8f0", "heart"));
  return r;
}

const cache = new Map<string, React.ReactNode[]>();

export const PixelScene = memo(function PixelScene({
  variant = "day",
  floor = true,
  className,
}: {
  variant?: SceneVariant;
  floor?: boolean;
  className?: string;
}) {
  const key = `${variant}-${floor}`;
  let nodes = cache.get(key);
  if (!nodes) {
    nodes = buildScene(variant, floor).map(([x, y, w, h, fill], i) => (
      <rect key={i} x={x} y={y} width={w} height={h} fill={fill} />
    ));
    cache.set(key, nodes);
  }
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      className={cn("pixel-render pointer-events-none absolute inset-0 h-full w-full", className)}
      aria-hidden="true"
    >
      {nodes}
    </svg>
  );
});

export const MODE_SCENES: Record<string, SceneVariant> = {
  "spot-the-ux": "sunset",
  "what-would-you-do": "day",
  "design-lingo": "night",
  "research-detective": "jungle",
  "copy-doctor": "candy",
  "product-detective": "desert",
  "quick-play": "day",
  daily: "sunset",
  review: "night",
};

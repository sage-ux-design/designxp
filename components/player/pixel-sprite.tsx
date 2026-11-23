import { memo } from "react";
import { getCharacter } from "@/data/characters";
import type { CharacterDef } from "@/types";
import { cn } from "@/lib/utils";

function buildGrid(c: CharacterDef): string[][] {
  const grid = c.half.map((row) => {
    const left = row.padEnd(8, ".").slice(0, 8).split("");
    return [...left, ...[...left].reverse()];
  });
  for (const [x, y, key] of c.overrides ?? []) if (grid[y]) grid[y][x] = key;
  return grid;
}

const cache = new Map<string, string[][]>();

/** Renders an original 16x16 character sprite as crisp SVG pixels. */
export const PixelSprite = memo(function PixelSprite({
  characterId,
  size = 64,
  className,
  title,
}: {
  characterId: string;
  size?: number;
  className?: string;
  title?: string;
}) {
  const c = getCharacter(characterId);
  let grid = cache.get(c.id);
  if (!grid) {
    grid = buildGrid(c);
    cache.set(c.id, grid);
  }
  const rects: React.ReactNode[] = [];
  grid.forEach((row, y) =>
    row.forEach((key, x) => {
      const fill = c.palette[key];
      if (fill) rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={fill} />);
    }),
  );
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      className={cn("pixel-render shrink-0", className)}
      role="img"
      aria-label={title ?? `${c.name} the ${c.title}`}
    >
      {rects}
    </svg>
  );
});

import { cn } from "@/lib/utils";
import { PixelSprite } from "./pixel-sprite";

/** Character sprite inside a framed "portrait" tile. */
export function PlayerAvatar({
  characterId,
  size = 56,
  className,
  highlight,
}: {
  characterId: string;
  size?: number;
  className?: string;
  highlight?: "gold" | "silver" | "bronze" | "primary";
}) {
  const ring =
    highlight === "gold"
      ? "bg-gold/25 outline-gold"
      : highlight === "silver"
        ? "bg-lavender/20 outline-lavender"
        : highlight === "bronze"
          ? "bg-[#d98b5f]/25 outline-[#d98b5f]"
          : highlight === "primary"
            ? "bg-primary/25 outline-primary"
            : "bg-surface-2 outline-ring";
  return (
    <div
      className={cn("grid place-items-center outline-4 -outline-offset-0 shrink-0", ring, className)}
      style={{ width: size + 12, height: size + 12 }}
    >
      <PixelSprite characterId={characterId} size={size} />
    </div>
  );
}

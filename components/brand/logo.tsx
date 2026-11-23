import { cn } from "@/lib/utils";

/**
 * DESIGNXP wordmark. "xl" is the title-screen version: chunky outlined type with
 * stepped depth. Smaller sizes are flat for the HUD bar.
 */
export function Logo({ size = "md", className }: { size?: "sm" | "md" | "xl"; className?: string }) {
  if (size === "xl")
    return (
      <span className={cn("inline-flex select-none flex-wrap items-end justify-center gap-x-3 leading-none", className)}>
        <span className="title-type text-4xl sm:text-6xl md:text-7xl">DESIGN</span>
        <span className="title-type is-yellow text-4xl sm:text-6xl md:text-7xl">XP</span>
      </span>
    );
  const text = size === "md" ? "text-sm sm:text-base" : "text-[11px]";
  return (
    <span className={cn("inline-flex select-none items-center gap-1.5 font-pixel leading-none", text, className)}>
      <span className="text-light">DESIGN</span>
      <span className={cn("bg-yellow text-ink", size === "md" ? "px-1.5 py-1" : "px-1 py-0.5")}>XP</span>
    </span>
  );
}

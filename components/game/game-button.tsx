import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

type Variant = "default" | "secondary" | "destructive" | "ghost" | "violet" | "pink" | "blue" | "green";
type Size = "default" | "sm" | "lg" | "icon";

const VARIANT: Record<Variant, string> = {
  default: "gbtn gbtn-yellow",
  secondary: "gbtn",
  destructive: "gbtn gbtn-red",
  violet: "gbtn gbtn-violet",
  pink: "gbtn gbtn-pink",
  blue: "gbtn gbtn-blue",
  green: "gbtn gbtn-green",
  ghost:
    "inline-flex items-center justify-center gap-2 text-cream underline-offset-4 transition-colors hover:underline",
};

const SIZE: Record<Size, string> = {
  default: "h-12 px-5 text-[11px]",
  sm: "h-10 px-4 text-[10px]",
  lg: "h-14 px-6 text-xs",
  icon: "size-11",
};

/**
 * Beveled game-block button: the DesignXP signature control.
 * Ink outline, top highlight, bottom shade and a hard drop shadow that collapses on press.
 */
export function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  type,
  ...props
}: React.ComponentProps<"button"> & { variant?: Variant; size?: Size; asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      type={asChild ? undefined : (type ?? "button")}
      className={cn(
        "cursor-pointer whitespace-nowrap font-pixel leading-none [&_svg]:size-4 [&_svg]:shrink-0",
        VARIANT[variant],
        variant !== "ghost" && SIZE[size],
        className,
      )}
      {...props}
    />
  );
}

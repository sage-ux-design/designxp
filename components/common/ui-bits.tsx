import {
  BookOpenText,
  Brain,
  ChartNoAxesCombined,
  Flag,
  Flame,
  Library,
  PenLine,
  ScanSearch,
  Search,
  Shuffle,
  Star,
  Swords,
  TrendingUp,
  Zap,
  CalendarDays,
  RotateCcw,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const ICONS: Record<string, LucideIcon> = {
  ScanSearch,
  Swords,
  BookOpenText,
  Search,
  PenLine,
  ChartNoAxesCombined,
  Flag,
  Zap,
  Star,
  Library,
  Brain,
  Flame,
  TrendingUp,
  Shuffle,
  CalendarDays,
  RotateCcw,
  Trophy,
};

export function Icon({ name, className }: { name: string; className?: string }) {
  const C = ICONS[name] ?? Star;
  return <C className={className} aria-hidden="true" />;
}

/** Arcade-style eyebrow label. */
export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("font-pixel text-[10px] uppercase tracking-widest text-lavender", className)}>{children}</p>;
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  // Sits directly on the sky: an ink sign, title-screen type and parchment body copy.
  return (
    <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-4">
        {eyebrow && <p className="sign">{eyebrow}</p>}
        <h1 className="title-type is-small text-2xl sm:text-4xl">{title}</h1>
        {subtitle && <p className="max-w-2xl font-bold text-light">{subtitle}</p>}
      </div>
      {children}
    </header>
  );
}

/** Pixel-framed surface for content that isn't a full 8bitcn Card. */
export function Panel({
  children,
  className,
  as: As = "section",
  tone = "default",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  as?: "section" | "div" | "article" | "aside";
  tone?: "default" | "raised" | "primary";
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <As
      className={cn(
        "pixel-frame p-5 sm:p-6",
        tone === "raised" && "bg-surface-2",
        tone === "primary" && "bg-primary/15",
        className,
      )}
      {...rest}
    >
      {children}
    </As>
  );
}

export function StatTile({
  label,
  value,
  icon,
  accent = "text-cream",
}: {
  label: string;
  value: React.ReactNode;
  icon?: string;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-3 border-4 border-ink bg-paper px-3 py-3 rounded-md">
      {icon && <Icon name={icon} className={cn("size-5 shrink-0", accent)} />}
      <div className="min-w-0">
        <p className={cn("tabular font-pixel text-sm", accent)}>{value}</p>
        <p className="truncate text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function DifficultyPips({ level }: { level: "easy" | "medium" | "hard" }) {
  const n = level === "easy" ? 1 : level === "medium" ? 2 : 3;
  return (
    <span className="inline-flex items-center gap-1" aria-label={`Difficulty: ${level}`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={cn("size-2", i <= n ? "bg-gold" : "bg-ring")} />
      ))}
      <span className="ml-1 text-xs capitalize text-muted-foreground">{level}</span>
    </span>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, Gamepad2, House, MessageSquareQuote, Settings, Trophy, UserRound } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { DemoBadge } from "./demo-badge";

export const NAV = [
  { href: "/dashboard", label: "Home", icon: House },
  { href: "/play", label: "Play", icon: Gamepad2 },
  { href: "/leaderboard", label: "Leaderboard", short: "Hiscore", icon: Trophy },
  { href: "/knowledge", label: "Knowledge", icon: BookOpenText },
  { href: "/designer-speak", label: "Designer Speak", short: "Speak", icon: MessageSquareQuote },
  { href: "/profile", label: "Profile", icon: UserRound },
];

/** Marquee bulbs along the top edge of the cabinet. */
function Bulbs() {
  return (
    <div className="flex h-2 items-center justify-between px-3" aria-hidden="true">
      {Array.from({ length: 28 }).map((_, i) => (
        <span key={i} className="marquee-bulb size-1.5 rounded-full bg-yellow" />
      ))}
    </div>
  );
}

/**
 * The app is an arcade cabinet: a hot-pink LED marquee with the navigation, a CRT screen for
 * the content and a control deck at the bottom.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const inRound = /^\/play\/.+/.test(pathname);

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-yellow focus:px-4 focus:py-2 focus:text-ink"
      >
        Skip to content
      </a>

      <header className="marquee sticky top-0 z-40 text-ink">
        <Bulbs />
        {/* Three columns: logo | centred nav | profile + settings. Equal side columns keep the nav centred. */}
        <div className="mx-auto grid h-16 max-w-6xl grid-cols-[1fr_auto] items-center gap-4 px-4 lg:grid-cols-[1fr_auto_1fr]">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/dashboard" aria-label="DesignXP home" className="shrink-0 rounded-md bg-ink px-3 py-2">
              <Logo size="md" />
            </Link>
            <DemoBadge className="hidden xl:inline-flex" />
          </div>
          <nav aria-label="Main" className="hidden items-center justify-center gap-1 lg:flex">
            {NAV.filter((item) => item.href !== "/play" && item.href !== "/profile").map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-bold text-ink transition-colors hover:bg-ink/15",
                  isActive(item.href) && "bg-ink text-yellow hover:bg-ink",
                )}
              >
                <item.icon className="size-4" aria-hidden="true" />
                <span className="hidden xl:inline">{item.label}</span>
                <span className="xl:hidden">{item.short ?? item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-1 justify-self-end">
            {[
              { href: "/profile", label: "Profile", Icon: UserRound },
              { href: "/settings", label: "Settings", Icon: Settings },
            ].map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                aria-label={label}
                title={label}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "grid size-10 place-items-center rounded-md text-ink transition-colors hover:bg-ink/15",
                  isActive(href) && "bg-ink text-yellow hover:bg-ink",
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
        <DemoBadge className="flex w-full justify-center xl:hidden" bar />
      </header>

      <div className={cn("mx-auto w-full max-w-[1240px] flex-1 px-2 pt-4 sm:px-4 sm:pt-6", inRound ? "pb-6" : "pb-28 lg:pb-6")}>
        <main
          id="main"
          className="crt min-h-[70dvh] px-4 py-6 [border-radius:18px] [border-width:6px] sm:px-8 sm:py-10 sm:[border-radius:28px] sm:[border-width:10px]"
        >
          <div className="relative z-10">{children}</div>
        </main>
      </div>

      {/* Control deck: a decorative stick and buttons; the coin slot starts a game. */}
      <footer className="deck hidden lg:block" aria-label="Control deck">
        <div className="mx-auto flex h-24 max-w-6xl items-center justify-between gap-8 px-8">
          <div className="flex items-center gap-6" aria-hidden="true">
            <span className="relative grid size-16 place-items-center rounded-full border-4 border-ink bg-ink">
              <span className="absolute bottom-1/2 h-8 w-2 rounded-sm bg-ink" />
              <span className="arcade-btn absolute -top-2 size-8 [--btn:var(--red)]" />
            </span>
            <span className="arcade-btn size-10 [--btn:var(--red)]" />
            <span className="arcade-btn size-10 [--btn:var(--yellow)]" />
            <span className="arcade-btn size-10 [--btn:var(--blue)]" />
          </div>
          <Link
            href="/play/quick-play"
            className="flex items-center gap-4 rounded-md border-4 border-ink bg-ink px-4 py-2 text-light transition-colors hover:bg-ink/80"
          >
            <span className="h-8 w-1.5 rounded-sm bg-ink shadow-[inset_0_0_0_1px_#fc65a7]" aria-hidden="true" />
            <span className="leading-tight">
              <span className="block font-pixel text-[11px] text-yellow">INSERT COIN</span>
              <span className="block text-xs text-light/80">Start a quick 5-question round</span>
            </span>
          </Link>
        </div>
      </footer>

      {!inRound && (
        <nav aria-label="Main" className="deck fixed inset-x-0 bottom-0 z-40 pb-[env(safe-area-inset-bottom)] lg:hidden">
          <ul className="mx-auto grid max-w-xl grid-cols-6 gap-1 px-1 py-2">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] font-bold text-light",
                    isActive(item.href) && "bg-ink text-yellow",
                  )}
                >
                  <item.icon className="size-5" aria-hidden="true" />
                  <span className="truncate">{item.short ?? item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}

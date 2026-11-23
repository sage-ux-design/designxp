"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ErrorScreen, LoadingScreen } from "@/components/common/loading-screen";
import { AppShell } from "@/components/layout/app-shell";
import { usePlayer } from "@/hooks/use-player";

/** Every in-game route requires a player identity (stored client-side); otherwise onboarding starts. */
export function GameGate({ children }: { children: React.ReactNode }) {
  const { status, player, error, refresh } = usePlayer();
  const router = useRouter();

  useEffect(() => {
    if (status === "ready" && !player) router.replace("/onboarding");
  }, [status, player, router]);

  if (status === "loading" || (status === "ready" && !player)) return <LoadingScreen />;
  if (status === "error") return <ErrorScreen message={error ?? "Unknown error"} onRetry={refresh} />;
  return <AppShell>{children}</AppShell>;
}

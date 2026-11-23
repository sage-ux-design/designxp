"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { PlayerProvider } from "@/hooks/use-player";
import { SettingsProvider } from "@/hooks/use-settings";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <PlayerProvider>
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
      </PlayerProvider>
    </SettingsProvider>
  );
}

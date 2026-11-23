"use client";

import { useCallback, useEffect, useState } from "react";
import { usePlayer } from "@/hooks/use-player";
import type { LeaderboardPeriod, LeaderboardResult } from "@/types";

export function useLeaderboard(period: LeaderboardPeriod, limit = 10) {
  const { backend, player } = usePlayer();
  const [data, setData] = useState<LeaderboardResult | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await backend.getLeaderboard(period, limit);
      setData(res);
      setError(null);
      setStatus("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load rankings.");
      setStatus("error");
    }
    // player.totalXp in deps refreshes rankings after XP changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backend, period, limit, player?.totalXp]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount / dependency change
    void load();
  }, [load]);

  return { data, status, error, reload: load };
}

"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getBackend, type Backend, type BackendMode } from "@/services";
import type { PlayerState } from "@/types";

type Status = "loading" | "ready" | "error";

interface PlayerCtx {
  status: Status;
  error: string | null;
  player: PlayerState | null;
  backend: Backend;
  mode: BackendMode;
  setPlayer: (p: PlayerState | null) => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<PlayerCtx | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const backend = useMemo(() => getBackend(), []);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [player, setPlayer] = useState<PlayerState | null>(null);

  const refresh = useCallback(async () => {
    try {
      const p = await backend.loadPlayer();
      setPlayer(p);
      setError(null);
      setStatus("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your player.");
      setStatus("error");
    }
  }, [backend]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load from storage/backend
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ status, error, player, backend, mode: backend.mode, setPlayer, refresh }),
    [status, error, player, backend, refresh],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlayer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
}

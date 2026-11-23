"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type ThemePref = "day" | "dusk" | "contrast";

export interface Settings {
  sound: boolean;
  reducedMotion: boolean;
  theme: ThemePref;
  crt: boolean;
}

const KEY = "designxp:settings:v1";
// Sound is off by default; reduced motion defaults to the OS preference (handled in CSS).
const DEFAULTS: Settings = { sound: false, reducedMotion: false, theme: "day", crt: true };

interface SettingsCtx {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  /** True if motion should be reduced (setting or OS preference). */
  motionReduced: boolean;
}

const Ctx = createContext<SettingsCtx | null>(null);

function load(): Settings {
  try {
    const saved = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") } as Settings;
    // Older saves used theme names that no longer exist.
    if (!["day", "dusk", "contrast"].includes(saved.theme)) saved.theme = "day";
    return saved;
  } catch {
    return DEFAULTS;
  }
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [osReduced, setOsReduced] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
    setSettings(load());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setOsReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setOsReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const d = document.documentElement;
    d.dataset.theme = settings.theme;
    d.dataset.crt = settings.crt ? "on" : "off";
    if (settings.reducedMotion) d.dataset.motion = "reduced";
    else delete d.dataset.motion;
  }, [settings]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable: keep in memory */
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ settings, update, motionReduced: settings.reducedMotion || osReduced }),
    [settings, update, osReduced],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSettings() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}

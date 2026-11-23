"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Database, Monitor, Palette, TriangleAlert, Volume2 } from "lucide-react";
import { PageHeader, Panel } from "@/components/common/ui-bits";
import { Button } from "@/components/game/game-button";
import { Switch } from "@/components/ui/8bit/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/8bit/alert-dialog";
import { clearAllBookmarks } from "@/hooks/use-bookmarks";
import { usePlayer } from "@/hooks/use-player";
import { type ThemePref, useSettings } from "@/hooks/use-settings";
import { playSfx } from "@/lib/sound";
import { cn } from "@/lib/utils";

const THEMES: { id: ThemePref; label: string; desc: string; swatch: string[] }[] = [
  { id: "day", label: "Playground", desc: "Bright violet sky, cream panels, pink marquee.", swatch: ["#6656e0", "#fffaf3", "#fc65a7", "#fcd63a"] },
  { id: "dusk", label: "Twilight", desc: "The same playground after sunset.", swatch: ["#3b2f9e", "#fffaf3", "#c75bd9", "#fcd63a"] },
  { id: "contrast", label: "High Contrast", desc: "Flat colours and black ink for maximum readability.", swatch: ["#2a1f6b", "#ffffff", "#000000", "#fcd63a"] },
];

export default function SettingsPage() {
  const { settings, update, motionReduced } = useSettings();
  const { backend, mode, setPlayer } = usePlayer();
  const router = useRouter();
  const [resetting, setResetting] = useState(false);

  async function resetProgress() {
    setResetting(true);
    await backend.resetLocal();
    clearAllBookmarks();
    setPlayer(null);
    router.replace("/onboarding");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader eyebrow="OPTIONS" title="SETTINGS" />

      <Panel className="space-y-6">
        <h2 className="flex items-center gap-2 font-pixel text-[11px] text-lavender">
          <Volume2 className="size-4" aria-hidden="true" /> SOUND &amp; MOTION
        </h2>
        <SettingRow
          label="Sound effects"
          desc="Chiptune blips for selections, answers and level-ups. Off by default."
          checked={settings.sound}
          onChange={(v) => {
            update({ sound: v });
            playSfx("correct", v);
          }}
        />
        <SettingRow
          label="Reduce motion"
          desc={
            motionReduced && !settings.reducedMotion
              ? "Your system already asks for reduced motion, so animations are minimised."
              : "Minimise animations such as floating sprites and confetti."
          }
          checked={settings.reducedMotion}
          onChange={(v) => update({ reducedMotion: v })}
        />
        <SettingRow
          label="CRT scanlines"
          desc="A subtle retro screen texture."
          checked={settings.crt}
          onChange={(v) => update({ crt: v })}
        />
      </Panel>

      <Panel className="space-y-5">
        <h2 className="flex items-center gap-2 font-pixel text-[11px] text-lavender">
          <Palette className="size-4" aria-hidden="true" /> THEME
        </h2>
        <div role="radiogroup" aria-label="Theme" className="grid gap-4 sm:grid-cols-3">
          {THEMES.map((t) => (
            <button
              key={t.id}
              role="radio"
              aria-checked={settings.theme === t.id}
              onClick={() => update({ theme: t.id })}
              className={cn(
                "space-y-3 p-4 text-left outline-4",
                settings.theme === t.id ? "bg-blue/30 outline-cyan" : "bg-paper-2 outline-ink hover:outline-cyan",
              )}
            >
              <span className="flex" aria-hidden="true">
                {t.swatch.map((c) => (
                  <span key={c} className="h-6 flex-1" style={{ background: c }} />
                ))}
              </span>
              <span className="block font-bold text-cream">{t.label}</span>
              <span className="block text-xs text-muted-foreground">{t.desc}</span>
            </button>
          ))}
        </div>
      </Panel>

      <Panel className="space-y-4">
        <h2 className="flex items-center gap-2 font-pixel text-[11px] text-lavender">
          <Database className="size-4" aria-hidden="true" /> DATA &amp; IDENTITY
        </h2>
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <Monitor className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {mode === "live"
            ? "You play with an anonymous identity stored in this browser. It does not transfer to other devices automatically."
            : "Demo mode is active: your player, XP and bookmarks are stored only in this browser."}
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="font-pixel text-[10px]">
              <TriangleAlert className="size-4" aria-hidden="true" /> RESET LOCAL PROGRESS
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent font="normal">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-pixel text-sm text-danger">RESET PROGRESS?</AlertDialogTitle>
              <AlertDialogDescription>
                {mode === "live"
                  ? "This signs this browser out of your anonymous player. Because there is no account linking yet, you will not be able to get back to this player, its XP or its leaderboard position. Bookmarks on this device are cleared too."
                  : "This permanently deletes your demo player, XP, unlocked concepts, achievements and bookmarks from this browser. It cannot be undone."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep my progress</AlertDialogCancel>
              <AlertDialogAction onClick={resetProgress} disabled={resetting} className="bg-destructive text-white">
                Yes, reset everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Panel>
    </div>
  );
}

function SettingRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between gap-6">
      <div>
        <label htmlFor={id} className="font-bold text-cream">
          {label}
        </label>
        <p id={`${id}-d`} className="text-sm text-muted-foreground">
          {desc}
        </p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} aria-describedby={`${id}-d`} />
    </div>
  );
}

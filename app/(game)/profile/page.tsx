"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark, Lock, Pencil, Settings } from "lucide-react";
import { Eyebrow, Icon, PageHeader, Panel, StatTile } from "@/components/common/ui-bits";
import { GamertagField } from "@/components/onboarding/gamertag-field";
import { CharacterPicker } from "@/components/player/character-picker";
import { PixelSprite } from "@/components/player/pixel-sprite";
import { XpMeter } from "@/components/player/xp-meter";
import { Button } from "@/components/game/game-button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/8bit/dialog";
import { getCharacter } from "@/data/characters";
import { CONCEPTS_BY_ID } from "@/data/concepts";
import { GAME_MODES_BY_ID, isGameModeId } from "@/data/game-modes";
import { ACHIEVEMENTS } from "@/data/progression";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { usePlayer } from "@/hooks/use-player";
import { computeStats } from "@/lib/player-stats";
import { GamertagTakenError } from "@/services";
import type { RankSnapshot } from "@/types";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { player, backend, setPlayer, mode } = usePlayer();
  const marks = useBookmarks("concepts");
  const [ranks, setRanks] = useState<RankSnapshot | null>(null);
  const [editName, setEditName] = useState(false);
  const [editChar, setEditChar] = useState(false);

  useEffect(() => {
    backend.getMyRanks().then(setRanks).catch(() => setRanks(null));
  }, [backend, player?.totalXp]);

  if (!player) return null;
  const s = computeStats(player);
  const c = getCharacter(player.profile.characterId);
  const earned = new Map(player.achievements.map((a) => [a.achievementId, a.at]));
  const saved = marks.ids.map((id) => CONCEPTS_BY_ID[id]).filter(Boolean);
  const history = [...player.rounds].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="CHARACTER SHEET" title="PLAYER PROFILE">
        <Button asChild variant="secondary" className="font-pixel text-[10px]">
          <Link href="/settings">
            <Settings className="size-4" aria-hidden="true" /> SETTINGS
          </Link>
        </Button>
      </PageHeader>

      <section className="pixel-frame pixel-shadow grid gap-8 p-6 sm:p-8 md:grid-cols-[auto_minmax(0,1fr)]">
        <div className="flex flex-col items-center gap-3">
          <div className="grid size-44 place-items-center bg-primary/20 outline-4 outline-primary">
            <PixelSprite characterId={c.id} size={144} />
          </div>
          <p className="font-pixel text-[10px] text-lavender">
            {c.name.toUpperCase()} · {c.title.toUpperCase()}
          </p>
          <Button variant="secondary" size="sm" onClick={() => setEditChar(true)} className="font-pixel text-[9px]">
            CHANGE CHARACTER
          </Button>
        </div>
        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="break-all font-pixel text-lg text-cream sm:text-2xl">{player.profile.gamertag}</h2>
            <button
              onClick={() => setEditName(true)}
              className="flex items-center gap-1 px-2 py-1 text-sm font-bold text-muted-foreground hover:text-cream"
            >
              <Pencil className="size-4" aria-hidden="true" /> Edit gamertag
            </button>
          </div>
          <XpMeter xp={player.totalXp} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Total XP" value={player.totalXp} icon="Star" accent="text-amber" />
            <StatTile label="Weekly XP" value={player.weeklyXp} icon="Zap" accent="text-amber" />
            <StatTile label={`Weekly rank${mode === "demo" ? " (demo)" : ""}`} value={ranks?.weekly ? `#${ranks.weekly}` : "–"} icon="Trophy" />
            <StatTile label={`All-time rank${mode === "demo" ? " (demo)" : ""}`} value={ranks?.allTime ? `#${ranks.allTime}` : "–"} icon="Trophy" />
            <StatTile label="Questions answered" value={s.questionsAnswered} icon="Flag" />
            <StatTile label="Accuracy" value={`${s.accuracy}%`} icon="ScanSearch" accent="text-success" />
            <StatTile label="Concepts unlocked" value={s.conceptsUnlocked} icon="Library" accent="text-lavender" />
            <StatTile label="Day streak" value={s.streak} icon="Flame" accent="text-[#ff8a4c]" />
          </div>
          <p className="text-xs text-muted-foreground">
            Member since {new Date(player.profile.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}.{" "}
            {mode === "live"
              ? "Your identity is an anonymous session tied to this browser."
              : "Demo mode: saved on this device only."}
          </p>
        </div>
      </section>

      <section aria-labelledby="ach" className="space-y-5">
        <h2 id="ach" className="sign">
          ACHIEVEMENTS ({earned.size}/{ACHIEVEMENTS.length})
        </h2>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {ACHIEVEMENTS.map((a) => {
            const at = earned.get(a.id);
            return (
              <li
                key={a.id}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 text-center outline-4",
                  at ? "bg-gold/10 outline-gold/70" : "bg-surface outline-ring opacity-70",
                )}
              >
                <span className={cn("grid size-12 place-items-center", at ? "bg-gold text-[#261527]" : "bg-surface-2 text-muted-foreground")}>
                  {at ? <Icon name={a.icon} className="size-6" /> : <Lock className="size-5" aria-hidden="true" />}
                </span>
                <span className={cn("font-pixel text-[9px] leading-relaxed", at ? "text-amber" : "text-muted-foreground")}>
                  {a.title.toUpperCase()}
                </span>
                <span className="text-xs text-muted-foreground">{a.description}</span>
                <span className="sr-only">{at ? "Unlocked" : "Locked"}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <Eyebrow className="mb-4">GAME HISTORY</Eyebrow>
          {history.length === 0 ? (
            <p className="text-muted-foreground">No completed rounds yet.</p>
          ) : (
            <ul className="divide-y-2 divide-ring">
              {history.map((r) => (
                <li key={r.roundId} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-cream">
                      {isGameModeId(r.gameMode)
                        ? GAME_MODES_BY_ID[r.gameMode].title
                        : r.gameMode === "quick-play"
                          ? "Quick Play"
                          : r.gameMode === "daily"
                            ? "Daily Challenge"
                            : "Review"}
                    </span>
                    <span className="text-xs text-muted-foreground">{new Date(r.at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-cream">
                      {r.correctCount}/{r.questionCount} correct
                    </span>
                    <span className="font-pixel text-[9px] text-amber">+{r.xpEarned} XP</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel>
          <Eyebrow className="mb-4 flex items-center gap-2">
            <Bookmark className="size-4" aria-hidden="true" /> SAVED CONCEPTS
          </Eyebrow>
          {saved.length === 0 ? (
            <p className="text-muted-foreground">
              Bookmark cards in the <Link href="/knowledge" className="text-lavender underline">Knowledge Library</Link> to keep them here.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {saved.map((k) => (
                <li key={k.id}>
                  <Link href={`/knowledge?concept=${k.id}`} className="block bg-surface-2 px-3 py-2 text-sm text-cream outline-2 outline-ring hover:outline-gold">
                    {k.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <EditGamertagDialog
        open={editName}
        onOpenChange={setEditName}
        current={player.profile.gamertag}
        onSave={async (tag) => {
          const p = await backend.updateProfile({ gamertag: tag });
          setPlayer(p);
        }}
      />
      <Dialog open={editChar} onOpenChange={setEditChar}>
        <DialogContent font="normal" className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="font-pixel text-sm">CHANGE CHARACTER</DialogTitle>
            <DialogDescription>Characters are cosmetic. Your XP and progress stay the same.</DialogDescription>
          </DialogHeader>
          <div className="-mx-2 max-h-[65dvh] overflow-y-auto px-2 py-2">
          <CharacterPicker
            name="profile-character"
            selected={player.profile.characterId}
            onSelect={async (id) => {
              const p = await backend.updateProfile({ characterId: id });
              setPlayer(p);
            }}
          />
          </div>
          <DialogFooter>
            <Button onClick={() => setEditChar(false)} className="font-pixel text-[10px]">
              DONE
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditGamertagDialog({
  open,
  onOpenChange,
  current,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  current: string;
  onSave: (tag: string) => Promise<void>;
}) {
  const [value, setValue] = useState(current);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onReady = useCallback((r: boolean) => setReady(r), []);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset form when opened
      setValue(current);
      setError(null);
    }
  }, [open, current]);

  const unchanged = value.trim() === current;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent font="normal" className="sm:max-w-lg">
        <form
          className="space-y-6"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!ready || unchanged) return;
            setBusy(true);
            setError(null);
            try {
              await onSave(value.trim());
              onOpenChange(false);
            } catch (err) {
              setError(err instanceof GamertagTakenError ? "That gamertag was just taken. Try another." : err instanceof Error ? err.message : "Couldn't save.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <DialogHeader>
            <DialogTitle className="font-pixel text-sm">EDIT GAMERTAG</DialogTitle>
            <DialogDescription>Your new name appears on the leaderboard straight away.</DialogDescription>
          </DialogHeader>
          <GamertagField value={value} onChange={setValue} onReadyChange={onReady} currentTag={current} autoFocus />
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <DialogFooter className="gap-3">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!ready || unchanged || busy} className="font-pixel text-[10px]">
              {busy ? "SAVING..." : "SAVE"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

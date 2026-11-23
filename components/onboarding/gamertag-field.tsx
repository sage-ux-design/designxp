"use client";

import { useEffect, useId, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/8bit/input";
import { usePlayer } from "@/hooks/use-player";
import { GAMERTAG_MAX, validateGamertag } from "@/lib/gamertag";
import { cn } from "@/lib/utils";

export type GamertagState = { value: string; ready: boolean };

/**
 * Gamertag input with live counter, format validation, profanity filter and a debounced,
 * case-insensitive availability check against the backend.
 */
export function GamertagField({
  value,
  onChange,
  onReadyChange,
  externalError,
  currentTag,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  onReadyChange: (ready: boolean) => void;
  externalError?: string | null;
  currentTag?: string;
  autoFocus?: boolean;
}) {
  const { backend } = usePlayer();
  const id = useId();
  const [touched, setTouched] = useState(false);
  const [availability, setAvailability] = useState<"idle" | "checking" | "available" | "taken" | "error">("idle");
  const v = validateGamertag(value);
  const unchanged = currentTag !== undefined && currentTag.toLowerCase() === value.trim().toLowerCase();

  useEffect(() => {
    if (!v.ok || unchanged) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset when input becomes invalid
      setAvailability("idle");
      return;
    }
    setAvailability("checking");
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const ok = await backend.isGamertagAvailable(value.trim());
        if (!cancelled) setAvailability(ok ? "available" : "taken");
      } catch {
        if (!cancelled) setAvailability("error");
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [value, v.ok, unchanged, backend]);

  const ready = v.ok && (availability === "available" || unchanged);
  useEffect(() => onReadyChange(ready), [ready, onReadyChange]);

  const showError = (touched || value.length > 0) && !v.ok;
  let message: { tone: "error" | "ok" | "info"; text: string } = {
    tone: "info",
    text: "3–16 characters. Letters, numbers and underscores.",
  };
  if (externalError && value.length > 0 && !touched) message = { tone: "error", text: externalError };
  else if (showError) message = { tone: "error", text: v.message };
  else if (v.ok && unchanged) message = { tone: "ok", text: "That's your current gamertag." };
  else if (availability === "checking") message = { tone: "info", text: "Checking availability..." };
  else if (availability === "taken") message = { tone: "error", text: "That gamertag is taken. Try adding a number or underscore." };
  else if (availability === "error") message = { tone: "error", text: "Couldn't check availability. Check your connection and try again." };
  else if (availability === "available") message = { tone: "ok", text: "Available! Nice name." };

  const len = value.trim().length;
  return (
    <div className="space-y-3">
      <label htmlFor={id} className="sr-only">
        Gamertag
      </label>
      <div className="relative">
        <Input
          id={id}
          value={value}
          autoFocus={autoFocus}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          maxLength={GAMERTAG_MAX + 4}
          placeholder="PIXELDESIGNER"
          aria-invalid={message.tone === "error"}
          aria-describedby={`${id}-msg ${id}-count`}
          onChange={(e) => {
            setTouched(true);
            onChange(e.target.value.replace(/\s/g, ""));
          }}
          className="h-14 pr-20 text-sm sm:text-base"
        />
        <span
          id={`${id}-count`}
          className={cn(
            "pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-pixel text-[10px]",
            len > GAMERTAG_MAX ? "text-danger" : "text-muted-foreground",
          )}
          aria-label={`${len} of ${GAMERTAG_MAX} characters`}
        >
          {len}/{GAMERTAG_MAX}
        </span>
      </div>
      <p
        id={`${id}-msg`}
        aria-live="polite"
        className={cn(
          "flex items-center gap-2 text-sm",
          message.tone === "error" && "text-danger",
          message.tone === "ok" && "text-success",
          message.tone === "info" && "text-muted-foreground",
        )}
      >
        {message.tone === "error" && <X className="size-4 shrink-0" aria-hidden="true" />}
        {message.tone === "ok" && <Check className="size-4 shrink-0" aria-hidden="true" />}
        {availability === "checking" && <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" />}
        {message.text}
      </p>
    </div>
  );
}

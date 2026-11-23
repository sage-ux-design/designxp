"use client";

/** Tiny chiptune sound effects generated with WebAudio. Only played when sound is enabled. */
type Sfx = "select" | "correct" | "wrong" | "levelup" | "victory";

let ctx: AudioContext | null = null;

const PATTERNS: Record<Sfx, [number, number][]> = {
  select: [[660, 0.05]],
  correct: [[523, 0.08], [784, 0.12]],
  wrong: [[220, 0.12], [180, 0.16]],
  levelup: [[523, 0.08], [659, 0.08], [784, 0.08], [1047, 0.2]],
  victory: [[392, 0.1], [523, 0.1], [659, 0.1], [784, 0.25]],
};

export function playSfx(name: Sfx, enabled: boolean) {
  if (!enabled || typeof window === "undefined") return;
  try {
    ctx ??= new AudioContext();
    let t = ctx.currentTime;
    for (const [freq, dur] of PATTERNS[name]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur);
      t += dur;
    }
  } catch {
    /* audio unavailable */
  }
}

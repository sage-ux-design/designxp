import { beforeEach, describe, expect, it, vi } from "vitest";
import { QUESTIONS } from "@/data/questions";
import { validateGamertag } from "@/lib/gamertag";
import { levelForXp, levelProgress } from "@/lib/levels";
import { dailyQuestion } from "@/lib/quiz-engine";
import { currentStreak, weekStartUtc } from "@/lib/time";
import { GamertagTakenError } from "@/services/backend";
import { LocalBackend } from "@/services/local-backend";

// Minimal localStorage for the demo backend.
function installStorage() {
  const store = new Map<string, string>();
  const ls = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
  vi.stubGlobal("window", { localStorage: ls });
  vi.stubGlobal("localStorage", ls);
}

const uuid = () => crypto.randomUUID();
const wrongFor = (id: string) => {
  const q = QUESTIONS.find((x) => x.id === id)!;
  return [q.options.find((o) => !q.correctAnswers.includes(o.key))!.key];
};
const rightFor = (id: string) => QUESTIONS.find((x) => x.id === id)!.correctAnswers;

describe("gamertag validation", () => {
  it("enforces length, characters and profanity", () => {
    expect(validateGamertag("ab").ok).toBe(false);
    expect(validateGamertag("a".repeat(17)).ok).toBe(false);
    expect(validateGamertag("has space").ok).toBe(false);
    expect(validateGamertag("dash-name").ok).toBe(false);
    expect(validateGamertag("Pixel_Pal_01").ok).toBe(true);
    expect(validateGamertag("sh1tlord").ok).toBe(false);
    expect(validateGamertag("F_U_C_K").ok).toBe(false);
    expect(validateGamertag("Scunthorpe_UX").ok).toBe(false); // conservative filter accepted trade-off
  });
});

describe("levels", () => {
  it("uses increasing thresholds", () => {
    expect(levelForXp(0).level).toBe(1);
    expect(levelForXp(99).level).toBe(1);
    expect(levelForXp(100).level).toBe(2);
    expect(levelForXp(250).level).toBe(3);
    expect(levelForXp(1000).level).toBe(6);
    expect(levelProgress(175).xpToNext).toBe(75);
    expect(levelProgress(5000).next).toBeNull();
  });
});

describe("time helpers", () => {
  it("starts the week on Monday 00:00 UTC", () => {
    expect(weekStartUtc(new Date("2026-11-23T10:00:00Z")).toISOString()).toBe("2026-11-23T00:00:00.000Z"); // Monday
    expect(weekStartUtc(new Date("2026-11-29T23:59:00Z")).toISOString()).toBe("2026-11-23T00:00:00.000Z"); // Sunday
    expect(weekStartUtc(new Date("2026-11-30T00:00:00Z")).toISOString()).toBe("2026-11-30T00:00:00.000Z");
  });
  it("counts streaks ending today or yesterday", () => {
    const now = new Date("2026-11-23T12:00:00Z");
    expect(currentStreak(["2026-11-21", "2026-11-22", "2026-11-23"], now)).toBe(3);
    expect(currentStreak(["2026-11-21", "2026-11-22"], now)).toBe(2);
    expect(currentStreak(["2026-11-20"], now)).toBe(0);
  });
});

describe("demo backend XP rules", () => {
  let b: LocalBackend;
  beforeEach(async () => {
    installStorage();
    b = new LocalBackend();
    await b.createPlayer("Tester_1", "ember");
  });

  it("rejects gamertags owned by sample players, case-insensitively", async () => {
    expect(await b.isGamertagAvailable("pixelpusher")).toBe(false);
    await expect(b.updateProfile({ gamertag: "PIXELPUSHER" })).rejects.toBeInstanceOf(GamertagTakenError);
  });

  it("awards 10 XP per first correct answer and 5 XP per first concept unlock", async () => {
    const r = await b.submitAnswer({ roundId: uuid(), roundKind: "standard", questionId: "pdf-11", selected: rightFor("pdf-11") });
    expect(r.correct).toBe(true);
    expect(r.xpForAnswer).toBe(10);
    expect(r.conceptUnlocked).toBe(true);
    expect(r.xpForConcept).toBe(5);
    expect(r.player.totalXp).toBe(15);
  });

  it("never subtracts XP for wrong answers and still unlocks the concept", async () => {
    const r = await b.submitAnswer({ roundId: uuid(), roundKind: "standard", questionId: "pdf-12", selected: wrongFor("pdf-12") });
    expect(r.correct).toBe(false);
    expect(r.xpForAnswer).toBe(0);
    expect(r.xpForConcept).toBe(5);
    expect(r.player.totalXp).toBe(5);
  });

  it("rewards a correct answer only once per question (no farming)", async () => {
    await b.submitAnswer({ roundId: uuid(), roundKind: "standard", questionId: "pdf-13", selected: rightFor("pdf-13") });
    const again = await b.submitAnswer({ roundId: uuid(), roundKind: "standard", questionId: "pdf-13", selected: rightFor("pdf-13") });
    expect(again.xpForAnswer).toBe(0);
    expect(again.xpForConcept).toBe(0);
    expect(again.alreadyEarned).toBe(true);
    expect(again.player.totalXp).toBe(15);
  });

  it("rejects answering the same question twice in one round", async () => {
    const round = uuid();
    await b.submitAnswer({ roundId: round, roundKind: "standard", questionId: "pdf-14", selected: ["A"] });
    await expect(b.submitAnswer({ roundId: round, roundKind: "standard", questionId: "pdf-14", selected: ["B"] })).rejects.toThrow();
  });

  it("awards the 5 XP round bonus once per UTC day, only for full rounds", async () => {
    const ids = ["pdf-01", "pdf-02", "pdf-03", "pdf-04", "pdf-05"];
    const short = uuid();
    await b.submitAnswer({ roundId: short, roundKind: "standard", questionId: "pdf-06", selected: ["A"] });
    expect((await b.completeRound({ roundId: short, kind: "standard", gameMode: "quick-play" })).roundBonus).toBe(0);

    const r1 = uuid();
    for (const id of ids) await b.submitAnswer({ roundId: r1, roundKind: "standard", questionId: id, selected: ["A"] });
    const first = await b.completeRound({ roundId: r1, kind: "standard", gameMode: "quick-play" });
    expect(first.roundBonus).toBe(5);
    expect(first.newAchievements).toContain("first-quest");

    // Completing the same round twice gives nothing.
    expect((await b.completeRound({ roundId: r1, kind: "standard", gameMode: "quick-play" })).roundBonus).toBe(0);

    const r2 = uuid();
    for (const id of ids) await b.submitAnswer({ roundId: r2, roundKind: "standard", questionId: id, selected: ["A"] });
    const second = await b.completeRound({ roundId: r2, kind: "standard", gameMode: "quick-play" });
    expect(second.roundBonus).toBe(0);
    expect(second.roundBonusAlreadyClaimed).toBe(true);
  });

  it("awards the daily challenge bonus once per day", async () => {
    const d = dailyQuestion();
    const r1 = uuid();
    await b.submitAnswer({ roundId: r1, roundKind: "daily", questionId: d.id, selected: ["A"] });
    expect((await b.completeRound({ roundId: r1, kind: "daily", gameMode: "daily" })).dailyBonus).toBe(15);
    const r2 = uuid();
    await b.submitAnswer({ roundId: r2, roundKind: "daily", questionId: d.id, selected: ["A"] });
    expect((await b.completeRound({ roundId: r2, kind: "daily", gameMode: "daily" })).dailyBonus).toBe(0);
  });

  it("unlocks Quick Thinker after five correct answers in a row and Flawless for 5/5", async () => {
    const ids = QUESTIONS.filter((q) => q.gameMode === "research-detective").slice(0, 5).map((q) => q.id);
    const round = uuid();
    const got: string[] = [];
    for (const id of ids) got.push(...(await b.submitAnswer({ roundId: round, roundKind: "standard", questionId: id, selected: rightFor(id) })).newAchievements);
    expect(got).toContain("quick-thinker");
    const done = await b.completeRound({ roundId: round, kind: "standard", gameMode: "research-detective" });
    expect(done.newAchievements).toContain("perfect-round");
    expect(done.player.totalXp).toBe(5 * 10 + 5 * 5 + 5);
  });

  it("keeps weekly and lifetime XP separate and ranks the player against labelled demo data", async () => {
    const r = await b.submitAnswer({ roundId: uuid(), roundKind: "standard", questionId: "pdf-20", selected: rightFor("pdf-20") });
    expect(r.player.weeklyXp).toBe(15);
    const board = await b.getLeaderboard("all-time", 50);
    expect(board.entries.filter((e) => !e.isCurrentPlayer).every((e) => e.isDemo)).toBe(true);
    expect(board.me?.isCurrentPlayer).toBe(true);
    expect(board.me?.xp).toBe(15);
  });
});

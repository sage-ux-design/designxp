/**
 * Runs the real Supabase migrations against an in-process Postgres (PGlite) with a minimal
 * stand-in for Supabase's `auth` schema, then exercises the XP functions as different users.
 */
import fs from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { QUESTIONS } from "@/data/questions";
import { dailyQuestion } from "@/lib/quiz-engine";

const ALICE = "00000000-0000-4000-8000-00000000000a";
const BOB = "00000000-0000-4000-8000-00000000000b";

let db: PGlite;

async function as<T = Record<string, unknown>>(user: string, sql: string, params: unknown[] = []) {
  await db.query(`select set_config('test.uid', $1, false)`, [user]);
  await db.query("set role authenticated");
  try {
    return (await db.query<T>(sql, params)).rows;
  } finally {
    await db.query("reset role");
  }
}

const right = (id: string) => QUESTIONS.find((q) => q.id === id)!.correctAnswers;
const wrong = (id: string) => {
  const q = QUESTIONS.find((x) => x.id === id)!;
  return [q.options.find((o) => !q.correctAnswers.includes(o.key))!.key];
};

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
    grant usage on schema auth to authenticated, anon;
    grant execute on function auth.uid() to authenticated, anon;
    grant usage on schema public to authenticated, anon;
    insert into auth.users values ('${ALICE}'), ('${BOB}');
  `);
  const dir = path.resolve(__dirname, "../supabase/migrations");
  for (const f of fs.readdirSync(dir).sort()) await db.exec(fs.readFileSync(path.join(dir, f), "utf8"));
  // Supabase grants table privileges to API roles by default; RLS then restricts rows.
  await db.exec(`grant select, insert, update, delete on all tables in schema public to authenticated, anon;`);
}, 60_000);

describe("supabase schema and functions", () => {
  it("seeds an answer key for every question in the app", async () => {
    const rows = await db.query<{ n: number }>("select count(*)::int as n from public.question_keys");
    expect(rows.rows[0].n).toBe(QUESTIONS.length);
  });

  it("creates players and enforces case-insensitive unique gamertags", async () => {
    await as(ALICE, "select public.create_player('Pixel_Pal', 'ember')");
    expect((await as<{ ok: boolean }>(BOB, "select public.is_gamertag_available('PIXEL_PAL') as ok"))[0].ok).toBe(false);
    await expect(as(BOB, "select public.create_player('PIXEL_pal', 'nova')")).rejects.toThrow(/GAMERTAG_TAKEN/);
    await expect(as(BOB, "select public.create_player('no spaces!', 'nova')")).rejects.toThrow(/GAMERTAG_INVALID/);
    await expect(as(BOB, "select public.create_player('sh1t_lord', 'nova')")).rejects.toThrow(/GAMERTAG_INVALID/);
    await as(BOB, "select public.create_player('BobTheBuilder', 'nova')");
  });

  it("blocks direct writes and hides other players' private rows", async () => {
    await expect(as(ALICE, "update public.players set total_xp = 99999 where id = $1", [ALICE])).resolves.toBeDefined();
    const p = await db.query<{ total_xp: number }>("select total_xp from public.players where id = $1", [ALICE]);
    expect(p.rows[0].total_xp).toBe(0); // RLS: no update policy, so nothing changed
    await expect(
      as(ALICE, "insert into public.xp_transactions (player_id, amount, reason, ref) values ($1, 500, 'round_bonus', 'x')", [ALICE]),
    ).rejects.toThrow();
    await expect(as(ALICE, "select public.award_xp($1, 500, 'round_bonus', 'hack')", [ALICE])).rejects.toThrow(/permission denied/);
    expect(await as(ALICE, "select * from public.question_keys")).toHaveLength(0);
  });

  it("awards XP server-side exactly once per question and concept", async () => {
    const round = "11111111-1111-4111-8111-111111111111";
    const [r1] = await as<{ r: Record<string, unknown> }>(ALICE, "select public.submit_answer($1, 'pdf-11', $2) as r", [round, right("pdf-11")]);
    expect(r1.r).toMatchObject({ correct: true, xp_answer: 10, xp_concept: 5, concept_unlocked: true });

    const round2 = "22222222-2222-4222-8222-222222222222";
    const [r2] = await as<{ r: Record<string, unknown> }>(ALICE, "select public.submit_answer($1, 'pdf-11', $2) as r", [round2, right("pdf-11")]);
    expect(r2.r).toMatchObject({ correct: true, xp_answer: 0, xp_concept: 0, already_earned: true });

    const [r3] = await as<{ r: Record<string, unknown> }>(ALICE, "select public.submit_answer($1, 'pdf-12', $2) as r", [round2, wrong("pdf-12")]);
    expect(r3.r).toMatchObject({ correct: false, xp_answer: 0, xp_concept: 5 });

    await expect(as(ALICE, "select public.submit_answer($1, 'pdf-12', $2)", [round2, right("pdf-12")])).rejects.toThrow(/ALREADY_ANSWERED/);

    const p = await db.query<{ total_xp: number }>("select total_xp from public.players where id = $1", [ALICE]);
    expect(p.rows[0].total_xp).toBe(20);
  });

  it("validates multi-select answers as a set", async () => {
    const round = "33333333-3333-4333-8333-333333333333";
    const [r] = await as<{ r: { correct: boolean } }>(ALICE, "select public.submit_answer($1, 'dx-lingo-08', $2) as r", [round, ["D", "A", "B"]]);
    expect(r.r.correct).toBe(true);
    const round2 = "44444444-4444-4444-8444-444444444444";
    const [r2] = await as<{ r: { correct: boolean } }>(ALICE, "select public.submit_answer($1, 'dx-lingo-07', $2) as r", [round2, ["A"]]);
    expect(r2.r.correct).toBe(false);
  });

  it("awards the round bonus once per day and only for full rounds", async () => {
    const ids = ["pdf-31", "pdf-32", "pdf-33", "pdf-34", "pdf-35"];
    const round = "55555555-5555-4555-8555-555555555555";
    for (const id of ids) await as(BOB, "select public.submit_answer($1, $2, $3)", [round, id, right(id)]);
    const [c] = await as<{ r: Record<string, unknown> }>(BOB, "select public.complete_round($1, 'standard', 'product-detective') as r", [round]);
    expect(c.r).toMatchObject({ round_bonus: 5 });
    expect(c.r.new_achievements).toEqual(expect.arrayContaining(["first-quest", "perfect-round"]));
    const ach = await as<{ achievement_id: string }>(BOB, "select achievement_id from public.achievements");
    // quick-thinker unlocks on the fifth consecutive correct answer, before the round completes.
    expect(ach.map((a) => a.achievement_id).sort()).toEqual(["first-quest", "perfect-round", "quick-thinker"]);
    // RLS: Bob cannot see Alice's achievements.
    expect(await as(BOB, "select * from public.achievements where player_id = $1", [ALICE])).toHaveLength(0);

    const [again] = await as<{ r: Record<string, unknown> }>(BOB, "select public.complete_round($1, 'standard', 'product-detective') as r", [round]);
    expect(again.r).toMatchObject({ round_bonus: 0 });

    const round2 = "66666666-6666-4666-8666-666666666666";
    for (const id of ["pdf-36", "pdf-37", "pdf-38", "pdf-39", "pdf-40"]) await as(BOB, "select public.submit_answer($1, $2, $3)", [round2, id, ["A"]]);
    const [second] = await as<{ r: Record<string, unknown> }>(BOB, "select public.complete_round($1, 'standard', 'product-detective') as r", [round2]);
    expect(second.r).toMatchObject({ round_bonus: 0, round_bonus_already_claimed: true });
  });

  it("matches the client's daily question and awards the daily bonus once", async () => {
    const [{ id }] = (await db.query<{ id: string }>("select public.daily_question_id() as id")).rows;
    expect(id).toBe(dailyQuestion().id);
    const r1 = "77777777-7777-4777-8777-777777777777";
    await as(ALICE, "select public.submit_answer($1, $2, $3)", [r1, id, ["A"]]).catch(() => undefined);
    const [c] = await as<{ r: Record<string, unknown> }>(ALICE, "select public.complete_round($1, 'daily', 'daily') as r", [r1]);
    expect(c.r).toMatchObject({ daily_bonus: 15 });
    const r2 = "88888888-8888-4888-8888-888888888888";
    await as(ALICE, "select public.submit_answer($1, $2, $3)", [r2, id, ["A"]]);
    const [c2] = await as<{ r: Record<string, unknown> }>(ALICE, "select public.complete_round($1, 'daily', 'daily') as r", [r2]);
    expect(c2.r).toMatchObject({ daily_bonus: 0 });
  });

  it("ranks weekly and all-time boards from the XP ledger", async () => {
    const all = await as<{ rank: number; gamertag: string; xp: number }>(ALICE, "select * from public.get_leaderboard('all_time', 10)");
    expect(all.map((r) => r.gamertag)).toEqual(["BobTheBuilder", "Pixel_Pal"]);
    const bobTotal = (await db.query<{ total_xp: number }>("select total_xp from public.players where id = $1", [BOB])).rows[0].total_xp;
    expect(Number(all[0].xp)).toBe(bobTotal);
    const weekly = await as<{ xp: number }>(ALICE, "select * from public.get_leaderboard('weekly', 10)");
    expect(weekly).toHaveLength(2);
    // Old XP from a previous week does not count toward this week.
    await db.query("update public.xp_transactions set created_at = now() - interval '14 days' where player_id = $1", [BOB]);
    const weekly2 = await as<{ gamertag: string }>(ALICE, "select * from public.get_leaderboard('weekly', 10)");
    expect(weekly2.map((r) => r.gamertag)).toEqual(["Pixel_Pal"]);
    const me = await as<{ rank: number }>(ALICE, "select * from public.get_my_rank('all_time')");
    expect(Number(me[0].rank)).toBe(2);
  });

  it("lets players rename themselves but not take someone else's tag", async () => {
    await as(ALICE, "select public.update_player_profile('Pixel_Pal_2', null)");
    await expect(as(ALICE, "select public.update_player_profile('bobthebuilder', null)")).rejects.toThrow(/GAMERTAG_TAKEN/);
    await as(ALICE, "select public.update_player_profile(null, 'gloop')");
    const p = await db.query<{ gamertag: string; character_id: string }>("select gamertag, character_id from public.players where id = $1", [ALICE]);
    expect(p.rows[0]).toEqual({ gamertag: "Pixel_Pal_2", character_id: "gloop" });
  });
});

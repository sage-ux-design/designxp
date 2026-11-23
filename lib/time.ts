/** All competitive time boundaries use UTC. */

export function utcDateKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Monday 00:00 UTC of the week containing `d`. */
export function weekStartUtc(d: Date = new Date()): Date {
  const day = d.getUTCDay(); // 0 = Sunday
  const diff = (day + 6) % 7; // days since Monday
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - diff));
}

export function weekEndUtc(d: Date = new Date()): Date {
  const start = weekStartUtc(d);
  return new Date(start.getTime() + 7 * 86_400_000 - 1);
}

export function formatWeekRange(d: Date = new Date()): string {
  const fmt = (x: Date) => x.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  return `${fmt(weekStartUtc(d))} – ${fmt(weekEndUtc(d))}`;
}

/** Days since 2024-01-01 UTC; used for daily rotations (mirrored in SQL). */
export function dayNumber(d: Date = new Date()): number {
  const today = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.floor((today - Date.UTC(2024, 0, 1)) / 86_400_000);
}

/** Consecutive-day streak ending today or yesterday (UTC). */
export function currentStreak(dateKeys: string[], now: Date = new Date()): number {
  if (!dateKeys.length) return 0;
  const set = new Set(dateKeys);
  const day = 86_400_000;
  let cursor = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (!set.has(new Date(cursor).toISOString().slice(0, 10))) cursor -= day;
  let streak = 0;
  while (set.has(new Date(cursor).toISOString().slice(0, 10))) {
    streak++;
    cursor -= day;
  }
  return streak;
}

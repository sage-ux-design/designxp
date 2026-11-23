export const GAMERTAG_MIN = 3;
export const GAMERTAG_MAX = 16;
export const GAMERTAG_PATTERN = /^[A-Za-z0-9_]+$/;

/**
 * Basic profanity filter. Matches blocked roots anywhere in the normalized tag,
 * including simple leetspeak substitutions. Mirrored (in reduced form) by the database.
 */
const BLOCKED = [
  "fuck", "shit", "bitch", "cunt", "dick", "cock", "pussy", "asshole", "bastard", "slut", "whore",
  "nigger", "nigga", "faggot", "fag", "retard", "rape", "nazi", "hitler", "porn", "penis", "vagina",
  "wank", "twat", "prick", "bollock", "spastic", "kike", "chink", "tranny",
];

const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "8": "b", "@": "a", $: "s" };

export function normalizeGamertag(tag: string): string {
  return tag.trim().toLowerCase();
}

function deLeet(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[01345780@$]/g, (c) => LEET[c] ?? c)
    .replace(/_/g, "");
}

export function containsProfanity(tag: string): boolean {
  const plain = tag.toLowerCase().replace(/_/g, "");
  const leet = deLeet(tag);
  return BLOCKED.some((w) => plain.includes(w) || leet.includes(w));
}

export type GamertagIssue = "too-short" | "too-long" | "invalid-chars" | "profanity" | null;

export function validateGamertag(raw: string): { ok: boolean; issue: GamertagIssue; message: string } {
  const tag = raw.trim();
  if (tag.length < GAMERTAG_MIN)
    return { ok: false, issue: "too-short", message: `Use at least ${GAMERTAG_MIN} characters.` };
  if (tag.length > GAMERTAG_MAX)
    return { ok: false, issue: "too-long", message: `Keep it to ${GAMERTAG_MAX} characters or fewer.` };
  if (!GAMERTAG_PATTERN.test(tag))
    return { ok: false, issue: "invalid-chars", message: "Only letters, numbers and underscores (_) are allowed." };
  if (containsProfanity(tag))
    return { ok: false, issue: "profanity", message: "That name isn't allowed. Try something else." };
  return { ok: true, issue: null, message: "Looks good." };
}

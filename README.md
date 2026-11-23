# DesignXP

**Level up your design thinking.** An arcade-style learning game for UX/UI and product designers: play five-question rounds, learn a concept after every answer, collect knowledge cards, earn XP and climb a shared leaderboard.

Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, [8bitcn](https://www.8bitcn.com) components, Lucide icons and Supabase.

## Art direction

The colour theory comes from the reference pixel-duck art: a saturated violet sky with lavender tiles, a pink checker floor, warm cream panels with plum-black outlines, and bright item colours (orange, yellow, hot pink, sky blue, green). The app is framed as a violet arcade cabinet with a hot-pink marquee holding the navigation. Display type is Press Start 2P with a chunky outline; long text uses Atkinson Hyperlegible. Actions are beveled arcade buttons (yellow primary, blue secondary, red destructive).

The colourful moments are original pixel scenes (`components/scene/pixel-scene.tsx`): six worlds (day, sunset, jungle, night, candy, desert), one per game mode. The violet sky and pink checker floor are sampled from the reference art. Your character stands in the dashboard hero, walks across the level as a round progresses, and celebrates on the victory screen. Tokens live at the top of `app/globals.css`. Settings offers Playground, Twilight and High Contrast themes.

The redesign followed the `unslop` and Emil Kowalski design-engineering skills in `.claude/skills/` (credited in their own licence files): one bright moment per screen with quiet chrome, a single strong ease-out curve, short press feedback and no decorative looping motion beyond the hero idle and marquee lights.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # 33 tests: question import, quiz engine, XP rules, Supabase SQL
npm run build      # production build
```

Without any environment variables the app runs in **demo mode** (see below).

## What's inside

| Area | Where |
| --- | --- |
| Onboarding (start screen → gamertag → character → confirm) | `app/onboarding`, `components/onboarding` |
| Dashboard, play, leaderboard, knowledge, Designer Speak, profile, settings | `app/(game)/*` |
| Quiz engine (selection, scoring, daily rotation) | `lib/quiz-engine.ts` |
| Levels, stats, achievements, streaks | `lib/levels.ts`, `lib/player-stats.ts`, `data/progression.ts` |
| Question content | `data/source-questions.json`, `data/question-meta.json`, `data/original-questions.json`, `data/questions.ts` |
| Knowledge cards / phrases | `data/concepts.ts`, `data/phrases.ts` |
| Original pixel-art characters | `data/characters.ts`, `components/player/pixel-sprite.tsx` |
| Backend interface + demo/live implementations | `services/` |
| Database schema, RLS and XP functions | `supabase/migrations/` |

### Question database

The 50 questions come from `content/design_arcade_50_product_design_situational_quiz.pdf` and are imported **verbatim** (question text, all four options, answer, explanation and takeaway):

```bash
npm run questions:extract   # needs pdftotext (poppler); regenerates data/source-questions.json
```

The extractor cross-checks every answer against the PDF's own Quick Answer Key and fails on any mismatch, missing field or duplicate. `tests/questions.test.ts` re-verifies the app data against the extracted JSON.

Each PDF question gets metadata in `data/question-meta.json` (game mode, difficulty, category, concept). Concepts add the learning layer (simple definition, why it matters, real-world example, designer phrase) without changing any source text.

`data/original-questions.json` holds 17 additional questions written for DesignXP and labelled `designxp-original` in the data and the UI. They exist so every mode has enough distinct questions and so the engine exercises **multi-select, true/false and visual** formats (the PDF is all single-select).

Questions per mode: Spot the UX 14 · What Would You Do? 12 · Design Lingo 11 · Research Detective 11 · Copy Doctor 10 · Product Detective 9.

To add questions, append to `data/original-questions.json` (or add a concept in `data/concepts.ts`), then run `npm run questions:keys` so the server-side answer keys stay in sync.

### XP rules

| Event | XP | Limit |
| --- | --- | --- |
| Correct answer | 10 | once per question, ever |
| New concept unlocked (any answer) | 5 | once per concept |
| Completing a full 5-question round | 5 | once per UTC day |
| Daily challenge | 15 | once per UTC day |

XP is never subtracted. Weekly XP is computed from the XP ledger since Monday 00:00 UTC; lifetime XP never resets. Levels: 0 / 100 / 250 / 450 / 700 / 1000 XP.

## Demo mode vs live leaderboard

**Demo mode** (no Supabase env vars): onboarding and gameplay work fully, the player is stored in `localStorage`, and the leaderboard ranks you against ten **sample players clearly labelled "demo"**. A DEMO MODE badge is shown and nothing claims to be global or live. Rank-change messages ("You climbed 3 positions!") only appear with live data.

### Enable the live leaderboard

1. Create a Supabase project.
2. **Authentication → Sign In / Providers → enable "Allow anonymous sign-ins".** Players are anonymous users; no email or real name is collected.
3. Apply the migrations in `supabase/migrations/` in order, either with the Supabase CLI (`supabase link` then `supabase db push`) or by pasting both files into the SQL editor.
4. Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API). Never use the `service_role` key in this app.
5. Restart `npm run dev`. The DEMO MODE badge disappears and the board is shared.

Anonymous identities are bound to the browser that created them. They don't transfer across devices; account linking can be added later with Supabase's `linkIdentity`.

### Security model

- Tables: `players`, `question_attempts`, `xp_transactions`, `unlocked_concepts`, `achievements`, `daily_activity`, `round_completions`, plus server-only `question_keys`.
- Row Level Security on every table. Players can read only their own rows (profiles are readable for the leaderboard). There are **no insert/update/delete policies**: all writes go through `SECURITY DEFINER` functions.
- `submit_answer` checks the answer against server-side keys and awards XP; the client never sends XP values.
- A unique `(player_id, reason, ref)` constraint on the XP ledger prevents duplicate question rewards and duplicate daily bonuses, even under concurrency.
- Gamertags are unique case-insensitively via a unique index on `lower(gamertag)`, which also makes simultaneous claims safe. Format and a basic profanity list are enforced in the database as well as the UI.
- Known limitation: answer keys also ship in the client bundle so feedback can be shown offline in demo mode. A determined player could read them; XP is still capped at the fixed content total.

`tests/supabase-sql.test.ts` runs the real migrations in an in-process Postgres (PGlite) and checks RLS, duplicate-XP prevention, bonuses, achievements and rankings.

## Accessibility and settings

Keyboard play (1–4 / A–D to pick, Enter to check and continue), visible focus states, labelled controls, state shown with icons and text as well as colour, and no horizontal scrolling down to 375 px. Settings include sound (off by default), reduced motion (also follows the OS preference), CRT scanlines, three themes including high contrast, and a confirmed reset of local progress.

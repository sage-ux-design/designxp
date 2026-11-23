-- DesignXP schema: players, XP ledger, attempts, concepts, achievements, activity, rounds.
-- All competitive writes happen in SECURITY DEFINER functions. Clients can only read
-- their own rows (plus public player profiles for the leaderboard) and cannot write directly.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.players (
  id uuid primary key references auth.users (id) on delete cascade,
  gamertag text not null check (gamertag ~ '^[A-Za-z0-9_]{3,16}$'),
  normalized_gamertag text generated always as (lower(gamertag)) stored,
  character_id text not null,
  total_xp integer not null default 0 check (total_xp >= 0),
  current_level integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Case-insensitive uniqueness; also makes concurrent claims of the same tag safe.
create unique index if not exists players_normalized_gamertag_key on public.players (normalized_gamertag);

-- Answer keys live server-side so XP is awarded on the server's judgement, not the client's.
create table if not exists public.question_keys (
  id text primary key,
  sort_order integer not null unique,
  correct_answers text[] not null,
  game_mode text not null,
  concept_id text not null
);

create table if not exists public.question_attempts (
  id bigint generated always as identity primary key,
  player_id uuid not null references public.players (id) on delete cascade,
  round_id uuid not null,
  question_id text not null references public.question_keys (id),
  selected text[] not null,
  is_correct boolean not null,
  game_mode text not null,
  created_at timestamptz not null default now(),
  unique (player_id, round_id, question_id)
);
create index if not exists question_attempts_player_idx on public.question_attempts (player_id, created_at desc);

-- XP ledger. The unique (player_id, reason, ref) constraint is what prevents XP farming:
--   correct_answer  -> ref = question id   (once per question, ever)
--   concept_unlock  -> ref = concept id    (once per concept, ever)
--   round_bonus     -> ref = UTC date      (once per day)
--   daily_challenge -> ref = UTC date      (once per day)
create table if not exists public.xp_transactions (
  id bigint generated always as identity primary key,
  player_id uuid not null references public.players (id) on delete cascade,
  amount integer not null check (amount > 0),
  reason text not null check (reason in ('correct_answer', 'concept_unlock', 'round_bonus', 'daily_challenge')),
  ref text not null,
  created_at timestamptz not null default now(),
  unique (player_id, reason, ref)
);
create index if not exists xp_transactions_created_idx on public.xp_transactions (created_at, player_id);

create table if not exists public.unlocked_concepts (
  player_id uuid not null references public.players (id) on delete cascade,
  concept_id text not null,
  unlocked_at timestamptz not null default now(),
  primary key (player_id, concept_id)
);

create table if not exists public.achievements (
  player_id uuid not null references public.players (id) on delete cascade,
  achievement_id text not null,
  unlocked_at timestamptz not null default now(),
  primary key (player_id, achievement_id)
);

create table if not exists public.daily_activity (
  player_id uuid not null references public.players (id) on delete cascade,
  activity_date date not null,
  questions_answered integer not null default 0,
  primary key (player_id, activity_date)
);

create table if not exists public.round_completions (
  id uuid not null,
  player_id uuid not null references public.players (id) on delete cascade,
  kind text not null check (kind in ('standard', 'daily', 'review')),
  game_mode text not null,
  question_count integer not null,
  correct_count integer not null,
  xp_earned integer not null default 0,
  completed_at timestamptz not null default now(),
  primary key (player_id, id)
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.players enable row level security;
alter table public.question_keys enable row level security;
alter table public.question_attempts enable row level security;
alter table public.xp_transactions enable row level security;
alter table public.unlocked_concepts enable row level security;
alter table public.achievements enable row level security;
alter table public.daily_activity enable row level security;
alter table public.round_completions enable row level security;

-- Player profiles hold no personal data (gamertag, character, XP) and are readable for the leaderboard.
drop policy if exists "players are readable by signed-in users" on public.players;
create policy "players are readable by signed-in users" on public.players
  for select to authenticated using (true);

drop policy if exists "own attempts" on public.question_attempts;
create policy "own attempts" on public.question_attempts
  for select to authenticated using (player_id = auth.uid());

drop policy if exists "own xp" on public.xp_transactions;
create policy "own xp" on public.xp_transactions
  for select to authenticated using (player_id = auth.uid());

drop policy if exists "own concepts" on public.unlocked_concepts;
create policy "own concepts" on public.unlocked_concepts
  for select to authenticated using (player_id = auth.uid());

drop policy if exists "own achievements" on public.achievements;
create policy "own achievements" on public.achievements
  for select to authenticated using (player_id = auth.uid());

drop policy if exists "own activity" on public.daily_activity;
create policy "own activity" on public.daily_activity
  for select to authenticated using (player_id = auth.uid());

drop policy if exists "own rounds" on public.round_completions;
create policy "own rounds" on public.round_completions
  for select to authenticated using (player_id = auth.uid());

-- No INSERT/UPDATE/DELETE policies exist: all writes go through the functions below.
-- question_keys has no SELECT policy, so answer keys are not readable through the API.

-- ---------------------------------------------------------------------------
-- Helpers (internal)
-- ---------------------------------------------------------------------------

create or replace function public.level_for_xp(p_xp integer)
returns integer language sql immutable as $$
  select case
    when p_xp >= 1000 then 6
    when p_xp >= 700 then 5
    when p_xp >= 450 then 4
    when p_xp >= 250 then 3
    when p_xp >= 100 then 2
    else 1 end;
$$;

create or replace function public.utc_today()
returns date language sql stable as $$
  select (now() at time zone 'utc')::date;
$$;

create or replace function public.week_start_utc()
returns timestamptz language sql stable as $$
  select date_trunc('week', now() at time zone 'utc') at time zone 'utc';
$$;

create or replace function public.is_profane(p_tag text)
returns boolean language plpgsql immutable as $$
declare
  v_plain text := replace(lower(p_tag), '_', '');
  v_leet text := translate(v_plain, '01345780', 'oieastbo');
  v_word text;
begin
  foreach v_word in array array[
    'fuck','shit','bitch','cunt','dick','cock','pussy','asshole','bastard','slut','whore',
    'nigger','nigga','faggot','fag','retard','rape','nazi','hitler','porn','penis','vagina',
    'wank','twat','prick','bollock','spastic','kike','chink','tranny'
  ] loop
    if position(v_word in v_plain) > 0 or position(v_word in v_leet) > 0 then
      return true;
    end if;
  end loop;
  return false;
end;
$$;

create or replace function public.valid_character(p_character_id text)
returns boolean language sql immutable as $$
  select p_character_id = any (array[
    'arcanist','shade','bolt-8','zib','atlas','glitch','ember','dr-flux','nova','gloop'
  ]);
$$;

-- Mirrors dailyQuestion() in lib/quiz-engine.ts.
create or replace function public.daily_question_id()
returns text language sql stable security definer set search_path = public as $$
  select id from public.question_keys
  order by sort_order
  offset ((public.utc_today() - date '2024-01-01') % greatest((select count(*) from public.question_keys), 1))
  limit 1;
$$;

create or replace function public.award_xp(p_player uuid, p_amount integer, p_reason text, p_ref text)
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_amount integer;
begin
  insert into public.xp_transactions (player_id, amount, reason, ref)
  values (p_player, p_amount, p_reason, p_ref)
  on conflict (player_id, reason, ref) do nothing
  returning amount into v_amount;

  if v_amount is null then
    return 0;
  end if;

  update public.players
     set total_xp = total_xp + v_amount,
         current_level = public.level_for_xp(total_xp + v_amount),
         updated_at = now()
   where id = p_player;
  return v_amount;
end;
$$;

create or replace function public.current_streak(p_player uuid)
returns integer language plpgsql stable security definer set search_path = public as $$
declare
  v_day date := public.utc_today();
  v_streak integer := 0;
begin
  if not exists (select 1 from public.daily_activity where player_id = p_player and activity_date = v_day) then
    v_day := v_day - 1;
  end if;
  while exists (select 1 from public.daily_activity where player_id = p_player and activity_date = v_day) loop
    v_streak := v_streak + 1;
    v_day := v_day - 1;
  end loop;
  return v_streak;
end;
$$;

-- Mirrors qualifyingAchievements() in lib/player-stats.ts. Returns newly unlocked ids.
create or replace function public.refresh_achievements(p_player uuid)
returns text[] language plpgsql security definer set search_path = public as $$
declare
  v_candidates text[] := array[]::text[];
  v_new text[];
  v_last5_count integer;
  v_last5_all_correct boolean;
begin
  if exists (select 1 from public.round_completions
             where player_id = p_player and kind = 'standard' and question_count >= 5) then
    v_candidates := array_append(v_candidates, 'first-quest');
  end if;

  select count(*), coalesce(bool_and(is_correct), false) into v_last5_count, v_last5_all_correct
  from (select is_correct from public.question_attempts
        where player_id = p_player order by created_at desc, id desc limit 5) t;
  if v_last5_count = 5 and v_last5_all_correct then
    v_candidates := array_append(v_candidates, 'quick-thinker');
  end if;

  if exists (select 1 from public.round_completions
             where player_id = p_player and kind = 'standard'
               and question_count >= 5 and correct_count = question_count) then
    v_candidates := array_append(v_candidates, 'perfect-round');
  end if;

  if (select count(*) from public.unlocked_concepts where player_id = p_player) >= 10 then
    v_candidates := array_append(v_candidates, 'knowledge-hunter');
  end if;

  if (select count(*) from public.question_attempts where player_id = p_player and game_mode = 'spot-the-ux') >= 10 then
    v_candidates := array_append(v_candidates, 'ux-detective');
  end if;

  if (select count(*) from public.question_attempts where player_id = p_player
        and game_mode in ('what-would-you-do', 'product-detective')) >= 10 then
    v_candidates := array_append(v_candidates, 'product-mind');
  end if;

  if public.current_streak(p_player) >= 3 then
    v_candidates := array_append(v_candidates, 'design-streak');
  end if;

  if (select current_level from public.players where id = p_player) >= 3 then
    v_candidates := array_append(v_candidates, 'level-up');
  end if;

  with ins as (
    insert into public.achievements (player_id, achievement_id)
    select p_player, unnest(v_candidates)
    on conflict do nothing
    returning achievement_id
  )
  select coalesce(array_agg(achievement_id), array[]::text[]) into v_new from ins;
  return v_new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Public RPCs
-- ---------------------------------------------------------------------------

create or replace function public.is_gamertag_available(p_gamertag text)
returns boolean language sql stable security definer set search_path = public as $$
  select not exists (
    select 1 from public.players
    where normalized_gamertag = lower(trim(p_gamertag))
      and id is distinct from auth.uid()
  );
$$;

create or replace function public.create_player(p_gamertag text, p_character_id text)
returns public.players language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_tag text := trim(p_gamertag);
  v_row public.players;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if v_tag !~ '^[A-Za-z0-9_]{3,16}$' or public.is_profane(v_tag) then raise exception 'GAMERTAG_INVALID'; end if;
  if not public.valid_character(p_character_id) then raise exception 'CHARACTER_INVALID'; end if;
  if exists (select 1 from public.players where id = v_uid) then raise exception 'PLAYER_EXISTS'; end if;
  begin
    insert into public.players (id, gamertag, character_id) values (v_uid, v_tag, p_character_id)
    returning * into v_row;
  exception when unique_violation then
    raise exception 'GAMERTAG_TAKEN';
  end;
  return v_row;
end;
$$;

create or replace function public.update_player_profile(p_gamertag text default null, p_character_id text default null)
returns public.players language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_row public.players;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if p_gamertag is not null and (trim(p_gamertag) !~ '^[A-Za-z0-9_]{3,16}$' or public.is_profane(p_gamertag)) then
    raise exception 'GAMERTAG_INVALID';
  end if;
  if p_character_id is not null and not public.valid_character(p_character_id) then
    raise exception 'CHARACTER_INVALID';
  end if;
  begin
    update public.players
       set gamertag = coalesce(trim(p_gamertag), gamertag),
           character_id = coalesce(p_character_id, character_id),
           updated_at = now()
     where id = v_uid
    returning * into v_row;
  exception when unique_violation then
    raise exception 'GAMERTAG_TAKEN';
  end;
  if v_row.id is null then raise exception 'PLAYER_NOT_FOUND'; end if;
  return v_row;
end;
$$;

create or replace function public.submit_answer(p_round_id uuid, p_question_id text, p_selected text[])
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_key public.question_keys;
  v_correct boolean;
  v_already boolean;
  v_xp_answer integer := 0;
  v_xp_concept integer := 0;
  v_concept_new boolean := false;
  v_inserted text;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if not exists (select 1 from public.players where id = v_uid) then raise exception 'PLAYER_NOT_FOUND'; end if;

  select * into v_key from public.question_keys where id = p_question_id;
  if v_key.id is null then raise exception 'QUESTION_NOT_FOUND'; end if;

  v_correct := coalesce((select array_agg(distinct x order by x) from unnest(p_selected) x), array[]::text[])
             = (select array_agg(x order by x) from unnest(v_key.correct_answers) x);

  v_already := exists (select 1 from public.xp_transactions
                       where player_id = v_uid and reason = 'correct_answer' and ref = v_key.id);

  begin
    insert into public.question_attempts (player_id, round_id, question_id, selected, is_correct, game_mode)
    values (v_uid, p_round_id, v_key.id, p_selected, v_correct, v_key.game_mode);
  exception when unique_violation then
    raise exception 'ALREADY_ANSWERED';
  end;

  if v_correct then
    v_xp_answer := public.award_xp(v_uid, 10, 'correct_answer', v_key.id);
  end if;

  insert into public.unlocked_concepts (player_id, concept_id) values (v_uid, v_key.concept_id)
  on conflict do nothing returning concept_id into v_inserted;
  if v_inserted is not null then
    v_concept_new := true;
    v_xp_concept := public.award_xp(v_uid, 5, 'concept_unlock', v_key.concept_id);
  end if;

  insert into public.daily_activity (player_id, activity_date, questions_answered)
  values (v_uid, public.utc_today(), 1)
  on conflict (player_id, activity_date) do update set questions_answered = public.daily_activity.questions_answered + 1;

  return jsonb_build_object(
    'correct', v_correct,
    'correct_answers', to_jsonb(v_key.correct_answers),
    'xp_answer', v_xp_answer,
    'concept_unlocked', v_concept_new,
    'xp_concept', v_xp_concept,
    'already_earned', v_correct and v_already,
    'new_achievements', to_jsonb(public.refresh_achievements(v_uid))
  );
end;
$$;

create or replace function public.complete_round(p_round_id uuid, p_kind text, p_game_mode text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_count integer;
  v_correct integer;
  v_first timestamptz;
  v_round integer := 0;
  v_daily integer := 0;
  v_claimed boolean := false;
  v_xp integer;
  v_today text := public.utc_today()::text;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if p_kind not in ('standard', 'daily', 'review') then raise exception 'INVALID_KIND'; end if;

  select count(distinct question_id), count(*) filter (where is_correct), min(created_at)
    into v_count, v_correct, v_first
    from public.question_attempts where player_id = v_uid and round_id = p_round_id;

  if v_count = 0 or exists (select 1 from public.round_completions where player_id = v_uid and id = p_round_id) then
    return jsonb_build_object('round_bonus', 0, 'daily_bonus', 0, 'round_bonus_already_claimed', false,
                              'new_achievements', '[]'::jsonb);
  end if;

  if p_kind = 'standard' and v_count >= 5 then
    v_round := public.award_xp(v_uid, 5, 'round_bonus', v_today);
    v_claimed := v_round = 0;
  end if;

  if p_kind = 'daily' and exists (select 1 from public.question_attempts
                                  where player_id = v_uid and round_id = p_round_id
                                    and question_id = public.daily_question_id()) then
    v_daily := public.award_xp(v_uid, 15, 'daily_challenge', v_today);
  end if;

  select coalesce(sum(amount), 0) into v_xp from public.xp_transactions
   where player_id = v_uid and created_at >= v_first;

  insert into public.round_completions (id, player_id, kind, game_mode, question_count, correct_count, xp_earned)
  values (p_round_id, v_uid, p_kind, left(p_game_mode, 40), v_count, v_correct, v_xp);

  return jsonb_build_object(
    'round_bonus', v_round,
    'daily_bonus', v_daily,
    'round_bonus_already_claimed', v_claimed,
    'new_achievements', to_jsonb(public.refresh_achievements(v_uid))
  );
end;
$$;

create or replace function public.leaderboard_scores(p_period text)
returns table (rank bigint, player_id uuid, gamertag text, character_id text, current_level integer, xp bigint)
language sql stable security definer set search_path = public as $$
  with scores as (
    select p.id, p.gamertag, p.character_id, p.current_level, p.created_at,
           case when p_period = 'weekly' then
             coalesce((select sum(t.amount) from public.xp_transactions t
                       where t.player_id = p.id and t.created_at >= public.week_start_utc()), 0)
           else p.total_xp end::bigint as xp
    from public.players p
  )
  select row_number() over (order by s.xp desc, s.created_at asc) as rank,
         s.id, s.gamertag, s.character_id, s.current_level, s.xp
  from scores s
  where p_period <> 'weekly' or s.xp > 0;
$$;

create or replace function public.get_leaderboard(p_period text, p_limit integer default 10)
returns table (rank bigint, player_id uuid, gamertag text, character_id text, current_level integer, xp bigint)
language sql stable security definer set search_path = public as $$
  select * from public.leaderboard_scores(p_period) order by rank limit least(greatest(p_limit, 1), 100);
$$;

create or replace function public.get_my_rank(p_period text)
returns table (rank bigint, player_id uuid, gamertag text, character_id text, current_level integer, xp bigint)
language sql stable security definer set search_path = public as $$
  select * from public.leaderboard_scores(p_period) s where s.player_id = auth.uid();
$$;

create or replace function public.count_players()
returns bigint language sql stable security definer set search_path = public as $$
  select count(*) from public.players;
$$;

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------

revoke all on function public.award_xp(uuid, integer, text, text) from public, anon, authenticated;
revoke all on function public.refresh_achievements(uuid) from public, anon, authenticated;
revoke all on function public.current_streak(uuid) from public, anon, authenticated;
revoke all on function public.leaderboard_scores(text) from public, anon, authenticated;
revoke all on function public.daily_question_id() from public, anon, authenticated;

revoke all on function public.is_gamertag_available(text) from public, anon;
revoke all on function public.create_player(text, text) from public, anon;
revoke all on function public.update_player_profile(text, text) from public, anon;
revoke all on function public.submit_answer(uuid, text, text[]) from public, anon;
revoke all on function public.complete_round(uuid, text, text) from public, anon;
revoke all on function public.get_leaderboard(text, integer) from public, anon;
revoke all on function public.get_my_rank(text) from public, anon;
revoke all on function public.count_players() from public, anon;

grant execute on function public.is_gamertag_available(text) to authenticated;
grant execute on function public.create_player(text, text) to authenticated;
grant execute on function public.update_player_profile(text, text) to authenticated;
grant execute on function public.submit_answer(uuid, text, text[]) to authenticated;
grant execute on function public.complete_round(uuid, text, text) to authenticated;
grant execute on function public.get_leaderboard(text, integer) to authenticated;
grant execute on function public.get_my_rank(text) to authenticated;
grant execute on function public.count_players() to authenticated;

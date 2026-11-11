-- ITCamp rules (Lesson 1 onwards):
--   * Subcomms register with their ITCamp group number. Each member gets a seat number in
--     their group, so the app can give every teammate a different set of questions.
--   * Each quiz allows 2 attempts (1 + 1 extra). The best finished attempt is the score.
--   * Every answer is saved with the time it was given.
--   * Only the server (service role) writes attempts and answers, after grading them against
--     the question bank in the repo. Members can only read their own.
-- Guests never reach the database.

-- ---------------------------------------------------------------------------------------
-- 1. Groups and seats on profiles
-- ---------------------------------------------------------------------------------------
alter table public.profiles
  add column group_number smallint check (group_number between 1 and 30),
  add column group_seat smallint check (group_seat >= 1);

create unique index profiles_group_seat_unique on public.profiles (group_number, group_seat);

-- Supabase grants full table rights to anon and authenticated by default, so the earlier
-- "grant update (display_name)" did not stop a member updating is_admin on their own row.
-- Members may only change their display name; group and seat go through set_my_group.
revoke insert, update, delete, truncate on public.profiles from anon, authenticated;
grant update (display_name) on public.profiles to authenticated;

-- PRIVACY FIX: the first migration let anyone with the public key read every profile (ids,
-- display names, who is admin). Now a member reads only their own row. The leaderboard and
-- admin results are security-definer functions, so they still work.
revoke select on public.profiles from anon;
drop policy if exists "Profiles are readable by everyone" on public.profiles;
create policy "Members read their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

-- Sign-up checks a display name before creating the account. This answers yes/no only, so
-- the profile list stays private.
create function public.display_name_taken(name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where lower(btrim(display_name)) = lower(btrim(name))
  );
$$;

revoke execute on function public.display_name_taken(text) from public;
grant execute on function public.display_name_taken(text) to anon, authenticated;

-- Gives a member the next free seat in their group when the group is set. A seat can't be
-- edited by hand, and changing group (admins only, in the SQL editor) gives a new seat.
create function public.assign_group_seat()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.group_number is null then
    new.group_seat := null;
    return new;
  end if;
  if tg_op = 'UPDATE' and old.group_number is not distinct from new.group_number then
    new.group_seat := old.group_seat;
    return new;
  end if;
  -- One sign-up at a time per group, so two teammates never get the same seat.
  perform pg_advisory_xact_lock(hashtext('itc_group_seat'), new.group_number);
  select coalesce(max(p.group_seat), 0) + 1 into new.group_seat
  from public.profiles p
  where p.group_number = new.group_number and p.id <> new.id;
  return new;
end;
$$;

create trigger profiles_assign_group_seat
  before insert or update of group_number, group_seat on public.profiles
  for each row execute function public.assign_group_seat();

-- Sign-up now also saves the group number the member picked.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  group_text text := new.raw_user_meta_data ->> 'group_number';
begin
  insert into public.profiles (id, display_name, group_number)
  values (
    new.id,
    btrim(new.raw_user_meta_data ->> 'display_name'),
    case when group_text ~ '^[0-9]{1,2}$' then group_text::smallint end
  );
  return new;
end;
$$;

-- Members who registered before groups existed pick theirs once. Returns the seat.
create function public.set_my_group(group_no smallint)
returns smallint
language plpgsql
security definer
set search_path = ''
as $$
declare
  seat smallint;
begin
  if auth.uid() is null then
    raise exception 'Log in first' using errcode = '42501';
  end if;
  update public.profiles
     set group_number = group_no
   where id = auth.uid() and group_number is null
  returning group_seat into seat;
  if seat is null then
    raise exception 'Your group is already set' using errcode = 'P0001';
  end if;
  return seat;
end;
$$;

revoke execute on function public.set_my_group(smallint) from public, anon;
grant execute on function public.set_my_group(smallint) to authenticated;

-- ---------------------------------------------------------------------------------------
-- 2. Attempts and answers
-- ---------------------------------------------------------------------------------------
-- Keep the old one-row-per-finished-quiz table for reference; nothing writes to it any more.
alter table public.quiz_attempts rename to quiz_attempts_legacy;
alter index if exists public.quiz_attempts_user_quiz rename to quiz_attempts_legacy_user_quiz;
drop policy if exists "Members add their own attempts" on public.quiz_attempts_legacy;
revoke insert, update, delete, truncate on public.quiz_attempts_legacy from anon, authenticated;

create table public.quiz_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  quiz_slug text not null check (quiz_slug ~ '^[a-z0-9-]{1,40}$'),
  attempt_no smallint not null check (attempt_no between 1 and 2),
  question_ids text[] not null check (cardinality(question_ids) between 1 and 20),
  total smallint not null,
  score smallint not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  unique (user_id, quiz_slug, attempt_no),
  check (total = cardinality(question_ids)),
  check (score between 0 and total)
);

create table public.quiz_answers (
  attempt_id bigint not null references public.quiz_attempts (id) on delete cascade,
  position smallint not null check (position >= 1),
  question_id text not null,
  chosen text not null,
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  primary key (attempt_id, position)
);

-- Attempt 2 can only start once attempt 1 is finished.
create function public.check_attempt_order()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.attempt_no > 1 and not exists (
    select 1 from public.quiz_attempts a
    where a.user_id = new.user_id and a.quiz_slug = new.quiz_slug
      and a.attempt_no = new.attempt_no - 1 and a.finished_at is not null
  ) then
    raise exception 'Finish attempt % first', new.attempt_no - 1 using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger quiz_attempts_check_order
  before insert on public.quiz_attempts
  for each row execute function public.check_attempt_order();

-- Each answer must match the attempt's question at that position, can't be given twice
-- (primary key), and can't be added after the attempt is finished. Saving an answer
-- updates the attempt's score, and finishes it when every question is answered.
create function public.record_answer()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  attempt public.quiz_attempts%rowtype;
begin
  select * into attempt from public.quiz_attempts where id = new.attempt_id for update;
  if attempt.finished_at is not null then
    raise exception 'This attempt is already finished' using errcode = 'P0001';
  end if;
  if new.position > attempt.total or attempt.question_ids[new.position] is distinct from new.question_id then
    raise exception 'That question is not part of this attempt' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger quiz_answers_record
  before insert on public.quiz_answers
  for each row execute function public.record_answer();

create function public.update_attempt_score()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.quiz_attempts a
     set score = s.correct,
         finished_at = case when s.answered >= a.total then now() else null end
    from (
      select count(*) filter (where is_correct) as correct, count(*) as answered
      from public.quiz_answers where attempt_id = new.attempt_id
    ) s
   where a.id = new.attempt_id;
  return null;
end;
$$;

create trigger quiz_answers_update_score
  after insert on public.quiz_answers
  for each row execute function public.update_attempt_score();

create index quiz_attempts_user_quiz on public.quiz_attempts (user_id, quiz_slug);

alter table public.quiz_attempts enable row level security;
alter table public.quiz_answers enable row level security;

-- Read only for members; the server writes with the service role, which skips RLS.
revoke all on public.quiz_attempts, public.quiz_answers from anon, authenticated;
grant select on public.quiz_attempts, public.quiz_answers to authenticated;

create policy "Members read their own attempts"
  on public.quiz_attempts for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Members read their own answers"
  on public.quiz_answers for select
  to authenticated
  using (exists (
    select 1 from public.quiz_attempts a
    where a.id = attempt_id and a.user_id = (select auth.uid())
  ));

-- ---------------------------------------------------------------------------------------
-- 3. Leaderboard and results
-- ---------------------------------------------------------------------------------------
-- Points = correct answers in each member's best finished attempt, added up over every quiz.
drop function if exists public.get_leaderboard();

create function public.get_leaderboard()
returns table (display_name text, group_number smallint, points int)
language sql
stable
security definer
set search_path = ''
as $$
  select p.display_name, p.group_number, coalesce(sum(best.score), 0)::int as points
  from (
    select user_id, quiz_slug, max(score) as score
    from public.quiz_attempts
    where finished_at is not null
    group by user_id, quiz_slug
  ) best
  join public.profiles p on p.id = best.user_id
  where not p.is_admin
  group by p.id, p.display_name, p.group_number
  order by points desc, min(p.created_at)
  limit 200;
$$;

revoke execute on function public.get_leaderboard() from public;
grant execute on function public.get_leaderboard() to authenticated;

-- Every member's best score per quiz, for admins to see each member's strengths.
create function public.get_results()
returns table (
  display_name text,
  group_number smallint,
  group_seat smallint,
  quiz_slug text,
  best_score smallint,
  total smallint,
  attempts_finished int,
  last_answered_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_admin) then
    raise exception 'Admins only' using errcode = '42501';
  end if;
  return query
    select p.display_name, p.group_number, p.group_seat, a.quiz_slug,
           max(a.score) filter (where a.finished_at is not null)::smallint,
           max(a.total)::smallint,
           (count(*) filter (where a.finished_at is not null))::int,
           max(a.finished_at)
    from public.quiz_attempts a
    join public.profiles p on p.id = a.user_id
    group by p.id, p.display_name, p.group_number, p.group_seat, a.quiz_slug
    order by p.group_number nulls last, p.group_seat, a.quiz_slug;
end;
$$;

revoke execute on function public.get_results() from public, anon;
grant execute on function public.get_results() to authenticated;

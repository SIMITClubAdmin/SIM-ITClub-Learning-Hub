-- One row per finished Practice quiz. The app grades answers on the server before saving.
create table public.quiz_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  quiz_slug text not null check (quiz_slug in ('html', 'css', 'javascript')),
  score int not null check (score between 0 and 10),
  total int not null default 10 check (total = 10),
  created_at timestamptz not null default now()
);

create index quiz_attempts_user_quiz on public.quiz_attempts (user_id, quiz_slug);

alter table public.quiz_attempts enable row level security;

grant select, insert on public.quiz_attempts to authenticated;
grant usage on sequence public.quiz_attempts_id_seq to authenticated;

create policy "Members read their own attempts"
  on public.quiz_attempts for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Members add their own attempts"
  on public.quiz_attempts for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

-- Leaderboard: 10 points per correct answer, using each member's best try per quiz.
-- Returns only display names and points, and leaves out admins.
create function public.get_leaderboard()
returns table (display_name text, points int)
language sql
stable
security definer
set search_path = ''
as $$
  select p.display_name, sum(best.score)::int * 10 as points
  from (
    select user_id, quiz_slug, max(score) as score
    from public.quiz_attempts
    group by user_id, quiz_slug
  ) best
  join public.profiles p on p.id = best.user_id
  where not p.is_admin
  group by p.id, p.display_name
  order by points desc, min(p.created_at)
  limit 100;
$$;

revoke execute on function public.get_leaderboard() from public;
grant execute on function public.get_leaderboard() to anon, authenticated;

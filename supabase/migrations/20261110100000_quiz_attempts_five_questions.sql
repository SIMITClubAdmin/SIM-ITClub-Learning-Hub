-- Quizzes now have 5 questions. Keep older 10-question attempts valid.
alter table public.quiz_attempts drop constraint quiz_attempts_score_check;
alter table public.quiz_attempts drop constraint quiz_attempts_total_check;
alter table public.quiz_attempts alter column total set default 5;
alter table public.quiz_attempts add constraint quiz_attempts_total_check check (total in (5, 10));
alter table public.quiz_attempts add constraint quiz_attempts_score_check check (score between 0 and total);

-- Each quiz is worth up to 100 points, whatever its length: best score / total * 100.
create or replace function public.get_leaderboard()
returns table (display_name text, points int)
language sql
stable
security definer
set search_path = ''
as $$
  select p.display_name, round(sum(best.ratio) * 100)::int as points
  from (
    select user_id, quiz_slug, max(score::numeric / total) as ratio
    from public.quiz_attempts
    group by user_id, quiz_slug
  ) best
  join public.profiles p on p.id = best.user_id
  where not p.is_admin
  group by p.id, p.display_name
  order by points desc, min(p.created_at)
  limit 100;
$$;

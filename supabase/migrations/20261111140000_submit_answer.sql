-- One database call per answer instead of three (look up the attempt, save the answer, read
-- the score back). Only the server (service role) can call it. Safe to run more than once.
create or replace function public.submit_answer(
  p_user uuid,
  p_attempt bigint,
  p_position smallint,
  p_question text,
  p_chosen text,
  p_correct boolean
)
returns table (score smallint, finished boolean)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.quiz_attempts a where a.id = p_attempt and a.user_id = p_user) then
    raise exception 'That attempt is not yours' using errcode = '42501';
  end if;

  -- The triggers on quiz_answers reject a wrong question, a repeat answer and an attempt
  -- that is already finished, then update the attempt's score and finish time.
  insert into public.quiz_answers (attempt_id, position, question_id, chosen, is_correct)
  values (p_attempt, p_position, p_question, p_chosen, p_correct);

  return query
    select a.score, a.finished_at is not null
    from public.quiz_attempts a
    where a.id = p_attempt;
end;
$$;

revoke execute on function public.submit_answer(uuid, bigint, smallint, text, text, boolean) from public, anon, authenticated;
grant execute on function public.submit_answer(uuid, bigint, smallint, text, text, boolean) to service_role;

notify pgrst, 'reload schema';

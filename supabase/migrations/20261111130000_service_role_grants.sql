-- The server saves quiz attempts and answers with the service role (SUPABASE_SECRET_KEY).
-- Tables made through the SQL editor aren't always granted to that role, so the server got
-- "permission denied" and the quiz said "We could not load your attempts".
-- Safe to run more than once.
grant select, insert, update, delete on public.quiz_attempts, public.quiz_answers to service_role;
grant select on public.profiles to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Make the API see the change straight away.
notify pgrst, 'reload schema';

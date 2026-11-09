-- Admins see all of Practice unlocked and are kept off the leaderboard.
-- Members can only update display_name (column grant), so they cannot make themselves admin.
alter table public.profiles add column is_admin boolean not null default false;

-- To make an account admin, run this in the Supabase SQL editor (replace the email):
-- update public.profiles set is_admin = true
-- where id = (select id from auth.users where email = 'you@example.com');

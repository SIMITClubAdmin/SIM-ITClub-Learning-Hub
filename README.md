# SIM ITClub Learning Hub
The SIM ITClub Learning Hub is the website for ITCamp: Frontendamentals. Participants can find all the lesson materials here and to practice what they learn.
 
## Sections
 
- **Learning**: Lesson materials for each lesson.
- **Practice**: Exercises that help participants use their skills.
## Tech Stack
 
- Hosting: Vercel
- Database: Supabase
- Source control: GitHub
## About SIM ITClub
 
SIM ITClub helps SIM students learn and use IT skills.
 
Contact: it@mymail.sim.edu.sg
 

## Setup (ITCamp rules, Nov 2026)

1. **Database**: the hub's own Supabase project, `https://beaoqecealnmhlsuwmap.supabase.co`.
   Run every file in `supabase/migrations/` that the project doesn't have yet, in order, in the
   Supabase SQL editor (the newest is `20261111120000_groups_attempts_answers.sql`).
2. **Environment variables** (Vercel and `.env.local`): see `.env.example`. `SUPABASE_SECRET_KEY`
   is required: the server grades answers and saves them with it, so members can't write scores.
3. **Groups**: set `GROUP_COUNT` in `src/lib/groups.ts` to the number of ITCamp groups.
4. **Admins**: `update public.profiles set is_admin = true where id = (select id from auth.users where email = '...');`
   Admins see every topic unlocked, are kept off the leaderboard, and can open `/admin/results`.

## Rules

- **Subcomms register** with a display name and their ITCamp group. Each member gets a seat
  number in their group (`profiles.group_seat`), set automatically.
- **Questions** live in `src/lib/quizzes.ts` (server only: it holds the answers). Each attempt
  draws 5 (`src/lib/draw.ts`). Teammates in the same group always get different sets, and the
  same member always gets the same set for the same attempt, so refreshing changes nothing.
  Never change or reuse a question `id`; add questions to reduce overlap.
- **2 attempts per quiz** (1 + 1 extra). Each answer is saved the moment it's picked and can't
  be changed. The best finished attempt is the member's score; points = correct answers in each
  quiz's best attempt, added up over every quiz. The quiz page shows every answer with its time.
- **Guests** ("Continue as a guest" on the login page) can read the notes and try any quiz.
  Nothing they do is saved. The notes (`/learn`) and quizzes need a login or guest mode.

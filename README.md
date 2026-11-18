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

1. **Database**: the SIM IT Club's Supabase project, shared with the club website. The hub's
   tables and functions are in its `learning_hub` schema, and logins are the club's. The schema
   is managed in the club website's repo (`supabase/migrations/`, documented in its
   `docs/SCHEMA.md` and `docs/LEARNING_HUB.md`), not here.
2. **Environment variables** (Vercel and `.env.local`): see `.env.example`, using the club
   project's URL and keys. `SUPABASE_SECRET_KEY` is required: the server grades answers and
   saves them with it, so nobody can write their own scores. It's the club project's admin key,
   so keep it server-side only and guard it like the club website's.
3. **Groups**: set `GROUP_COUNT` in `src/lib/groups.ts` to the number of ITCamp groups.
4. **EXCO**: club EXCO and above (offices are managed on the club website). They see every
   topic unlocked, are kept off the leaderboard, and can open `/admin/results`.
5. **Password reset**: in the club project's Authentication → URL Configuration → Redirect
   URLs, allow `https://<hub domain>/auth/reset` (and `http://localhost:3000/auth/reset` for
   local development). Without it, reset links go to the Site URL (the club website).

## Account types

The club database calls a club login `member` and a hub-only login `guest`
(`ensure_learner()`); the hub names them in `src/lib/supabase/learner.ts`.

| Who | Account | Scores | Unlock order | Leaderboard |
| --- | --- | --- | --- | --- |
| **Visitor** | none (logged out) | — | sees the login card | can't see it |
| **Guest mode** | none ("Continue as a guest") | not saved | everything open | can't see it |
| **Learner** | registered on the hub | saved | in order | not ranked |
| **Subcomm** | ITCamp subcomm's club login | saved | in order | ranked |
| **EXCO** | club login, EXCO and above | saved | everything open | not ranked |

## Rules

- **ITCamp subcomms log in with their club account** (SIM IT Club email and password). On
  their first visit the club database makes their learner row and gives them the ITCamp group
  the club has for them, with a seat number in it (`learners.group_seat`). Anyone the club has
  no group for picks one once.
- **Anyone else can register** with a display name: a **learner account** that saves their
  challenge scores but has no ITCamp group, no club access and no place on the leaderboard.
- **Forgot password** (`/forgot-password`) emails a reset link that works for every account.
  For subcomms and EXCO it changes their SIM IT Club password too, since it's the same login.
- **Questions** live in `src/lib/quizzes.ts` (server only: it holds the answers). Each attempt
  draws 5 (`src/lib/draw.ts`). Teammates in the same group always get different sets, and the
  same person always gets the same set for the same attempt, so refreshing changes nothing.
  Never change or reuse a question `id`; add questions to reduce overlap.
- **2 attempts per quiz** (1 + 1 extra). Each answer is saved the moment it's picked and can't
  be changed. The best finished attempt is their score; points = correct answers in each
  quiz's best attempt, added up over every quiz. The quiz page shows every answer with its time.
- **Guest mode** ("Continue as a guest" on the login page) needs no account: read the notes and
  try any quiz, but nothing is saved. The notes (`/learn`) and quizzes need a login or guest mode.

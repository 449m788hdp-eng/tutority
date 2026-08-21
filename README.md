# Tutorly

Ukrainian tutor marketplace built with Next.js, Supabase Auth/Storage/Postgres, and Vercel-ready server routes.

## Local setup

1. Create a dedicated Supabase project (do not reuse an unrelated database) and apply `supabase/migrations/20260822000000_tutorly_initial.sql`.
2. Copy `.env.example` to `.env.local` and add the project's **publishable** key. Add the secret key only for server moderation/webhook work.
3. In Supabase Auth, configure Google and Apple providers plus the callback URL `http://localhost:3000/auth/callback` (and the production equivalent).
4. Run `npm install`, then `npm run dev`.

The first admin must be promoted with a controlled SQL operation: insert their `auth.users.id` into `public.user_roles` with role `admin`.

-- APEX table permissions (Stage 1, step 1.3, part 2)
-- Run this once in the Supabase SQL Editor, after 20261108000000_init.sql.
--
-- Newer Supabase projects do not give the API roles access to new tables automatically,
-- so each table needs explicit grants. Row level security (set up in the first file) still
-- decides which rows a signed-in user can touch. It is safe to run this more than once.

grant usage on schema public to anon, authenticated, service_role;

-- Signed-in users: only what the app needs, and row level security narrows it to their own rows.
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.goals to authenticated;
grant select, insert, update, delete on public.food_logs to authenticated;
grant select, insert, update, delete on public.activity_logs to authenticated;
grant select on public.ai_usage to authenticated;

-- The server (service role) manages every table, for example to record AI usage.
grant all on public.profiles, public.goals, public.food_logs, public.activity_logs, public.ai_usage
  to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Logged-out visitors (anon) get nothing, on purpose.
revoke all on public.profiles, public.goals, public.food_logs, public.activity_logs, public.ai_usage
  from anon;

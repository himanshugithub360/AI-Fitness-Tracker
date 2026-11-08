-- APEX initial schema (Stage 1, step 1.3)
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste > Run.
-- Every table has row level security. Users can only see and change their own rows.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: one row per user, created automatically at sign-up
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  sex text check (sex in ('male', 'female', 'other')),
  birth_date date check (birth_date is null or birth_date > date '1900-01-01'),
  height_cm numeric(5, 1) check (height_cm is null or height_cm between 50 and 260),
  weight_kg numeric(5, 1) check (weight_kg is null or weight_kg between 20 and 400),
  activity_level text not null default 'moderate'
    check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  units text not null default 'metric' check (units in ('metric', 'imperial')),
  timezone text not null default 'UTC',
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- goals: daily targets. At most one active goal per user.
-- ---------------------------------------------------------------------------

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  goal_type text not null check (goal_type in ('lose_fat', 'maintain', 'build_muscle')),
  daily_calories integer not null check (daily_calories between 800 and 8000),
  protein_g integer check (protein_g is null or protein_g >= 0),
  carbs_g integer check (carbs_g is null or carbs_g >= 0),
  fat_g integer check (fat_g is null or fat_g >= 0),
  target_weight_kg numeric(5, 1) check (target_weight_kg is null or target_weight_kg between 20 and 400),
  target_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index goals_one_active_per_user on public.goals (user_id) where is_active;

create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- food_logs: what the user ate
-- ---------------------------------------------------------------------------

create table public.food_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  logged_at timestamptz not null default now(),
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  name text not null check (char_length(name) between 1 and 200),
  quantity numeric(8, 2) check (quantity is null or quantity > 0),
  unit text,
  calories numeric(7, 1) not null check (calories >= 0),
  protein_g numeric(6, 1) not null default 0 check (protein_g >= 0),
  carbs_g numeric(6, 1) not null default 0 check (carbs_g >= 0),
  fat_g numeric(6, 1) not null default 0 check (fat_g >= 0),
  source text not null default 'manual'
    check (source in ('manual', 'photo', 'voice', 'barcode', 'coach')),
  confidence numeric(3, 2) check (confidence is null or confidence between 0 and 1),
  image_path text,
  ai_meta jsonb,
  created_at timestamptz not null default now()
);

create index food_logs_user_time_idx on public.food_logs (user_id, logged_at desc);

-- ---------------------------------------------------------------------------
-- activity_logs: workouts and activities
-- ---------------------------------------------------------------------------

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  logged_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 200),
  duration_min integer not null check (duration_min between 1 and 1440),
  calories_burned numeric(7, 1) not null default 0 check (calories_burned >= 0),
  source text not null default 'manual' check (source in ('manual', 'voice', 'coach', 'device')),
  created_at timestamptz not null default now()
);

create index activity_logs_user_time_idx on public.activity_logs (user_id, logged_at desc);

-- ---------------------------------------------------------------------------
-- ai_usage: one row per AI call. Written only by the server (service role).
-- ---------------------------------------------------------------------------

create table public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  task text not null,
  provider text not null check (provider in ('mistral', 'gemini')),
  model text not null,
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  cost_usd numeric(10, 6) not null default 0 check (cost_usd >= 0),
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  success boolean not null default true,
  error text,
  created_at timestamptz not null default now()
);

create index ai_usage_user_time_idx on public.ai_usage (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.food_logs enable row level security;
alter table public.activity_logs enable row level security;
alter table public.ai_usage enable row level security;

-- Logged-out visitors (the anon role) get no access to any of these tables.
revoke all on public.profiles, public.goals, public.food_logs, public.activity_logs, public.ai_usage
  from anon;

-- profiles: own row only. No delete policy: the row is removed when the auth user is deleted.
create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- goals
create policy "goals_select_own" on public.goals
  for select to authenticated using (user_id = (select auth.uid()));
create policy "goals_insert_own" on public.goals
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "goals_update_own" on public.goals
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "goals_delete_own" on public.goals
  for delete to authenticated using (user_id = (select auth.uid()));

-- food_logs
create policy "food_logs_select_own" on public.food_logs
  for select to authenticated using (user_id = (select auth.uid()));
create policy "food_logs_insert_own" on public.food_logs
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "food_logs_update_own" on public.food_logs
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "food_logs_delete_own" on public.food_logs
  for delete to authenticated using (user_id = (select auth.uid()));

-- activity_logs
create policy "activity_logs_select_own" on public.activity_logs
  for select to authenticated using (user_id = (select auth.uid()));
create policy "activity_logs_insert_own" on public.activity_logs
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "activity_logs_update_own" on public.activity_logs
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "activity_logs_delete_own" on public.activity_logs
  for delete to authenticated using (user_id = (select auth.uid()));

-- ai_usage: users may read their own rows. Only the server may write them.
revoke insert, update, delete on public.ai_usage from authenticated;
create policy "ai_usage_select_own" on public.ai_usage
  for select to authenticated using (user_id = (select auth.uid()));

-- Tutorly: privacy-first marketplace schema. Apply only to a dedicated project.
create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'moderator');
create type public.tutor_status as enum ('draft', 'processing', 'approved', 'rejected', 'manual_review', 'changes_requested', 'suspended');
create type public.teaching_format as enum ('online', 'offline', 'hybrid');
create type public.pricing_kind as enum ('lesson', 'hour', 'per_student', 'group', 'negotiable', 'contact_for_price');
create type public.contact_kind as enum ('phone', 'telegram', 'instagram', 'link');
create type public.verification_status as enum ('pending', 'approved', 'rejected', 'manual_review');
create type public.subscription_status as enum ('free_launch', 'active', 'past_due', 'cancelled', 'expired');

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text check (char_length(first_name) between 1 and 80),
  last_name text check (char_length(last_name) between 1 and 80),
  locale text not null default 'uk' check (locale in ('uk', 'en')),
  theme text not null default 'dark' check (theme in ('dark', 'light', 'system')),
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_private_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  date_of_birth date,
  email_notifications boolean not null default true,
  deletion_requested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  granted_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name_uk text not null unique,
  name_en text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.subject_goals (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references public.subjects(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name_uk text not null,
  name_en text not null,
  is_active boolean not null default true
);

create table public.tutor_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,100}$'),
  status public.tutor_status not null default 'draft',
  headline text check (char_length(headline) <= 180),
  biography text check (char_length(biography) <= 5000),
  teaching_style text check (char_length(teaching_style) <= 1000),
  experience_years smallint check (experience_years between 0 and 70),
  education text check (char_length(education) <= 2000),
  city text check (char_length(city) <= 120),
  teaching_format public.teaching_format not null default 'online',
  student_levels text[] not null default '{}',
  nmt_preparation boolean not null default false,
  gender text check (gender in ('woman', 'man', 'non_binary', 'prefer_not_to_say')),
  published_at timestamptz,
  submitted_at timestamptz,
  moderation_note text check (char_length(moderation_note) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tutor_subjects (
  tutor_id uuid not null references public.tutor_profiles(id) on delete cascade,
  subject_id uuid not null references public.subjects(id),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (tutor_id, subject_id)
);
create unique index tutor_subjects_one_primary on public.tutor_subjects(tutor_id) where is_primary;

create table public.tutor_goals (
  tutor_id uuid not null references public.tutor_profiles(id) on delete cascade,
  goal_id uuid not null references public.subject_goals(id),
  primary key (tutor_id, goal_id)
);

create table public.tutor_photos (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.tutor_profiles(id) on delete cascade,
  bucket_path text not null unique check (char_length(bucket_path) between 5 and 500),
  is_primary boolean not null default false,
  alt_text text check (char_length(alt_text) <= 140),
  created_at timestamptz not null default now()
);
create unique index tutor_photos_one_primary on public.tutor_photos(tutor_id) where is_primary;

create table public.tutor_media_uploads (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.tutor_profiles(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  pending_path text not null unique,
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes integer not null check (size_bytes between 1 and 5242880),
  created_at timestamptz not null default now()
);

create table public.tutor_contacts (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.tutor_profiles(id) on delete cascade,
  kind public.contact_kind not null,
  label text check (char_length(label) <= 60),
  value text not null check (char_length(value) between 1 and 500),
  is_published boolean not null default true,
  sort_order smallint not null default 0 check (sort_order between 0 and 50),
  created_at timestamptz not null default now(),
  unique (tutor_id, kind, value)
);

create table public.tutor_pricing (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.tutor_profiles(id) on delete cascade,
  kind public.pricing_kind not null,
  amount_uah integer check (amount_uah between 1 and 100000),
  duration_minutes smallint check (duration_minutes between 15 and 480),
  group_size smallint check (group_size between 2 and 100),
  note text check (char_length(note) <= 180),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  check ((kind in ('negotiable', 'contact_for_price')) or amount_uah is not null)
);
create unique index tutor_pricing_one_primary on public.tutor_pricing(tutor_id) where is_primary;
create index tutor_pricing_budget on public.tutor_pricing(amount_uah) where amount_uah is not null;

create table public.tutor_achievements (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.tutor_profiles(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 200),
  description text check (char_length(description) <= 2000),
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.tutor_verifications (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.tutor_profiles(id) on delete cascade,
  achievement_id uuid references public.tutor_achievements(id) on delete set null,
  kind text not null check (char_length(kind) between 2 and 100),
  document_path text not null unique,
  status public.verification_status not null default 'pending',
  reviewer_id uuid references auth.users(id),
  reviewer_note text check (char_length(reviewer_note) <= 2000),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);

create table public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  tutor_id uuid not null references public.tutor_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, tutor_id)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.tutor_profiles(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 10 and 2000),
  is_visible boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index reviews_one_active_per_author on public.reviews(author_id, tutor_id) where deleted_at is null;
create index reviews_tutor_visible on public.reviews(tutor_id, rating desc) where deleted_at is null and is_visible;

create table public.moderation_jobs (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null references public.tutor_profiles(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'failed')),
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
create table public.moderation_results (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references public.moderation_jobs(id) on delete cascade,
  decision public.tutor_status not null check (decision in ('approved', 'rejected', 'manual_review', 'changes_requested')),
  confidence numeric(4,3) check (confidence between 0 and 1),
  safe_reason text check (char_length(safe_reason) <= 1000),
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null check (char_length(action) between 3 and 120),
  target_type text not null check (char_length(target_type) between 2 and 80),
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.analytics_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  event_name text not null check (char_length(event_name) between 3 and 100),
  tutor_id uuid references public.tutor_profiles(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index analytics_events_rollup on public.analytics_events(event_name, created_at desc);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  tutor_id uuid not null unique references public.tutor_profiles(id) on delete cascade,
  status public.subscription_status not null default 'free_launch',
  current_period_start timestamptz,
  current_period_end timestamptz,
  provider_customer_id text unique,
  provider_subscription_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references public.subscriptions(id) on delete set null,
  provider_event_id text not null unique,
  event_type text not null,
  amount_uah integer check (amount_uah between 1 and 100000),
  status text not null,
  payload jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now()
);
create table private.tutor_embeddings (
  tutor_id uuid primary key references public.tutor_profiles(id) on delete cascade,
  content_hash text not null,
  embedding jsonb not null,
  updated_at timestamptz not null default now()
);

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = public, auth
as $$ select exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'admin') $$;
create or replace function private.is_public_tutor(target_tutor_id uuid)
returns boolean language sql stable security definer set search_path = public, auth
as $$ select exists (select 1 from public.tutor_profiles where id = target_tutor_id and status = 'approved') $$;
create or replace function private.owns_tutor(target_tutor_id uuid)
returns boolean language sql stable security definer set search_path = public, auth
as $$ select exists (select 1 from public.tutor_profiles where id = target_tutor_id and user_id = auth.uid()) $$;
revoke all on function private.is_admin(), private.is_public_tutor(uuid), private.owns_tutor(uuid) from public;
grant execute on function private.is_admin(), private.is_public_tutor(uuid), private.owns_tutor(uuid) to authenticated;

create or replace function private.set_updated_at() returns trigger language plpgsql security invoker as $$ begin new.updated_at = now(); return new; end $$;
create or replace function private.assert_tutor_age() returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  if not exists (select 1 from public.user_private_data where user_id = new.user_id and date_of_birth <= current_date - interval '14 years') then
    raise exception 'Tutor profile requires an account holder aged 14 or older';
  end if;
  return new;
end $$;
create or replace function private.limit_tutor_subjects() returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  if (select count(*) from public.tutor_subjects where tutor_id = new.tutor_id) >= 3 then
    raise exception 'A tutor may select at most 3 subjects';
  end if;
  return new;
end $$;
create or replace function private.prevent_self_review() returns trigger language plpgsql security definer set search_path = public, auth as $$
begin
  if exists (select 1 from public.tutor_profiles where id = new.tutor_id and user_id = new.author_id) then raise exception 'Tutors cannot review themselves'; end if;
  return new;
end $$;

create trigger profiles_updated before update on public.profiles for each row execute function private.set_updated_at();
create trigger private_data_updated before update on public.user_private_data for each row execute function private.set_updated_at();
create trigger tutor_updated before update on public.tutor_profiles for each row execute function private.set_updated_at();
create trigger reviews_updated before update on public.reviews for each row execute function private.set_updated_at();
create trigger subscriptions_updated before update on public.subscriptions for each row execute function private.set_updated_at();
create trigger tutor_age before insert or update of user_id on public.tutor_profiles for each row execute function private.assert_tutor_age();
create trigger tutor_subject_limit before insert on public.tutor_subjects for each row execute function private.limit_tutor_subjects();
create trigger no_self_review before insert or update of tutor_id, author_id on public.reviews for each row execute function private.prevent_self_review();

-- Every Data API table is RLS protected. There are deliberately no anon policies.
alter table public.profiles enable row level security;
alter table public.user_private_data enable row level security;
alter table public.user_roles enable row level security;
alter table public.subjects enable row level security;
alter table public.subject_goals enable row level security;
alter table public.tutor_profiles enable row level security;
alter table public.tutor_subjects enable row level security;
alter table public.tutor_goals enable row level security;
alter table public.tutor_photos enable row level security;
alter table public.tutor_media_uploads enable row level security;
alter table public.tutor_contacts enable row level security;
alter table public.tutor_pricing enable row level security;
alter table public.tutor_achievements enable row level security;
alter table public.tutor_verifications enable row level security;
alter table public.favorites enable row level security;
alter table public.reviews enable row level security;
alter table public.moderation_jobs enable row level security;
alter table public.moderation_results enable row level security;
alter table public.audit_logs enable row level security;
alter table public.analytics_events enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payment_events enable row level security;
alter table private.tutor_embeddings enable row level security;

create policy "own profile" on public.profiles for all to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "own private data" on public.user_private_data for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own roles only" on public.user_roles for select to authenticated using (user_id = (select auth.uid()) or private.is_admin());
create policy "subjects readable" on public.subjects for select to authenticated using (is_active or private.is_admin());
create policy "subjects administered" on public.subjects for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "goals readable" on public.subject_goals for select to authenticated using (is_active or private.is_admin());
create policy "goals administered" on public.subject_goals for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "visible or own tutor" on public.tutor_profiles for select to authenticated using (status = 'approved' or user_id = (select auth.uid()) or private.is_admin());
create policy "create own tutor" on public.tutor_profiles for insert to authenticated with check (user_id = (select auth.uid()) and status = 'draft');
create policy "edit own tutor" on public.tutor_profiles for update to authenticated using (user_id = (select auth.uid()) or private.is_admin()) with check ((user_id = (select auth.uid()) and status in ('draft','processing','manual_review','changes_requested')) or private.is_admin());
create policy "delete own draft" on public.tutor_profiles for delete to authenticated using ((user_id = (select auth.uid()) and status = 'draft') or private.is_admin());
create policy "tutor child select" on public.tutor_subjects for select to authenticated using (private.owns_tutor(tutor_id) or private.is_public_tutor(tutor_id) or private.is_admin());
create policy "tutor child edit" on public.tutor_subjects for all to authenticated using (private.owns_tutor(tutor_id) or private.is_admin()) with check (private.owns_tutor(tutor_id) or private.is_admin());
create policy "goal select" on public.tutor_goals for select to authenticated using (private.owns_tutor(tutor_id) or private.is_public_tutor(tutor_id) or private.is_admin());
create policy "goal edit" on public.tutor_goals for all to authenticated using (private.owns_tutor(tutor_id) or private.is_admin()) with check (private.owns_tutor(tutor_id) or private.is_admin());
create policy "photo select" on public.tutor_photos for select to authenticated using (private.owns_tutor(tutor_id) or private.is_public_tutor(tutor_id) or private.is_admin());
create policy "photo edit" on public.tutor_photos for all to authenticated using (private.owns_tutor(tutor_id) or private.is_admin()) with check (private.owns_tutor(tutor_id) or private.is_admin());
create policy "own pending media" on public.tutor_media_uploads for select to authenticated using (owner_id = (select auth.uid()) or private.is_admin());
create policy "own pending media insert" on public.tutor_media_uploads for insert to authenticated with check (owner_id = (select auth.uid()) and private.owns_tutor(tutor_id));
create policy "own pending media delete" on public.tutor_media_uploads for delete to authenticated using (owner_id = (select auth.uid()) or private.is_admin());
create policy "published contacts" on public.tutor_contacts for select to authenticated using (private.owns_tutor(tutor_id) or (is_published and private.is_public_tutor(tutor_id)) or private.is_admin());
create policy "contact edit" on public.tutor_contacts for all to authenticated using (private.owns_tutor(tutor_id) or private.is_admin()) with check (private.owns_tutor(tutor_id) or private.is_admin());
create policy "pricing select" on public.tutor_pricing for select to authenticated using (private.owns_tutor(tutor_id) or private.is_public_tutor(tutor_id) or private.is_admin());
create policy "pricing edit" on public.tutor_pricing for all to authenticated using (private.owns_tutor(tutor_id) or private.is_admin()) with check (private.owns_tutor(tutor_id) or private.is_admin());
create policy "achievement select" on public.tutor_achievements for select to authenticated using (private.owns_tutor(tutor_id) or private.is_public_tutor(tutor_id) or private.is_admin());
create policy "achievement edit" on public.tutor_achievements for all to authenticated using (private.owns_tutor(tutor_id) or private.is_admin()) with check (private.owns_tutor(tutor_id) or private.is_admin());
create policy "own verification" on public.tutor_verifications for select to authenticated using (private.owns_tutor(tutor_id) or private.is_admin());
create policy "create own verification" on public.tutor_verifications for insert to authenticated with check (private.owns_tutor(tutor_id));
create policy "admin verification" on public.tutor_verifications for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "own favorites" on public.favorites for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "visible reviews" on public.reviews for select to authenticated using ((is_visible and deleted_at is null and private.is_public_tutor(tutor_id)) or author_id = (select auth.uid()) or private.is_admin());
create policy "create reviews" on public.reviews for insert to authenticated with check (author_id = (select auth.uid()));
create policy "edit own reviews" on public.reviews for update to authenticated using (author_id = (select auth.uid()) or private.is_admin()) with check (author_id = (select auth.uid()) or private.is_admin());
create policy "own moderation jobs" on public.moderation_jobs for select to authenticated using (private.owns_tutor(tutor_id) or private.is_admin());
create policy "submit own moderation job" on public.moderation_jobs for insert to authenticated with check (private.owns_tutor(tutor_id) and status = 'queued');
create policy "admin moderation jobs" on public.moderation_jobs for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "own moderation results" on public.moderation_results for select to authenticated using (private.is_admin() or exists (select 1 from public.moderation_jobs j join public.tutor_profiles t on t.id = j.tutor_id where j.id = job_id and t.user_id = (select auth.uid())));
create policy "admin moderation results" on public.moderation_results for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "admin audit only" on public.audit_logs for select to authenticated using (private.is_admin());
create policy "admin audit write" on public.audit_logs for insert to authenticated with check (private.is_admin());
create policy "own analytics write" on public.analytics_events for insert to authenticated with check (actor_id = (select auth.uid()));
create policy "admin analytics only" on public.analytics_events for select to authenticated using (private.is_admin());
create policy "own subscription status" on public.subscriptions for select to authenticated using (private.owns_tutor(tutor_id) or private.is_admin());
create policy "admin subscriptions" on public.subscriptions for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "admin payments only" on public.payment_events for select to authenticated using (private.is_admin());

-- Private buckets. Approved media requires authentication even though its profile is discoverable.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('tutor-media-pending', 'tutor-media-pending', false, 5242880, array['image/jpeg','image/png','image/webp']),
  ('tutor-media-approved', 'tutor-media-approved', false, 5242880, array['image/jpeg','image/png','image/webp']),
  ('tutor-verifications', 'tutor-verifications', false, 10485760, array['application/pdf','image/jpeg','image/png'])
on conflict (id) do nothing;
create policy "own pending upload" on storage.objects for insert to authenticated with check (bucket_id = 'tutor-media-pending' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "own pending files" on storage.objects for select to authenticated using (bucket_id = 'tutor-media-pending' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "own pending delete" on storage.objects for delete to authenticated using (bucket_id = 'tutor-media-pending' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "authenticated approved media" on storage.objects for select to authenticated using (bucket_id = 'tutor-media-approved');
create policy "own verification upload" on storage.objects for insert to authenticated with check (bucket_id = 'tutor-verifications' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "own verification files" on storage.objects for select to authenticated using (bucket_id = 'tutor-verifications' and (storage.foldername(name))[1] = (select auth.uid())::text);

insert into public.subjects (slug, name_uk, name_en) values
('mathematics','Математика','Mathematics'), ('ukrainian','Українська мова','Ukrainian'), ('ukrainian-literature','Українська література','Ukrainian literature'), ('english','Англійська','English'), ('history-of-ukraine','Історія України','History of Ukraine'), ('physics','Фізика','Physics'), ('chemistry','Хімія','Chemistry'), ('biology','Біологія','Biology'), ('geography','Географія','Geography'), ('german','Німецька','German'), ('french','Французька','French'), ('spanish','Іспанська','Spanish'), ('polish','Польська','Polish')
on conflict (slug) do nothing;

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

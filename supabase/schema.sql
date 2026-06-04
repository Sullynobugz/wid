-- WID — Willkommen in Deutschland
-- Supabase Schema

-- Organisationen (Vereine / Maßnahme-Träger)
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- Profile (Koordinatoren + Teilnehmer)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id),
  full_name text not null,
  participant_code text unique,
  role text not null default 'participant' check (role in ('coordinator', 'participant')),
  native_language text default 'ar',
  created_at timestamptz default now()
);

-- Linguu: Lern-Fortschritt pro Session
create table linguu_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  topic_id text not null,
  lesson_type text not null check (lesson_type in ('phrases', 'vocab', 'quiz')),
  score integer,
  xp_earned integer default 0,
  duration_seconds integer default 0,
  completed_at timestamptz default now()
);

-- Linguu: Vokabel-Mastery pro Nutzer
create table vocab_mastery (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  word_id text not null,
  mastery_level integer default 0 check (mastery_level between 0 and 5),
  last_reviewed_at timestamptz default now(),
  unique(user_id, word_id)
);

-- Jobmate: Aktivitäten-Log
create table jobmate_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  activity_type text not null check (activity_type in ('cv_upload', 'job_saved', 'application', 'interview')),
  details jsonb default '{}',
  created_at timestamptz default now()
);

-- View: Teilnehmer-Übersicht für Koordinatoren
create or replace view participant_stats as
select
  p.id,
  p.organization_id,
  p.full_name,
  p.participant_code,
  p.native_language,
  p.created_at,
  coalesce(sum(lp.xp_earned), 0) as total_xp,
  count(distinct lp.id) as lessons_completed,
  max(lp.completed_at) as last_active,
  count(distinct ja.id) as jobs_saved
from profiles p
left join linguu_progress lp on lp.user_id = p.id
left join jobmate_activity ja on ja.user_id = p.id and ja.activity_type = 'job_saved'
where p.role = 'participant'
group by p.id;

-- RLS aktivieren
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table linguu_progress enable row level security;
alter table vocab_mastery enable row level security;
alter table jobmate_activity enable row level security;

-- Koordinatoren sehen alles ihrer Organisation
create policy "coordinator_all" on profiles
  for all using (
    auth.uid() in (
      select id from profiles where role = 'coordinator'
      and organization_id = profiles.organization_id
    )
  );

-- Teilnehmer sehen nur sich selbst
create policy "participant_self" on profiles
  for select using (auth.uid() = id);

create policy "linguu_own" on linguu_progress
  for all using (auth.uid() = user_id);

create policy "vocab_own" on vocab_mastery
  for all using (auth.uid() = user_id);

create policy "jobmate_own" on jobmate_activity
  for all using (auth.uid() = user_id);

-- Koordinatoren dürfen Fortschritt ihrer Teilnehmer lesen
create policy "coordinator_read_progress" on linguu_progress
  for select using (
    exists (
      select 1 from profiles coord
      join profiles participant on participant.organization_id = coord.organization_id
      where coord.id = auth.uid()
      and coord.role = 'coordinator'
      and participant.id = linguu_progress.user_id
    )
  );

create policy "coordinator_read_jobmate" on jobmate_activity
  for select using (
    exists (
      select 1 from profiles coord
      join profiles participant on participant.organization_id = coord.organization_id
      where coord.id = auth.uid()
      and coord.role = 'coordinator'
      and participant.id = jobmate_activity.user_id
    )
  );

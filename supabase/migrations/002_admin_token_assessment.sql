-- Migration 002: Global Admin, Token-Tracking, Assessment

-- ── 1. global_admin Rolle ──────────────────────────────────────
-- profiles.role Constraint erweitern
alter table profiles
  drop constraint profiles_role_check,
  add constraint profiles_role_check
    check (role in ('coordinator', 'participant', 'global_admin'));

-- ── 2. Token-Usage-Tracking ────────────────────────────────────
create table token_usage (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references profiles(id) on delete set null,
  participant_code text,
  app            text not null check (app in ('linguu', 'jobmate', 'wid')),
  endpoint       text not null,
  model          text not null,
  input_tokens   integer default 0,
  output_tokens  integer default 0,
  tts_chars      integer default 0,
  whisper_secs   numeric(8,2) default 0,
  cost_eur       numeric(10,6) default 0,
  created_at     timestamptz default now()
);

create index token_usage_user_idx    on token_usage(user_id);
create index token_usage_app_idx     on token_usage(app);
create index token_usage_created_idx on token_usage(created_at desc);

-- ── 3. Assessment-Ergebnisse ────────────────────────────────────
create table assessment_results (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references profiles(id) on delete cascade,
  session_id   text not null,
  level        text not null check (level in ('A1', 'A2', 'B1', 'B2', 'C1')),
  score        integer not null,
  total        integer not null,
  answers      jsonb not null default '[]',
  duration_sec integer default 0,
  completed_at timestamptz default now(),
  unique(user_id, session_id)
);

-- ── 4. RLS ────────────────────────────────────────────────────
alter table token_usage enable row level security;
alter table assessment_results enable row level security;

-- Global admin sieht alles (token_usage)
create policy "admin_all_token_usage" on token_usage
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'global_admin')
  );

-- Niemand sonst schreibt direkt (nur via service role aus API-Proxies)
create policy "service_insert_token_usage" on token_usage
  for insert with check (true);

-- Global admin sieht alle assessments
create policy "admin_all_assessments" on assessment_results
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'global_admin')
  );

-- Koordinatoren sehen assessments ihrer Teilnehmer
create policy "coordinator_read_assessments" on assessment_results
  for select using (
    exists (
      select 1 from profiles coord
      join profiles part on part.organization_id = coord.organization_id
      where coord.id = auth.uid()
        and coord.role = 'coordinator'
        and part.id = assessment_results.user_id
    )
  );

-- Teilnehmer sehen eigene assessments
create policy "participant_own_assessments" on assessment_results
  for all using (auth.uid() = user_id);

-- ── 5. Admin-View: Organisations-Übersicht ────────────────────
create or replace view admin_org_stats as
select
  o.id as org_id,
  o.name as org_name,
  o.created_at as org_created,
  count(distinct case when p.role = 'coordinator' then p.id end) as coordinator_count,
  count(distinct case when p.role = 'participant' then p.id end) as participant_count,
  coalesce(sum(tu.cost_eur), 0) as total_cost_eur,
  max(lp.completed_at) as last_activity
from organizations o
left join profiles p on p.organization_id = o.id
left join token_usage tu on tu.user_id = p.id
left join linguu_progress lp on lp.user_id = p.id
group by o.id, o.name, o.created_at;

-- ── 6. Admin-View: Token-Kosten nach App ──────────────────────
create or replace view admin_cost_by_app as
select
  app,
  date_trunc('day', created_at) as day,
  count(*) as request_count,
  sum(input_tokens) as input_tokens,
  sum(output_tokens) as output_tokens,
  sum(tts_chars) as tts_chars,
  sum(whisper_secs) as whisper_secs,
  sum(cost_eur) as cost_eur
from token_usage
group by app, date_trunc('day', created_at)
order by day desc, app;

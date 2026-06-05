-- Migration 004: Org-Pipeline, Admin-Todos, Deep Stats Views

-- ── 1. Organisations-Pipeline (Outreach-Tracking) ──────────────
create table if not exists org_pipeline (
  id                       uuid primary key default gen_random_uuid(),
  name                     text not null,
  contact_name             text,
  contact_email            text,
  contact_phone            text,
  status                   text default 'prospect'
    check (status in ('prospect', 'demo_scheduled', 'demo_done', 'proposal_sent', 'signed', 'churned')),
  participant_count_target int  default 0,
  price_per_participant    numeric(10,2) default 40.00,
  notes                    text,
  org_id                   uuid references organizations(id),
  next_followup            date,
  created_at               timestamptz default now(),
  updated_at               timestamptz default now()
);

-- ── 2. Admin To-Do Liste ────────────────────────────────────────
create table if not exists admin_todos (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  status      text default 'open'
    check (status in ('open', 'in_progress', 'done')),
  priority    text default 'medium'
    check (priority in ('low', 'medium', 'high', 'critical')),
  category    text default 'general'
    check (category in ('tech', 'business', 'product', 'general')),
  due_date    date,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── 3. Pre-populated Todos (bekannte offene Punkte) ─────────────
insert into admin_todos (title, description, priority, category, status) values
  ('SQL Migrations 002 + 003 in Supabase ausführen',
   'Admin-Panel, Token-Tracking, Cross-App-Views — alles inaktiv bis diese laufen. Supabase Dashboard → SQL Editor.',
   'critical', 'tech', 'open'),
  ('global_admin Rolle für bastian.sb94@gmail.com setzen',
   'UPDATE profiles SET role = ''global_admin'' WHERE id = (SELECT id FROM auth.users WHERE email = ''bastian.sb94@gmail.com'');',
   'critical', 'tech', 'open'),
  ('/lernen/jobs Seite erstellen',
   'Teilnehmer-Tab führt aktuell in 404. Fix: JobMate mit WID-Code verlinken.',
   'high', 'product', 'in_progress'),
  ('Teilnehmer-Onboarding: Welcome-Screen mit WID-Code prominent',
   '3-App-Ökosystem erklären (WID = Hub, Linguu = Sprache, JobMate = Bewerbungen).',
   'high', 'product', 'open'),
  ('Coolify Deploy: WID + Linguu + JobMate + DNS-Subdomains',
   'wid.techstag.de, linguu.techstag.de, jobmate.techstag.de — ENV-Secrets setzen.',
   'high', 'tech', 'open'),
  ('Assessment-Level im Koordinator-Dashboard anzeigen',
   'Spalte im ParticipantTable: erkanntes Sprachniveau aus assessment_results.',
   'medium', 'product', 'open'),
  ('Ersten Verein kalt akquirieren',
   'Pilot kostenlos → 40€/TN ab Monat 2. Ziel: 1 Organisation bis Ende Juni.',
   'high', 'business', 'open'),
  ('E-Mail an Solarfirma (Energiecheck)',
   'Hat beim Kaltanruf (02.06.) um Angebot gebeten. Provisionsmodell für Leads.',
   'critical', 'business', 'open'),
  ('Print-PDF-Report für Jobcenter',
   'Druckbarer Fortschrittsbericht pro Teilnehmer für Nachweispflicht.',
   'medium', 'product', 'open'),
  ('Passwort-Reset für Teilnehmer',
   'Koordinator sollte PW zurücksetzen können — bereits als API vorhanden, UI in Tabelle fehlt noch.',
   'medium', 'product', 'open'),
  ('PostgreSQL + n8n + Minio in Coolify einrichten',
   'Server läuft, Services noch nicht deployed.',
   'low', 'tech', 'open'),
  ('Impressum techstag.de',
   'Rechtlich erforderlich.',
   'medium', 'business', 'open'),
  ('JobMate: Bewerbungsgespräch-Simulator',
   'Mikrofon → Whisper-Transkript → Claude-Feedback zu Inhalt, Klarheit, Stärken/Schwächen. Kontext: Stellenbezeichnung + CV. Neue Seite /interview in JobMate.',
   'medium', 'product', 'open');

-- ── 4. Revenue-View (MRR pro Organisation) ─────────────────────
create or replace view admin_revenue_by_org as
select
  o.id                                                              as org_id,
  o.name                                                            as org_name,
  o.created_at,
  count(distinct p.id) filter (where p.role = 'participant')       as active_participants,
  count(distinct p.id) filter (where p.role = 'participant') * 40.0 as mrr_eur,
  max(lp.completed_at)                                               as last_activity
from organizations o
left join profiles p         on p.organization_id = o.id
left join linguu_progress lp on lp.user_id = p.id
group by o.id, o.name, o.created_at;

-- ── 5. Completion-Stats-View ────────────────────────────────────
create or replace view admin_completion_stats as
select
  o.id                                                              as org_id,
  o.name                                                            as org_name,
  count(distinct p.id)                                             as total_participants,
  count(distinct p.id) filter (
    where (
      select count(distinct topic_id) from linguu_progress lp
      where lp.user_id = p.id
    ) >= 8
  )                                                                 as fully_completed,
  coalesce(round(avg(
    (select count(distinct topic_id) from linguu_progress lp where lp.user_id = p.id)
  )::numeric, 1), 0)                                               as avg_topics_completed,
  count(distinct p.id) filter (
    where p.role = 'participant' and (
      not exists (select 1 from linguu_progress lp where lp.user_id = p.id)
      or (
        select max(completed_at) from linguu_progress lp where lp.user_id = p.id
      ) < now() - interval '21 days'
    )
  )                                                                 as inactive_participants
from organizations o
left join profiles p on p.organization_id = o.id and p.role = 'participant'
group by o.id, o.name;

-- ── 6. Weekly-Activity-View ─────────────────────────────────────
create or replace view admin_weekly_activity as
select
  date_trunc('week', completed_at)::date as week,
  count(distinct user_id)              as active_users,
  coalesce(sum(xp_earned), 0)          as total_xp_earned,
  count(*)                             as lessons_done
from linguu_progress
group by 1
order by 1 desc;

-- ── 7. Topline KPIs View ────────────────────────────────────────
create or replace view admin_topline_kpis as
select
  (select count(*) from organizations)                            as total_orgs,
  (select count(*) from profiles where role = 'participant')      as total_participants,
  (select count(*) from profiles where role = 'participant'
   and id in (
     select user_id from linguu_progress
     where completed_at > now() - interval '7 days'
   ))                                                              as active_last_7d,
  (select count(*) from profiles where role = 'participant'
   and id in (
     select user_id from linguu_progress
     where completed_at > now() - interval '30 days'
   ))                                                              as active_last_30d,
  (select count(distinct user_id) from jobmate_activity
   where activity_type = 'application')                            as total_applications,
  (select count(*) from assessment_results)                        as total_assessments,
  (select coalesce(sum(mrr_eur), 0) from admin_revenue_by_org)     as total_mrr_eur;

-- ── 8. RLS für neue Tabellen ────────────────────────────────────
alter table org_pipeline  enable row level security;
alter table admin_todos   enable row level security;

create policy "admin_all_pipeline" on org_pipeline
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'global_admin')
  );

create policy "admin_all_todos" on admin_todos
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'global_admin')
  );

-- ── 9. Grants für service_role (notwendig trotz RLS) ────────────
grant all on org_pipeline  to service_role, authenticated, anon;
grant all on admin_todos   to service_role, authenticated, anon;

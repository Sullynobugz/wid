-- Migration 008: Anwesenheits-/Stempelsystem + Bewerbungs-Ergebnis
-- Teilnehmer stempeln sich im Enter-Hub ein/aus; Koordinatoren sehen Anwesenheit & Pünktlichkeit.

-- ── 1. Soll-Startzeit pro Maßnahme (für Pünktlichkeit) ─────────
alter table organizations
  add column if not exists expected_start_time time default '09:00';

-- ── 2. Anwesenheits-Tabelle ───────────────────────────────────
create table if not exists attendance (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete cascade,
  organization_id uuid references organizations(id),
  date            date not null default current_date,
  check_in        timestamptz not null default now(),
  check_out       timestamptz,
  was_late        boolean default false,
  created_at      timestamptz default now(),
  unique (user_id, date)          -- ein Anwesenheits-Datensatz pro Teilnehmer und Tag
);

create index if not exists idx_attendance_user     on attendance(user_id);
create index if not exists idx_attendance_org_date on attendance(organization_id, date);

-- ── 3. Bewerbungs-Ergebnis (Dummy-Status, später echt verdrahtet) ─
alter table jobmate_activity
  add column if not exists outcome text
    check (outcome in ('applied', 'invited', 'rejected', 'offer'));

-- ── 4. GRANTs für Service-Role (Pattern wie Migration 007) ─────
grant all on attendance to service_role;

-- ── 5. Anwesenheits-Aggregat-View für Koordinatoren ───────────
create or replace view attendance_stats as
select
  p.id                                                          as user_id,
  p.organization_id,
  count(a.id)                                                   as days_present,
  count(a.id) filter (where a.was_late = false)                 as days_on_time,
  count(a.id) filter (where a.date >= date_trunc('month', now())) as days_present_month,
  round(
    100.0 * count(a.id) filter (where a.was_late = false)
    / nullif(count(a.id), 0)
  )                                                             as punctuality_pct,
  round(
    (avg(extract(epoch from (a.check_out - a.check_in)) / 3600.0)
     filter (where a.check_out is not null))::numeric, 1
  )                                                             as avg_hours,
  max(a.date)                                                   as last_present
from profiles p
left join attendance a on a.user_id = p.id
where p.role = 'participant'
group by p.id, p.organization_id;

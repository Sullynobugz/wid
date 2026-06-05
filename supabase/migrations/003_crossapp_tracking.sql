-- Migration 003: Cross-App Tracking (JobMate Bewerbungen + Linguu Fortschritt via WID-Code)

-- ── 1. jobmate_activity erweitern ─────────────────────────────
-- Neue Felder für Bewerbungs-Nachweis
alter table jobmate_activity
  add column if not exists job_title      text,
  add column if not exists company        text,
  add column if not exists job_url        text,
  add column if not exists applied_at     timestamptz,
  add column if not exists email_proof    text,      -- optional: copy der gesendeten E-Mail / Subject
  add column if not exists verified       boolean default false;

-- ── 2. Bewerbungs-Stats View ──────────────────────────────────
create or replace view application_stats as
select
  p.id as user_id,
  p.organization_id,
  p.full_name,
  p.participant_code,
  count(ja.id) filter (where ja.activity_type = 'application') as total_applications,
  count(ja.id) filter (
    where ja.activity_type = 'application'
      and ja.applied_at >= date_trunc('week', now())
  ) as applications_this_week,
  count(ja.id) filter (
    where ja.activity_type = 'application'
      and ja.applied_at >= date_trunc('month', now())
  ) as applications_this_month,
  count(ja.id) filter (
    where ja.activity_type = 'application' and ja.verified = true
  ) as verified_applications,
  max(ja.applied_at) as last_applied_at
from profiles p
left join jobmate_activity ja on ja.user_id = p.id
where p.role = 'participant'
group by p.id, p.organization_id, p.full_name, p.participant_code;

-- ── 3. Linguu-Fortschritt-View für Koordinatoren ──────────────
create or replace view linguu_weekly_stats as
select
  p.id as user_id,
  p.organization_id,
  p.full_name,
  p.participant_code,
  count(lp.id) filter (where lp.completed_at >= date_trunc('week', now()))   as lessons_this_week,
  count(lp.id) filter (where lp.completed_at >= date_trunc('month', now()))  as lessons_this_month,
  sum(lp.xp_earned) filter (where lp.completed_at >= date_trunc('week', now()))  as xp_this_week,
  sum(lp.xp_earned) filter (where lp.completed_at >= date_trunc('month', now())) as xp_this_month,
  round(avg(lp.score) filter (where lp.lesson_type = 'quiz'), 1) as avg_quiz_score,
  max(lp.completed_at) as last_linguu_activity
from profiles p
left join linguu_progress lp on lp.user_id = p.id
where p.role = 'participant'
group by p.id, p.organization_id, p.full_name, p.participant_code;

-- ── 4. Kombinierter Report-View für Koordinatoren ─────────────
create or replace view participant_report as
select
  ps.id,
  ps.organization_id,
  ps.full_name,
  ps.participant_code,
  ps.native_language,
  ps.created_at,
  -- Linguu
  coalesce(ps.total_xp, 0)          as total_xp,
  coalesce(ps.lessons_completed, 0) as lessons_completed,
  ps.last_active                     as last_linguu_active,
  lws.lessons_this_week,
  lws.lessons_this_month,
  lws.xp_this_week,
  lws.avg_quiz_score,
  -- JobMate
  coalesce(apps.total_applications, 0)        as total_applications,
  coalesce(apps.applications_this_week, 0)    as applications_this_week,
  coalesce(apps.applications_this_month, 0)   as applications_this_month,
  coalesce(apps.verified_applications, 0)     as verified_applications,
  apps.last_applied_at,
  -- Jobs gemerkt
  coalesce(ps.jobs_saved, 0) as jobs_saved
from participant_stats ps
left join linguu_weekly_stats lws  on lws.user_id  = ps.id
left join application_stats   apps on apps.user_id = ps.id;

-- ── 5. RLS für neue Views ──────────────────────────────────────
-- Koordinatoren können nur ihre Org sehen (Views erben keine RLS — API filtert per org)
-- Global Admin sieht alles via service role

-- Migration 007: service_role braucht Zugriff auf ALLE public-Objekte (Tabellen + Views).
-- Behebt fehlende Grants aus 002/003/004: assessment_results, token_usage,
-- participant_report, application_stats, linguu_weekly_stats und alle admin_* Views.
-- Symptom: /track meldete 200 ok, speicherte Assessments aber nicht; /admin-Dashboard leer.
-- Ausführen: Supabase Dashboard → SQL Editor (läuft als Owner-Rolle).

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

-- Zukunftssicher: künftige Tabellen/Sequenzen automatisch für service_role granten
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;

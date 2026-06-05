-- EINMALIG ausführen: Global Admin Rolle für bastian.sb94@gmail.com setzen
-- Voraussetzung: Migration 002 muss gelaufen sein (profiles_role_check erweitert)

UPDATE profiles
SET role = 'global_admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'bastian.sb94@gmail.com'
);

-- Recovery: Falls eingeloggt und role zurückgesetzt werden muss,
-- dieses Script erneut über Supabase Dashboard → SQL Editor ausführen.
-- Kein In-App-Recovery nötig — Supabase Dashboard ist der einzige Recovery-Pfad.

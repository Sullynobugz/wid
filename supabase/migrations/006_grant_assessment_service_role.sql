-- Fix: service_role benötigt INSERT auf assessment_results (fehlte in 002)
grant insert, select on assessment_results to service_role, authenticated, anon;

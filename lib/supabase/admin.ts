import { createClient } from '@supabase/supabase-js'

// Plain Admin-Client ohne SSR/Cookies — bypasses RLS guaranteed
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

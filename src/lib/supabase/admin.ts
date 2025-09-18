import { createClient } from '@supabase/supabase-js';

// Service role client (server-only). Ensure SUPABASE_SERVICE_ROLE_KEY is set in env (NEVER expose to client bundles).
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // must be configured in the deployment environment
  if (!url || !serviceKey) {
    throw new Error('Service role client missing configuration');
  }
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false } // pure server usage
  });
}

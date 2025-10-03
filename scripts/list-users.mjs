// List users with roles and tenant context for dev/testing
// Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

async function main() {
  const { data: usersList, error } = await admin.auth.admin.listUsers()
  if (error) throw error
  const users = usersList.users
  console.log('Users:')
  for (const u of users) {
    const { data: profile } = await admin
      .from('user_profiles')
      .select('tenant_id,role,first_name,last_name')
      .eq('id', u.id)
      .maybeSingle()
    let tenant = null
    if (profile?.tenant_id) {
      const { data: t } = await admin
        .from('tenants')
        .select('name,subdomain')
        .eq('id', profile.tenant_id)
        .single()
      tenant = t?.subdomain || null
    }
    const { data: emp } = await admin
      .from('employees')
      .select('id')
      .eq('user_id', u.id)
      .maybeSingle()
    console.log(`- ${u.email} | role=${profile?.role ?? 'n/a'} | tenant=${tenant ?? 'n/a'} | employee=${emp?.id ? 'yes' : 'no'}`)
  }
}

main().catch((e) => { console.error(e); process.exit(1) })

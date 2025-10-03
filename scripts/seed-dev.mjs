// Seed demo tenants, users, memberships, employees, and module subscriptions.
// IMPORTANT: Use ONLY in local/dev environments.
// Requires env:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false }
})

const DEFAULT_PASS = process.env.DEV_PASSWORD || '1234'
const USERS = [
  // COMPANY1
  { email: 'company1-owner@demo.local', password: DEFAULT_PASS, tenant: 'company1', role: 'owner', name: 'Company1 Owner' },
  { email: 'company1-admin@demo.local', password: DEFAULT_PASS, tenant: 'company1', role: 'admin', name: 'Company1 Admin' },
  { email: 'company1-employee@demo.local', password: DEFAULT_PASS, tenant: 'company1', role: 'employee', name: 'Company1 Employee' },
  // COMPANY2
  { email: 'company2-owner@demo.local', password: DEFAULT_PASS, tenant: 'company2', role: 'owner', name: 'Company2 Owner' },
  { email: 'company2-admin@demo.local', password: DEFAULT_PASS, tenant: 'company2', role: 'admin', name: 'Company2 Admin' },
  { email: 'company2-employee@demo.local', password: DEFAULT_PASS, tenant: 'company2', role: 'employee', name: 'Company2 Employee' },
]

const TENANTS = [
  { name: 'Company One', subdomain: 'company1' },
  { name: 'Company Two', subdomain: 'company2' },
]

async function upsertTenant(subdomain, name) {
  const { data, error } = await admin
    .from('tenants')
    .upsert({ name, subdomain }, { onConflict: 'subdomain' })
    .select('id,subdomain')
    .eq('subdomain', subdomain)
    .single()
  if (error) throw error
  return data
}

async function ensureUser(email, password) {
  // Try to find user; if not present, create
  const list = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  const existing = list.data.users.find(u => u.email === email)
  if (existing) return existing
  const res = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })
  if (res.error) throw res.error
  return res.data.user
}

async function upsertProfile(userId, tenantId, role, name) {
  const [first, ...rest] = (name || '').split(' ')
  const last = rest.join(' ')
  // Attempt to set requested role; if it fails (enum constraint), fallback to 'admin' for 'owner'
  let setRole = role
  let { error } = await admin
    .from('user_profiles')
    .upsert({ id: userId, first_name: first || 'Test', last_name: last || 'User', role, tenant_id: tenantId })
  if (error && role === 'owner') {
    setRole = 'admin'
    const retry = await admin
      .from('user_profiles')
      .upsert({ id: userId, first_name: first || 'Test', last_name: last || 'User', role: setRole, tenant_id: tenantId })
    if (retry.error) throw retry.error
  } else if (error) {
    throw error
  }
}

async function upsertMembership(tenantId, userId, role) {
  let setRole = role
  let { error } = await admin
    .from('tenant_memberships')
    .upsert({ tenant_id: tenantId, user_id: userId, role })
  if (error && role === 'owner') {
    setRole = 'admin'
    const retry = await admin
      .from('tenant_memberships')
      .upsert({ tenant_id: tenantId, user_id: userId, role: setRole })
    if (retry.error) throw retry.error
  } else if (error) {
    throw error
  }
}

async function ensureEmployee(tenantId, userId, name) {
  const { data } = await admin
    .from('employees')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .maybeSingle()
  if (data?.id) return data
  const { data: ins, error } = await admin
    .from('employees')
    .insert({ tenant_id: tenantId, user_id: userId, name, email: null, is_active: true })
    .select('id')
    .single()
  if (error) throw error
  return ins
}

async function ensureSubscription(tenantId, code) {
  const { data } = await admin
    .from('tenant_module_subscriptions')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('module_code', code)
  if (data && data.length > 0) return
  const { error } = await admin
    .from('tenant_module_subscriptions')
    .insert({ tenant_id: tenantId, module_code: code, status: 'active' })
  if (error) throw error
}

async function main() {
  const tenantsBySub = {}
  for (const t of TENANTS) {
    const row = await upsertTenant(t.subdomain, t.name)
    tenantsBySub[t.subdomain] = row
  }

  const usersCreated = []
  for (const u of USERS) {
    const user = await ensureUser(u.email, u.password)
    const tenant = tenantsBySub[u.tenant]
    await upsertProfile(user.id, tenant.id, u.role, u.name)
    await upsertMembership(tenant.id, user.id, u.role)
    // Ensure employees for manager/employee (and admin too for convenience)
    if (['employee','manager','admin'].includes(u.role)) {
      await ensureEmployee(tenant.id, user.id, u.name)
    }
    usersCreated.push({ email: u.email, role: u.role, tenant: u.tenant, password: u.password })
  }

  // Subscriptions
  await ensureSubscription(tenantsBySub['company1'].id, 'attendance')
  await ensureSubscription(tenantsBySub['company1'].id, 'hr')
  await ensureSubscription(tenantsBySub['company1'].id, 'store')
  await ensureSubscription(tenantsBySub['company2'].id, 'attendance')

  console.log('\nSeed complete. Demo accounts:')
  for (const u of usersCreated) {
    console.log(`- ${u.email} (${u.role} @ ${u.tenant}) / password: ${u.password}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

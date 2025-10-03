// Reset a user's password by email (dev only)
// Usage: node scripts/reset-user-password.mjs user@example.com NewPass123!

import { createClient } from '@supabase/supabase-js'

const [,, email, newPassword] = process.argv
if (!email || !newPassword) {
  console.error('Usage: node scripts/reset-user-password.mjs <email> <newPassword>')
  process.exit(1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

async function main() {
  const list = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
  const user = list.data.users.find(u => u.email === email)
  if (!user) {
    console.error('User not found:', email)
    process.exit(1)
  }
  const res = await admin.auth.admin.updateUserById(user.id, { password: newPassword })
  if (res.error) throw res.error
  console.log('Password updated for', email)
}

main().catch((e) => { console.error(e); process.exit(1) })

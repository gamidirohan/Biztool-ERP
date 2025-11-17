#!/usr/bin/env node
/**
 * Manually accept an invitation for a user
 * Usage: node scripts/accept-invitation.mjs <token>
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the root .env.local file
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const admin = createClient(supabaseUrl, supabaseServiceKey);

const token = process.argv[2];
if (!token) {
  console.error('❌ Usage: node scripts/accept-invitation.mjs <token>');
  process.exit(1);
}

console.log(`🔍 Looking up invitation token: ${token}`);

// Get invitation
const { data: invite, error: inviteErr } = await admin
  .from('tenant_invitations')
  .select('*')
  .eq('token', token)
  .maybeSingle();

if (inviteErr || !invite) {
  console.error('❌ Invitation not found:', inviteErr?.message || 'No matching token');
  process.exit(1);
}

console.log(`✅ Found invitation for ${invite.email} (role: ${invite.role})`);
console.log(`   Tenant ID: ${invite.tenant_id}`);

// Check if expired
if (new Date(invite.expires_at) < new Date()) {
  console.error('❌ Invitation has expired');
  process.exit(1);
}

// Find user by email
const { data: users, error: userErr } = await admin.auth.admin.listUsers();
if (userErr) {
  console.error('❌ Failed to list users:', userErr.message);
  process.exit(1);
}

const user = users.users.find(u => u.email?.toLowerCase() === invite.email.toLowerCase());
if (!user) {
  console.error(`❌ No user found with email: ${invite.email}`);
  console.log('   User must register first before accepting invitation');
  process.exit(1);
}

console.log(`✅ Found user: ${user.email} (${user.id})`);

// Create tenant membership
console.log(`📝 Creating tenant membership...`);
const { error: memErr } = await admin
  .from('tenant_memberships')
  .upsert({
    tenant_id: invite.tenant_id,
    user_id: user.id,
    role: invite.role,
  }, {
    onConflict: 'tenant_id,user_id'
  });

if (memErr) {
  console.error('❌ Failed to create membership:', memErr.message);
  process.exit(1);
}

console.log(`✅ Tenant membership created`);

// Update user_profiles if exists
const { data: existingProfile } = await admin
  .from('user_profiles')
  .select('id')
  .eq('id', user.id)
  .maybeSingle();

if (existingProfile) {
  console.log(`📝 Updating user profile...`);
  await admin
    .from('user_profiles')
    .update({
      tenant_id: invite.tenant_id,
      role: invite.role,
    })
    .eq('id', user.id);
  console.log(`✅ User profile updated`);
}

// Create employee record if role is employee
if (invite.role === 'employee') {
  console.log(`📝 Creating employee record...`);
  
  const { data: existingEmployee } = await admin
    .from('employees')
    .select('id')
    .eq('tenant_id', invite.tenant_id)
    .eq('user_id', user.id)
    .maybeSingle();
  
  if (!existingEmployee) {
    const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Employee';
    
    const { error: empErr } = await admin
      .from('employees')
      .insert({
        tenant_id: invite.tenant_id,
        user_id: user.id,
        name: userName,
        email: user.email,
      });
    
    if (empErr) {
      console.error('⚠️  Failed to create employee record:', empErr.message);
    } else {
      console.log(`✅ Employee record created`);
    }
  } else {
    console.log(`✅ Employee record already exists`);
  }
}

// Delete the invitation token
console.log(`🗑️  Deleting invitation token...`);
await admin
  .from('tenant_invitations')
  .delete()
  .eq('id', invite.id);

console.log(`✅ Invitation accepted successfully!`);
console.log(`\n🎉 ${invite.email} has joined the tenant as ${invite.role}`);

-- Fix infinite recursion in tenant_invitations RLS policies
-- The issue: invitation policies check tenant_memberships, which has its own RLS that may recursively check invitations
-- Solution: Use user_profiles for authorization instead (profiles have simpler RLS: auth.uid() = id)

-- Drop existing problematic policies
DROP POLICY IF EXISTS invite_select_privileged ON tenant_invitations;
DROP POLICY IF EXISTS invite_insert_privileged ON tenant_invitations;
DROP POLICY IF EXISTS invite_update_mark_accept_cancel ON tenant_invitations;

-- Recreate policies using profile-based checks (no membership recursion)
CREATE POLICY invite_select_privileged ON tenant_invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.id = auth.uid()
        AND p.tenant_id = tenant_invitations.tenant_id
        AND p.role IN ('owner','manager','admin')
    )
  );

CREATE POLICY invite_insert_privileged ON tenant_invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.id = auth.uid()
        AND p.tenant_id = tenant_invitations.tenant_id
        AND p.role IN ('owner','manager','admin')
    )
  );

-- Allow updates (accept/cancel) by privileged users of the same tenant
CREATE POLICY invite_update_mark_accept_cancel ON tenant_invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles p
      WHERE p.id = auth.uid()
        AND p.tenant_id = tenant_invitations.tenant_id
        AND p.role IN ('owner','manager','admin')
    )
  ) WITH CHECK (true);

-- Keep the anonymous token-based policy for invite acceptance page (no change needed)
-- CREATE POLICY invite_select_by_token ON tenant_invitations FOR SELECT USING (...)
-- Fix infinite recursion in tenant_memberships RLS policies
-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view memberships in their tenant" ON tenant_memberships;
DROP POLICY IF EXISTS "Users can view their own memberships" ON tenant_memberships;

-- Enable RLS if not already enabled
ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policy
CREATE POLICY "Users can view their own memberships"
ON tenant_memberships
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow insert for invitation acceptance
CREATE POLICY "Users can insert their own memberships"
ON tenant_memberships
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow update for their own memberships
CREATE POLICY "Users can update their own memberships"
ON tenant_memberships
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

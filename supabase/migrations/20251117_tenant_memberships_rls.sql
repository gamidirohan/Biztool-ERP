-- Enable RLS on tenant_memberships table
ALTER TABLE tenant_memberships ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (idempotent)
DROP POLICY IF EXISTS "Users can view their own memberships" ON tenant_memberships;
DROP POLICY IF EXISTS "Users can view memberships in their tenant" ON tenant_memberships;

-- Allow users to read their own memberships
CREATE POLICY "Users can view their own memberships"
ON tenant_memberships
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to view memberships in their tenant (for admin features)
CREATE POLICY "Users can view memberships in their tenant"
ON tenant_memberships
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id 
    FROM tenant_memberships 
    WHERE user_id = auth.uid()
  )
);

-- Allow service role full access (for API operations)
CREATE POLICY "Service role has full access"
ON tenant_memberships
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

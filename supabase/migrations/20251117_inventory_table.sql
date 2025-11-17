-- Create inventory table for multi-tenant inventory management
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_code TEXT,
  category TEXT,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit_of_measure TEXT DEFAULT 'units',
  unit_cost NUMERIC(10,2),
  selling_price NUMERIC(10,2),
  supplier TEXT,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Unique constraint for item_name per tenant
  CONSTRAINT unique_item_per_tenant UNIQUE (tenant_id, item_name)
);

-- Create indexes for faster queries (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_inventory_tenant_id ON inventory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_supplier ON inventory(supplier);
CREATE INDEX IF NOT EXISTS idx_inventory_active ON inventory(is_active);

-- Enable RLS
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view inventory for their tenant
CREATE POLICY "Users can view own tenant inventory"
  ON inventory
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_memberships WHERE user_id = auth.uid()
      UNION
      SELECT tenant_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- Policy: Owners and admins can insert inventory
CREATE POLICY "Owners and admins can insert inventory"
  ON inventory
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_memberships 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
      UNION
      SELECT tenant_id FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Policy: Owners and admins can update inventory
CREATE POLICY "Owners and admins can update inventory"
  ON inventory
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_memberships 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'admin')
      UNION
      SELECT tenant_id FROM user_profiles 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Policy: Owners can delete inventory
CREATE POLICY "Owners can delete inventory"
  ON inventory
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_memberships 
      WHERE user_id = auth.uid() 
      AND role = 'owner'
      UNION
      SELECT tenant_id FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'owner'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_update_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_updated_at();

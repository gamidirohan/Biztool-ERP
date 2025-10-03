-- Create tasks table for daily task management
CREATE TABLE public.tasks (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL,
  title character varying NOT NULL,
  description text,
  assigned_to uuid NOT NULL, -- employee user_id
  assigned_by uuid NOT NULL, -- admin/manager/owner user_id
  priority character varying DEFAULT 'medium'::character varying CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status character varying DEFAULT 'pending'::character varying CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date date,
  completed_at timestamp with time zone,
  sort_order integer DEFAULT 0,
  is_daily_task boolean DEFAULT true, -- distinguishes daily tasks from project tasks
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tasks_pkey PRIMARY KEY (id),
  CONSTRAINT tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id),
  CONSTRAINT tasks_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES auth.users(id),
  CONSTRAINT tasks_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);

-- Create index for better performance
CREATE INDEX idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_tenant_id ON public.tasks(tenant_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_tasks_is_daily_task ON public.tasks(is_daily_task);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Users can view tasks assigned to them
CREATE POLICY "Users can view their own tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (assigned_to = auth.uid());

-- Users can update their own tasks (for status changes, completion)
CREATE POLICY "Users can update their own tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (assigned_to = auth.uid())
WITH CHECK (assigned_to = auth.uid());

-- Admins/managers/owners can view all tasks in their tenant
CREATE POLICY "Admins can view tenant tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.tenant_id = tasks.tenant_id
    AND user_profiles.role IN ('admin', 'owner', 'manager')
  )
);

-- Admins/managers/owners can manage all tasks in their tenant
CREATE POLICY "Admins can manage tenant tasks"
ON public.tasks
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.tenant_id = tasks.tenant_id
    AND user_profiles.role IN ('admin', 'owner', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.tenant_id = tasks.tenant_id
    AND user_profiles.role IN ('admin', 'owner', 'manager')
  )
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
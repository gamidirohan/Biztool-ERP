-- Update RLS policies for employees table to include managers

-- Drop the existing admin policy
DROP POLICY IF EXISTS "Admins can manage tenant employees" ON public.employees;

-- Create new policy that includes managers
CREATE POLICY "Admins can manage tenant employees"
ON public.employees
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.tenant_id = employees.tenant_id
    AND user_profiles.role IN ('admin', 'owner', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE user_profiles.id = auth.uid()
    AND user_profiles.tenant_id = employees.tenant_id
    AND user_profiles.role IN ('admin', 'owner', 'manager')
  )
);

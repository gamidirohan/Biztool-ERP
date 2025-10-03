-- RLS policies for employees table to allow user operations

-- Enable RLS if not already enabled
alter table public.employees enable row level security;

-- Allow users to read their own employee records within their tenant
create policy "Users can view their own employee record"
on public.employees
for select
to authenticated
using (
  auth.uid() = user_id
);

-- Allow users to insert their own employee record (for auto-creation)
create policy "Users can create their own employee record"
on public.employees
for insert
to authenticated
with check (
  auth.uid() = user_id
);

-- Allow users to update their own employee record
create policy "Users can update their own employee record"
on public.employees
for update
to authenticated
using (
  auth.uid() = user_id
)
with check (
  auth.uid() = user_id
);

-- Allow admins/owners to manage all employees in their tenant
create policy "Admins can manage tenant employees"
on public.employees
for all
to authenticated
using (
  exists (
    select 1 from public.user_profiles
    where user_profiles.id = auth.uid()
    and user_profiles.tenant_id = employees.tenant_id
    and user_profiles.role in ('admin', 'owner')
  )
);

-- RLS policies for attendance_records table

-- Enable RLS if not already enabled
alter table public.attendance_records enable row level security;

-- Allow users to view their own attendance records
create policy "Users can view their own attendance records"
on public.attendance_records
for select
to authenticated
using (
  exists (
    select 1 from public.employees
    where employees.id = attendance_records.employee_id
    and employees.user_id = auth.uid()
  )
);

-- Allow users to insert their own attendance records
create policy "Users can create their own attendance records"
on public.attendance_records
for insert
to authenticated
with check (
  exists (
    select 1 from public.employees
    where employees.id = attendance_records.employee_id
    and employees.user_id = auth.uid()
    and employees.tenant_id = attendance_records.tenant_id
  )
);

-- Allow admins/managers to view all attendance records in their tenant
create policy "Admins can view tenant attendance records"
on public.attendance_records
for select
to authenticated
using (
  exists (
    select 1 from public.user_profiles
    where user_profiles.id = auth.uid()
    and user_profiles.tenant_id = attendance_records.tenant_id
    and user_profiles.role in ('admin', 'owner', 'manager')
  )
);

-- Allow admins/managers to manage (update/delete) attendance records in their tenant
create policy "Admins can manage tenant attendance records"
on public.attendance_records
for all
to authenticated
using (
  exists (
    select 1 from public.user_profiles
    where user_profiles.id = auth.uid()
    and user_profiles.tenant_id = attendance_records.tenant_id
    and user_profiles.role in ('admin', 'owner')
  )
);

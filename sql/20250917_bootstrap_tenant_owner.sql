-- Bootstrap tenant owner secure function & tightened RLS policies
-- Run after base tables exist.

-- 1. Drop broad ALL policy on user_profiles if present
do $$
begin
  if exists (
    select 1 from pg_policies where tablename = 'user_profiles' and policyname = 'Users can only access their tenant data'
  ) then
    execute 'drop policy "Users can only access their tenant data" on user_profiles';
  end if;
end $$;

alter table user_profiles enable row level security;

-- 2. Narrow policies: select/update self (no insert)
do $$
begin
  if not exists (
    select 1 from pg_policies where tablename='user_profiles' and policyname='user_profiles_select_self'
  ) then
    execute 'create policy user_profiles_select_self on user_profiles for select using (auth.uid() = id)';
  end if;

  if not exists (
    select 1 from pg_policies where tablename='user_profiles' and policyname='user_profiles_update_self'
  ) then
    -- WITH CHECK ensures user can only set values on rows where they are the owner of the row.
    -- (Further restriction on immutable role/tenant changes can be enforced via trigger if desired.)
    execute 'create policy user_profiles_update_self on user_profiles for update using (auth.uid() = id) with check (auth.uid() = id)';
  end if;
end $$;

-- 3. Prevent direct inserts (no insert policy). Function will bypass via security definer.

-- 4. Function: bootstrap_tenant_owner
create or replace function public.bootstrap_tenant_owner(
  p_company_name text,
  p_subdomain text,
  p_user_id uuid,
  p_first_name text,
  p_last_name text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_id uuid;
  v_existing_owner uuid;
begin
  -- Ensure caller matches auth.uid (defense-in-depth) if extension available
  if p_user_id <> auth.uid() then
    raise exception 'Access denied';
  end if;

  -- Validate subdomain format (2-30 chars, lowercase alnum/hyphen, no leading/trailing hyphen) server-side
  if p_subdomain !~ '^[a-z0-9][a-z0-9-]{0,28}[a-z0-9]$' then
    raise exception 'Invalid subdomain. Use 2-30 lowercase letters, numbers or hyphens (no leading/trailing hyphen).';
  end if;

  -- Reserved subdomains
  if lower(p_subdomain) in ('admin','api','app','www','root','support','help','billing') then
    raise exception 'Subdomain reserved. Choose another.';
  end if;

  -- Check user not already in any tenant (single-tenant rule for now)
  if exists(select 1 from tenant_memberships where user_id = p_user_id) then
    raise exception 'User already belongs to a tenant';
  end if;

  -- Subdomain uniqueness (relies on unique index outside)
  if exists(select 1 from tenants where subdomain = p_subdomain) then
    raise exception 'Subdomain already taken';
  end if;

  -- Create tenant
  insert into tenants(name, subdomain, subscription_tier)
  values (p_company_name, p_subdomain, 'starter')
  returning id into v_tenant_id;

  -- Insert membership first
  insert into tenant_memberships(tenant_id, user_id, role)
  values (v_tenant_id, p_user_id, 'owner');

  -- Insert profile as owner
  insert into user_profiles(id, first_name, last_name, role, tenant_id)
  values (p_user_id, p_first_name, p_last_name, 'owner', v_tenant_id);

  -- Seed core modules (idempotent; ignore duplicates)
  -- Some environments may not yet have a 'tier' column on modules. We attempt a dynamic check.
  if exists (
    select 1 from information_schema.columns where table_schema='public' and table_name='modules' and column_name='tier'
  ) then
    insert into tenant_module_subscriptions(tenant_id, module_code, status)
    select v_tenant_id, m.code, 'active'
    from modules m
    where m.tier = 'core'
    on conflict do nothing;
  else
    -- Fallback: seed all modules (or restrict if a future 'is_core' boolean exists)
    insert into tenant_module_subscriptions(tenant_id, module_code, status)
    select v_tenant_id, m.code, 'active'
    from modules m
    on conflict do nothing;
  end if;

  -- Optional audit log (only if table exists)
  if to_regclass('public.audit_logs') is not null then
    insert into audit_logs(actor, tenant_id, action, details)
    values (p_user_id, v_tenant_id, 'tenant.bootstrap', jsonb_build_object(
      'company', p_company_name,
      'subdomain', p_subdomain
    ))
    on conflict do nothing;
  end if;

  return v_tenant_id;
end;
$$;

grant execute on function public.bootstrap_tenant_owner(text,text,uuid,text,text) to authenticated;

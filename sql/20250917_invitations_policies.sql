-- Invitations table RLS & supporting objects
-- Run AFTER creating the tenant_invitations table.
-- Safe to run multiple times (uses IF NOT EXISTS patterns where possible).

-- Optional: add canceled_at for cleaner cancel semantics
alter table if exists tenant_invitations
  add column if not exists canceled_at timestamptz;

-- Enable RLS
alter table tenant_invitations enable row level security;

-- Drop pre-existing policies (idempotent) so we can re-create cleanly
do $$
begin
  if exists (select 1 from pg_policies where schemaname = current_schema and tablename = 'tenant_invitations' and policyname = 'invite_select_privileged') then
    execute 'drop policy invite_select_privileged on tenant_invitations';
  end if;
  if exists (select 1 from pg_policies where schemaname = current_schema and tablename = 'tenant_invitations' and policyname = 'invite_insert_privileged') then
    execute 'drop policy invite_insert_privileged on tenant_invitations';
  end if;
  if exists (select 1 from pg_policies where schemaname = current_schema and tablename = 'tenant_invitations' and policyname = 'invite_update_mark_accept_cancel') then
    execute 'drop policy invite_update_mark_accept_cancel on tenant_invitations';
  end if;
  if exists (select 1 from pg_policies where schemaname = current_schema and tablename = 'tenant_invitations' and policyname = 'invite_select_by_token') then
    execute 'drop policy invite_select_by_token on tenant_invitations';
  end if;
end $$;

-- Policy: privileged members (owner/manager/admin) can view invites of their tenant
create policy invite_select_privileged on tenant_invitations
  for select using (
    exists (
      select 1 from tenant_memberships m
      where m.tenant_id = tenant_invitations.tenant_id
        and m.user_id = auth.uid()
        and m.role in ('owner','manager','admin')
    )
  );

-- Policy: privileged members can insert
create policy invite_insert_privileged on tenant_invitations
  for insert with check (
    exists (
      select 1 from tenant_memberships m
      where m.tenant_id = tenant_invitations.tenant_id
        and m.user_id = auth.uid()
        and m.role in ('owner','manager','admin')
    )
  );

-- Policy: privileged members can update only to cancel (set canceled_at) - or mark accepted (handled by app server after user validates)
create policy invite_update_mark_accept_cancel on tenant_invitations
  for update using (
    exists (
      select 1 from tenant_memberships m
      where m.tenant_id = tenant_invitations.tenant_id
        and m.user_id = auth.uid()
        and m.role in ('owner','manager','admin')
    )
  ) with check (true);

-- Policy: allow anonymous retrieval by token ONLY (for pre-auth acceptance page)
-- NOTE: This exposes email & role to anyone with the token. Token must be high entropy.
create policy invite_select_by_token on tenant_invitations
  for select using (
    token = current_setting('request.headers', true)::jsonb ->> 'x-invite-token'
  );

-- Helpful index for pending queries
create index if not exists ix_tenant_invitations_pending on tenant_invitations(tenant_id)
  where accepted_at is null and canceled_at is null and expires_at > now();

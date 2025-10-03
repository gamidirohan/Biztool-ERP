-- Enable pgvector and prepare face embeddings table + helper functions
create extension if not exists vector;

-- Ensure face_embeddings has an embedding vector column (512 dims)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'face_embeddings' and column_name = 'embedding_vec'
  ) then
    alter table public.face_embeddings
      add column embedding_vec vector(512);
  end if;
end $$;

-- Ensure unique identity per tenant+user for upsert
create unique index if not exists face_embeddings_tenant_user_key on public.face_embeddings(tenant_id, user_id);

-- Upsert helper to write embedding vector
create or replace function public.upsert_face_embedding(p_tenant uuid, p_user uuid, p_vec float4[], p_label text default null, p_metadata jsonb default '{}'::jsonb)
returns void
language sql as $$
  insert into public.face_embeddings(tenant_id, user_id, embedding_vec, label, metadata)
  values (p_tenant, p_user, (p_vec)::vector, p_label, p_metadata)
  on conflict (tenant_id, user_id)
  do update set embedding_vec = excluded.embedding_vec,
                label = coalesce(excluded.label, public.face_embeddings.label),
                metadata = p_metadata,
                updated_at = now();
$$;

grant execute on function public.upsert_face_embedding(uuid, uuid, float4[], text, jsonb) to anon, authenticated, service_role;

-- Distance of query vector to a specific user's embedding
create or replace function public.face_distance(p_tenant uuid, p_user uuid, p_q float4[])
returns table (user_id uuid, distance float4)
language sql stable as $$
  select user_id, (embedding_vec <-> (p_q)::vector) as distance
  from public.face_embeddings
  where tenant_id = p_tenant and user_id = p_user and embedding_vec is not null
  limit 1;
$$;

-- KNN within a tenant
create or replace function public.match_face(tenant uuid, q float4[], k int)
returns table (user_id uuid, distance float4)
language sql stable as $$
  select user_id, (embedding_vec <-> (q)::vector) as distance
  from public.face_embeddings
  where tenant_id = tenant and embedding_vec is not null
  order by embedding_vec <-> (q)::vector
  limit greatest(k,1);
$$;

grant execute on function public.face_distance(uuid, uuid, float4[]) to anon, authenticated, service_role;
grant execute on function public.match_face(uuid, float4[], int) to anon, authenticated, service_role;

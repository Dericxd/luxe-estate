-- =============================================================================
-- LuxeEstate: Tabla public.saved_properties (Favoritos / Guardados) y RLS
-- Ejecuta este script en el SQL Editor de tu proyecto de Supabase
-- Idempotente: seguro de ejecutar múltiples veces
-- =============================================================================

-- 1. Tabla de propiedades guardadas por usuario
create table if not exists public.saved_properties (
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, property_id)
);

-- 2. Índices para rendimiento en consultas del usuario, orden cronológico y cascadas FK
create index if not exists saved_properties_user_created_idx
  on public.saved_properties (user_id, created_at desc);

create index if not exists saved_properties_property_id_idx
  on public.saved_properties (property_id);

-- 3. Permisos estrictos y Row-Level Security (RLS)
revoke all on table public.saved_properties from anon;
grant select, insert, delete on table public.saved_properties to authenticated;

alter table public.saved_properties enable row level security;

drop policy if exists "saved_properties_select_own" on public.saved_properties;
create policy "saved_properties_select_own"
  on public.saved_properties
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "saved_properties_insert_own" on public.saved_properties;
create policy "saved_properties_insert_own"
  on public.saved_properties
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "saved_properties_delete_own" on public.saved_properties;
create policy "saved_properties_delete_own"
  on public.saved_properties
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

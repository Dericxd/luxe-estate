-- =============================================================================
-- LuxeEstate: desactivar propiedades en lugar de eliminarlas
-- Ejecuta DESPUÉS de setup-properties-rls.sql. Idempotente.
-- =============================================================================

alter table public.properties
  add column if not exists is_active boolean not null default true;

create index if not exists properties_is_active_idx on public.properties (is_active);

-- Lectura: separar anon y authenticated para que anon no invoque private.is_admin()
drop policy if exists "properties_select_published_or_admin" on public.properties;
drop policy if exists "properties_select_public" on public.properties;
drop policy if exists "properties_select_authenticated" on public.properties;

create policy "properties_select_public"
  on public.properties
  for select
  to anon
  using (is_active and status <> 'draft');

create policy "properties_select_authenticated"
  on public.properties
  for select
  to authenticated
  using ((is_active and status <> 'draft') or (select private.is_admin()));

-- Prohibir borrado desde la app
drop policy if exists "properties_delete_admin" on public.properties;
revoke delete on table public.properties from authenticated;

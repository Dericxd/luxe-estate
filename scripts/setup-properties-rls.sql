-- =============================================================================
-- LuxeEstate: RLS completo y versionado para public.properties
-- Ejecuta DESPUÉS de setup-user-roles.sql y setup-properties-storage-and-schema.sql
-- Idempotente: seguro de ejecutar múltiples veces
-- =============================================================================

alter table public.properties enable row level security;

grant select on table public.properties to anon, authenticated;
grant insert, update, delete on table public.properties to authenticated;
revoke insert, update, delete on table public.properties from anon;

-- 1. Elimina cualquier política SELECT previa (p. ej. using (true)) que anularía
--    la restricción, ya que las políticas permisivas se combinan con OR.
do $$
declare
  pol record;
begin
  for pol in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'properties'
      and cmd = 'SELECT'
  loop
    execute format('drop policy if exists %I on public.properties', pol.policyname);
  end loop;
end $$;

-- 2. Lectura: público ve solo no-borradores; admins activos ven todo
create policy "properties_select_published_or_admin"
  on public.properties
  for select
  to anon, authenticated
  using (status <> 'draft' or (select private.is_admin()));

-- 3. Escritura: solo admins activos
drop policy if exists "properties_insert_admin" on public.properties;
create policy "properties_insert_admin"
  on public.properties
  for insert
  to authenticated
  with check ((select private.is_admin()));

drop policy if exists "properties_update_admin" on public.properties;
create policy "properties_update_admin"
  on public.properties
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

drop policy if exists "properties_delete_admin" on public.properties;
create policy "properties_delete_admin"
  on public.properties
  for delete
  to authenticated
  using ((select private.is_admin()));

-- 4. Verificación: lista las políticas resultantes
-- select policyname, cmd, roles, qual from pg_policies
--   where schemaname = 'public' and tablename = 'properties';

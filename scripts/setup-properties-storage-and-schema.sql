-- =============================================================================
-- LuxeEstate: Esquema extendido de Properties + Bucket de Supabase Storage
-- Ejecuta este script en el SQL Editor de tu proyecto de Supabase
-- Idempotente: seguro de ejecutar múltiples veces
-- =============================================================================

-- 1. Nuevas columnas en public.properties para el formulario completo
alter table public.properties
  add column if not exists description text,
  add column if not exists year_built integer,
  add column if not exists parking integer not null default 1,
  add column if not exists amenities text[] not null default '{}',
  add column if not exists status text not null default 'published',
  add column if not exists slug text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'properties_coordinates_check'
      and conrelid = 'public.properties'::regclass
  ) then
    alter table public.properties
      add constraint properties_coordinates_check
      check (
        (latitude is null or (latitude between -90 and 90))
        and (longitude is null or (longitude between -180 and 180))
      );
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'properties_status_check'
      and conrelid = 'public.properties'::regclass
  ) then
    alter table public.properties
      add constraint properties_status_check
      check (status in ('published', 'draft', 'sold'));
  end if;
end $$;

create index if not exists properties_status_idx on public.properties (status);
create unique index if not exists properties_slug_unique_idx
  on public.properties (slug)
  where slug is not null;

-- 2. Permisos y política RLS faltante para INSERT de propiedades por admins
grant select, insert, update on table public.properties to authenticated;

drop policy if exists "properties_insert_admin" on public.properties;
create policy "properties_insert_admin"
  on public.properties
  for insert
  to authenticated
  with check ((select private.is_admin()));

-- 3. Bucket público para imágenes de propiedades (máx 5MB, JPG/PNG/WEBP)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'property-images',
  'property-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 4. Políticas RLS en storage.objects para el bucket property-images
-- Nota: Storage upsert/reemplazo requiere INSERT + SELECT + UPDATE
drop policy if exists "property_images_public_select" on storage.objects;
create policy "property_images_public_select"
  on storage.objects
  for select
  to public
  using (bucket_id = 'property-images');

drop policy if exists "property_images_admin_insert" on storage.objects;
create policy "property_images_admin_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'property-images'
    and (select private.is_admin())
  );

drop policy if exists "property_images_admin_update" on storage.objects;
create policy "property_images_admin_update"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'property-images'
    and (select private.is_admin())
  )
  with check (
    bucket_id = 'property-images'
    and (select private.is_admin())
  );

drop policy if exists "property_images_admin_delete" on storage.objects;
create policy "property_images_admin_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'property-images'
    and (select private.is_admin())
  );

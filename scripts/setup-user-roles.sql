-- =============================================================================
-- LuxeEstate: Configuración de Tabla de Roles de Usuario (RBAC) y Políticas RLS
-- Ejecuta este script en el SQL Editor de tu proyecto de Supabase
-- Soporta creación desde cero y migración automática de columnas text -> enum
-- =============================================================================

-- 1. Esquema privado para funciones de seguridad internas (no expuesto en la Data API)
create schema if not exists private;

-- 2. Tipos ENUM para que Supabase muestre un selector (dropdown) en el Table Editor
-- y genere tipos literales exactos en TypeScript
do $$
begin
  create type public.user_role as enum ('admin', 'broker', 'agent', 'viewer');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.user_status as enum ('active', 'inactive', 'suspended');
exception
  when duplicate_object then null;
end $$;

-- 3. Tabla public.user_roles vinculada a auth.users (con columnas enum)
create table if not exists public.user_roles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  role public.user_role not null default 'viewer'::public.user_role,
  status public.user_status not null default 'active'::public.user_status,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Migración idempotente si la tabla ya fue creada previamente con columnas text
drop policy if exists "user_roles_select_authenticated" on public.user_roles;
drop policy if exists "user_roles_insert_self" on public.user_roles;
drop policy if exists "user_roles_update_admin" on public.user_roles;

do $$
begin
  if (
    select data_type
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_roles'
      and column_name = 'role'
  ) = 'text' then
    alter table public.user_roles drop constraint if exists user_roles_role_check;
    alter table public.user_roles drop constraint if exists user_roles_status_check;

    alter table public.user_roles
      alter column role drop default,
      alter column status drop default;

    alter table public.user_roles
      alter column role type public.user_role using role::public.user_role,
      alter column status type public.user_status using status::public.user_status;

    alter table public.user_roles
      alter column role set default 'viewer'::public.user_role,
      alter column status set default 'active'::public.user_status;
  end if;
end $$;

-- 5. Índices para optimizar consultas y filtros en RLS / Dashboard
create index if not exists user_roles_role_idx on public.user_roles (role);
create index if not exists user_roles_status_idx on public.user_roles (status);
create index if not exists user_roles_email_idx on public.user_roles (email);

-- 6. Permisos y RLS
grant usage on type public.user_role to anon, authenticated, service_role;
grant usage on type public.user_status to anon, authenticated, service_role;
grant select, insert, update on table public.user_roles to authenticated;
alter table public.user_roles enable row level security;

-- 7. Función para verificar admin activo (evita recursión en RLS)
create or replace function private.is_admin()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    where id = (select auth.uid())
      and role = 'admin'::public.user_role
      and status = 'active'::public.user_status
  );
$$;

revoke execute on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

-- 8. Políticas RLS seguras
create policy "user_roles_select_authenticated"
  on public.user_roles
  for select
  to authenticated
  using (
    (select auth.uid()) = id
    or (select private.is_admin())
  );

-- Cierre de escalada de privilegios: desde el cliente solo se puede insertar 'viewer' y 'active'
create policy "user_roles_insert_self"
  on public.user_roles
  for insert
  to authenticated
  with check (
    (select auth.uid()) = id
    and role = 'viewer'::public.user_role
    and status = 'active'::public.user_status
  );

-- Solo admins activos pueden actualizar roles, impidiendo que un admin se quite su propio rol admin
create policy "user_roles_update_admin"
  on public.user_roles
  for update
  to authenticated
  using ((select private.is_admin()))
  with check (
    (select private.is_admin())
    and not (id = (select auth.uid()) and role <> 'admin'::public.user_role)
  );

-- 9. Trigger para sincronizar nuevos usuarios desde auth.users (SECURITY DEFINER)
create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  initial_role public.user_role := 'viewer'::public.user_role;
  extracted_name text;
  extracted_avatar text;
begin
  if new.email = 'ericdrz19@gmail.com' then
    initial_role := 'admin'::public.user_role;
  end if;

  extracted_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'user_name',
    split_part(coalesce(new.email, 'usuario'), '@', 1)
  );

  extracted_avatar := coalesce(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture'
  );

  insert into public.user_roles (id, email, full_name, avatar_url, role, status)
  values (
    new.id,
    coalesce(new.email, ''),
    extracted_name,
    extracted_avatar,
    initial_role,
    'active'::public.user_status
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(public.user_roles.full_name, excluded.full_name),
    avatar_url = coalesce(public.user_roles.avatar_url, excluded.avatar_url),
    updated_at = now();

  return new;
end;
$$;

revoke execute on function private.handle_new_auth_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_auth_user();

-- 10. Backfill de usuarios existentes en auth.users
with ordered_users as (
  select
    u.id,
    coalesce(u.email, '') as email,
    coalesce(
      u.raw_user_meta_data->>'full_name',
      u.raw_user_meta_data->>'name',
      u.raw_user_meta_data->>'user_name',
      split_part(coalesce(u.email, 'usuario'), '@', 1)
    ) as full_name,
    coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture') as avatar_url,
    u.created_at,
    row_number() over (order by u.created_at asc) as rn
  from auth.users u
)
insert into public.user_roles (id, email, full_name, avatar_url, role, status, created_at, updated_at)
select
  id,
  email,
  full_name,
  avatar_url,
  case
    when email = 'ericdrz19@gmail.com' or rn = 1 then 'admin'::public.user_role
    else 'viewer'::public.user_role
  end,
  'active'::public.user_status,
  created_at,
  now()
from ordered_users
on conflict (id) do nothing;

-- 11. Admins pueden actualizar/eliminar propiedades desde el dashboard
drop policy if exists "properties_delete_admin" on public.properties;
create policy "properties_delete_admin"
  on public.properties
  for delete
  to authenticated
  using ((select private.is_admin()));

drop policy if exists "properties_update_admin" on public.properties;
create policy "properties_update_admin"
  on public.properties
  for update
  to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

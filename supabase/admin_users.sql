-- =============================================
-- MECHAIA — Admin Users module
-- Tabla admin_actions + 5 SECURITY DEFINER RPCs
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =============================================

-- 1. Tabla de auditoria de acciones admin
create table if not exists admin_actions (
  id uuid primary key default gen_random_uuid(),
  actor_email text not null,
  action text not null check (action in ('block','unblock','grant_messages','extend_trial','change_plan')),
  target_user_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_actions_target_idx on admin_actions(target_user_id, created_at desc);

alter table admin_actions enable row level security;
drop policy if exists admin_actions_read on admin_actions;
create policy admin_actions_read on admin_actions
  for select
  using ((select email from auth.users where id = auth.uid()) = 'lautarogarofano@gmail.com');
-- Inserts solo via SECURITY DEFINER RPCs

-- 2. Helper para validar admin (raise excepcion si no lo es)
create or replace function _assert_admin()
returns text
language plpgsql
security definer
as $$
declare v_email text;
begin
  select email into v_email from auth.users where id = auth.uid();
  if v_email is null or v_email <> 'lautarogarofano@gmail.com' then
    raise exception 'Acceso denegado';
  end if;
  return v_email;
end;
$$;

-- 3. RPC: listar usuarios (con search opcional)
create or replace function admin_list_users(p_search text default null)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_search text;
  v_result jsonb;
begin
  perform _assert_admin();
  v_search := nullif(trim(coalesce(p_search, '')), '');

  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb) into v_result
  from (
    select
      u.id,
      u.email,
      coalesce(u.raw_user_meta_data->>'workshop_name', null) as workshop_name,
      s.plan,
      s.status,
      u.banned_until,
      coalesce(s.messages_used, 0) as messages_used,
      s.messages_limit,
      coalesce(s.trial_diagnostics_remaining, 0) as trial_diagnostics_remaining,
      (select count(*)::int from diagnostics d where d.user_id = u.id) as diagnostics_count,
      (select max(created_at) from diagnostics d where d.user_id = u.id) as last_diagnostic_at,
      u.created_at
    from auth.users u
    left join subscriptions s on s.user_id = u.id
    where v_search is null
       or u.email ilike '%' || v_search || '%'
       or coalesce(u.raw_user_meta_data->>'workshop_name', '') ilike '%' || v_search || '%'
    order by u.created_at desc
    limit 200
  ) t;

  return v_result;
end;
$$;

-- 4. RPC: detalle de usuario
create or replace function admin_user_detail(p_target uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_user jsonb;
  v_sub jsonb;
  v_recent_diags jsonb;
  v_recent_actions jsonb;
begin
  perform _assert_admin();

  select to_jsonb(t) into v_user
  from (
    select
      u.id,
      u.email,
      coalesce(u.raw_user_meta_data->>'workshop_name', null) as workshop_name,
      u.banned_until,
      u.created_at
    from auth.users u
    where u.id = p_target
  ) t;

  if v_user is null then
    raise exception 'Usuario no encontrado';
  end if;

  select to_jsonb(s) into v_sub
  from subscriptions s
  where s.user_id = p_target;

  select coalesce(jsonb_agg(row_to_json(d) order by d.created_at desc), '[]'::jsonb) into v_recent_diags
  from (
    select id, patente, marca, modelo, falla, status, created_at
    from diagnostics
    where user_id = p_target
    order by created_at desc
    limit 20
  ) d;

  select coalesce(jsonb_agg(row_to_json(a) order by a.created_at desc), '[]'::jsonb) into v_recent_actions
  from (
    select id, actor_email, action, payload, created_at
    from admin_actions
    where target_user_id = p_target
    order by created_at desc
    limit 10
  ) a;

  return jsonb_build_object(
    'user', v_user,
    'subscription', v_sub,
    'recent_diagnostics', v_recent_diags,
    'recent_actions', v_recent_actions
  );
end;
$$;

-- 5. RPC: bloquear / desbloquear (toca auth.users.banned_until)
create or replace function admin_block_user(p_target uuid, p_block boolean)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_admin text;
  v_action text;
begin
  v_admin := _assert_admin();

  if p_block then
    update auth.users set banned_until = 'infinity'::timestamptz where id = p_target;
    v_action := 'block';
  else
    update auth.users set banned_until = null where id = p_target;
    v_action := 'unblock';
  end if;

  insert into admin_actions(actor_email, action, target_user_id, payload)
  values (v_admin, v_action, p_target, jsonb_build_object('blocked', p_block));

  return admin_user_detail(p_target);
end;
$$;

-- 6. RPC: regalar mensajes / extender trial
create or replace function admin_grant_messages(p_target uuid, p_qty int)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_admin text;
  v_status text;
  v_action text;
begin
  v_admin := _assert_admin();

  if p_qty is null or p_qty < 1 or p_qty > 500 then
    raise exception 'Cantidad fuera de rango (1-500)';
  end if;

  select status into v_status from subscriptions where user_id = p_target;
  if v_status is null then
    raise exception 'Usuario sin suscripcion';
  end if;

  if v_status = 'trial' then
    update subscriptions
      set trial_diagnostics_remaining = coalesce(trial_diagnostics_remaining, 0) + p_qty,
          updated_at = now()
      where user_id = p_target;
    v_action := 'extend_trial';
  else
    update subscriptions
      set messages_used = greatest(coalesce(messages_used, 0) - p_qty, 0),
          updated_at = now()
      where user_id = p_target;
    v_action := 'grant_messages';
  end if;

  insert into admin_actions(actor_email, action, target_user_id, payload)
  values (v_admin, v_action, p_target, jsonb_build_object('qty', p_qty, 'previous_status', v_status));

  return admin_user_detail(p_target);
end;
$$;

-- 7. RPC: cambiar plan
create or replace function admin_change_plan(p_target uuid, p_plan text, p_status text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_admin text;
  v_msg_limit int;
begin
  v_admin := _assert_admin();

  if p_plan not in ('base','turbo') then
    raise exception 'Plan invalido (base|turbo)';
  end if;
  if p_status not in ('trial','active','inactive','cancelled') then
    raise exception 'Estado invalido (trial|active|inactive|cancelled)';
  end if;

  v_msg_limit := case when p_plan = 'base' then 150 else null end;

  insert into subscriptions(user_id, plan, status, messages_used, messages_limit, trial_diagnostics_remaining, updated_at)
  values (p_target, p_plan, p_status, 0, v_msg_limit, 9999, now())
  on conflict (user_id) do update
    set plan = excluded.plan,
        status = excluded.status,
        messages_limit = excluded.messages_limit,
        updated_at = now();

  insert into admin_actions(actor_email, action, target_user_id, payload)
  values (v_admin, 'change_plan', p_target, jsonb_build_object('plan', p_plan, 'status', p_status));

  return admin_user_detail(p_target);
end;
$$;

-- =============================================
-- Notas:
-- - Las RPCs corren como SECURITY DEFINER (owner = postgres). Por eso pueden
--   actualizar auth.users (banned_until) sin necesidad de service role en el cliente.
-- - El admin esta hardcoded a 'lautarogarofano@gmail.com'. Para sumar mas admins
--   en el futuro, abstraer en una tabla admin_emails o env config.
-- - admin_list_users limita a 200 filas. Si crece, paginar con offset/cursor.
-- =============================================

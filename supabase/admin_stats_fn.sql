-- Función que devuelve estadísticas de admin
-- SECURITY DEFINER: se ejecuta con permisos de superusuario, bypassea RLS
-- Solo accesible para lautarogarofano@gmail.com

CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email text;
  v_total_users bigint;
  v_new_this_month bigint;
  v_trial_active bigint;
  v_trial_exhausted bigint;
  v_base_active bigint;
  v_turbo_active bigint;
  v_inactive bigint;
  v_total_msgs bigint;
  v_total_diags bigint;
  v_diags_this_month bigint;
BEGIN
  -- Verificar que el caller es admin
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email != 'lautarogarofano@gmail.com' THEN
    RAISE EXCEPTION 'Acceso denegado';
  END IF;

  -- Usuarios totales y nuevos este mes
  SELECT count(*) INTO v_total_users FROM auth.users;
  SELECT count(*) INTO v_new_this_month FROM auth.users
    WHERE date_trunc('month', created_at) = date_trunc('month', now());

  -- Suscripciones
  SELECT count(*) INTO v_trial_active   FROM subscriptions WHERE status = 'trial' AND trial_diagnostics_remaining > 0;
  SELECT count(*) INTO v_trial_exhausted FROM subscriptions WHERE status = 'trial' AND trial_diagnostics_remaining <= 0;
  SELECT count(*) INTO v_base_active    FROM subscriptions WHERE status = 'active' AND plan = 'base';
  SELECT count(*) INTO v_turbo_active   FROM subscriptions WHERE status = 'active' AND plan = 'turbo';
  SELECT count(*) INTO v_inactive       FROM subscriptions WHERE status IN ('cancelled', 'inactive', 'past_due');
  SELECT coalesce(sum(messages_used), 0) INTO v_total_msgs FROM subscriptions;

  -- Diagnósticos
  SELECT count(*) INTO v_total_diags FROM diagnostics;
  SELECT count(*) INTO v_diags_this_month FROM diagnostics
    WHERE date_trunc('month', created_at) = date_trunc('month', now());

  RETURN jsonb_build_object(
    'totalUsers',        v_total_users,
    'newUsersThisMonth', v_new_this_month,
    'subscriptions', jsonb_build_object(
      'trialActive',    v_trial_active,
      'trialExhausted', v_trial_exhausted,
      'baseActive',     v_base_active,
      'turboActive',    v_turbo_active,
      'inactive',       v_inactive
    ),
    'revenue', jsonb_build_object(
      'estimatedMonthly', (v_base_active * 11.45 + v_turbo_active * 19.20),
      'baseCount',  v_base_active,
      'turboCount', v_turbo_active
    ),
    'diagnostics', jsonb_build_object(
      'total',     v_total_diags,
      'thisMonth', v_diags_this_month
    ),
    'api', jsonb_build_object(
      'totalMessagesUsed', v_total_msgs,
      'estimatedCostUSD',  (v_total_msgs * 0.003)
    )
  );
END;
$$;

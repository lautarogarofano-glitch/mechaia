-- =============================================
-- MECHAIA - Tabla de rate limiting persistido
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para queries rápidas por IP + tiempo
CREATE INDEX IF NOT EXISTS rate_limits_ip_created_at_idx ON rate_limits(ip, created_at DESC);

-- Deshabilitar RLS (solo se escribe desde service role key en el backend)
ALTER TABLE rate_limits DISABLE ROW LEVEL SECURITY;

-- Limpiar registros viejos automáticamente (retener solo últimas 2 horas)
-- Ejecutar este job periódicamente o usar pg_cron si está disponible:
-- DELETE FROM rate_limits WHERE created_at < NOW() - INTERVAL '2 hours';

-- Función para limpiar registros viejos (llamar desde un cron job o trigger)
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM rate_limits WHERE created_at < NOW() - INTERVAL '2 hours';
END;
$$;

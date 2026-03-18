-- =============================================
-- MECHAIA - Seguridad completa en Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =============================================

-- 1. Habilitar Row Level Security en la tabla diagnostics
ALTER TABLE diagnostics ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes (si las hay)
DROP POLICY IF EXISTS "Users can view own diagnostics" ON diagnostics;
DROP POLICY IF EXISTS "Users can insert own diagnostics" ON diagnostics;
DROP POLICY IF EXISTS "Users can update own diagnostics" ON diagnostics;
DROP POLICY IF EXISTS "Users can delete own diagnostics" ON diagnostics;

-- 3. Política: cada usuario solo ve SUS diagnósticos
CREATE POLICY "Users can view own diagnostics"
  ON diagnostics FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Política: cada usuario solo puede insertar con SU user_id
CREATE POLICY "Users can insert own diagnostics"
  ON diagnostics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Política: cada usuario solo puede actualizar SUS diagnósticos
CREATE POLICY "Users can update own diagnostics"
  ON diagnostics FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Política: cada usuario solo puede eliminar SUS diagnósticos
CREATE POLICY "Users can delete own diagnostics"
  ON diagnostics FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Agregar columna status si no existe
ALTER TABLE diagnostics ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 8. Verificar que user_id tiene índice para performance
CREATE INDEX IF NOT EXISTS diagnostics_user_id_idx ON diagnostics(user_id);
CREATE INDEX IF NOT EXISTS diagnostics_created_at_idx ON diagnostics(created_at DESC);

-- =============================================
-- VERIFICACIÓN: ejecutar para confirmar que RLS está activo
-- =============================================
-- SELECT schemaname, tablename, rowsecurity
-- FROM pg_tables
-- WHERE tablename = 'diagnostics';

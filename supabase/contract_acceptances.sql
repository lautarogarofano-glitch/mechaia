-- =============================================
-- MECHAIA - Registro de aceptaciones contractuales (audit trail legal)
-- Ejecutar en: Supabase Dashboard > SQL Editor
--
-- Acredita la aceptación electrónica del contrato (Carta Oferta de Servicios) y sus
-- documentos integrantes, conforme Cap. IV (4.4 Registro de evidencias) y 16.5
-- (Valor probatorio) de las Condiciones Generales. Guarda: fecha/hora, IP, user-agent,
-- email, VERSIÓN exacta del contrato aceptado y consentimientos especiales.
-- =============================================

CREATE TABLE IF NOT EXISTS contract_acceptances (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 TEXT NOT NULL,
  contract_version      TEXT NOT NULL,
  -- Snapshot de los documentos aceptados: [{ "doc": "condiciones-generales", "version": "1.0" }, ...]
  documents             JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Consentimientos reforzados (Cap. 4.3)
  accepted_conditions   BOOLEAN NOT NULL DEFAULT false,
  accepted_ai_consent   BOOLEAN NOT NULL DEFAULT false,
  accepted_intl_transfer BOOLEAN NOT NULL DEFAULT false,
  -- Evidencia técnica (Cap. 4.4)
  ip                    TEXT,
  user_agent            TEXT,
  accepted_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Un usuario puede aceptar distintas versiones a lo largo del tiempo, pero una sola vez
-- por versión. Garantiza idempotencia del registro y conserva el historial de versiones.
CREATE UNIQUE INDEX IF NOT EXISTS contract_acceptances_user_version_uidx
  ON contract_acceptances(user_id, contract_version);

CREATE INDEX IF NOT EXISTS contract_acceptances_user_idx
  ON contract_acceptances(user_id, accepted_at DESC);

-- RLS: el usuario puede LEER sus propias aceptaciones (para saber si ya aceptó la versión
-- vigente). La ESCRITURA se hace exclusivamente desde el backend con service role key
-- (que omite RLS), nunca desde el cliente, para garantizar la integridad del audit trail.
ALTER TABLE contract_acceptances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users read own acceptances" ON contract_acceptances;
CREATE POLICY "users read own acceptances"
  ON contract_acceptances
  FOR SELECT
  USING (auth.uid() = user_id);

-- No se definen policies de INSERT/UPDATE/DELETE: el cliente no puede escribir.
-- Solo el service role (api/record-acceptance.ts) inserta, omitiendo RLS.

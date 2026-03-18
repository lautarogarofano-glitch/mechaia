-- =============================================
-- MECHAIA - Tabla de suscripciones
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  lemon_customer_id TEXT,
  lemon_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'turbo',        -- 'base' | 'turbo'
  status TEXT NOT NULL DEFAULT 'trial',      -- 'trial' | 'active' | 'inactive' | 'cancelled' | 'past_due'
  messages_used INT DEFAULT 0,
  messages_limit INT DEFAULT NULL,           -- NULL = ilimitado (trial y turbo), 150 para base
  trial_diagnostics_remaining INT DEFAULT 5, -- solo aplica en status='trial'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Índices
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_lemon_customer_idx ON subscriptions(lemon_customer_id);

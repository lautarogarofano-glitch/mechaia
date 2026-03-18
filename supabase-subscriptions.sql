-- =============================================
-- MECHAIA - Tabla de suscripciones
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL DEFAULT 'base',         -- 'base' | 'turbo'
  status TEXT NOT NULL DEFAULT 'inactive',   -- 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trialing'
  messages_used INT DEFAULT 0,
  messages_limit INT DEFAULT 150,            -- 150 para base, NULL para turbo (ilimitado)
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Service can manage subscriptions" ON subscriptions;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Índices
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_customer_idx ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS subscriptions_stripe_sub_idx ON subscriptions(stripe_subscription_id);

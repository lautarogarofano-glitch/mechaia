export type SubscriptionStatus =
  | 'trial'
  | 'active'
  | 'inactive'
  | 'cancelled'
  | 'past_due';

export type Plan = 'base' | 'turbo';

export interface AdminUserRow {
  id: string;
  email: string;
  workshop_name: string | null;
  plan: Plan | null;
  status: SubscriptionStatus | null;
  banned_until: string | null;
  messages_used: number;
  messages_limit: number | null;
  trial_diagnostics_remaining: number;
  diagnostics_count: number;
  last_diagnostic_at: string | null;
  created_at: string;
}

export interface AdminUserDetail {
  user: {
    id: string;
    email: string;
    workshop_name: string | null;
    banned_until: string | null;
    created_at: string;
  };
  subscription: {
    id: string;
    user_id: string;
    plan: Plan;
    status: SubscriptionStatus;
    messages_used: number;
    messages_limit: number | null;
    trial_diagnostics_remaining: number;
    current_period_start: string | null;
    current_period_end: string | null;
    lemon_customer_id: string | null;
    lemon_subscription_id: string | null;
    created_at: string;
    updated_at: string;
  } | null;
  recent_diagnostics: Array<{
    id: string;
    patente: string | null;
    marca: string | null;
    modelo: string | null;
    falla: string | null;
    status: string;
    created_at: string;
  }>;
  recent_actions: Array<{
    id: string;
    actor_email: string;
    action: 'block' | 'unblock' | 'grant_messages' | 'extend_trial' | 'change_plan';
    payload: Record<string, unknown> | null;
    created_at: string;
  }>;
}

export type AdminActionBody =
  | { action: 'block' }
  | { action: 'unblock' }
  | { action: 'grant_messages'; qty: number }
  | { action: 'change_plan'; plan: Plan; status: SubscriptionStatus };

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No autorizado' });

  const token = authHeader.split(' ')[1];
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  // Verificar usuario
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Token inválido' });

  // Verificar que es admin
  const adminEmail = process.env.ADMIN_EMAIL || 'lautarogarofano@gmail.com';
  if (user.email !== adminEmail) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  const isThisMonth = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  };

  try {
    // Usuarios registrados
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const totalUsers = users.length;
    const newUsersThisMonth = users.filter(u => isThisMonth(u.created_at)).length;

    // Suscripciones
    const { data: subs } = await supabaseAdmin
      .from('subscriptions')
      .select('status, plan, messages_used, trial_diagnostics_remaining');

    const allSubs = subs || [];
    const trialActive = allSubs.filter(s => s.status === 'trial' && s.trial_diagnostics_remaining > 0).length;
    const trialExhausted = allSubs.filter(s => s.status === 'trial' && s.trial_diagnostics_remaining <= 0).length;
    const baseActive = allSubs.filter(s => s.status === 'active' && s.plan === 'base').length;
    const turboActive = allSubs.filter(s => s.status === 'active' && s.plan === 'turbo').length;
    const inactive = allSubs.filter(s => ['cancelled', 'inactive', 'past_due'].includes(s.status)).length;
    const totalMessagesUsed = allSubs.reduce((acc, s) => acc + (s.messages_used || 0), 0);

    const estimatedMonthly = baseActive * 11.45 + turboActive * 19.20;
    const estimatedApiCost = totalMessagesUsed * 0.003;

    // Diagnósticos
    const { data: diags, count: totalDiagnostics } = await supabaseAdmin
      .from('diagnostics')
      .select('created_at', { count: 'exact' });

    const diagsThisMonth = (diags || []).filter(d => isThisMonth(d.created_at)).length;

    res.status(200).json({
      totalUsers,
      newUsersThisMonth,
      subscriptions: { trialActive, trialExhausted, baseActive, turboActive, inactive },
      revenue: { estimatedMonthly, baseCount: baseActive, turboCount: turboActive },
      diagnostics: { total: totalDiagnostics || 0, thisMonth: diagsThisMonth },
      api: { totalMessagesUsed, estimatedCostUSD: estimatedApiCost },
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error('Admin stats error:', err?.message);
    res.status(500).json({ error: 'Error obteniendo estadísticas' });
  }
}

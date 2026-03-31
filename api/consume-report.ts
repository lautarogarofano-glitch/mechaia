import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No autorizado' });
  const token = authHeader.split(' ')[1];

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Configuración del servidor incompleta' });
  }

  // Verificar usuario
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Token inválido o expirado' });

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('status, trial_diagnostics_remaining')
    .eq('user_id', user.id)
    .single();

  // Suscripción activa: puede generar sin límite
  if (subscription?.status === 'active') {
    return res.status(200).json({ ok: true });
  }

  // Trial: verificar slots
  if (subscription?.status === 'trial') {
    if ((subscription.trial_diagnostics_remaining ?? 0) <= 0) {
      return res.status(403).json({
        error: 'trial_exhausted',
        message: 'Llegaste a tu límite de uso gratuito. Suscribite para seguir generando reportes.',
      });
    }
    // Descontar slot
    await supabaseAdmin
      .from('subscriptions')
      .update({
        trial_diagnostics_remaining: Math.max(0, (subscription.trial_diagnostics_remaining || 0) - 1),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    return res.status(200).json({ ok: true, remaining: (subscription.trial_diagnostics_remaining || 0) - 1 });
  }

  return res.status(403).json({
    error: 'subscription_required',
    message: 'Necesitás una suscripción activa para generar reportes.',
  });
}

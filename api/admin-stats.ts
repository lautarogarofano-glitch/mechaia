import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No autorizado' });

  const token = authHeader.split(' ')[1];
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY!;

  // Llamar a la función SQL con el token del usuario (verifica admin internamente)
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  try {
    const { data, error } = await supabase.rpc('get_admin_stats');
    if (error) {
      const msg = error.message || '';
      if (msg.includes('Acceso denegado')) return res.status(403).json({ error: 'Acceso denegado' });
      return res.status(500).json({ error: msg || 'Error obteniendo estadísticas' });
    }
    res.status(200).json(data);
  } catch (error: unknown) {
    const err = error as { message?: string };
    res.status(500).json({ error: err?.message || 'Error desconocido' });
  }
}

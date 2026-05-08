import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Metodo no permitido' });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No autorizado' });
    return;
  }
  const token = authHeader.split(' ')[1];

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    res.status(500).json({ error: 'Supabase env no configurado' });
    return;
  }

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const search = typeof req.query.search === 'string' ? req.query.search.slice(0, 100) : null;

  const { data, error } = await supabase.rpc('admin_list_users', { p_search: search });
  if (error) {
    const msg = error.message || 'Error desconocido';
    if (msg.includes('Acceso denegado')) {
      res.status(403).json({ error: 'Acceso denegado' });
      return;
    }
    res.status(500).json({ error: msg });
    return;
  }
  res.status(200).json({ users: data ?? [] });
}

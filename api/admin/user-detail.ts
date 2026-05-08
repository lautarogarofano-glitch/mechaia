import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Metodo no permitido' });
    return;
  }

  const id = typeof req.query.id === 'string' ? req.query.id : '';
  if (!UUID.test(id)) {
    res.status(400).json({ error: 'ID invalido' });
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

  const { data, error } = await supabase.rpc('admin_user_detail', { p_target: id });
  if (error) {
    const msg = error.message || 'Error desconocido';
    if (msg.includes('Acceso denegado')) {
      res.status(403).json({ error: 'Acceso denegado' });
      return;
    }
    if (msg.includes('Usuario no encontrado')) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    res.status(500).json({ error: msg });
    return;
  }
  res.status(200).json(data);
}

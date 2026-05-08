import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function adminClientFromRequest(
  req: VercelRequest,
  res: VercelResponse
): SupabaseClient | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No autorizado' });
    return null;
  }
  const token = authHeader.split(' ')[1];
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    res.status(500).json({ error: 'Supabase env no configurado' });
    return null;
  }
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export function handleRpcError(
  res: VercelResponse,
  message: string | undefined
): void {
  const msg = message || 'Error desconocido';
  if (msg.includes('Acceso denegado')) {
    res.status(403).json({ error: 'Acceso denegado' });
    return;
  }
  if (msg.includes('Usuario no encontrado')) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }
  if (
    msg.includes('Cantidad fuera de rango') ||
    msg.includes('Plan invalido') ||
    msg.includes('Estado invalido') ||
    msg.includes('Usuario sin suscripcion')
  ) {
    res.status(422).json({ error: msg });
    return;
  }
  res.status(500).json({ error: msg });
}

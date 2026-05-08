import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ActionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('block') }),
  z.object({ action: z.literal('unblock') }),
  z.object({ action: z.literal('grant_messages'), qty: z.number().int().min(1).max(500) }),
  z.object({
    action: z.literal('change_plan'),
    plan: z.enum(['base', 'turbo']),
    status: z.enum(['trial', 'active', 'inactive', 'cancelled']),
  }),
]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Metodo no permitido' });
    return;
  }

  const id = typeof req.query.id === 'string' ? req.query.id : '';
  if (!UUID.test(id)) {
    res.status(400).json({ error: 'ID invalido' });
    return;
  }

  const parsed = ActionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Body invalido', details: parsed.error.flatten() });
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

  const body = parsed.data;
  let rpcCall: { name: string; args: Record<string, unknown> };

  switch (body.action) {
    case 'block':
      rpcCall = { name: 'admin_block_user', args: { p_target: id, p_block: true } };
      break;
    case 'unblock':
      rpcCall = { name: 'admin_block_user', args: { p_target: id, p_block: false } };
      break;
    case 'grant_messages':
      rpcCall = { name: 'admin_grant_messages', args: { p_target: id, p_qty: body.qty } };
      break;
    case 'change_plan':
      rpcCall = {
        name: 'admin_change_plan',
        args: { p_target: id, p_plan: body.plan, p_status: body.status },
      };
      break;
  }

  const { data, error } = await supabase.rpc(rpcCall.name, rpcCall.args);
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
    return;
  }
  res.status(200).json(data);
}

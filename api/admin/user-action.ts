import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { adminClientFromRequest, handleRpcError } from '../_admin-auth';

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

  const supabase = adminClientFromRequest(req, res);
  if (!supabase) return;

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
    handleRpcError(res, error.message);
    return;
  }
  res.status(200).json(data);
}

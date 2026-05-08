import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClientFromRequest, handleRpcError } from '../_admin-auth';

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

  const supabase = adminClientFromRequest(req, res);
  if (!supabase) return;

  const { data, error } = await supabase.rpc('admin_user_detail', { p_target: id });
  if (error) {
    handleRpcError(res, error.message);
    return;
  }
  res.status(200).json(data);
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminClientFromRequest, handleRpcError } from '../_admin-auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Metodo no permitido' });
    return;
  }

  const supabase = adminClientFromRequest(req, res);
  if (!supabase) return;

  const search = typeof req.query.search === 'string' ? req.query.search.slice(0, 100) : null;

  const { data, error } = await supabase.rpc('admin_list_users', { p_search: search });
  if (error) {
    handleRpcError(res, error.message);
    return;
  }
  res.status(200).json({ users: data ?? [] });
}

import { supabase } from './supabase';
import type { AdminUserRow, AdminUserDetail, AdminActionBody } from '../types/admin';

async function authHeader(): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${session?.access_token ?? ''}` };
}

async function parseError(res: Response): Promise<string> {
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    return 'API no disponible (¿estas en local sin vercel dev?)';
  }
  try {
    const body = await res.json();
    return body.error || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

async function readJson<T>(res: Response): Promise<T> {
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    throw new Error('API no disponible (¿estas en local sin vercel dev?)');
  }
  return (await res.json()) as T;
}

export async function listUsers(search?: string): Promise<AdminUserRow[]> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : '';
  const res = await fetch(`/api/admin/users${qs}`, { headers: await authHeader() });
  if (!res.ok) throw new Error(await parseError(res));
  const json = await readJson<{ users: AdminUserRow[] }>(res);
  return json.users ?? [];
}

export async function getUserDetail(id: string): Promise<AdminUserDetail> {
  const res = await fetch(`/api/admin/user-detail?id=${encodeURIComponent(id)}`, {
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return await readJson<AdminUserDetail>(res);
}

export async function runAction(
  id: string,
  body: AdminActionBody
): Promise<AdminUserDetail> {
  const res = await fetch(`/api/admin/user-action?id=${encodeURIComponent(id)}`, {
    method: 'POST',
    headers: { ...(await authHeader()), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return await readJson<AdminUserDetail>(res);
}

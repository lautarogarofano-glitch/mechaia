import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Graba la aceptación electrónica del contrato con su evidencia técnica (IP, user-agent,
// versión, consentimientos). Idempotente: una fila por (user_id, contract_version).
// La escritura usa service role para garantizar la integridad del audit trail (el cliente
// no puede escribir directamente la tabla por RLS).

interface AcceptanceBody {
  contractVersion?: unknown;
  acceptedConditions?: unknown;
  acceptedAiConsent?: unknown;
  acceptedIntlTransfer?: unknown;
  documents?: unknown;
}

function clientIp(req: VercelRequest): string | null {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim();
  if (Array.isArray(fwd) && fwd.length > 0) return fwd[0].split(',')[0].trim();
  return req.socket?.remoteAddress ?? null;
}

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

  const body = (req.body ?? {}) as AcceptanceBody;
  const contractVersion = typeof body.contractVersion === 'string' ? body.contractVersion : '';
  if (!contractVersion) return res.status(400).json({ error: 'contractVersion requerido' });

  const documents = Array.isArray(body.documents) ? body.documents : [];
  // Los checkboxes son obligatorios en el signup; el acceso autenticado equivale a aceptación
  // (Cap. 4.2.d). Por defecto registramos los consentimientos como otorgados.
  const acceptedConditions = body.acceptedConditions !== false;
  const acceptedAiConsent = body.acceptedAiConsent !== false;
  const acceptedIntlTransfer = body.acceptedIntlTransfer !== false;

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // Idempotencia: si ya existe una aceptación para esta versión, no duplicar.
  const { data: existing } = await supabaseAdmin
    .from('contract_acceptances')
    .select('id')
    .eq('user_id', user.id)
    .eq('contract_version', contractVersion)
    .maybeSingle();

  if (existing) return res.status(200).json({ ok: true, alreadyRecorded: true });

  const { error: insertError } = await supabaseAdmin
    .from('contract_acceptances')
    .insert({
      user_id: user.id,
      email: user.email ?? '',
      contract_version: contractVersion,
      documents,
      accepted_conditions: acceptedConditions,
      accepted_ai_consent: acceptedAiConsent,
      accepted_intl_transfer: acceptedIntlTransfer,
      ip: clientIp(req),
      user_agent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
    });

  // Si dos requests corren en paralelo, el índice único puede rechazar el segundo: lo tratamos
  // como éxito idempotente.
  if (insertError && insertError.code !== '23505') {
    return res.status(500).json({ error: 'No se pudo registrar la aceptación' });
  }

  return res.status(200).json({ ok: true });
}

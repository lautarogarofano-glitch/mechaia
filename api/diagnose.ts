import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ─── RAG (inline) ────────────────────────────────────────────────────────────
interface RagChunk { content: string; metadata: Record<string, string>; similarity: number; }

async function searchKnowledgeBase(query: string, supabaseUrl: string, supabaseKey: string, matchCount = 4, minSimilarity = 0.35): Promise<RagChunk[]> {
  const googleApiKey = process.env.GOOGLE_AI_API_KEY;
  if (!googleApiKey) return [];
  try {
    const embRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${googleApiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'models/gemini-embedding-001', content: { parts: [{ text: query }] }, outputDimensionality: 768 }),
    });
    if (!embRes.ok) return [];
    const embData = await embRes.json() as { embedding?: { values?: number[] } };
    const embedding = embData.embedding?.values;
    if (!embedding) return [];
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.rpc('search_knowledge_base', { query_embedding: embedding, match_count: matchCount, min_similarity: minSimilarity });
    if (error || !data) return [];
    return data as RagChunk[];
  } catch { return []; }
}

function formatRagContext(chunks: RagChunk[]): string {
  if (chunks.length === 0) return '';
  return `\nINFORMACIÓN TÉCNICA DE LA BASE DE CONOCIMIENTO:\n${chunks.map((c, i) => `[Doc ${i + 1} — ${c.metadata?.filename || 'técnico'}, similitud: ${(c.similarity * 100).toFixed(0)}%]\n${c.content}`).join('\n\n')}\n`;
}
// ─────────────────────────────────────────────────────────────────────────────

// Rate limiting: 20 requests por IP por minuto, persistido en Supabase
const RATE_LIMIT = 20;
const RATE_WINDOW_SECONDS = 60;

async function isRateLimited(ip: string, supabaseUrl: string, supabaseServiceKey: string): Promise<boolean> {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const windowStart = new Date(Date.now() - RATE_WINDOW_SECONDS * 1000).toISOString();
    const { count } = await supabase
      .from('rate_limits')
      .select('*', { count: 'exact', head: true })
      .eq('ip', ip)
      .gte('created_at', windowStart);
    if ((count ?? 0) >= RATE_LIMIT) return true;
    await supabase.from('rate_limits').insert({ ip });
    return false;
  } catch {
    // Si falla el rate limit check, dejamos pasar (fail open) para no bloquear usuarios legítimos
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Outer catch — cualquier excepción no manejada devuelve JSON (nunca texto plano)
  return innerHandler(req, res).catch((err: unknown) => {
    const e = err as { message?: string; name?: string };
    console.error('[diagnose] UNHANDLED:', e?.name, e?.message);
    if (!res.headersSent) {
      res.status(500).json({ reply: 'Error interno del servidor. Por favor intentá de nuevo.' });
    }
  });
}

async function innerHandler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validación de autenticación
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  const token = authHeader.split(' ')[1];
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Configuración del servidor incompleta' });
  }

  // Rate limiting (persistido en Supabase para sobrevivir entre invocaciones serverless)
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
  if (await isRateLimited(ip, supabaseUrl, supabaseServiceKey)) {
    return res.status(429).json({ error: 'Demasiadas solicitudes. Esperá un minuto.' });
  }

  // Verificar autenticación
  let user: { id: string } | null = null;
  try {
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user: u }, error: authError } = await supabaseAnon.auth.getUser(token);
    if (authError || !u) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
    user = u;
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error('[diagnose] Error verificando auth:', err?.message);
    return res.status(500).json({ error: 'Error de autenticación. Intentá de nuevo.' });
  }

  // Verificar suscripción y límite de mensajes
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  let subscription: { status: string; plan: string; messages_used: number; messages_limit: number | null; trial_diagnostics_remaining: number | null } | null = null;
  try {
    const { data } = await supabaseAdmin
      .from('subscriptions')
      .select('status, plan, messages_used, messages_limit, trial_diagnostics_remaining')
      .eq('user_id', user.id)
      .single();
    subscription = data;
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error('[diagnose] Error verificando suscripción:', err?.message);
    return res.status(500).json({ error: 'Error verificando suscripción. Intentá de nuevo.' });
  }

  const isActive = subscription?.status === 'active';
  const isTrial = subscription?.status === 'trial';

  if (!subscription || (!isActive && !isTrial)) {
    return res.status(403).json({
      error: 'subscription_required',
      message: 'Necesitás una suscripción activa para usar MechaIA.',
    });
  }

  // Límite de mensajes plan base
  if (isActive && subscription.messages_limit !== null && subscription.messages_used >= subscription.messages_limit) {
    return res.status(403).json({
      error: 'limit_reached',
      message: `Alcanzaste el límite de ${subscription.messages_limit} mensajes del plan Base. Actualizá a Turbo para mensajes ilimitados.`,
    });
  }

  // Incrementar contador de mensajes (solo para analytics)
  try {
    await supabaseAdmin
      .from('subscriptions')
      .update({
        messages_used: (subscription.messages_used || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);
  } catch (e: unknown) {
    const err = e as { message?: string };
    console.error('[diagnose] Error actualizando subscription:', err?.message);
    // No bloquear el diagnóstico por un error de analytics
  }

  try {
    const { messages, vehicle } = req.body;

    if (!messages || !vehicle) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }
    if (!Array.isArray(messages) || messages.length > 50) {
      return res.status(400).json({ error: 'Formato de mensajes inválido' });
    }
    for (const msg of messages) {
      if (typeof msg?.content === 'string' && msg.content.length > 4000) {
        return res.status(400).json({ error: 'Mensaje demasiado largo' });
      }
    }

    // Búsqueda semántica en la base de conocimiento técnico
    const ragChunks = await searchKnowledgeBase(
      `${vehicle.marca} ${vehicle.modelo} ${vehicle.falla} ${vehicle.codigoObd || ''}`,
      supabaseUrl,
      supabaseServiceKey,
    );
    const ragContext = formatRagContext(ragChunks);

    const systemPrompt = `Eres MechaIA, un asistente experto en diagnóstico automotriz con más de 20 años de experiencia en talleres mecánicos de toda Latinoamérica.

Tu misión es ayudar a mecánicos profesionales a diagnosticar fallas de forma precisa, paso a paso, usando razonamiento técnico profundo.

REGLAS FUNDAMENTALES:
1. NUNCA des un diagnóstico definitivo sin hacer al menos 2 preguntas de síntomas específicos primero
2. Siempre preguntá por: condiciones de aparición (frío/caliente/aceleración/ralentí), frecuencia, códigos OBD2 si no fueron provistos
3. Dá probabilidades concretas: "80% probabilidad sensor MAF, 15% fuga de vacío, 5% ECU"
4. Indicá herramientas específicas para verificar: scanner OBD2, multímetro, manómetro de combustible, osciloscopio
5. Si no tenés suficiente información, decí exactamente qué necesitás saber
6. Usá terminología técnica correcta universal (no jerga regional exclusiva)
7. Mencioná si la falla puede ser peligrosa para el conductor
8. Siempre indicá valores esperados vs medidos cuando sugerís una prueba

ESTRUCTURA DE RESPUESTA:
- Análisis inicial breve
- Preguntas de diagnóstico (si necesitás más datos)
- Hipótesis con probabilidades
- Pasos de verificación concretos
- Advertencias de seguridad si aplica

DATOS DEL VEHÍCULO:
- Marca: ${vehicle.marca}
- Modelo: ${vehicle.modelo}
- Año: ${vehicle.año}
- Motor: ${vehicle.motor}
- ECU: ${vehicle.ecu || 'No especificada'}
- Código OBD: ${vehicle.codigoObd || 'No proporcionado'}
- Kilometraje: ${vehicle.kilometraje || 'No especificado'}
- Falla reportada: ${vehicle.falla}

Recordá: sos un asistente técnico de alto nivel. Tu objetivo es guiar al mecánico hacia el diagnóstico correcto con el menor costo y tiempo posible.${ragContext}`;

    // Anthropic requires conversation to start with a user message
    const allMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
    const firstUserIndex = allMessages.findIndex((m: { role: string }) => m.role === 'user');
    const trimmedMessages = firstUserIndex >= 0 ? allMessages.slice(firstUserIndex) : allMessages;
    // Remove trailing assistant messages — Anthropic requires conversation to end with user
    let lastIdx = trimmedMessages.length - 1;
    while (lastIdx >= 0 && trimmedMessages[lastIdx].role === 'assistant') lastIdx--;
    const filteredMessages = trimmedMessages.slice(0, lastIdx + 1);

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'Configuración del servidor incompleta (API key)' });
    }

    // Iniciar streaming SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1500,
          stream: true,
          system: systemPrompt,
          messages: filteredMessages,
        }),
      });

      if (!anthropicRes.ok || !anthropicRes.body) {
        const errText = await anthropicRes.text().catch(() => 'unknown error');
        console.error('[diagnose] Anthropic API error:', anthropicRes.status, errText);
        res.write(`data: ${JSON.stringify({ error: 'Error procesando el diagnóstico. Intentá de nuevo.' })}\n\n`);
      } else {
        const reader = anthropicRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (raw === '[DONE]') break;
            try {
              const parsed = JSON.parse(raw);
              if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
                res.write(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`);
              }
            } catch { /* chunk incompleto */ }
          }
        }
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('[diagnose] Error en stream:', err?.message);
      res.write(`data: ${JSON.stringify({ error: 'Error procesando el diagnóstico. Intentá de nuevo.' })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number; name?: string };
    console.error('[diagnose] Error general:', err?.name, 'status:', err?.status, 'msg:', err?.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error procesando el diagnóstico' });
    }
  }
}

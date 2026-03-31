import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { searchKnowledgeBase, formatRagContext } from './_rag';

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
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  // Verificar suscripción y límite de mensajes (service role key garantizado arriba)
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('status, plan, messages_used, messages_limit, trial_diagnostics_remaining')
    .eq('user_id', user.id)
    .single();

  const isActive = subscription?.status === 'active';
  const isTrial = subscription?.status === 'trial';

  if (!subscription || (!isActive && !isTrial)) {
    return res.status(403).json({
      error: 'subscription_required',
      message: 'Necesitás una suscripción activa para usar MechaIA.',
    });
  }

  // Trial sin diagnósticos restantes
  if (isTrial && subscription.trial_diagnostics_remaining <= 0) {
    return res.status(403).json({
      error: 'trial_exhausted',
      message: 'Usaste tus 5 diagnósticos gratuitos. ¡Suscribite para continuar!',
    });
  }

  // Límite de mensajes plan base
  if (isActive && subscription.messages_limit !== null && subscription.messages_used >= subscription.messages_limit) {
    return res.status(403).json({
      error: 'limit_reached',
      message: `Alcanzaste el límite de ${subscription.messages_limit} mensajes del plan Base. Actualizá a Turbo para mensajes ilimitados.`,
    });
  }

  // Incrementar contador de mensajes y decrementar trial si aplica
  const updatePayload: Record<string, unknown> = {
    messages_used: (subscription.messages_used || 0) + 1,
    updated_at: new Date().toISOString(),
  };
  if (isTrial) {
    updatePayload.trial_diagnostics_remaining = Math.max(0, (subscription.trial_diagnostics_remaining || 0) - 1);
  }
  const { error: updateError } = await supabaseAdmin
    .from('subscriptions')
    .update(updatePayload)
    .eq('user_id', user.id);
  if (updateError) {
    console.error('[diagnose] Error actualizando subscription:', updateError.message);
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

    // Iniciar streaming SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    try {
      const stream = anthropic.messages.stream({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        system: systemPrompt,
        messages: filteredMessages,
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
        }
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('[diagnose] Error en Anthropic stream:', err?.message);
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

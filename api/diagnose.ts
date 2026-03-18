import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Rate limiting: 30 requests por IP por minuto
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW = 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  if (entry.count >= RATE_LIMIT) return true;
  entry.count++;
  return false;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Demasiadas solicitudes. Esperá un minuto.' });
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

  if (!supabaseUrl || !supabaseAnonKey) {
    return res.status(500).json({ error: 'Configuración del servidor incompleta' });
  }

  // Verificar autenticación
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }

  // Verificar suscripción y límite de mensajes
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
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

  // Incrementar contador de mensajes
  await supabaseAdmin
    .from('subscriptions')
    .update({ messages_used: (subscription.messages_used || 0) + 1, updated_at: new Date().toISOString() })
    .eq('user_id', user.id);

  try {
    const { messages, vehicle } = req.body;

    if (!messages || !vehicle) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

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

Recordá: sos un asistente técnico de alto nivel. Tu objetivo es guiar al mecánico hacia el diagnóstico correcto con el menor costo y tiempo posible.`;

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

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: filteredMessages,
    });

    const reply = response.content[0].type === 'text' ? response.content[0].text : '';

    res.status(200).json({ reply });
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number };
    console.error('Error:', err?.message, err?.status);
    res.status(500).json({
      error: 'Error procesando el diagnóstico',
      reply: 'Disculpá, estoy teniendo problemas técnicos. Probá de nuevo en unos segundos.',
    });
  }
}

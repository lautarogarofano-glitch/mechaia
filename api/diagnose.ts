import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, vehicle } = req.body;

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
    const firstUserIndex = allMessages.findIndex(m => m.role === 'user');
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
  } catch (error: any) {
    console.error('Error completo:', JSON.stringify(error, null, 2));
    console.error('Error message:', error?.message);
    console.error('Error status:', error?.status);
    res.status(500).json({
      error: 'Error procesando el diagnóstico',
      reply: 'Disculpá, estoy teniendo problemas técnicos. Probá de nuevo en unos segundos.',
    });
  }
}

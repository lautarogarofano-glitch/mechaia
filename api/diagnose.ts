import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, vehicle } = req.body;

    const systemPrompt = `Eres MechaIA, un asistente de diagnóstico automotriz experto con 20 años de experiencia.
Tu trabajo es ayudar a mecánicos a diagnosticar fallas PASO A PASO.

REGLAS IMPORTANTES:
1. NUNCA des un diagnóstico definitivo sin preguntar primero síntomas específicos
2. Siempre pedí: códigos OBD2, condiciones (frío/caliente), cuándo aparece la falla
3. Dá probabilidades, no certezas (ej: "70% probabilidad de bujías, 20% bobina")
4. Sugerí herramientas específicas para verificar (scanner, multímetro, manómetro)
5. Si no tenés información suficiente, decí "Necesito más datos para ayudarte"
6. Usá lenguaje de taller argentino (nafta, ralentí, "le falta fuerza", etc.)
7. Sé profesional pero accesible

DATOS DEL VEHÍCULO:
- Marca: ${vehicle.marca}
- Modelo: ${vehicle.modelo}
- Año: ${vehicle.año}
- Motor: ${vehicle.motor}
- ECU: ${vehicle.ecu}
- Código OBD: ${vehicle.codigoObd || 'No proporcionado'}
- Falla reportada: ${vehicle.falla}

Recordá: SOS UN AYUDANTE TÉCNICO, no reemplazás al mecánico. Guiá, no decidas por él.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Modelo económico y rápido
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const reply = response.choices[0].message.content;

    res.status(200).json({ reply });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: 'Error procesando el diagnóstico',
      reply: 'Disculpá, estoy teniendo problemas técnicos. Probá de nuevo en unos segundos.' 
    });
  }
}

#!/usr/bin/env tsx
/**
 * seed-obd-extended.ts
 * Batch 2: P0xxx extendidos + P1xxx por marca (VW, Renault, Peugeot, Ford, Toyota, Fiat, GM)
 * + Inmovilizador/llave + ABS/ESP (C0xxx) + Red CAN (U0xxx)
 * Uso: npx tsx scripts/seed-obd-extended.ts [--reset]
 */

import fs from 'fs';
import path from 'path';

const envFile = path.resolve('.env.local');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
  }
}

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const googleApiKey = process.env.GOOGLE_AI_API_KEY_INGEST || process.env.GOOGLE_AI_API_KEY || '';

if (!supabaseUrl || !supabaseKey || !googleApiKey) {
  console.error('❌ Faltan variables de entorno.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(googleApiKey);
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
async function getEmbedding(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent({ content: { parts: [{ text }] }, outputDimensionality: 768 } as any);
  return result.embedding.values;
}

// ─── CÓDIGOS ──────────────────────────────────────────────────────────────────

const ALL_CODES = [

  // ══════════════════════════════════════════════════════════════════════════
  // P0xxx EXTENDIDOS — Genéricos que faltaron en batch 1
  // ══════════════════════════════════════════════════════════════════════════

  {
    code: 'P0140',
    content: `CÓDIGO P0140 — Sensor O2 banco 1 sonda 2 (postcatalizador): sin actividad
Sistema: Sensor lambda downstream banco 1
Descripción: El sensor O2 postcatalizador no muestra actividad. No alterna ni responde.
Causas probables: Calentador del sensor O2 defectuoso, cable cortado, sensor dañado.
Diagnóstico: 1) Verificar resistencia del calentador (3-15Ω). 2) Verificar +12V al calentador. 3) Reemplazar sensor.
Solución típica: Reemplazo del sensor O2 downstream.`,
  },
  {
    code: 'P0141',
    content: `CÓDIGO P0141 — Calentador sensor O2 banco 1 sonda 2: mal funcionamiento
Sistema: Calentador del sensor lambda postcatalizador banco 1
Descripción: El calentador del sensor O2 downstream no funciona correctamente.
Causas probables: Fusible quemado, calentador del sensor quemado, cableado cortado.
Diagnóstico: 1) Verificar fusible. 2) Medir resistencia del calentador. 3) Verificar voltaje de alimentación.
Solución típica: Reemplazo del sensor O2.`,
  },
  {
    code: 'P0150',
    content: `CÓDIGO P0150 — Sensor O2 banco 2 sonda 1 (upstream): mal funcionamiento
Sistema: Sensor lambda precatalizador banco 2
Descripción: Problema en el sensor O2 upstream del banco 2. Igual que P0130 pero para banco 2.
Diagnóstico: Mismos pasos que P0130. Verificar oscilación 0.1V-0.9V a motor caliente.
Solución típica: Reemplazo del sensor O2 banco 2 upstream.`,
  },
  {
    code: 'P0155',
    content: `CÓDIGO P0155 — Calentador sensor O2 banco 2 sonda 1: mal funcionamiento
Sistema: Calentador lambda upstream banco 2
Diagnóstico: Verificar fusible, resistencia del calentador y voltaje de alimentación.
Solución típica: Reemplazo del sensor O2 banco 2.`,
  },
  {
    code: 'P0160',
    content: `CÓDIGO P0160 — Sensor O2 banco 2 sonda 2 (postcatalizador): sin actividad
Sistema: Sensor lambda downstream banco 2
Diagnóstico: Igual que P0140 pero para banco 2.
Solución típica: Reemplazo del sensor O2 downstream banco 2.`,
  },
  {
    code: 'P0161',
    content: `CÓDIGO P0161 — Calentador sensor O2 banco 2 sonda 2: mal funcionamiento
Sistema: Calentador lambda downstream banco 2
Diagnóstico: Igual que P0141 pero para banco 2.
Solución típica: Reemplazo del sensor O2.`,
  },
  {
    code: 'P0180',
    content: `CÓDIGO P0180 — Sensor de temperatura de combustible: mal funcionamiento
Sistema: Sensor de temperatura del combustible (FTS)
Descripción: El PCM detectó un problema en el sensor de temperatura del combustible. Presente en algunos diesel y GDI.
Causas probables: Sensor defectuoso, cableado dañado, conector corroído.
Diagnóstico: 1) Medir resistencia del sensor. 2) Verificar cableado. 3) Reemplazar sensor.
Solución típica: Reemplazo del sensor de temperatura de combustible.`,
  },
  {
    code: 'P0191',
    content: `CÓDIGO P0191 — Sensor de presión de riel de combustible: rango/rendimiento
Sistema: Sensor de presión del common rail (diesel/GDI)
Descripción: La señal del sensor de presión del common rail está fuera del rango esperado.
Síntomas: Arranque difícil, humo negro, pérdida de potencia, motor irregular.
Causas probables: Sensor defectuoso, bomba de alta presión débil, regulador de presión dañado, inyectores con fuga.
Diagnóstico: 1) Verificar presión real del common rail con scanner. 2) Comparar con especificación del fabricante. 3) Verificar bomba de alta presión.
Solución típica: Revisión del sistema de alta presión (bomba, regulador, inyectores).`,
  },
  {
    code: 'P0192',
    content: `CÓDIGO P0192 — Sensor de presión de riel: señal baja
Sistema: Sensor presión common rail
Descripción: La señal del sensor de presión está por debajo del mínimo. Presión muy baja o cortocircuito.
Diagnóstico: 1) Verificar presión real del riel. 2) Verificar cableado. 3) Reemplazar sensor si la presión es normal.
Solución típica: Bomba de alta presión o sensor de presión del riel.`,
  },
  {
    code: 'P0193',
    content: `CÓDIGO P0193 — Sensor de presión de riel: señal alta
Sistema: Sensor presión common rail
Descripción: Señal del sensor de presión sobre el máximo. Cortocircuito o sensor defectuoso.
Diagnóstico: 1) Verificar cableado del sensor. 2) Medir presión real. 3) Reemplazar sensor.
Solución típica: Reemplazo del sensor de presión del riel.`,
  },
  {
    code: 'P0217',
    content: `CÓDIGO P0217 — Condición de sobretemperatura del motor
Sistema: Temperatura del motor / sistema de refrigeración
Descripción: El motor alcanzó temperatura excesiva. El PCM detectó sobrecalentamiento.
Síntomas: Temperatura del agua muy alta, posible pérdida de potencia por protección del PCM.
Causas probables: Nivel de refrigerante bajo, termostato cerrado, bomba de agua defectuosa, radiador tapado, ventiladores no funcionan.
Diagnóstico: 1) Verificar nivel de refrigerante. 2) Verificar funcionamiento de ventiladores. 3) Verificar termostato. 4) Verificar bomba de agua.
Solución típica: Reparación del sistema de refrigeración según la causa encontrada.`,
  },
  {
    code: 'P0218',
    content: `CÓDIGO P0218 — Sobretemperatura del líquido de transmisión
Sistema: Transmisión automática — temperatura del ATF
Descripción: El líquido ATF alcanzó temperatura excesiva.
Causas probables: Nivel de ATF bajo, enfriador de transmisión obstruido, uso severo del vehículo.
Diagnóstico: 1) Verificar nivel y condición del ATF. 2) Verificar enfriador de transmisión.
Solución típica: Cambio de ATF y verificación del sistema de enfriamiento de la transmisión.`,
  },
  {
    code: 'P0261',
    content: `CÓDIGO P0261 — Circuito injector cilindro 1: voltaje bajo
Sistema: Injector combustible cilindro 1
Descripción: El voltaje de control del injector 1 es demasiado bajo.
Causas probables: Cortocircuito a masa en el cableado, injector con bobina cortocircuitada, PCM defectuoso.
Diagnóstico: 1) Medir resistencia del injector. 2) Verificar cableado. 3) Verificar señal de control del PCM.
Solución típica: Reemplazo del injector o reparación de cableado.`,
  },
  {
    code: 'P0262',
    content: `CÓDIGO P0262 — Circuito injector cilindro 1: voltaje alto
Sistema: Injector combustible cilindro 1
Diagnóstico: Cortocircuito a positivo en cableado o injector defectuoso.
Solución típica: Reparación de cableado o reemplazo del injector.`,
  },
  {
    code: 'P0351',
    content: `CÓDIGO P0351 — Bobina de encendido cilindro 1: circuito primario/secundario
Sistema: Bobina de encendido cilindro 1
Descripción: El PCM detectó un problema en el circuito de la bobina de encendido del cilindro 1.
Síntomas: Fallo de encendido cilindro 1 (puede acompañar P0301), vibración del motor.
Causas probables: Bobina defectuosa, cable de alta tensión dañado, conector flojo, cortocircuito en el cableado.
Diagnóstico: 1) Intercambiar bobina cilindro 1 con otro cilindro. 2) Medir resistencia primaria (0.5-2Ω) y secundaria (6-15kΩ). 3) Verificar +12V y señal de disparo.
Solución típica: Reemplazo de la bobina de encendido.`,
  },
  {
    code: 'P0352',
    content: `CÓDIGO P0352 — Bobina encendido cilindro 2: circuito
Sistema: Bobina de encendido cilindro 2
Diagnóstico: Igual a P0351 para cilindro 2. Intercambiar bobinas para aislar la falla.
Solución típica: Reemplazo de bobina cilindro 2.`,
  },
  {
    code: 'P0353',
    content: `CÓDIGO P0353 — Bobina encendido cilindro 3: circuito
Sistema: Bobina encendido cilindro 3
Diagnóstico: Igual a P0351 para cilindro 3.`,
  },
  {
    code: 'P0354',
    content: `CÓDIGO P0354 — Bobina encendido cilindro 4: circuito
Sistema: Bobina encendido cilindro 4
Diagnóstico: Igual a P0351 para cilindro 4.`,
  },
  {
    code: 'P0410',
    content: `CÓDIGO P0410 — Sistema de inyección de aire secundario: mal funcionamiento
Sistema: Bomba de aire secundario (SAI)
Descripción: El sistema de inyección de aire secundario (reduce emisiones en arranque en frío) no funciona correctamente.
Síntomas: Check engine encendida, puede fallar inspección de emisiones.
Causas probables: Bomba de aire defectuosa, válvula de aire secundario atascada, cañerías obstruidas con carbonilla, relé defectuoso.
Diagnóstico: 1) Verificar que la bomba de aire arranque en frío. 2) Verificar relé y fusible. 3) Verificar válvulas de check del sistema.
Solución típica: Reemplazo de la bomba de aire secundario.`,
  },
  {
    code: 'P0412',
    content: `CÓDIGO P0412 — Válvula de conmutación de inyección de aire secundario A: circuito
Sistema: Válvula del sistema de aire secundario
Diagnóstico: Verificar solenoide de la válvula, cableado y relé.
Solución típica: Reemplazo de la válvula de conmutación de aire secundario.`,
  },
  {
    code: 'P0420',
    content: ``,  // ya está en batch 1, se saltea
  },
  {
    code: 'P0480',
    content: `CÓDIGO P0480 — Relé del ventilador de refrigeración 1: circuito
Sistema: Relé del ventilador del radiador
Descripción: El PCM no puede controlar correctamente el relé del ventilador de refrigeración.
Síntomas: Ventilador no enciende (sobrecalentamiento) o ventilador siempre encendido.
Causas probables: Relé defectuoso, fusible quemado, cableado del relé dañado, PCM defectuoso.
Diagnóstico: 1) Verificar fusible del ventilador. 2) Probar relé directamente. 3) Verificar señal de control del PCM al relé.
Solución típica: Reemplazo del relé del ventilador.`,
  },
  {
    code: 'P0481',
    content: `CÓDIGO P0481 — Relé del ventilador de refrigeración 2: circuito
Sistema: Relé ventilador 2 (alta velocidad)
Diagnóstico: Igual a P0480 para el segundo relé de ventilador (velocidad alta).
Solución típica: Reemplazo del relé ventilador 2.`,
  },
  {
    code: 'P0532',
    content: `CÓDIGO P0532 — Sensor de presión de A/C: señal baja
Sistema: Sensor de presión del sistema de aire acondicionado
Descripción: La señal del sensor de presión de A/C es demasiado baja.
Causas probables: Sistema de A/C sin gas (baja presión real), sensor defectuoso, cableado dañado.
Diagnóstico: 1) Verificar presión del sistema de A/C con manómetros. 2) Si presión correcta, reemplazar sensor.
Solución típica: Recarga de gas refrigerante o reemplazo del sensor de presión.`,
  },
  {
    code: 'P0533',
    content: `CÓDIGO P0533 — Sensor de presión de A/C: señal alta
Sistema: Sensor presión A/C
Descripción: Presión del A/C excesivamente alta o cortocircuito en sensor.
Causas probables: Sistema con exceso de gas, condensador obstruido, sensor defectuoso.
Diagnóstico: Verificar presión del sistema. Si normal, reemplazar sensor.
Solución típica: Purga del exceso de refrigerante o reemplazo del sensor.`,
  },
  {
    code: 'P0540',
    content: `CÓDIGO P0540 — Calentador de admisión A: circuito
Sistema: Calentador de admisión (diesel — precalentamiento de entrada de aire)
Descripción: Problema en el circuito del calentador de aire de admisión.
Causas probables: Calentador defectuoso, fusible quemado, relé dañado.
Diagnóstico: Verificar fusible y relé del calentador. Medir resistencia del calentador.
Solución típica: Reemplazo del calentador de admisión.`,
  },
  {
    code: 'P0571',
    content: `CÓDIGO P0571 — Switch de freno/embrague A: circuito
Sistema: Interruptor del pedal de freno o embrague
Descripción: El PCM detectó un problema en el circuito del interruptor del pedal de freno.
Síntomas: Luces de freno que no funcionan correctamente, control de crucero que no desactiva, problemas de cambio en automáticos.
Causas probables: Interruptor del freno defectuoso, conector suelto, ajuste incorrecto del interruptor.
Diagnóstico: 1) Verificar que las luces de freno funcionen. 2) Ajustar o reemplazar el interruptor del pedal.
Solución típica: Ajuste o reemplazo del interruptor del pedal de freno.`,
  },
  {
    code: 'P0597',
    content: `CÓDIGO P0597 — Termostato de control: circuito abierto
Sistema: Termostato eléctrico/electrónico controlado por PCM
Descripción: El PCM controla activamente el termostato para optimizar temperatura. Detectó circuito abierto.
Síntomas: Motor que no alcanza temperatura correcta, mayor consumo.
Causas probables: Termostato eléctrico defectuoso, cableado dañado, conector suelto.
Diagnóstico: 1) Verificar cableado del termostato electrónico. 2) Medir resistencia del actuador del termostato. 3) Reemplazar termostato.
Solución típica: Reemplazo del termostato electrónico.`,
  },
  {
    code: 'P0598',
    content: `CÓDIGO P0598 — Termostato de control: circuito bajo
Sistema: Termostato electrónico
Diagnóstico: Cortocircuito a masa en el cableado del termostato o termostato defectuoso.
Solución típica: Reemplazo del termostato o reparación de cableado.`,
  },
  {
    code: 'P0599',
    content: `CÓDIGO P0599 — Termostato de control: circuito alto
Sistema: Termostato electrónico
Diagnóstico: Circuito abierto o cortocircuito a positivo en cableado del termostato.
Solución típica: Reemplazo del termostato electrónico.`,
  },
  {
    code: 'P0638',
    content: `CÓDIGO P0638 — Actuador del acelerador (throttle): rango/rendimiento banco 1
Sistema: Control electrónico del acelerador (E-throttle / Drive by Wire)
Descripción: El motor de la mariposa electrónica no responde según lo comandado.
Síntomas: Modo de emergencia (limp mode), marcha en vacío a 1500 RPM, aceleración nula o limitada.
Causas probables: Motor de la mariposa desgastado, cuerpo de mariposa sucio, sensor TPS defectuoso, cortocircuito en cableado.
Diagnóstico: 1) Limpiar cuerpo de mariposa. 2) Verificar señal del motor de la mariposa. 3) Verificar sensores TPS 1 y TPS 2.
Solución típica: Limpieza del cuerpo de mariposa o reemplazo del conjunto.`,
  },
  {
    code: 'P0641',
    content: `CÓDIGO P0641 — Circuito de referencia de 5V sensor A: abierto
Sistema: Tensión de referencia de 5V del PCM para sensores
Descripción: El voltaje de referencia de 5V que el PCM suministra a los sensores está en circuito abierto.
Síntomas: Múltiples sensores con falla simultánea (TPS, MAP, APP, etc.).
Causas probables: Cortocircuito a masa en uno de los sensores que comparten la referencia de 5V, PCM defectuoso.
Diagnóstico: 1) Desconectar sensores uno a uno hasta que el voltaje vuelva a 5V. 2) El sensor que al desconectarlo restaura el voltaje es el que tiene el cortocircuito.
Solución típica: Identificar el sensor que causa el cortocircuito y reemplazarlo.`,
  },
  {
    code: 'P0645',
    content: `CÓDIGO P0645 — Relé del compresor de A/C: circuito
Sistema: Relé del compresor de aire acondicionado
Descripción: El PCM no puede controlar el relé del compresor de A/C.
Causas probables: Relé defectuoso, fusible quemado, cableado del relé dañado.
Diagnóstico: 1) Verificar fusible del compresor. 2) Probar el relé. 3) Verificar señal de control del PCM.
Solución típica: Reemplazo del relé del compresor de A/C.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // P2xxx — OBD2 EXTENDIDO (modernos)
  // ══════════════════════════════════════════════════════════════════════════

  {
    code: 'P2004',
    content: `CÓDIGO P2004 — Runner del múltiple de admisión atascado abierto banco 1
Sistema: Sistema de control del runner de admisión (IMRC/IMTV)
Descripción: El runner variable del múltiple de admisión está atascado en posición abierta.
Síntomas: Pérdida de torque a bajas RPM, marcha en vacío irregular.
Causas probables: Actuador del runner defectuoso, palanca mecánica rota, carbonilla trabando el mecanismo.
Diagnóstico: 1) Verificar operación del actuador con scanner. 2) Inspeccionar mecanismo visualmente.
Solución típica: Limpieza o reemplazo del actuador del runner de admisión.`,
  },
  {
    code: 'P2006',
    content: `CÓDIGO P2006 — Runner del múltiple de admisión atascado cerrado banco 1
Sistema: IMRC/IMTV banco 1
Descripción: El runner está atascado cerrado. Pérdida de potencia a altas RPM.
Síntomas: Falta de potencia en aceleración fuerte, motor "cortado" a altas RPM.
Diagnóstico: Verificar actuador del runner, limpiar carbonilla del mecanismo.
Solución típica: Limpieza o reemplazo del actuador IMRC.`,
  },
  {
    code: 'P2096',
    content: `CÓDIGO P2096 — Sistema de control de mezcla postcatalizador: demasiado pobre banco 1
Sistema: Fuel trim postcatalizador banco 1
Descripción: El sistema de corrección de mezcla basado en el sensor O2 postcatalizador indica mezcla pobre.
Causas probables: Sensor O2 downstream defectuoso, fuga de escape después del catalizador, catalizador dañado.
Diagnóstico: 1) Verificar sensor O2 downstream. 2) Verificar fugas de escape. 3) Evaluar catalizador.
Solución típica: Reemplazo del sensor O2 downstream o reparación de fuga de escape.`,
  },
  {
    code: 'P2097',
    content: `CÓDIGO P2097 — Sistema postcatalizador: demasiado rico banco 1
Sistema: Fuel trim postcatalizador banco 1
Diagnóstico: Sensor O2 downstream contaminado o defectuoso, fuga de combustible al escape.
Solución típica: Reemplazo del sensor O2 downstream.`,
  },
  {
    code: 'P2101',
    content: `CÓDIGO P2101 — Motor de la mariposa electrónica: rango/rendimiento
Sistema: Actuador de la mariposa electrónica (E-throttle)
Descripción: El motor que controla la mariposa no alcanza la posición comandada.
Síntomas: Limp mode, pérdida de potencia, aceleración cortada a 1500-2000 RPM.
Causas probables: Motor de la mariposa desgastado, resorte de retorno roto, cuerpo de mariposa muy sucio, conector oxidado.
Diagnóstico: 1) Limpiar cuerpo de mariposa. 2) Verificar que la mariposa mueva libremente. 3) Medir resistencia del motor (2-10Ω). 4) Verificar señal de posición.
Solución típica: Limpieza del cuerpo de mariposa o reemplazo del conjunto actuador.`,
  },
  {
    code: 'P2106',
    content: `CÓDIGO P2106 — Sistema de control del acelerador: modo de falla forzado
Sistema: E-throttle
Descripción: El PCM puso el sistema de acelerador en modo de emergencia debido a múltiples fallas detectadas.
Síntomas: Vehículo solo alcanza 1500-2000 RPM, aceleración prácticamente nula.
Diagnóstico: Leer todos los códigos del sistema E-throttle. Resolver P2101, P0638, P0122, P0123 primero.
Solución típica: Resolver los códigos raíz del sistema E-throttle.`,
  },
  {
    code: 'P2122',
    content: `CÓDIGO P2122 — Sensor de posición del pedal del acelerador D: señal baja
Sistema: Sensor APP (Accelerator Pedal Position) — sensor D/1
Descripción: La señal del sensor de posición del pedal del acelerador está por debajo del mínimo.
Síntomas: Motor que no responde al acelerador o responde erráticamente, limp mode.
Causas probables: Sensor del pedal defectuoso, cableado dañado, conector oxidado.
Diagnóstico: 1) Verificar voltaje del sensor APP en reposo (0.5-1V) y a fondo (4-4.5V). 2) Verificar cableado. 3) Reemplazar sensor del pedal.
Solución típica: Reemplazo del sensor de posición del pedal del acelerador.`,
  },
  {
    code: 'P2123',
    content: `CÓDIGO P2123 — Sensor APP D: señal alta
Sistema: Sensor pedal acelerador
Síntomas: Motor acelerando sin tocar el pedal o lectura incorrecta.
Diagnóstico: Verificar cableado del sensor. Reemplazar sensor del pedal.
Solución típica: Reemplazo del sensor APP.`,
  },
  {
    code: 'P2127',
    content: `CÓDIGO P2127 — Sensor APP E: señal baja
Sistema: Sensor pedal acelerador E/2 (redundante)
Descripción: Los sensores APP tienen señales redundantes. Si difieren, activa el modo de falla.
Diagnóstico: Comparar señal del sensor D vs E. Si divergen, reemplazar el sensor del pedal.
Solución típica: Reemplazo del conjunto del sensor de pedal del acelerador.`,
  },
  {
    code: 'P2128',
    content: `CÓDIGO P2128 — Sensor APP E: señal alta
Sistema: Sensor pedal acelerador E/2
Diagnóstico: Igual que P2127.
Solución típica: Reemplazo del sensor del pedal del acelerador.`,
  },
  {
    code: 'P2138',
    content: `CÓDIGO P2138 — Correlación sensores APP D/E: no coinciden
Sistema: Sensores de posición del pedal del acelerador
Descripción: Los dos sensores del pedal del acelerador no entregan señales coherentes entre sí.
Síntomas: Limp mode, vehículo no acelera correctamente.
Causas probables: Uno de los sensores del pedal defectuoso, conector suelto.
Diagnóstico: 1) Comparar señales de los dos sensores. 2) El que da valor incorrecto es el defectuoso. 3) Reemplazar el conjunto del pedal (normalmente es un módulo completo).
Solución típica: Reemplazo del sensor/conjunto del pedal del acelerador.`,
  },
  {
    code: 'P2187',
    content: `CÓDIGO P2187 — Sistema demasiado pobre en ralentí banco 1
Sistema: Control de mezcla en ralentí
Descripción: La mezcla en ralentí es pobre (exceso de aire). Diferente al P0171 que aplica a toda la gama de carga.
Causas probables: Fuga de vacío que solo afecta en ralentí, injector tapado, IAC defectuoso.
Diagnóstico: 1) Buscar fugas de vacío. 2) Verificar válvula IAC o cuerpo de mariposa electrónico.
Solución típica: Reparación de fuga de vacío o limpieza del sistema de ralentí.`,
  },
  {
    code: 'P2188',
    content: `CÓDIGO P2188 — Sistema demasiado rico en ralentí banco 1
Sistema: Control de mezcla en ralentí
Descripción: Mezcla rica solo en ralentí. Injector con goteo o sensor defectuoso.
Causas probables: Injector con fuga en reposo, sensor IAT/ECT leyendo frío permanentemente.
Diagnóstico: 1) Verificar injectores (prueba de goteo). 2) Verificar sensor ECT.
Solución típica: Limpieza o reemplazo de inyectores.`,
  },
  {
    code: 'P2195',
    content: `CÓDIGO P2195 — Sensor O2 banco 1 sonda 1: señal fija lean (pobre)
Sistema: Sensor lambda wideband / A/F sensor banco 1
Descripción: El sensor de O2 de banda ancha indica mezcla pobre de forma permanente.
Causas probables: Sensor A/F defectuoso, fuga de aire severa, problema de presión de combustible.
Diagnóstico: 1) Verificar fuel trim. 2) Buscar fugas de aire. 3) Verificar presión de combustible. 4) Reemplazar sensor A/F.
Solución típica: Reparar fuga de aire o reemplazar sensor A/F.`,
  },
  {
    code: 'P2196',
    content: `CÓDIGO P2196 — Sensor O2 banco 1 sonda 1: señal fija rich (rica)
Sistema: Sensor A/F banco 1
Descripción: Mezcla rica permanente detectada por el sensor de banda ancha.
Causas probables: Injector con fuga, presión de combustible alta, sensor A/F defectuoso.
Diagnóstico: Similar a P0172. Verificar presión de combustible e injectores.
Solución típica: Revisar injectores o reemplazar sensor A/F.`,
  },
  {
    code: 'P2270',
    content: `CÓDIGO P2270 — Sensor O2 banco 1 sonda 2: señal fija lean
Sistema: Sensor O2 postcatalizador banco 1
Diagnóstico: Verificar fuga de escape postcatalizador. Reemplazar sensor O2 si la fuga no existe.
Solución típica: Reemplazo del sensor O2 downstream.`,
  },
  {
    code: 'P2271',
    content: `CÓDIGO P2271 — Sensor O2 banco 1 sonda 2: señal fija rich
Sistema: Sensor O2 postcatalizador banco 1
Diagnóstico: Sensor O2 downstream contaminado o defectuoso.
Solución típica: Reemplazo del sensor O2 downstream.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // P1xxx — VOLKSWAGEN / AUDI / SEAT / SKODA (VAG)
  // ══════════════════════════════════════════════════════════════════════════

  {
    code: 'P1176_VAG',
    content: `CÓDIGO P1176 (VAG — VW/Audi/Seat/Skoda) — Sensor O2 banco 1 sonda 2: fuera de rango
Sistema: Sensor lambda postcatalizador — grupo VAG
Descripción: El sensor O2 postcatalizador del banco 1 está fuera del rango de adaptación en motores VAG.
Causas probables: Sensor O2 envejecido, catalizador ineficiente, fuga de escape.
Diagnóstico: Verificar sensor O2 downstream y catalizador. Comparar con VCDS/OBD scanner.
Solución típica: Reemplazo del sensor O2 downstream o catalizador.`,
  },
  {
    code: 'P1296_VAG',
    content: `CÓDIGO P1296 (VAG) — Sensor de temperatura de refrigerante: correlación con sensor de temperatura de admisión
Sistema: Sensor ECT — grupo VAG
Descripción: Hay diferencia excesiva entre el sensor de temperatura de refrigerante y el de admisión al arrancar en frío. Indica que uno de los dos sensores tiene error.
Causas probables: Sensor ECT defectuoso, sensor IAT defectuoso.
Diagnóstico: Comparar lecturas de ECT e IAT con motor frío. Deben ser similares. El que difiere está defectuoso.
Solución típica: Reemplazo del sensor ECT o IAT.`,
  },
  {
    code: 'P1336_VAG',
    content: `CÓDIGO P1336 (VAG) — Adaptación del sensor CKP/CMP: límite de rango excedido
Sistema: Correlación cigüeñal-árbol de levas — grupo VAG
Descripción: La adaptación del sensor de posición del cigüeñal superó los límites. Indica desfase de distribución.
Síntomas: Falta de potencia, consumo elevado, traqueteo en cadena de distribución.
Causas probables: Cadena de distribución elongada, tensionador defectuoso, sensor CKP/CMP deteriorado.
Diagnóstico: 1) Verificar correlación CKP-CMP con VCDS. 2) Inspeccionar cadena de distribución.
Solución típica: Cambio de cadena de distribución y tensionador.`,
  },
  {
    code: 'P1411_VAG',
    content: `CÓDIGO P1411 (VAG) — Sistema de aire secundario banco 2: caudal incorrecto
Sistema: Bomba de aire secundario — VAG
Diagnóstico: Verificar bomba de aire secundario, válvulas de check y relé. Limpiar conductos.
Solución típica: Reemplazo de la bomba de aire secundario o válvulas.`,
  },
  {
    code: 'P1545_VAG',
    content: `CÓDIGO P1545 (VAG) — Control de posición de mariposa: mal funcionamiento
Sistema: Cuerpo de mariposa electrónico — VAG
Descripción: El sistema E-throttle no puede controlar la posición de la mariposa correctamente en vehículos VAG.
Síntomas: Modo de emergencia, ralentí a 1200-1500 RPM fijo, sin respuesta al acelerador.
Causas probables: Mariposa electrónica sucia o dañada, sensor de posición defectuoso, conector oxidado.
Diagnóstico: 1) Limpiar el cuerpo de mariposa. 2) Hacer adaptación básica con VCDS. 3) Si persiste, reemplazar cuerpo de mariposa.
Solución típica: Limpieza del cuerpo de mariposa + adaptación básica con VCDS.`,
  },
  {
    code: 'P1580_VAG',
    content: `CÓDIGO P1580 (VAG) — Motor del actuador de mariposa: fuera de rango
Sistema: Motor del actuador E-throttle — VAG
Descripción: El motor del cuerpo de mariposa electrónica está fuera del rango esperado.
Causas probables: Motor de la mariposa desgastado, carbonilla acumulada en el cuerpo.
Diagnóstico: 1) Limpiar el cuerpo de mariposa con limpiador. 2) Realizar adaptación básica. 3) Si persiste, reemplazar el cuerpo de mariposa completo.
Solución típica: Reemplazo del cuerpo de mariposa electrónica.`,
  },
  {
    code: 'P1602_VAG',
    content: `CÓDIGO P1602 (VAG) — Módulo de control: tensión de alimentación baja
Sistema: Alimentación del PCM/ECM — VAG
Descripción: El módulo de control detectó caída de tensión en su alimentación.
Síntomas: Múltiples fallos simultáneos, comportamiento errático, fallo de arranque.
Causas probables: Batería descargada o deficiente, bornes de batería corroídos, masa del motor deficiente.
Diagnóstico: 1) Verificar tensión de batería y bornes. 2) Verificar masa del motor y carrocería. 3) Verificar alternador.
Solución típica: Revisión completa del sistema eléctrico. Batería o alternador.`,
  },
  {
    code: 'P1693_VAG',
    content: `CÓDIGO P1693 (VAG) — Electroválvula wastegate del turbocompresor: mal funcionamiento
Sistema: Control de la wastegate del turbo — VAG (motores 1.4 TSI, 1.8T, 2.0T)
Descripción: La electroválvula de control del actuador de la wastegate del turbo no funciona correctamente.
Síntomas: Pérdida de boost, limp mode, falta de potencia en carga.
Causas probables: Electroválvula N75 defectuosa, manguera de vacío rota, actuador de wastegate dañado.
Diagnóstico: 1) Verificar la válvula N75 (electroválvula). 2) Verificar mangueras de vacío al actuador. 3) Probar el actuador de la wastegate directamente.
Solución típica: Reemplazo de la válvula N75 o actuador de wastegate.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // P1xxx — RENAULT / DACIA
  // ══════════════════════════════════════════════════════════════════════════

  {
    code: 'P1180_RENAULT',
    content: `CÓDIGO P1180 (Renault/Dacia) — Presión de combustible: demasiado baja al arranque
Sistema: Sistema de combustible — Renault (motores K4M, F4R, D4F)
Descripción: La presión de combustible es insuficiente en el arranque o tras parada larga.
Síntomas: Arranque difícil especialmente en caliente, falta de presión de retención.
Causas probables: Bomba de combustible débil, válvula de retención de la bomba defectuosa, filtro tapado, inyectores con fuga.
Diagnóstico: 1) Medir presión de retención (debe mantenerse 10+ min sin caer a 0). 2) Verificar bomba de combustible. 3) Verificar filtro.
Solución típica: Reemplazo de la bomba de combustible o filtro.`,
  },
  {
    code: 'P1190_RENAULT',
    content: `CÓDIGO P1190 (Renault) — Sensor de presión de combustible: circuito
Sistema: Sensor de presión del riel — Renault inyección directa
Diagnóstico: Verificar señal del sensor, cableado y presión real del riel.
Solución típica: Reemplazo del sensor de presión del riel.`,
  },
  {
    code: 'P1335_RENAULT',
    content: `CÓDIGO P1335 (Renault) — Sensor de posición del cigüeñal: mal funcionamiento
Sistema: Sensor CKP — Renault
Descripción: Problema con el sensor CKP en motores Renault. Puede causar no arranque o fallas intermitentes.
Causas probables: Sensor CKP defectuoso (falla frecuente en motores Renault), reluctor dañado, cable roto por vibración.
Diagnóstico: 1) Verificar señal del CKP con osciloscopio. 2) Verificar espacio sensor-reluctor. 3) Reemplazar sensor.
Solución típica: Reemplazo del sensor CKP (falla muy común en Renault Clio, Logan, Sandero con motor K4M).`,
  },
  {
    code: 'P1351_RENAULT',
    content: `CÓDIGO P1351 (Renault) — Bobina de encendido: circuito primario
Sistema: Bobinas de encendido individuales — Renault
Descripción: Problema en el circuito primario de las bobinas de encendido.
Causas probables: Bobina de encendido defectuosa, conector dañado por calor.
Diagnóstico: Intercambiar bobinas para aislar cuál falla. Verificar resistencia primaria.
Solución típica: Reemplazo de la bobina defectuosa.`,
  },
  {
    code: 'P1400_RENAULT',
    content: `CÓDIGO P1400 (Renault) — Solenoide EGR: circuito
Sistema: EGR — Renault
Descripción: El solenoide de la válvula EGR tiene un problema de circuito.
Diagnóstico: Verificar solenoide EGR, cableado y alimentación. Limpiar la válvula EGR.
Solución típica: Limpieza o reemplazo de la válvula EGR.`,
  },
  {
    code: 'P1492_RENAULT',
    content: `CÓDIGO P1492 (Renault) — Sensor de temperatura ambiente: señal alta
Sistema: Sensor de temperatura ambiente — Renault
Descripción: El sensor de temperatura ambiente (exterior) muestra un valor anormalmente alto.
Causas probables: Sensor defectuoso, sensor expuesto a fuente de calor.
Diagnóstico: Verificar lectura real de temperatura ambiente. Reemplazar sensor si es incorrecto.
Solución típica: Reemplazo del sensor de temperatura ambiente.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // P1xxx — PEUGEOT / CITROËN
  // ══════════════════════════════════════════════════════════════════════════

  {
    code: 'P1100_PSA',
    content: `CÓDIGO P1100 (Peugeot/Citroën) — Sensor barométrico: fuera de rango
Sistema: Sensor de presión barométrica — PSA (Peugeot, Citroën)
Descripción: El sensor de presión atmosférica está fuera del rango esperado.
Causas probables: Sensor barométrico (generalmente interno al PCM) defectuoso, PCM defectuoso.
Diagnóstico: Comparar lectura del sensor barométrico con altitud real. Si diverge, considerar reemplazo del PCM.
Solución típica: Reemplazo del PCM en la mayoría de los casos.`,
  },
  {
    code: 'P1340_PSA',
    content: `CÓDIGO P1340 (Peugeot/Citroën) — Correlación CKP/CMP: señal incorrecta
Sistema: Distribución — PSA
Descripción: Desfase entre el sensor del cigüeñal y el árbol de levas en motores PSA.
Síntomas: Falta de potencia, consumo elevado, posible traqueteo de distribución.
Causas probables: Cadena de distribución elongada (muy frecuente en motores PSA 1.4 y 1.6 HDi), tensionador defectuoso, sensor CMP débil.
Diagnóstico: 1) Verificar desfase CKP-CMP. 2) Inspeccionar cadena de distribución. 3) Medir elongación de la cadena.
Solución típica: Cambio de cadena de distribución y tensionador (problema muy frecuente en PSA 1.4/1.6 HDi).`,
  },
  {
    code: 'P1351_PSA',
    content: `CÓDIGO P1351 (Peugeot/Citroën) — Circuito de encendido: señal alta
Sistema: Sistema de encendido — PSA
Descripción: Problema en el circuito de encendido de motores Peugeot/Citroën.
Causas probables: Módulo de encendido defectuoso, bobinas dañadas, sensor CKP con falla.
Diagnóstico: Verificar señales de las bobinas con osciloscopio. Verificar sensor CKP.
Solución típica: Reemplazo del módulo de encendido o bobinas.`,
  },
  {
    code: 'P1400_PSA',
    content: `CÓDIGO P1400 (Peugeot/Citroën) — EGR: mal funcionamiento
Sistema: EGR — PSA diesel
Descripción: Problema en el sistema EGR de motores diesel PSA (HDi, BlueHDi).
Síntomas: Mayor consumo, humo negro, pérdida de potencia.
Causas probables: Válvula EGR atascada por carbonilla (muy frecuente en HDi), sensor EGR defectuoso, tuberías EGR tapadas.
Diagnóstico: 1) Limpiar válvula EGR con limpiador de carbono. 2) Verificar operación con scanner. 3) Verificar sensor de posición EGR.
Solución típica: Limpieza profunda o reemplazo de la válvula EGR.`,
  },
  {
    code: 'P1516_PSA',
    content: `CÓDIGO P1516 (Peugeot/Citroën) — Módulo de control del acelerador: mal funcionamiento
Sistema: E-throttle — PSA
Descripción: Problema en el sistema de control electrónico del acelerador en vehículos Peugeot/Citroën.
Síntomas: Modo de emergencia (el motor limita RPM), aceleración errática.
Causas probables: Cuerpo de mariposa sucio, sensor TPS dual defectuoso, cableado dañado.
Diagnóstico: 1) Limpiar cuerpo de mariposa. 2) Verificar sensores de posición duales. 3) Verificar cableado.
Solución típica: Limpieza del cuerpo de mariposa o reemplazo del conjunto.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // P1xxx — FORD
  // ══════════════════════════════════════════════════════════════════════════

  {
    code: 'P1000_FORD',
    content: `CÓDIGO P1000 (Ford) — Test de preparación del sistema OBD: no completado
Sistema: Monitores OBD — Ford
Descripción: Los monitores de auto-diagnóstico del OBD no han completado todos los ciclos de prueba. No es una falla — indica que el vehículo necesita más tiempo de conducción para completar los tests.
Síntomas: Ninguno. Solo aparece después de borrar códigos o desconectar la batería.
Solución: Conducir el vehículo en ciclos variados (ciudad y ruta) para que los monitores completen. Generalmente 2-3 ciclos de manejo.`,
  },
  {
    code: 'P1101_FORD',
    content: `CÓDIGO P1101 (Ford) — Sensor MAF: fuera del rango del autotest
Sistema: Sensor MAF — Ford
Descripción: Durante el autotest de encendido, el MAF dio una lectura fuera de rango.
Causas probables: Sensor MAF sucio o débil, fuga de admisión, filtro de aire obstruido.
Diagnóstico: 1) Limpiar el sensor MAF. 2) Verificar filtro de aire. 3) Buscar fugas de admisión.
Solución típica: Limpieza del MAF o reemplazo.`,
  },
  {
    code: 'P1120_FORD',
    content: `CÓDIGO P1120 (Ford) — Sensor TPS: fuera del rango bajo
Sistema: TPS — Ford
Descripción: El sensor de posición de la mariposa está en el límite inferior del rango esperado.
Diagnóstico: Verificar el voltaje del TPS en reposo. Ajustar o reemplazar.
Solución típica: Ajuste de la posición del TPS o reemplazo.`,
  },
  {
    code: 'P1260_FORD',
    content: `CÓDIGO P1260 (Ford) — Sistema antirrobo detectado — motor deshabilitado
Sistema: Sistema antirrobo PATS (Passive Anti-Theft System) — Ford
Descripción: El sistema PATS detectó una llave no autorizada o un problema de comunicación. El motor fue deshabilitado.
Síntomas: Motor arranca 1-2 segundos y se apaga, luz de seguridad parpadeando.
Causas probables: Llave no programada, transpondedor de la llave dañado, módulo PATS defectuoso, PCM no sincronizado con PATS.
Diagnóstico: 1) Verificar que la llave tenga transpondedor activo. 2) Intentar con llave de repuesto. 3) Reprogramar llave con escáner compatible. 4) Verificar módulo PATS.
Solución típica: Reprogramación de la llave o módulo PATS.`,
  },
  {
    code: 'P1400_FORD',
    content: `CÓDIGO P1400 (Ford) — Sensor DPFE: señal baja (circuito EGR)
Sistema: Sensor DPFE (Differential Pressure Feedback EGR) — Ford
Descripción: El sensor DPFE que mide el flujo EGR tiene señal baja en motores Ford (muy frecuente en Ka, Focus, Ecosport con motor Zetec).
Síntomas: Check engine encendida, posible detonación.
Causas probables: Sensor DPFE defectuoso (falla muy frecuente), mangueras del sensor tapadas o rotas, válvula EGR con problemas.
Diagnóstico: 1) Verificar mangueras del DPFE. 2) Limpiar o reemplazar sensor DPFE. 3) Verificar válvula EGR.
Solución típica: Reemplazo del sensor DPFE (causa más frecuente en Ford Zetec).`,
  },
  {
    code: 'P1401_FORD',
    content: `CÓDIGO P1401 (Ford) — Sensor DPFE: señal alta
Sistema: DPFE — Ford
Descripción: Señal alta del sensor DPFE. Manguera desconectada o sensor defectuoso.
Diagnóstico: Verificar mangueras del DPFE. Reemplazar sensor.
Solución típica: Reconectar manguera o reemplazar sensor DPFE.`,
  },
  {
    code: 'P1500_FORD',
    content: `CÓDIGO P1500 (Ford) — Sensor de velocidad del vehículo: intermitente
Sistema: VSS — Ford
Descripción: El sensor de velocidad del vehículo tiene fallas intermitentes.
Síntomas: Velocímetro que salta o falla, cruise control intermitente.
Causas probables: Sensor VSS con conector flojo, piñón impulsor desgastado.
Diagnóstico: Verificar conector del VSS. Reemplazar sensor o piñón.
Solución típica: Reemplazo del sensor VSS.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // P1xxx — TOYOTA / LEXUS
  // ══════════════════════════════════════════════════════════════════════════

  {
    code: 'P1300_TOYOTA',
    content: `CÓDIGO P1300 (Toyota/Lexus) — Igniter banco 1: circuito
Sistema: Módulo igniter (encendido transistorizado) — Toyota
Descripción: El circuito del igniter (módulo de encendido integrado en las bobinas o externo) tiene un problema en el banco 1.
Síntomas: Fallo de encendido en banco 1, motor irregular.
Causas probables: Igniter defectuoso, bobinas dañadas, cableado defectuoso.
Diagnóstico: 1) Verificar señal IGT (trigger del PCM) e IGF (confirmación del igniter). 2) Reemplazar bobina/igniter del cilindro afectado.
Solución típica: Reemplazo del módulo igniter o bobina de encendido.`,
  },
  {
    code: 'P1349_TOYOTA',
    content: `CÓDIGO P1349 (Toyota) — Sistema VVT-i banco 1: mal funcionamiento
Sistema: VVT-i (Variable Valve Timing with intelligence) — Toyota
Descripción: El sistema VVT-i del banco 1 no responde correctamente. Puede estar atascado o responder lento.
Síntomas: Traqueteo al arranque en frío, falta de potencia, consumo elevado, ralentí irregular.
Causas probables: Aceite de motor sucio o con viscosidad incorrecta (causa más común), solenoide VVT-i defectuoso o tapado con barro, actuador VVT-i (OCV — Oil Control Valve) defectuoso.
Diagnóstico: 1) Cambiar aceite con 5W-30 o la viscosidad indicada. 2) Limpiar o reemplazar el solenoide OCV. 3) Verificar presión de aceite.
Solución típica: Cambio de aceite + reemplazo del solenoide OCV (muy frecuente en Toyota Corolla, Hilux, RAV4).`,
  },
  {
    code: 'P1354_TOYOTA',
    content: `CÓDIGO P1354 (Toyota) — Sistema VVT-i banco 2: mal funcionamiento
Sistema: VVT-i banco 2 — Toyota V6/V8
Diagnóstico: Igual que P1349 para banco 2. Cambio de aceite + solenoide OCV banco 2.
Solución típica: Cambio de aceite + OCV banco 2.`,
  },
  {
    code: 'P1400_TOYOTA',
    content: `CÓDIGO P1400 (Toyota) — Sensor EGR: mal funcionamiento
Sistema: Sensor de posición de la válvula EGR — Toyota
Descripción: El sensor de posición de la válvula EGR no funciona correctamente.
Diagnóstico: Verificar sensor de posición EGR. Limpiar la válvula EGR.
Solución típica: Limpieza o reemplazo de la válvula EGR y su sensor.`,
  },
  {
    code: 'P1500_TOYOTA',
    content: `CÓDIGO P1500 (Toyota) — Circuito del motor de arranque: señal
Sistema: Circuito del motor de arranque — Toyota
Descripción: El PCM no recibe la señal del motor de arranque correctamente.
Causas probables: Relé del motor de arranque defectuoso, cableado dañado, interruptor de arranque defectuoso.
Diagnóstico: Verificar señal de arranque al PCM. Verificar relé y cableado.
Solución típica: Reemplazo del relé de arranque.`,
  },
  {
    code: 'P1600_TOYOTA',
    content: `CÓDIGO P1600 (Toyota) — PCM: circuito de alimentación de batería
Sistema: Alimentación del PCM — Toyota
Descripción: El PCM detectó problema en su circuito de alimentación de batería de respaldo.
Causas probables: Batería baja, fusible del PCM quemado, borne de batería corroído.
Diagnóstico: Verificar batería, fusibles del PCM y bornes.
Solución típica: Revisión del sistema eléctrico y bornes de batería.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // P1xxx — CHEVROLET / GM
  // ══════════════════════════════════════════════════════════════════════════

  {
    code: 'P1133_GM',
    content: `CÓDIGO P1133 (Chevrolet/GM) — Sensor O2 banco 1 sonda 1: insuficiente cambio de señal
Sistema: Sensor HO2S upstream banco 1 — GM (Corsa, Agile, Cruze, S10)
Descripción: El sensor O2 no alterna suficientemente (menos de 23 veces en 100 segundos típicamente).
Causas probables: Sensor O2 envejecido o contaminado, fuga de escape, sensor lento.
Diagnóstico: Verificar velocidad de alternancia del O2 en datos en vivo. Si alterna lento, reemplazar.
Solución típica: Reemplazo del sensor O2 upstream.`,
  },
  {
    code: 'P1380_GM',
    content: `CÓDIGO P1380 (GM) — Misfire detectado — datos de camino rugoso no disponibles
Sistema: Detección de misfires — GM
Descripción: El PCM detectó fallos de encendido pero el sistema de datos de camino rugoso no está disponible para confirmar si es misfire real o vibración del camino.
Diagnóstico: Tratar como misfire real. Verificar bujías, bobinas, compresión.
Solución típica: Igual que P0300 — bujías, bobinas, injectores.`,
  },
  {
    code: 'P1516_GM',
    content: `CÓDIGO P1516 (GM) — Módulo TAC (throttle actuator control): señal TPS
Sistema: TAC — Chevrolet (Cruze, Agile, Cobalt, Captiva)
Descripción: El módulo de control del actuador de mariposa detectó problema en la señal del TPS.
Síntomas: Limp mode, aceleración limitada, ralentí fijo alto.
Causas probables: Cuerpo de mariposa sucio, sensor de posición dual defectuoso, conector del cuerpo de mariposa con mala conexión.
Diagnóstico: 1) Limpiar el cuerpo de mariposa. 2) Verificar sensores de posición. 3) Realizar adaptación de la mariposa si el vehículo lo permite.
Solución típica: Limpieza o reemplazo del cuerpo de mariposa.`,
  },
  {
    code: 'P1626_GM',
    content: `CÓDIGO P1626 (GM) — Sistema antirrobo: señal de habilitación de combustible
Sistema: Inmovilizador / VATS / PASSLock — GM
Descripción: El sistema antirrobo no envió la señal de habilitación del combustible al PCM. El motor puede arrancarse brevemente y apagarse.
Síntomas: Motor arranca 2-3 segundos y se apaga. Luz de seguridad activa.
Causas probables: Transpondedor de la llave defectuoso, módulo de carrocería (BCM) con falla de comunicación, PCM no sincronizado.
Diagnóstico: 1) Verificar si la llave tiene chip de seguridad. 2) Intentar procedimiento de reaprendizaje del inmovilizador. 3) Verificar comunicación entre BCM y PCM.
Solución típica: Reprogramación del sistema antirrobo o reemplazo de la llave.`,
  },
  {
    code: 'P1635_GM',
    content: `CÓDIGO P1635 (GM) — Circuito de referencia de 5V: voltaje bajo
Sistema: Referencia de 5V del PCM — GM
Descripción: El voltaje de referencia de 5V del PCM para los sensores está bajo. Causa múltiples fallos simultáneos de sensores.
Diagnóstico: 1) Desconectar sensores uno a uno para encontrar cuál causa el cortocircuito. 2) El sensor que al desconectarlo restaura el 5V es el defectuoso.
Solución típica: Identificar y reemplazar el sensor con cortocircuito en la línea de referencia de 5V.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // P1xxx — FIAT / ALFA ROMEO
  // ══════════════════════════════════════════════════════════════════════════

  {
    code: 'P1120_FIAT',
    content: `CÓDIGO P1120 (Fiat/Alfa Romeo) — Sensor TPS: mal funcionamiento
Sistema: TPS/E-throttle — Fiat (Palio, Punto, Bravo, Linea, 500)
Descripción: El sensor de posición de la mariposa tiene mal funcionamiento en vehículos Fiat.
Síntomas: Aceleración irregular, ralentí inestable, limp mode.
Causas probables: Sensor TPS desgastado, cuerpo de mariposa sucio, conector con oxidación.
Diagnóstico: 1) Verificar voltaje del TPS. 2) Limpiar cuerpo de mariposa. 3) Realizar adaptación de la mariposa.
Solución típica: Limpieza del cuerpo de mariposa o reemplazo del sensor TPS.`,
  },
  {
    code: 'P1335_FIAT',
    content: `CÓDIGO P1335 (Fiat) — Sensor CKP: sin señal
Sistema: Sensor CKP — Fiat
Descripción: El PCM no recibe señal del sensor CKP. Causa no arranque o falla intermitente.
Causas probables: Sensor CKP defectuoso, reluctor dañado, conector suelto (frecuente en Fiat Palio/Siena por vibración).
Diagnóstico: 1) Verificar señal CKP con osciloscopio. 2) Verificar reluctor. 3) Verificar conector.
Solución típica: Reemplazo del sensor CKP o reparación del conector.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // INMOVILIZADOR / LLAVE / ANTIRROBO
  // ══════════════════════════════════════════════════════════════════════════

  {
    code: 'B1000_INMOVILIZADOR',
    content: `INMOVILIZADOR / SISTEMA DE LLAVE Y ANTIRROBO — Diagnóstico general
Los problemas de inmovilizador son causas frecuentes de "motor arranca y se apaga" o "no arranca con ignición OK".

SÍNTOMAS TÍPICOS:
- Motor arranca 1-3 segundos y se apaga
- Motor no arranca pero hay chispa y combustible
- Luz de seguridad (candado o coche con llave) parpadeando o fija

SISTEMAS DE INMOVILIZADOR POR MARCA:
- VW/Audi: IMMO con transponder chip en llave — código P0513 o problemas de comunicación
- Ford: PATS (Passive Anti-Theft System) — código P1260
- GM: VATS / PASSLock / PASSKEY — código P1626
- Renault: IMMO integrado al UCE — requiere scanner Clip o compatible
- Peugeot/Citroën: BSI (Boîtier de Servitude Intelligent) — problemas de comunicación
- Toyota: Immobiliser ECU con ID de llave
- Fiat: CODE system — llave con chip Magneti Marelli

DIAGNÓSTICO:
1) Intentar con la llave de repuesto
2) Verificar si hay comunicación entre el módulo del inmovilizador y el PCM
3) Revisar la antena del inmovilizador (aro alrededor de la cerradura de encendido)
4) Verificar que el chip de la llave no esté dañado
5) Consultar scanner específico de la marca para reprogramación`,
  },
  {
    code: 'P0513_INMOVILIZADOR',
    content: `CÓDIGO P0513 — Llave de arranque incorrecta
Sistema: Sistema de inmovilizador / transponder de llave
Descripción: El PCM recibió la señal del transpondedor de la llave pero no coincide con el código aprendido.
Síntomas: Motor arranca brevemente y se apaga, luz de seguridad encendida.
Causas probables: Llave no programada o con chip dañado, módulo del inmovilizador defectuoso, pérdida de memoria del PCM, llave de repuesto sin transpondedor.
Diagnóstico: 1) Intentar con llave original. 2) Verificar que la llave tenga chip (transponder). 3) Realizar procedimiento de reaprendizaje de la llave. 4) Si persiste, verificar módulo del inmovilizador.
Solución típica: Reprogramación de la llave o sincronización del inmovilizador con el PCM.`,
  },
  {
    code: 'P0633_INMOVILIZADOR',
    content: `CÓDIGO P0633 — Código VIN del inmovilizador no programado / incompatible
Sistema: Inmovilizador — VIN/código
Descripción: El PCM fue reemplazado o el código del inmovilizador no está sincronizado con el VIN del vehículo.
Síntomas: Vehículo no arranca después de cambio de PCM.
Causas probables: PCM nuevo sin programar, PCM de otro vehículo, pérdida de datos del inmovilizador.
Diagnóstico: Requiere reprogramación del PCM con el código del inmovilizador usando scanner dealer o locksmith autorizado.
Solución típica: Reprogramación del PCM con herramienta específica del fabricante.`,
  },
  {
    code: 'LLAVE_NO_ARRANCA',
    content: `DIAGNÓSTICO: MOTOR NO ARRANCA POR SISTEMA DE LLAVE / INMOVILIZADOR

SECUENCIA DE DIAGNÓSTICO:
1) Verificar si hay chispa en las bujías — si hay chispa, el inmovilizador probablemente corta la inyección
2) Verificar si hay pulso de injector — si no hay pulso, el inmovilizador está activo
3) Revisar la luz de seguridad en el tablero (candado o símbolo de auto con llave)
4) Intentar con la segunda llave original

SÍNTOMAS ESPECÍFICOS POR MARCA:
VW Gol/Polo/Fox: No arranca + luz de llave fija = antena del immo suelta
Renault Clio/Logan: Arranca 2 seg + se apaga = UCE bloqueada, requiere Renault Clip
Ford Ka/Focus: Luz de seguridad parpadeando rápido = PATS activo, releer con ForScan
Toyota Corolla/Hilux: No arranca + sin código = verificar resistencia correcta de la llave
Chevrolet Corsa/Agile: Arranca 3 seg + se apaga = reaprendizaje PASSLock necesario

REPROGRAMACIÓN SIN SCANNER (en algunos casos):
Algunos vehículos permiten procedimiento de reaprendizaje con tiempo prolongado en ON. Consultar procedimiento específico del modelo.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // C0xxx — ABS / ESP / ESTABILIDAD
  // ══════════════════════════════════════════════════════════════════════════

  {
    code: 'C0031_ABS',
    content: `CÓDIGO C0031 — Sensor de velocidad de rueda delantera derecha: problema de circuito
Sistema: ABS / ESP — sensor de velocidad rueda delantera derecha
Descripción: El módulo ABS detectó un problema en la señal del sensor de velocidad de la rueda delantera derecha.
Síntomas: Luz ABS encendida, luz ESP encendida, ABS desactivado.
Causas probables: Sensor ABS defectuoso, corona dentada (tono ring) dañada o sucia, cableado cortado o conector oxidado, espacio sensor-tono ring incorrecto.
Diagnóstico: 1) Verificar señal del sensor en VIVO durante conducción. 2) Inspeccionar la corona dentada. 3) Limpiar área del sensor. 4) Medir resistencia del sensor (activo: 1kΩ-3kΩ; pasivo: resistencia variable).
Solución típica: Limpieza de la corona dentada o reemplazo del sensor ABS.`,
  },
  {
    code: 'C0034_ABS',
    content: `CÓDIGO C0034 — Sensor de velocidad rueda delantera izquierda: problema de circuito
Sistema: ABS — sensor rueda delantera izquierda
Diagnóstico: Igual que C0031 para rueda delantera izquierda.
Solución típica: Limpieza de corona dentada o reemplazo del sensor ABS.`,
  },
  {
    code: 'C0037_ABS',
    content: `CÓDIGO C0037 — Sensor de velocidad rueda trasera derecha: problema de circuito
Sistema: ABS — sensor rueda trasera derecha
Descripción: Problema en el sensor ABS de la rueda trasera derecha.
Causas probables: Sensor defectuoso, corona dentada dañada, cableado dañado (más expuesto por posición trasera).
Diagnóstico: Igual que C0031 para rueda trasera derecha. Verificar también cableado del arnés trasero.
Solución típica: Reemplazo del sensor ABS o limpieza de corona dentada.`,
  },
  {
    code: 'C0040_ABS',
    content: `CÓDIGO C0040 — Sensor de velocidad rueda trasera izquierda: problema de circuito
Sistema: ABS — sensor rueda trasera izquierda
Diagnóstico: Igual que C0037 para rueda trasera izquierda.
Solución típica: Reemplazo del sensor ABS trasero izquierdo.`,
  },
  {
    code: 'C0051_ABS',
    content: `CÓDIGO C0051 — Sensor de velocidad rueda delantera derecha: señal fuera de rango
Sistema: ABS rueda delantera derecha
Descripción: La señal del sensor existe pero está fuera del rango esperado o es inconsistente.
Causas probables: Corona dentada con diente roto o doblado, sensor demasiado alejado de la corona, interferencia magnética.
Diagnóstico: 1) Inspeccionar la corona dentada. 2) Verificar espacio sensor-corona (0.2-1.5mm típico). 3) Verificar señal en osciloscopio.
Solución típica: Reemplazo de la corona dentada o ajuste del espacio.`,
  },
  {
    code: 'C0110_ABS',
    content: `CÓDIGO C0110 — Motor de la bomba ABS: circuito
Sistema: Motor de la bomba hidráulica del ABS
Descripción: El módulo ABS detectó un problema en el motor de la bomba hidráulica.
Síntomas: Luz ABS encendida, ABS desactivado, posible ruido de bomba al frenar.
Causas probables: Motor de la bomba ABS defectuoso, fusible de la bomba quemado, relé defectuoso, cableado dañado.
Diagnóstico: 1) Verificar fusible y relé de la bomba ABS. 2) Medir resistencia del motor de la bomba. 3) Verificar voltaje al motor durante frenada ABS simulada.
Solución típica: Reemplazo del conjunto hidráulico ABS o motor de la bomba.`,
  },
  {
    code: 'C0121_ABS',
    content: `CÓDIGO C0121 — Válvula solenoide ABS: circuito
Sistema: Solenoides de la unidad hidráulica ABS
Descripción: Una o más válvulas solenoides del módulo hidráulico ABS tienen un problema de circuito.
Síntomas: Luz ABS, ESP desactivado, pedal de freno con sensación diferente.
Causas probables: Solenoide quemado en el bloque hidráulico, cableado dañado, módulo ABS defectuoso.
Diagnóstico: 1) Verificar voltaje de alimentación al módulo ABS. 2) Medir resistencia de los solenoides. 3) El módulo hidráulico generalmente es la falla.
Solución típica: Reemplazo del módulo hidráulico ABS (puede requerir programación).`,
  },
  {
    code: 'C0245_ABS',
    content: `CÓDIGO C0245 — Sensor de velocidad de rueda: frecuencia fuera de rango
Sistema: ABS — frecuencia de señal del sensor
Descripción: La frecuencia de la señal de uno de los sensores ABS está fuera del rango esperado para la velocidad del vehículo.
Causas probables: Corona dentada contaminada con barro, sensor débil, interferencia eléctrica.
Diagnóstico: 1) Limpiar coronas dentadas de todas las ruedas. 2) Verificar señal en VIVO a diferentes velocidades.
Solución típica: Limpieza de coronas dentadas.`,
  },
  {
    code: 'C0265_ABS',
    content: `CÓDIGO C0265 — Relé del motor de la bomba ABS: circuito abierto
Sistema: Relé bomba ABS
Descripción: El relé que alimenta el motor de la bomba ABS tiene circuito abierto.
Causas probables: Relé defectuoso, fusible quemado, cableado abierto.
Diagnóstico: 1) Verificar fusible del relé ABS. 2) Reemplazar relé. 3) Verificar continuidad del cableado.
Solución típica: Reemplazo del relé de la bomba ABS.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // U0xxx — RED CAN / COMUNICACIÓN ENTRE MÓDULOS
  // ══════════════════════════════════════════════════════════════════════════

  {
    code: 'U0001_CAN',
    content: `CÓDIGO U0001 — Bus CAN de alta velocidad: problema de comunicación
Sistema: Red CAN bus de alta velocidad
Descripción: Hay un problema de comunicación en el bus CAN de alta velocidad que conecta los módulos principales (PCM, TCM, ABS, airbag).
Síntomas: Múltiples luces de advertencia simultáneas, comportamiento errático de varios sistemas, tablero con muchas fallas a la vez.
Causas probables: Cableado CAN dañado (par trenzado azul/naranja o verde/blanco según marca), módulo defectuoso que "satura" el bus, fusible del bus CAN quemado, batería muy descargada.
Diagnóstico: 1) Verificar resistencia CAN bus: medir entre cables CAN H y CAN L — debe ser ~60Ω con todos los módulos conectados (120Ω x 2 terminadores en paralelo). 2) Verificar si todos los módulos tienen 12V y masa. 3) Desconectar módulos uno a uno para encontrar el que satura el bus.
Solución típica: Reparación de cableado CAN o reemplazo del módulo defectuoso.`,
  },
  {
    code: 'U0100_CAN',
    content: `CÓDIGO U0100 — Comunicación perdida con el PCM/ECM
Sistema: Red CAN — comunicación con el módulo de control del motor
Descripción: Un módulo (ABS, airbag, tablero, etc.) perdió comunicación con el PCM/ECM a través del CAN bus.
Síntomas: Múltiples luces de falla, velocímetro sin funcionamiento, ABS/ESP desactivados, tablero sin datos del motor.
Causas probables: PCM apagado o sin alimentación, cable CAN cortado entre el módulo y el PCM, resistencia terminal del CAN dañada, fusible del PCM quemado.
Diagnóstico: 1) Verificar alimentación y masas del PCM. 2) Verificar resistencia CAN (~60Ω). 3) Verificar continuidad de los cables CAN H y CAN L.
Solución típica: Verificar alimentación del PCM y cableado CAN.`,
  },
  {
    code: 'U0101_CAN',
    content: `CÓDIGO U0101 — Comunicación perdida con el TCM (módulo de transmisión)
Sistema: CAN — TCM
Descripción: Se perdió la comunicación con el módulo de control de la transmisión.
Síntomas: Transmisión en modo de emergencia (limp mode), luz de transmisión encendida, cambios incorrectos o nulos.
Causas probables: TCM sin alimentación (fusible), cable CAN cortado, TCM defectuoso.
Diagnóstico: 1) Verificar fusibles del TCM. 2) Verificar alimentación del TCM. 3) Verificar cables CAN al TCM.
Solución típica: Verificar fusibles y alimentación del TCM.`,
  },
  {
    code: 'U0121_CAN',
    content: `CÓDIGO U0121 — Comunicación perdida con el módulo de control ABS
Sistema: CAN — módulo ABS
Descripción: Se perdió la comunicación con el módulo de control ABS/ESP.
Síntomas: Luces ABS y ESP encendidas, sistemas de seguridad desactivados.
Causas probables: Módulo ABS sin alimentación, cables CAN dañados hacia el ABS, módulo ABS defectuoso.
Diagnóstico: 1) Verificar fusibles del ABS. 2) Verificar alimentación y masa del módulo ABS. 3) Verificar cables CAN.
Solución típica: Verificar fusibles/alimentación del módulo ABS.`,
  },
  {
    code: 'U0122_CAN',
    content: `CÓDIGO U0122 — Comunicación perdida con el módulo de control de estabilidad del vehículo (VCM)
Sistema: CAN — módulo de control de estabilidad/ESP
Descripción: Pérdida de comunicación con el módulo ESP/ESC.
Síntomas: ESP desactivado, luz ESP encendida, posible desactivación del ABS.
Diagnóstico: Verificar alimentación del módulo ESP y cables CAN.
Solución típica: Reparación de cableado CAN o reemplazo del módulo.`,
  },
  {
    code: 'U0140_CAN',
    content: `CÓDIGO U0140 — Comunicación perdida con el BCM (módulo de carrocería)
Sistema: CAN — BCM (Body Control Module)
Descripción: Se perdió la comunicación con el módulo de carrocería que controla luces, cierres, vidrios, etc.
Síntomas: Luces que no responden, cierres automáticos sin funcionar, inmobilizador activo, tablero con fallas.
Causas probables: BCM sin alimentación, cables CAN dañados, BCM defectuoso.
Diagnóstico: 1) Verificar fusibles del BCM. 2) Verificar alimentación y masa del BCM. 3) Verificar cables CAN al BCM.
Solución típica: Verificar fusibles/alimentación del BCM. Si persiste, reemplazar BCM (requiere programación).`,
  },
  {
    code: 'U0155_CAN',
    content: `CÓDIGO U0155 — Comunicación perdida con el tablero de instrumentos (cluster)
Sistema: CAN — tablero de instrumentos
Descripción: Se perdió la comunicación entre el PCM/BCM y el tablero de instrumentos.
Síntomas: Tablero sin indicadores (velocímetro, cuentarrevoluciones, temperatura, combustible).
Causas probables: Fusible del cluster quemado, cables CAN al cluster dañados, cluster defectuoso.
Diagnóstico: 1) Verificar fusibles del cluster. 2) Verificar alimentación del tablero. 3) Verificar cables CAN.
Solución típica: Reemplazo del tablero o reparación del cableado.`,
  },
  {
    code: 'U0184_CAN',
    content: `CÓDIGO U0184 — Comunicación perdida con el sistema de radio/audio
Sistema: CAN — sistema de audio / multimedia
Descripción: Pérdida de comunicación con el sistema de infoentretenimiento.
Síntomas: Radio sin funcionar, pantalla apagada, controles del volante sin respuesta.
Diagnóstico: Verificar fusibles del sistema de audio y cableado CAN.
Solución típica: Reemplazo de la unidad de audio.`,
  },
  {
    code: 'U0073_CAN',
    content: `CÓDIGO U0073 — Bus de control desactivado
Sistema: CAN bus principal
Descripción: El bus CAN principal está desactivado o no hay comunicación. Es el más grave de los códigos U.
Síntomas: La mayoría de los sistemas electrónicos sin respuesta, imposible leer con scanner.
Causas probables: Fusible del CAN bus quemado, cable CAN con cortocircuito que derribó el bus completo, módulo defectuoso que apagó el bus.
Diagnóstico: 1) Verificar fusibles del CAN bus. 2) Medir resistencia CAN: si es 0Ω hay cortocircuito, si es >120Ω hay circuito abierto. 3) Desconectar módulos uno a uno. 4) Verificar cableado.
Solución típica: Reparación del cableado CAN o reemplazo del módulo que está derribando el bus.`,
  },

];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const shouldReset = process.argv.includes('--reset');
  const SOURCE_TAG = 'obd_codes_v2_extended';

  // Filtrar entradas vacías (codes ya procesados en otro batch)
  const codes = ALL_CODES.filter(c => c.content.trim().length > 0);

  console.log(`🔧 MechaIA — Seeder Extendido (batch 2)`);
  console.log(`📊 Total de entradas: ${codes.length}`);

  if (shouldReset) {
    console.log('🗑️  Borrando batch 2 existente...');
    await supabase.from('knowledge_base').delete().eq('metadata->>source', SOURCE_TAG);
  }

  const { data: existing } = await supabase
    .from('knowledge_base')
    .select('metadata')
    .eq('metadata->>source', SOURCE_TAG);

  const existingCodes = new Set((existing || []).map((r: any) => r.metadata?.code).filter(Boolean));
  console.log(`📋 Ya cargados: ${existingCodes.size}`);

  const pending = codes.filter(c => !existingCodes.has(c.code));
  console.log(`⏳ Por cargar: ${pending.length} entradas\n`);

  let ok = 0, errors = 0;

  for (let i = 0; i < pending.length; i++) {
    const entry = pending[i];
    process.stdout.write(`[${i + 1}/${pending.length}] ${entry.code} ... `);
    try {
      await sleep(250);
      const embedding = await getEmbedding(entry.content);
      const { error } = await supabase.from('knowledge_base').insert({
        content: entry.content,
        metadata: {
          filename: `codigo-obd-${entry.code}`,
          path: `obd_codes/${entry.code}`,
          marca: entry.code.includes('VAG') ? 'VAG' :
                 entry.code.includes('RENAULT') ? 'RENAULT' :
                 entry.code.includes('PSA') ? 'PSA' :
                 entry.code.includes('FORD') ? 'FORD' :
                 entry.code.includes('TOYOTA') ? 'TOYOTA' :
                 entry.code.includes('GM') || entry.code.includes('FIAT') ? 'GM_FIAT' :
                 entry.code.includes('ABS') || entry.code.includes('CAN') ||
                 entry.code.includes('INMOVILIZADOR') || entry.code.includes('LLAVE') ? 'GENERAL' : 'GENERAL',
          folder: entry.code.includes('_ABS') ? 'abs_esp' :
                  entry.code.includes('_CAN') ? 'can_network' :
                  entry.code.includes('INMOVILIZADOR') || entry.code.includes('LLAVE') ? 'inmovilizador' :
                  entry.code.startsWith('P1') ? 'obd_p1_manufacturer' :
                  entry.code.startsWith('P2') ? 'obd_p2_extended' : 'obd_codes',
          source: SOURCE_TAG,
          code: entry.code,
        },
        embedding,
      });
      if (error) throw error;
      console.log('✅');
      ok++;
    } catch (err: any) {
      console.log(`❌ ${err.message}`);
      errors++;
    }
  }

  console.log(`\n🏁 Finalizado: ${ok} insertados, ${errors} errores`);

  // Mostrar total acumulado
  const { count } = await supabase.from('knowledge_base').select('*', { count: 'exact', head: true });
  console.log(`📚 Total en knowledge_base: ${count} entradas`);
}

main().catch(console.error);

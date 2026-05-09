#!/usr/bin/env tsx
/**
 * seed-obd-codes.ts
 * Inserta códigos de falla OBD/OBD2 en la knowledge_base de Supabase con embeddings.
 * Uso: npx tsx scripts/seed-obd-codes.ts
 *   --reset: borra los códigos OBD existentes antes de insertar
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

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getEmbedding(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent({
    content: { parts: [{ text }] },
    outputDimensionality: 768,
  } as any);
  return result.embedding.values;
}

// ─── Base de datos de códigos OBD ─────────────────────────────────────────────

const OBD_CODES = [
  // ─── P01xx — Sensores de aire/combustible ───────────────────────────────────
  {
    code: 'P0100',
    content: `CÓDIGO P0100 — Sensor MAF: mal funcionamiento del circuito
Sistema: Sensor de flujo de masa de aire (MAF/AFM)
Descripción: El PCM detectó una señal anormal del sensor MAF. El sensor mide la cantidad de aire que ingresa al motor para calcular la inyección de combustible.
Síntomas: Motor irregular en ralentí, pérdida de potencia, consumo elevado, arranque difícil, humo negro.
Causas probables: Sensor MAF sucio o dañado, fuga de aire entre MAF y mariposa, cable dañado, masa del sensor deficiente.
Diagnóstico: 1) Limpiar el sensor MAF con limpiador específico. 2) Verificar manguera de admisión sin grietas. 3) Medir señal del MAF en VIVO: 0.5V-1V en ralentí, 4.5V a plena carga. 4) Verificar continuidad del cableado.
Solución típica: Limpieza o reemplazo del sensor MAF.`,
  },
  {
    code: 'P0101',
    content: `CÓDIGO P0101 — Sensor MAF: rango/rendimiento fuera de parámetro
Sistema: Sensor de flujo de masa de aire (MAF)
Descripción: La señal del MAF está fuera del rango esperado según las condiciones de carga del motor.
Síntomas: Motor irregular, consumo elevado, humo negro en aceleración, corte de potencia.
Causas probables: Sensor MAF contaminado (aceite, polvo), filtro de aire sucio o incorrecto, fuga de vacío, sensor de temperatura de admisión defectuoso.
Diagnóstico: 1) Verificar y reemplazar filtro de aire. 2) Limpiar sensor MAF. 3) Buscar fugas en admisión. 4) Comparar valores del MAF con especificaciones del fabricante.
Solución típica: Limpieza de MAF y reemplazo de filtro de aire.`,
  },
  {
    code: 'P0102',
    content: `CÓDIGO P0102 — Sensor MAF: señal baja
Sistema: Sensor de flujo de masa de aire (MAF)
Descripción: La señal de voltaje del sensor MAF es menor a lo esperado (señal baja).
Síntomas: Motor en ralentí inestable, pérdida de potencia, mezcla pobre o rica.
Causas probables: Sensor MAF defectuoso, cortocircuito en el cableado a masa, conector sucio o corroído, fuga de aire grande antes del MAF.
Diagnóstico: 1) Medir voltaje de alimentación del MAF (debe ser 5V o 12V según tipo). 2) Medir señal de salida. 3) Revisar conector y cableado. 4) Probar con sensor nuevo.
Solución típica: Reemplazo del sensor MAF o reparación de cableado.`,
  },
  {
    code: 'P0103',
    content: `CÓDIGO P0103 — Sensor MAF: señal alta
Sistema: Sensor de flujo de masa de aire (MAF)
Descripción: La señal del sensor MAF supera el límite máximo esperado por el PCM.
Síntomas: Mezcla rica, humo negro, aumento brusco de revoluciones, consumo excesivo.
Causas probables: Cortocircuito en el cable de señal, sensor MAF defectuoso, PCM defectuoso.
Diagnóstico: 1) Verificar si hay cortocircuito a positivo en cable de señal. 2) Desconectar sensor y ver si el código persiste (indica cableado). 3) Reemplazar sensor y verificar.
Solución típica: Reparación del cableado o reemplazo del sensor MAF.`,
  },
  {
    code: 'P0111',
    content: `CÓDIGO P0111 — Sensor IAT (temperatura de aire de admisión): rango/rendimiento
Sistema: Sensor de temperatura de aire de admisión (IAT)
Descripción: La señal del sensor IAT no corresponde con las condiciones esperadas (motor frío vs temperatura ambiente).
Síntomas: Arranque difícil en frío, mezcla incorrecta, consumo elevado.
Causas probables: Sensor IAT defectuoso, conector dañado, cortocircuito.
Diagnóstico: 1) Medir resistencia del IAT: aprox 2.5kΩ a 20°C, 300Ω a 80°C. 2) Comparar lectura del scanner con temperatura real. 3) Verificar cableado.
Solución típica: Reemplazo del sensor IAT (frecuentemente integrado en el MAF).`,
  },
  {
    code: 'P0112',
    content: `CÓDIGO P0112 — Sensor IAT: señal baja (temperatura muy alta indicada)
Sistema: Sensor de temperatura de aire de admisión
Descripción: El PCM lee temperatura de admisión anormalmente alta porque la señal del sensor es demasiado baja (cortocircuito a masa).
Causas probables: Cortocircuito a masa en el cableado, sensor defectuoso.
Diagnóstico: 1) Medir resistencia del sensor (debe ser alta si el motor está frío). 2) Verificar si hay cortocircuito a masa. 3) Desconectar sensor: el voltaje debe subir.
Solución típica: Reparación de cableado o reemplazo del sensor IAT.`,
  },
  {
    code: 'P0113',
    content: `CÓDIGO P0113 — Sensor IAT: señal alta (temperatura muy baja indicada)
Sistema: Sensor de temperatura de aire de admisión
Descripción: El PCM lee temperatura de admisión anormalmente baja (sensor en circuito abierto).
Síntomas: Mezcla rica en frío, consumo elevado, difícil de controlar el ralentí.
Causas probables: Circuito abierto en cableado, conector suelto, sensor quemado.
Diagnóstico: 1) Medir voltaje de señal: debe ser 0.3V-4.8V según temperatura. 2) Verificar continuidad del cableado. 3) Reemplazar sensor.
Solución típica: Reemplazo del sensor IAT o reparación de conector.`,
  },
  {
    code: 'P0116',
    content: `CÓDIGO P0116 — Sensor ECT (temperatura de refrigerante): rango/rendimiento
Sistema: Sensor de temperatura de refrigerante del motor (ECT/CLT)
Descripción: La señal del ECT no sube correctamente durante el calentamiento del motor.
Síntomas: Ventiladores activándose incorrectamente, consumo elevado, fan encendida en frío.
Causas probables: Sensor ECT defectuoso, termostato abierto permanentemente, burbuja de aire en circuito de refrigeración.
Diagnóstico: 1) Verificar que el motor suba a temperatura normal (90°C aprox). 2) Comparar lectura del ECT con termómetro real. 3) Verificar termostato.
Solución típica: Reemplazo del termostato o sensor ECT.`,
  },
  {
    code: 'P0117',
    content: `CÓDIGO P0117 — Sensor ECT: señal baja (temperatura alta indicada)
Sistema: Sensor de temperatura de refrigerante
Descripción: El PCM lee temperatura de refrigerante anormalmente alta. Puede activar modo de protección del motor.
Síntomas: Ventiladores siempre encendidos, mezcla rica, consumo elevado.
Causas probables: Cortocircuito a masa en cableado, sensor ECT defectuoso.
Diagnóstico: 1) Verificar temperatura real del motor con scanner. 2) Medir resistencia ECT (2.5kΩ a 20°C, 180Ω a 80°C aprox). 3) Buscar cortocircuito a masa.
Solución típica: Reemplazo del sensor ECT.`,
  },
  {
    code: 'P0118',
    content: `CÓDIGO P0118 — Sensor ECT: señal alta (temperatura baja indicada / circuito abierto)
Sistema: Sensor de temperatura de refrigerante
Descripción: El PCM no puede leer la temperatura correctamente. El motor puede no alcanzar temperatura de operación según el PCM.
Síntomas: Ventiladores nunca encienden, consumo elevado (PCM cree que el motor está siempre frío), mezcla rica permanente.
Causas probables: Conector suelto o corroído, cable cortado, sensor defectuoso.
Diagnóstico: 1) Revisar conector del ECT (corrosión frecuente). 2) Verificar continuidad del cableado. 3) Medir resistencia del sensor.
Solución típica: Limpieza/reemplazo de conector o sensor ECT.`,
  },
  {
    code: 'P0121',
    content: `CÓDIGO P0121 — Sensor TPS (posición de mariposa): rango/rendimiento
Sistema: Sensor de posición del acelerador (TPS)
Descripción: La señal del TPS no corresponde con la posición real de la mariposa o con las condiciones del motor.
Síntomas: Aceleración irregular, caída de RPM al soltar el acelerador, comportamiento errático.
Causas probables: TPS desgastado (zona muerta), conector dañado, desajuste mecánico de la mariposa.
Diagnóstico: 1) Verificar voltaje TPS en reposo: 0.5V aprox. 2) Abrir mariposa lentamente: debe ser lineal hasta 4.5V. 3) Buscar puntos muertos o saltos en la señal.
Solución típica: Reemplazo del sensor TPS.`,
  },
  {
    code: 'P0122',
    content: `CÓDIGO P0122 — Sensor TPS: señal baja
Sistema: Sensor de posición del acelerador
Descripción: La señal del TPS es menor a 0.17V (típico) con la mariposa en cualquier posición.
Causas probables: Cortocircuito a masa, sensor defectuoso, conector suelto.
Diagnóstico: 1) Verificar alimentación de 5V al sensor. 2) Medir señal de salida. 3) Revisar cableado.
Solución típica: Reparación de cableado o reemplazo de TPS.`,
  },
  {
    code: 'P0123',
    content: `CÓDIGO P0123 — Sensor TPS: señal alta
Sistema: Sensor de posición del acelerador
Descripción: La señal del TPS supera 4.8V con la mariposa cerrada o en cualquier posición.
Síntomas: Ralentí elevado, motor difícil de controlar, aceleración errática.
Causas probables: Cortocircuito a positivo, sensor defectuoso, ajuste mecánico incorrecto.
Diagnóstico: 1) Verificar que no haya cortocircuito en cable de señal. 2) Medir voltaje con mariposa cerrada. 3) Reemplazar sensor.
Solución típica: Reemplazo del TPS.`,
  },
  // ─── P013x — Sensores de oxígeno ────────────────────────────────────────────
  {
    code: 'P0130',
    content: `CÓDIGO P0130 — Sensor de oxígeno banco 1 sonda 1: mal funcionamiento
Sistema: Sensor lambda / sonda de oxígeno upstream (antes del catalizador) banco 1
Descripción: El PCM detectó respuesta lenta o señal incorrecta del sensor O2 precatalizador.
Síntomas: Consumo elevado, posible mezcla rica o pobre, falla en la calibración del combustible.
Causas probables: Sensor O2 envejecido (más de 100.000 km), contaminación por silicona o refrigerante, fuga de escape, cableado dañado.
Diagnóstico: 1) Ver oscilación del sensor en vivo: debe alternar 0.1V-0.9V rápidamente a motor caliente. 2) Verificar fugas de escape antes del sensor. 3) Reemplazar si respuesta es lenta.
Solución típica: Reemplazo del sensor O2 upstream banco 1.`,
  },
  {
    code: 'P0131',
    content: `CÓDIGO P0131 — Sensor O2 banco 1 sonda 1: señal baja (mezcla pobre permanente)
Sistema: Sensor lambda upstream banco 1
Descripción: El sensor O2 indica mezcla pobre de forma continua (voltaje bajo permanente).
Causas probables: Fuga de aire en admisión, injector tapado, presión de combustible baja, sensor O2 defectuoso.
Diagnóstico: 1) Verificar presión de combustible. 2) Buscar fugas de admisión con spray de carburador. 3) Verificar que el sensor oscile en caliente.
Solución típica: Reparar fuga de vacío o reemplazar sensor O2.`,
  },
  {
    code: 'P0132',
    content: `CÓDIGO P0132 — Sensor O2 banco 1 sonda 1: señal alta (mezcla rica permanente)
Sistema: Sensor lambda upstream banco 1
Descripción: El sensor indica mezcla rica constantemente.
Causas probables: Injector con fuga, presión de combustible alta, sensor de refrigerante defectuoso que mantiene mezcla rica, sensor O2 dañado.
Diagnóstico: 1) Verificar presión de combustible. 2) Probar injectores. 3) Verificar sensor ECT.
Solución típica: Revisar injectores o reemplazar sensor O2.`,
  },
  {
    code: 'P0133',
    content: `CÓDIGO P0133 — Sensor O2 banco 1 sonda 1: respuesta lenta
Sistema: Sensor lambda upstream banco 1
Descripción: El sensor O2 tarda demasiado en alternar entre mezcla rica y pobre. Tiempo de respuesta mayor a 100ms (especificación típica).
Causas probables: Sensor O2 envejecido o contaminado (silicona, plomo, refrigerante), fuga de escape.
Diagnóstico: 1) Verificar en VIVO que el sensor alterne rápido a motor caliente. 2) Verificar fugas de escape. 3) Si el sensor tiene más de 80.000 km, reemplazar.
Solución típica: Reemplazo del sensor O2 upstream.`,
  },
  {
    code: 'P0134',
    content: `CÓDIGO P0134 — Sensor O2 banco 1 sonda 1: sin actividad
Sistema: Sensor lambda upstream banco 1
Descripción: El sensor O2 no muestra actividad (señal fija, no alterna).
Causas probables: Sensor O2 frío (calentador dañado), cable roto, sensor defectuoso.
Diagnóstico: 1) Verificar resistencia del calentador del O2 (típico 3-15Ω). 2) Verificar que el calentador reciba +12V y masa. 3) Reemplazar sensor si el calentador funciona.
Solución típica: Reemplazo del sensor O2.`,
  },
  {
    code: 'P0135',
    content: `CÓDIGO P0135 — Calentador del sensor O2 banco 1 sonda 1: mal funcionamiento
Sistema: Calentador interno del sensor lambda upstream
Descripción: El calentador del sensor O2 no funciona correctamente. El sensor tarda demasiado en calentarse.
Síntomas: Mayor consumo en frío, ciclo de lazo cerrado tardío.
Causas probables: Calentador del sensor quemado, fusible del calentador quemado, cableado cortado.
Diagnóstico: 1) Verificar fusible del calentador O2. 2) Medir resistencia del calentador (3-15Ω). 3) Verificar que llegue +12V al calentador.
Solución típica: Reemplazo del sensor O2.`,
  },
  {
    code: 'P0136',
    content: `CÓDIGO P0136 — Sensor O2 banco 1 sonda 2: mal funcionamiento (postcatalizador)
Sistema: Sensor lambda downstream (después del catalizador) banco 1
Descripción: Problema con el sensor O2 que monitorea la eficiencia del catalizador.
Síntomas: No hay síntomas de conducción directos. Solo falla de emisiones.
Causas probables: Sensor O2 defectuoso, contaminación del sensor, cableado dañado.
Diagnóstico: 1) Verificar que el sensor postcatalizador tenga señal estable (no debe oscilar como el precatalizador). 2) Revisar cableado. 3) Reemplazar sensor.
Solución típica: Reemplazo del sensor O2 downstream.`,
  },
  // ─── P017x — Corrección de mezcla (Fuel Trim) ───────────────────────────────
  {
    code: 'P0171',
    content: `CÓDIGO P0171 — Sistema demasiado pobre banco 1 (Fuel Trim lean)
Sistema: Control de mezcla combustible/aire banco 1
Descripción: El PCM está agregando demasiado combustible (LTFT +20% o más) para compensar una mezcla pobre. Indica que hay exceso de aire o falta de combustible.
Síntomas: Marcha en vacío irregular, tirones al acelerar, posible apagado.
Causas probables (en orden de probabilidad): 1) Fuga de vacío (mangueras, junta múltiple admisión, sello de válvula IAC), 2) MAF sucio, 3) Injector tapado, 4) Presión de combustible baja, 5) Fuga de escape antes del sensor O2, 6) Sensor O2 defectuoso.
Diagnóstico: 1) Revisar LTFT en scanner. 2) Buscar fugas de vacío con smoke test o spray. 3) Limpiar MAF. 4) Verificar presión de combustible (3-4 bar típico).
Solución típica: Reparación de fuga de vacío en 60% de los casos.`,
  },
  {
    code: 'P0172',
    content: `CÓDIGO P0172 — Sistema demasiado rico banco 1 (Fuel Trim rich)
Sistema: Control de mezcla combustible/aire banco 1
Descripción: El PCM está quitando combustible (LTFT -20% o más) para compensar una mezcla rica.
Síntomas: Consumo elevado, humo negro, olor a nafta, bujías carbonizadas.
Causas probables: Injector con fuga, sensor ECT defectuoso (siempre frío), presión de combustible alta, MAF leyendo más flujo del real, sensor O2 upstream dañado.
Diagnóstico: 1) Verificar LTFT negativo. 2) Medir presión de combustible. 3) Verificar lectura del ECT. 4) Buscar injector con fuga (presión retención).
Solución típica: Reparación o reemplazo de injectores, o sensor ECT.`,
  },
  {
    code: 'P0174',
    content: `CÓDIGO P0174 — Sistema demasiado pobre banco 2
Sistema: Control de mezcla banco 2 (motores V6/V8)
Descripción: Similar al P0171 pero en el banco 2. Si aparece con P0171, la falla es global (presión de combustible, MAF). Si solo aparece P0174, buscar fuga de vacío específica del banco 2.
Causas probables: Fuga de vacío lado banco 2, injector tapado banco 2, sensor O2 banco 2 defectuoso.
Diagnóstico: Mismos pasos que P0171 pero enfocados en banco 2.
Solución típica: Fuga de vacío en junta múltiple admisión banco 2.`,
  },
  {
    code: 'P0175',
    content: `CÓDIGO P0175 — Sistema demasiado rico banco 2
Sistema: Control de mezcla banco 2
Descripción: Mezcla rica en banco 2. Similar al P0172 para banco 2.
Diagnóstico: Mismos pasos que P0172 pero verificar injectores y sensor O2 del banco 2 específicamente.
Solución típica: Injector con fuga o sensor O2 banco 2.`,
  },
  // ─── P02xx — Injectores de combustible ──────────────────────────────────────
  {
    code: 'P0201',
    content: `CÓDIGO P0201 — Injector cilindro 1: circuito abierto o mal funcionamiento
Sistema: Circuito del injector de combustible cilindro 1
Descripción: El PCM detectó un problema en el circuito eléctrico del injector del cilindro 1.
Síntomas: Fallo de encendido cilindro 1, vibración, pérdida de potencia.
Causas probables: Injector quemado (bobina abierta), cable cortado, conector oxidado.
Diagnóstico: 1) Medir resistencia del injector: 12-17Ω (alta impedancia) o 2-5Ω (baja impedancia). 2) Verificar señal de activación con osciloscopio. 3) Verificar que llegue +12V al injector.
Solución típica: Reemplazo del injector o reparación del cableado.`,
  },
  {
    code: 'P0202',
    content: `CÓDIGO P0202 — Injector cilindro 2: circuito abierto
Sistema: Circuito del injector cilindro 2
Descripción: Problema eléctrico en el injector del cilindro 2.
Diagnóstico y solución: Idéntico a P0201 pero para cilindro 2.`,
  },
  {
    code: 'P0203',
    content: `CÓDIGO P0203 — Injector cilindro 3: circuito
Sistema: Injector cilindro 3
Diagnóstico y solución: Idéntico a P0201 pero para cilindro 3. Verificar resistencia, cableado y señal de disparo del injector 3.`,
  },
  {
    code: 'P0204',
    content: `CÓDIGO P0204 — Injector cilindro 4: circuito
Sistema: Injector cilindro 4
Diagnóstico y solución: Idéntico a P0201 pero para cilindro 4.`,
  },
  // ─── P03xx — Fallas de encendido (Misfires) ─────────────────────────────────
  {
    code: 'P0300',
    content: `CÓDIGO P0300 — Fallas de encendido aleatorias/múltiples detectadas
Sistema: Encendido — múltiples cilindros
Descripción: El PCM detectó fallos de encendido en múltiples cilindros o aleatoriamente. No es un cilindro específico.
Síntomas: Vibración severa del motor, pérdida de potencia en todos los rangos, posible luz de check engine parpadeando (daño al catalizador).
Causas probables: Bujías desgastadas (causa más común), bobinas de encendido débiles, injectores sucios, compresión baja generalizada, falla en distribución (cadena/correa de distribución), fuga en junta de culata, problema en presión de combustible.
Diagnóstico: 1) Verificar bujías (desgaste, holgura). 2) Hacer test de compresión en todos los cilindros. 3) Verificar presión de combustible. 4) Si P0300 aparece con P030x, identificar cilindro principal.
Solución típica: Reemplazo de bujías en 50% de los casos. Verificar distribución si el motor tiene muchos km.`,
  },
  {
    code: 'P0301',
    content: `CÓDIGO P0301 — Falla de encendido detectada cilindro 1
Sistema: Encendido cilindro 1
Descripción: El PCM detectó un fallo de combustión en el cilindro 1 específicamente.
Síntomas: Vibración del motor (peor en ralentí), pérdida de potencia, posible humo por escape, consumo elevado.
Causas probables (en orden): 1) Bujía desgastada o dañada cilindro 1, 2) Bobina de encendido defectuosa, 3) Injector cilindro 1 tapado o fallando, 4) Compresión baja (válvula, anillo, junta culata), 5) Fuga de vacío cilindro 1, 6) Problema de distribución.
Diagnóstico: 1) Intercambiar bujía cilindro 1 con cilindro 2 — si el código migra a P0302, la bujía es la causa. 2) Intercambiar bobina cilindro 1 — si migra, es la bobina. 3) Test de compresión cilindro 1 (mínimo 120 PSI). 4) Balance de injectores.
Solución típica: Bujía o bobina en 80% de los casos.`,
  },
  {
    code: 'P0302',
    content: `CÓDIGO P0302 — Falla de encendido cilindro 2
Sistema: Encendido cilindro 2
Descripción: Fallo de combustión específico en cilindro 2.
Síntomas: Idénticos a P0301 pero en cilindro 2.
Diagnóstico: Mismos pasos que P0301 aplicados al cilindro 2. Intercambiar bujía y bobina con otro cilindro para aislar la falla.
Solución típica: Bujía o bobina cilindro 2.`,
  },
  {
    code: 'P0303',
    content: `CÓDIGO P0303 — Falla de encendido cilindro 3
Sistema: Encendido cilindro 3
Diagnóstico: Mismos pasos que P0301 para cilindro 3.`,
  },
  {
    code: 'P0304',
    content: `CÓDIGO P0304 — Falla de encendido cilindro 4
Sistema: Encendido cilindro 4
Diagnóstico: Mismos pasos que P0301 para cilindro 4.`,
  },
  {
    code: 'P0305',
    content: `CÓDIGO P0305 — Falla de encendido cilindro 5
Sistema: Encendido cilindro 5
Diagnóstico: Mismos pasos que P0301 para cilindro 5.`,
  },
  {
    code: 'P0306',
    content: `CÓDIGO P0306 — Falla de encendido cilindro 6
Sistema: Encendido cilindro 6
Diagnóstico: Mismos pasos que P0301 para cilindro 6.`,
  },
  // ─── P033x/P034x — Sensores de posición cigüeñal/árbol de levas ─────────────
  {
    code: 'P0335',
    content: `CÓDIGO P0335 — Sensor CKP (posición de cigüeñal): mal funcionamiento circuito A
Sistema: Sensor de posición del cigüeñal (CKP/CPS)
Descripción: El PCM no recibe señal correcta del sensor CKP. Este sensor es crítico para el encendido y la inyección.
Síntomas: Motor que no arranca o arranca y se apaga, fallos de encendido, aceleración irregular, pérdida total de potencia.
Causas probables: Sensor CKP defectuoso, reluctor dañado o con diente roto, espacio sensor-reluctor incorrecto, cableado cortado o con interferencia, corrosión en conector.
Diagnóstico: 1) Verificar señal en osciloscopio: debe ser señal cuadrada o senoidal limpia. 2) Verificar espacio entre sensor y reluctor (típico 0.5-1.5mm). 3) Inspeccionar reluctor por dientes doblados o rotos. 4) Verificar cableado.
Solución típica: Reemplazo del sensor CKP o revisión del reluctor.`,
  },
  {
    code: 'P0336',
    content: `CÓDIGO P0336 — Sensor CKP: rango/rendimiento
Sistema: Sensor de posición del cigüeñal
Descripción: El sensor CKP envía señal pero fuera del rango esperado. Puede ser una señal distorsionada.
Causas probables: Reluctor con diente faltante (no el diente de sincronismo), interferencia electromagnética, sensor débil.
Diagnóstico: 1) Ver señal en osciloscopio a diferentes RPM. 2) Verificar reluctor. 3) Verificar masa del sensor.
Solución típica: Revisión del reluctor o reemplazo del sensor CKP.`,
  },
  {
    code: 'P0340',
    content: `CÓDIGO P0340 — Sensor CMP (posición de árbol de levas) banco 1: mal funcionamiento
Sistema: Sensor de posición del árbol de levas (CMP)
Descripción: El PCM no recibe señal del sensor de árbol de levas. Afecta sincronización del encendido y fases de inyección.
Síntomas: Arranque difícil, fallos de encendido, motor irregular, en algunos vehículos no arranca.
Causas probables: Sensor CMP defectuoso, rueda fónica del árbol dañada, cableado cortado, cadena/correa de distribución elongada (desfase de fase).
Diagnóstico: 1) Verificar señal del sensor CMP. 2) Comparar fase CKP-CMP en osciloscopio. 3) Verificar estado de la distribución.
Solución típica: Reemplazo del sensor CMP o revisión de la distribución.`,
  },
  {
    code: 'P0341',
    content: `CÓDIGO P0341 — Sensor CMP banco 1: rango/rendimiento
Sistema: Sensor árbol de levas
Descripción: La señal del CMP existe pero no es correcta respecto al CKP. Puede indicar desfase por cadena/correa elongada.
Síntomas: Pérdida de potencia, consumo elevado, motor que jalonea.
Causas probables: Cadena de distribución elongada, tensionador defectuoso, sensor CMP débil.
Diagnóstico: 1) Comparar correlación CKP-CMP. 2) Verificar tensión de la cadena de distribución. 3) Evaluar si hay desfase de distribución.
Solución típica: Revisión y posible cambio de cadena de distribución.`,
  },
  // ─── P04xx — Emisiones ───────────────────────────────────────────────────────
  {
    code: 'P0400',
    content: `CÓDIGO P0400 — Sistema EGR (recirculación de gases de escape): falla de flujo
Sistema: Sistema de recirculación de gases de escape (EGR)
Descripción: El PCM detectó que el flujo EGR no corresponde al esperado al activar la válvula.
Síntomas: Check engine encendida, posible detonación/golpeteo, mayor consumo.
Causas probables: Válvula EGR atascada (abierta o cerrada), pasajes EGR tapados con carbonilla, mangueras de vacío rotas (EGR por vacío), sensor DPFE defectuoso (Ford), actuador EGR eléctrico dañado.
Diagnóstico: 1) Limpiar la válvula EGR y pasajes. 2) Verificar operación de la válvula con scanner (activar con datos en vivo). 3) Verificar mangueras de vacío. 4) Verificar sensor de posición EGR.
Solución típica: Limpieza o reemplazo de la válvula EGR.`,
  },
  {
    code: 'P0401',
    content: `CÓDIGO P0401 — Sistema EGR: flujo insuficiente detectado
Sistema: EGR
Descripción: El flujo de gases recirculados es menor al esperado. La válvula puede estar atascada cerrada o los pasajes tapados.
Causas probables: Pasajes EGR tapados con carbonilla, válvula EGR pegada cerrada, vacío insuficiente (EGR por vacío), sensor DPFE dañado.
Diagnóstico: 1) Limpiar pasajes EGR con desengrasante. 2) Verificar que la válvula abra correctamente al activarla. 3) Hacer smoke test en pasajes EGR.
Solución típica: Limpieza de pasajes EGR o reemplazo de válvula.`,
  },
  {
    code: 'P0402',
    content: `CÓDIGO P0402 — Sistema EGR: flujo excesivo detectado
Sistema: EGR
Descripción: El flujo EGR es mayor al esperado. La válvula puede estar pegada abierta.
Síntomas: Marcha en vacío inestable o paros del motor, jalones al acelerar desde ralentí.
Causas probables: Válvula EGR pegada abierta, sensor DPFE defectuoso.
Diagnóstico: 1) Verificar si la válvula EGR cierra completamente. 2) Reemplazar válvula si está pegada.
Solución típica: Reemplazo de válvula EGR.`,
  },
  {
    code: 'P0420',
    content: `CÓDIGO P0420 — Eficiencia del catalizador por debajo del umbral banco 1
Sistema: Catalizador (convertidor catalítico) banco 1
Descripción: El PCM compara los sensores O2 upstream y downstream. Si el sensor postcatalizador oscila demasiado (como el precatalizador), indica que el catalizador no está funcionando eficientemente.
Síntomas: Generalmente ninguno perceptible. Puede haber olor a huevo podrido (H2S) si el catalizador está dañado.
Causas probables (en orden de probabilidad): 1) Catalizador dañado o agotado (más de 150.000 km), 2) Sonda lambda trasera defectuosa, 3) Fuga de escape antes del sensor postcatalizador, 4) Mezcla rica sostenida que dañó el catalizador, 5) Aceite o refrigerante quemado en motor, 6) Tierra del sensor O2 deficiente.
Diagnóstico: 1) Verificar que el sensor O2 upstream funcione correctamente. 2) Comparar oscilación upstream vs downstream en VIVO. 3) Verificar fuga de escape. 4) Evaluar daño interno del catalizador.
Solución típica: Reemplazo del catalizador en la mayoría de los casos.`,
  },
  {
    code: 'P0421',
    content: `CÓDIGO P0421 — Calentamiento del catalizador por debajo del umbral banco 1
Sistema: Catalizador banco 1
Descripción: El catalizador no alcanza temperatura de eficiencia durante el calentamiento del motor.
Causas probables: Catalizador dañado, sensor O2 postcatalizador defectuoso, termostato abierto (motor siempre frío).
Diagnóstico: 1) Verificar temperatura del catalizador con pirometro. 2) Verificar sensor O2 downstream. 3) Verificar termostato.
Solución típica: Reemplazo del catalizador o termostato.`,
  },
  {
    code: 'P0430',
    content: `CÓDIGO P0430 — Eficiencia del catalizador banco 2 por debajo del umbral
Sistema: Catalizador banco 2 (motores V)
Descripción: Igual que P0420 pero para el banco 2 en motores V6/V8.
Diagnóstico: Mismos pasos que P0420 pero para banco 2.
Solución típica: Reemplazo del catalizador banco 2.`,
  },
  {
    code: 'P0440',
    content: `CÓDIGO P0440 — Sistema EVAP (evaporativo): mal funcionamiento general
Sistema: Control de emisiones evaporativas (EVAP/canister)
Descripción: Existe una fuga o mal funcionamiento en el sistema que captura vapores de combustible del tanque.
Síntomas: Olor a nafta ocasional, check engine encendida. Raramente afecta el rendimiento.
Causas probables: Tapa de combustible suelta o dañada, mangueras EVAP rotas, válvula purga EVAP defectuosa, canister saturado.
Diagnóstico: 1) Verificar tapa del tanque (causa más simple). 2) Verificar válvula de purga EVAP (debe cerrar y abrir por comando). 3) Smoke test del sistema EVAP.
Solución típica: Reemplazo de tapa de combustible o válvula purga EVAP.`,
  },
  {
    code: 'P0441',
    content: `CÓDIGO P0441 — Sistema EVAP: flujo de purga incorrecto
Sistema: EVAP
Descripción: El flujo a través de la válvula de purga del canister no es el esperado.
Causas probables: Válvula de purga atascada (abierta o cerrada), manguera de purga bloqueada o rota.
Diagnóstico: 1) Desconectar manguera de la válvula purga en el múltiple y verificar vacío. 2) Activar la válvula con scanner y verificar apertura.
Solución típica: Reemplazo de la válvula de purga EVAP.`,
  },
  {
    code: 'P0442',
    content: `CÓDIGO P0442 — Sistema EVAP: fuga pequeña detectada
Sistema: EVAP
Descripción: Se detectó una fuga pequeña en el sistema EVAP (menor a 1mm de diámetro).
Causas probables: Tapa del tanque desgastada (causa 60%), mangueras EVAP con micro fisuras, válvula purga que no cierra completamente.
Diagnóstico: 1) Reemplazar tapa del tanque primero (solución más económica). 2) Smoke test del sistema EVAP. 3) Revisar mangueras visualmente.
Solución típica: Tapa de combustible nueva.`,
  },
  {
    code: 'P0455',
    content: `CÓDIGO P0455 — Sistema EVAP: fuga grande detectada
Sistema: EVAP
Descripción: Fuga grande en el sistema EVAP (mayor a 1mm). El sistema no mantiene presión.
Causas probables: Tapa del tanque ausente o muy dañada, manguera EVAP rota, cuello del tanque dañado, sensor de presión del tanque defectuoso.
Diagnóstico: 1) Verificar tapa del tanque. 2) Inspección visual de mangueras EVAP. 3) Smoke test. 4) Verificar sensor FTPS/FTP.
Solución típica: Tapa de combustible o manguera EVAP.`,
  },
  // ─── P05xx — Velocidad, ralentí ─────────────────────────────────────────────
  {
    code: 'P0500',
    content: `CÓDIGO P0500 — Sensor de velocidad del vehículo (VSS): mal funcionamiento
Sistema: Sensor de velocidad del vehículo
Descripción: El PCM no recibe señal o recibe señal incorrecta del sensor de velocidad.
Síntomas: Velocímetro no funciona, transmisión automática con cambios incorrectos, control de crucero no funciona, ABS/ESP pueden activarse.
Causas probables: Sensor VSS defectuoso, piñón impulsor desgastado, cableado dañado, problema en la caja de cambios.
Diagnóstico: 1) Verificar señal del VSS a velocidad constante. 2) Revisar el piñón impulsor del sensor. 3) Verificar cableado y conector.
Solución típica: Reemplazo del sensor VSS o piñón.`,
  },
  {
    code: 'P0505',
    content: `CÓDIGO P0505 — Sistema de control de ralentí: mal funcionamiento
Sistema: Control de ralentí (IAC / IACV / E-throttle)
Descripción: El sistema de control de ralentí no funciona correctamente.
Síntomas: Ralentí demasiado alto, demasiado bajo, irregular, o motor que se apaga al soltar el acelerador.
Causas probables: Válvula IAC sucia o defectuosa, cuerpo de mariposa sucio, fuga de vacío, sensor TPS desajustado.
Diagnóstico: 1) Limpiar cuerpo de mariposa y válvula IAC. 2) Verificar que no haya fugas de vacío. 3) Verificar posición del TPS en ralentí.
Solución típica: Limpieza del cuerpo de mariposa y válvula IAC.`,
  },
  {
    code: 'P0506',
    content: `CÓDIGO P0506 — Sistema control de ralentí: RPM más bajas de lo esperado
Sistema: Control de ralentí
Descripción: Las RPM de ralentí son menores a las especificadas.
Causas probables: Válvula IAC pegada cerrada, cuerpo de mariposa muy sucio, fuga de vacío grande (el motor cae de RPM), avance de encendido incorrecto.
Diagnóstico: 1) Verificar RPM objetivo en scanner vs RPM reales. 2) Limpiar sistema. 3) Verificar fugas de vacío.
Solución típica: Limpieza de cuerpo de mariposa.`,
  },
  {
    code: 'P0507',
    content: `CÓDIGO P0507 — Sistema control de ralentí: RPM más altas de lo esperado
Sistema: Control de ralentí
Descripción: Las RPM de ralentí son mayores a las especificadas.
Causas probables: Válvula IAC pegada abierta, fuga de vacío grande después de la mariposa, fuga de aire por junta multiple, pedal de aceleración no vuelve completamente.
Diagnóstico: 1) Verificar que la mariposa cierre completamente. 2) Buscar fugas de vacío. 3) Limpiar o reemplazar válvula IAC.
Solución típica: Búsqueda y reparación de fuga de vacío.`,
  },
  // ─── P06xx — Control PCM/ECM ─────────────────────────────────────────────────
  {
    code: 'P0601',
    content: `CÓDIGO P0601 — Módulo de control del motor (PCM/ECM): error de memoria interna
Sistema: PCM/ECM
Descripción: La memoria interna del PCM tiene un error de checksum. El PCM se autodiagnosticó con falla.
Síntomas: Múltiples códigos juntos, comportamiento errático del motor, puede no arrancar.
Causas probables: PCM defectuoso, problema de alimentación de tensión al PCM (baja tensión de batería), falla de tierra del PCM.
Diagnóstico: 1) Verificar tensión de batería y alternador. 2) Verificar masas del PCM. 3) Intentar actualizar/reflashear el PCM. 4) Si persiste, reemplazar PCM.
Solución típica: Verificación de alimentación del PCM. Si todo es correcto, reemplazar PCM.`,
  },
  {
    code: 'P0606',
    content: `CÓDIGO P0606 — PCM/ECM: procesador defectuoso
Sistema: PCM/ECM
Descripción: El procesador interno del PCM detectó un fallo en su propio circuito de control.
Síntomas: Motor que no arranca, múltiples fallos simultáneos, comportamiento completamente errático.
Diagnóstico: 1) Verificar alimentaciones y masas del PCM. 2) Verificar que no haya sobretensión en el sistema eléctrico. 3) El PCM generalmente necesita ser reemplazado.
Solución típica: Reemplazo del PCM/ECM (requiere reprogramación en muchos casos).`,
  },
  // ─── P07xx — Transmisión automática ─────────────────────────────────────────
  {
    code: 'P0700',
    content: `CÓDIGO P0700 — Sistema de control de transmisión: código de mal funcionamiento
Sistema: Módulo de control de la transmisión (TCM)
Descripción: El TCM detectó una falla interna y lo reportó al PCM. Este código siempre viene acompañado de otros códigos de transmisión que indican la falla específica.
Síntomas: Luz de transmisión encendida, cambios duros o incorrectos, transmisión en modo de emergencia (limp mode).
Diagnóstico: 1) Leer TODOS los códigos del sistema, incluyendo los del TCM. 2) Los códigos secundarios indican la falla real. 3) Verificar nivel y condición del aceite de transmisión.
Solución típica: Depende del código secundario del TCM.`,
  },
  {
    code: 'P0715',
    content: `CÓDIGO P0715 — Sensor de velocidad del turbine shaft (entrada de transmisión): mal funcionamiento
Sistema: Sensor de velocidad de entrada de la transmisión automática
Descripción: El TCM no recibe señal correcta del sensor de velocidad de la turbina.
Síntomas: Cambios duros, cambios incorrectos, trepidación al cambiar, posible limp mode.
Causas probables: Sensor defectuoso, cableado dañado, reluctor de la transmisión dañado, aceite de transmisión contaminado.
Diagnóstico: 1) Verificar nivel y calidad del aceite ATF. 2) Verificar señal del sensor con scanner. 3) Verificar cableado y conector.
Solución típica: Reemplazo del sensor o cambio de aceite ATF.`,
  },
  {
    code: 'P0720',
    content: `CÓDIGO P0720 — Sensor de velocidad de salida de transmisión: mal funcionamiento
Sistema: Sensor de velocidad de salida (OSS)
Descripción: Señal incorrecta del sensor de velocidad de salida de la transmisión.
Síntomas: Velocímetro incorrecto, cambios incorrectos, ABS con fallos.
Diagnóstico: 1) Verificar señal del sensor a velocidad constante. 2) Revisar cableado. 3) Reemplazar sensor.
Solución típica: Reemplazo del sensor de velocidad de salida.`,
  },
  {
    code: 'P0730',
    content: `CÓDIGO P0730 — Relación de marcha incorrecta
Sistema: Transmisión automática
Descripción: La relación de transmisión real no coincide con la esperada por el TCM.
Síntomas: Patinaje de transmisión, jalones al acelerar, consumo elevado.
Causas probables: Aceite ATF bajo o muy degradado, embragues o bandas desgastados, solenoide de cambio defectuoso, sensor de velocidad incorrecto.
Diagnóstico: 1) Verificar y cambiar aceite ATF. 2) Verificar solenoides de cambio. 3) Evaluar estado mecánico de la transmisión.
Solución típica: Cambio de aceite ATF o reparación de transmisión.`,
  },
  // ─── P08xx — Combustible y aire (adicionales) ────────────────────────────────
  {
    code: 'P0087',
    content: `CÓDIGO P0087 — Presión de combustible del sistema/riel: demasiado baja
Sistema: Sistema de alimentación de combustible (bomba, regulador, inyectores)
Descripción: La presión de combustible medida por el sensor de presión del riel es menor a la especificada.
Síntomas: Pérdida de potencia especialmente en carga alta, aceleración cortada, posible apagado bajo carga, dificultad para arrancar en caliente.
Causas probables: Bomba de combustible débil (causa más común), filtro de combustible tapado, regulador de presión defectuoso, injector con fuga interna (pierde presión en reposo), línea de combustible restringida.
Diagnóstico: 1) Medir presión de combustible en el riel (manómetro). 2) Verificar que la presión se mantenga al apagar el motor (retención de presión). 3) Medir consumo de la bomba. 4) Reemplazar filtro de combustible.
Solución típica: Reemplazo de la bomba de combustible o filtro.`,
  },
  {
    code: 'P0088',
    content: `CÓDIGO P0088 — Presión de combustible del sistema/riel: demasiado alta
Sistema: Sistema de combustible
Descripción: La presión en el riel de combustible supera el máximo especificado.
Síntomas: Mezcla rica, humo negro, consumo elevado, posible dificultad para arrancar.
Causas probables: Regulador de presión de combustible defectuoso (cerrado), retorno de combustible obstruido.
Diagnóstico: 1) Medir presión de combustible. 2) Verificar línea de retorno. 3) Reemplazar regulador de presión.
Solución típica: Reemplazo del regulador de presión de combustible.`,
  },
  {
    code: 'P0089',
    content: `CÓDIGO P0089 — Regulador de presión de combustible: rendimiento
Sistema: Regulador de presión de combustible / sistema de alta presión (GDI)
Descripción: El rendimiento del regulador no es el esperado. Presión inestable.
Causas probables: Regulador de presión desgastado, válvula de presión defectuosa (en sistemas GDI).
Diagnóstico: 1) Verificar presión con motor en VIVO. 2) Verificar estabilidad de la presión a diferentes RPM.
Solución típica: Reemplazo del regulador de presión.`,
  },
  // ─── Códigos de sistema eléctrico/batería ────────────────────────────────────
  {
    code: 'P0562',
    content: `CÓDIGO P0562 — Voltaje del sistema: bajo
Sistema: Sistema de carga eléctrica (batería, alternador)
Descripción: El voltaje del sistema eléctrico es menor a 10V durante la operación normal.
Síntomas: Luz de batería encendida, múltiples luces de advertencia, comportamiento errático de sistemas electrónicos, motor con fallas varias.
Causas probables: Batería descargada o defectuosa, alternador no carga correctamente, conexiones de batería corroídas, pérdida de carga por consumo excesivo.
Diagnóstico: 1) Medir voltaje en batería con motor apagado (debe ser 12.4-12.7V). 2) Medir voltaje con motor en marcha (debe ser 13.5-14.7V). 3) Verificar bornes de batería. 4) Probar alternador.
Solución típica: Reemplazo de batería o alternador.`,
  },
  {
    code: 'P0563',
    content: `CÓDIGO P0563 — Voltaje del sistema: alto
Sistema: Sistema de carga eléctrica
Descripción: El voltaje del sistema supera los 16V. Puede dañar componentes electrónicos.
Causas probables: Regulador de voltaje del alternador defectuoso, alternador defectuoso.
Diagnóstico: 1) Medir voltaje con motor en marcha. 2) Verificar regulador de voltaje del alternador.
Solución típica: Reemplazo del alternador.`,
  },
  // ─── Códigos de sistema de arranque ─────────────────────────────────────────
  {
    code: 'P0615',
    content: `CÓDIGO P0615 — Relé del motor de arranque: circuito
Sistema: Circuito del motor de arranque
Descripción: Problema en el circuito del relé del motor de arranque. El PCM no puede controlar correctamente el arranque.
Causas probables: Relé de arranque defectuoso, cableado del relé dañado, fusible quemado, PCM defectuoso.
Diagnóstico: 1) Verificar fusible del relé de arranque. 2) Verificar que el relé reciba señal del PCM al girar la llave. 3) Verificar voltaje en el motor de arranque.
Solución típica: Reemplazo del relé de arranque.`,
  },
  // ─── Códigos adicionales importantes ────────────────────────────────────────
  {
    code: 'P0011',
    content: `CÓDIGO P0011 — Árbol de levas de admisión banco 1: sobreavance o sistema atascado avanzado (VVT)
Sistema: Sistema de variación de fase del árbol de levas (VVT/VCT/VANOS/VVTi)
Descripción: El ángulo del árbol de levas de admisión está más avanzado de lo comandado, o no puede retrasarse.
Síntomas: Ruido de cascabel al arrancar en frío (cadena distribución), ralentí irregular, pérdida de potencia, consumo elevado.
Causas probables: Aceite de motor muy sucio o viscosidad incorrecta (causa más común), solenoide VVT defectuoso o tapado con barro de aceite, actuador VVT dañado, cadena de distribución desgastada.
Diagnóstico: 1) Cambiar aceite y filtro con viscosidad correcta — muchas veces resuelve solo. 2) Limpiar o reemplazar solenoide VVT. 3) Verificar estado de la cadena de distribución.
Solución típica: Cambio de aceite con viscosidad correcta. Si persiste, reemplazar solenoide VVT.`,
  },
  {
    code: 'P0012',
    content: `CÓDIGO P0012 — Árbol de levas de admisión banco 1: sobreretraso o atascado retrasado (VVT)
Sistema: VVT banco 1
Descripción: El árbol de levas de admisión está más retrasado de lo comandado.
Causas probables: Solenoide VVT defectuoso, aceite sucio bloqueando el solenoide, actuador VVT atascado.
Diagnóstico: 1) Cambiar aceite. 2) Verificar solenoide VVT (resistencia 7-12Ω típico). 3) Probar solenoide con voltaje directo.
Solución típica: Cambio de aceite + reemplazo del solenoide VVT.`,
  },
  {
    code: 'P0016',
    content: `CÓDIGO P0016 — Correlación posición cigüeñal-árbol de levas banco 1 sonda A
Sistema: Sincronización entre CKP y CMP
Descripción: Existe desfase entre la posición del cigüeñal y el árbol de levas. La distribución no está en fase.
Síntomas: Falta de potencia, posible traqueteo de cadena, consumo elevado, arranque difícil.
Causas probables: Cadena de distribución desgastada o elongada, tensionador defectuoso, sensor CKP o CMP dañado, distribución mal armada.
Diagnóstico: 1) Verificar señales CKP y CMP con osciloscopio y comparar desfase. 2) Verificar tensión de la cadena de distribución. 3) Considerar revisión de la distribución.
Solución típica: Cambio de cadena de distribución y tensionador.`,
  },
  {
    code: 'P0017',
    content: `CÓDIGO P0017 — Correlación posición cigüeñal-árbol de levas banco 1 sonda B
Sistema: Sincronización CKP-CMP (árbol de levas de escape)
Descripción: Desfase entre cigüeñal y árbol de levas de ESCAPE.
Causas y diagnóstico: Idéntico a P0016 pero para el árbol de levas de escape. Frecuentemente indica cadena de distribución elongada en motores con VVT en ambos árboles.
Solución típica: Revisión y cambio de distribución.`,
  },
  {
    code: 'P0030',
    content: `CÓDIGO P0030 — Calentador sensor O2 banco 1 sonda 1: circuito abierto
Sistema: Calentador del sensor lambda upstream banco 1
Descripción: Circuito abierto en el calentador del sensor O2. El sensor tarda demasiado en calentarse, afectando el control de mezcla en frío.
Causas probables: Cable del calentador cortado, fusible quemado, sensor O2 con calentador abierto.
Diagnóstico: 1) Verificar fusible del calentador O2. 2) Medir resistencia del calentador (3-15Ω). 3) Verificar voltaje +12V al calentador.
Solución típica: Reemplazo del sensor O2.`,
  },
  // ─── Códigos de sistema de combustible ──────────────────────────────────────
  {
    code: 'P0230',
    content: `CÓDIGO P0230 — Circuito primario de la bomba de combustible: mal funcionamiento
Sistema: Relé y circuito de la bomba de combustible
Descripción: El PCM detectó un problema en el circuito de control de la bomba de combustible.
Síntomas: Motor que no arranca, se apaga al conducir, falta de presión de combustible.
Causas probables: Relé de bomba de combustible defectuoso, fusible quemado, cableado cortado, bomba de combustible defectuosa.
Diagnóstico: 1) Verificar fusible de la bomba. 2) Verificar relé (escuchar el clic al girar la llave). 3) Medir voltaje en el conector de la bomba. 4) Medir amperaje de la bomba.
Solución típica: Reemplazo del relé o fusible. Si la bomba no recibe corriente, revisar cableado.`,
  },
  // ─── Códigos de sistema de presión de aceite ────────────────────────────────
  {
    code: 'P0520',
    content: `CÓDIGO P0520 — Sensor de presión de aceite del motor: mal funcionamiento
Sistema: Sensor de presión de aceite
Descripción: El PCM detectó una señal anormal del sensor de presión de aceite.
Síntomas: Luz de presión de aceite encendida, puede ser falsa alarma o problema real.
Causas probables: Sensor de presión de aceite defectuoso, nivel de aceite bajo, presión de aceite realmente baja (bomba de aceite), cableado dañado.
Diagnóstico: 1) PRIMERO verificar nivel de aceite. 2) Medir presión real con manómetro mecánico. 3) Si presión es correcta, reemplazar sensor.
Solución típica: Reemplazo del sensor de presión de aceite (verificar primero que la presión real sea correcta).`,
  },
  {
    code: 'P0521',
    content: `CÓDIGO P0521 — Sensor de presión de aceite: rango/rendimiento
Sistema: Presión de aceite
Descripción: La señal del sensor de presión de aceite está fuera del rango esperado según las condiciones del motor.
Diagnóstico: 1) Verificar nivel de aceite. 2) Medir presión con manómetro mecánico. 3) Si presión es correcta pero código persiste, reemplazar sensor.
Solución típica: Reemplazo del sensor de presión de aceite.`,
  },
  // ─── Códigos de sistema de carga (turbo) ────────────────────────────────────
  {
    code: 'P0234',
    content: `CÓDIGO P0234 — Sistema de sobrealimentación: sobreboost
Sistema: Turbocompresor / sobrealimentación
Descripción: La presión de boost supera el límite máximo.
Síntomas: El PCM puede recortar la inyección (limp mode), pérdida de potencia repentina.
Causas probables: Válvula wastegate atascada cerrada, actuador de wastegate defectuoso, solenoide de control de boost defectuoso, sensor MAP leyendo mal.
Diagnóstico: 1) Verificar operación de la wastegate (debe abrirse a cierta presión). 2) Verificar solenoide de boost. 3) Verificar presión de boost con scanner.
Solución típica: Reparación o reemplazo de la wastegate o actuador.`,
  },
  {
    code: 'P0236',
    content: `CÓDIGO P0236 — Sensor MAP de turbocompresor: rango/rendimiento
Sistema: Sensor de presión absoluta del múltiple en sistema turbo
Descripción: La señal del sensor de presión de boost no corresponde con las condiciones de operación.
Causas probables: Sensor MAP defectuoso, manguera de vacío al sensor rota, fuga en intercooler o mangueras de boost.
Diagnóstico: 1) Verificar mangueras de boost con smoke test. 2) Verificar señal del sensor MAP en VIVO a diferentes cargas. 3) Reemplazar sensor.
Solución típica: Reparación de fuga de boost o reemplazo del sensor MAP.`,
  },
  {
    code: 'P0299',
    content: `CÓDIGO P0299 — Turbocompresor/sobrealimentador: subboost o pérdida de potencia
Sistema: Turbocompresor
Descripción: La presión de boost es menor a la esperada. El turbo no genera suficiente presión.
Síntomas: Pérdida notable de potencia, especialmente al acelerar fuerte, humo azul o negro según la causa.
Causas probables: Fuga en mangueras de boost (intercooler, entre turbina y mariposa), turbina dañada (aspas rotas), wastegate pegada abierta, aceite insuficiente al turbo, VGT defectuosa (turbina de geometría variable).
Diagnóstico: 1) Smoke test de todo el sistema de boost. 2) Verificar wastegate. 3) Revisar aceite del turbo. 4) Verificar que la turbina gire libremente.
Solución típica: Reparación de fuga de boost o reconstrucción/reemplazo del turbo.`,
  },
  // ─── Diagnóstico de múltiples códigos ────────────────────────────────────────
  {
    code: 'MULTI_CODES',
    content: `DIAGNÓSTICO CON MÚLTIPLES CÓDIGOS DE FALLA SIMULTÁNEOS
Cuando un vehículo tiene varios códigos OBD al mismo tiempo, el diagnóstico debe ser estratégico:

1. IDENTIFICAR EL CÓDIGO RAÍZ: Un código principal puede generar varios secundarios. Ej: P0335 (sin señal CKP) puede generar P0300, P0301-P0304, P0340, P0171.

2. ORDEN DE PRIORIDAD:
   - Primero: códigos de sensores base (CKP, CMP, ECT, MAF)
   - Segundo: códigos de alimentación (batería, voltaje)
   - Tercero: códigos de encendido/combustible
   - Último: códigos de emisiones (O2, CAT, EVAP)

3. SI TODOS LOS CÓDIGOS SON DE DISTINTOS SISTEMAS: Sospechar falla eléctrica general — verificar masa del motor/PCM, voltaje de la batería, problemas de tierra.

4. SI SON TODOS DEL MISMO BANCO: Verificar fuga de vacío en ese banco, sensor O2 defectuoso, o problema de compresión en varios cilindros.

5. NUNCA reparar todos los códigos simultáneamente sin identificar la causa raíz. Resolver el código principal primero y ver cuáles desaparecen.`,
  },
  // ─── Herramienta de diagnóstico ──────────────────────────────────────────────
  {
    code: 'DIAGNOSTICO_GENERAL',
    content: `METODOLOGÍA DE DIAGNÓSTICO AUTOMOTRIZ PROFESIONAL CON OBD2

PASO 1 — RECOPILACIÓN DE INFORMACIÓN:
- Km del vehículo, historial de service, síntomas exactos del cliente
- ¿Cuándo ocurre? (frío/caliente, ralentí/aceleración, siempre/intermitente)
- ¿Hubo algún trabajo reciente?

PASO 2 — LECTURA DE CÓDIGOS:
- Leer todos los sistemas (motor, transmisión, ABS, airbag, carrocería)
- Anotar códigos activos Y pendientes
- Registrar datos congelados (freeze frame) del momento de la falla

PASO 3 — DATOS EN VIVO:
- Analizar datos en tiempo real con motor caliente
- Verificar O2 sensors, fuel trim, MAF, TPS, ECT

PASO 4 — PRUEBAS ESPECÍFICAS:
- Test de compresión si hay misfires
- Presión de combustible si hay códigos de mezcla
- Osciloscopio para sensores con señal dudosa

PASO 5 — REPARAR Y VERIFICAR:
- Reparar la causa raíz, no solo borrar códigos
- Verificar que los códigos no vuelvan después de un ciclo de conducción
- Entregar informe al cliente`,
  },
  // ─── Sistemas específicos adicionales ───────────────────────────────────────
  {
    code: 'P0325',
    content: `CÓDIGO P0325 — Sensor de detonación (knock sensor) banco 1: mal funcionamiento
Sistema: Sensor de detonación / knock sensor
Descripción: El PCM detectó un problema en el circuito del sensor de detonación. Este sensor detecta golpeteo/detonación en el motor.
Síntomas: Check engine encendida. El PCM puede retrasar el encendido preventivamente, causando pérdida de potencia y consumo elevado.
Causas probables: Sensor de knock defectuoso, cableado dañado, sensor flojo (torque incorrecto), motor con detonación real.
Diagnóstico: 1) Verificar torque del sensor (crítico: generalmente 20-25 Nm). 2) Medir resistencia del sensor (varios MΩ). 3) Verificar cableado blindado. 4) Escuchar si hay detonación real con combustible de baja octanaje.
Solución típica: Reapriete o reemplazo del sensor de knock.`,
  },
  {
    code: 'P0326',
    content: `CÓDIGO P0326 — Sensor de detonación banco 1: rango/rendimiento
Sistema: Knock sensor
Descripción: La señal del sensor de knock está fuera del rango esperado. Puede estar detectando vibraciones mecánicas como detonación.
Causas probables: Sensor flojo, motor con vibración excesiva (falla mecánica), sensor defectuoso.
Diagnóstico: 1) Verificar torque del sensor. 2) Verificar estado mecánico del motor. 3) Reemplazar sensor si todo está correcto.
Solución típica: Reapriete o reemplazo del sensor.`,
  },
  {
    code: 'P0128',
    content: `CÓDIGO P0128 — Temperatura del refrigerante por debajo del umbral del termostato
Sistema: Termostato / temperatura del motor
Descripción: El motor no alcanza la temperatura normal de operación en el tiempo esperado, o nunca la alcanza.
Síntomas: Temperatura del agua siempre baja (aguja en frío), consumo elevado, calefacción del habitáculo deficiente, condensación en el caño de escape.
Causas probables: Termostato pegado abierto (causa 95%), sensor ECT defectuoso.
Diagnóstico: 1) Verificar con scanner que la temperatura del refrigerante llegue a 90°C o más. 2) Si no llega, el termostato está pegado abierto. 3) Reemplazar termostato.
Solución típica: Reemplazo del termostato (causa casi exclusiva de este código).`,
  },
  {
    code: 'P0443',
    content: `CÓDIGO P0443 — Válvula de purga del sistema EVAP: circuito
Sistema: Válvula de purga del canister EVAP
Descripción: Problema en el circuito eléctrico de la válvula de purga del sistema evaporativo.
Causas probables: Válvula de purga defectuosa, cableado cortado, fusible quemado.
Diagnóstico: 1) Verificar que la válvula reciba +12V. 2) Verificar resistencia de la bobina (20-30Ω típico). 3) Activar la válvula con scanner y escuchar el clic.
Solución típica: Reemplazo de la válvula de purga EVAP.`,
  },
  {
    code: 'P0446',
    content: `CÓDIGO P0446 — Válvula de ventilación del sistema EVAP: circuito
Sistema: EVAP — válvula de ventilación del canister
Descripción: Problema en la válvula de ventilación del sistema EVAP (vent valve).
Causas probables: Válvula de ventilación defectuosa o atascada, cableado dañado, canister tapado.
Diagnóstico: 1) Verificar operación de la válvula. 2) Verificar cableado. 3) Smoke test del sistema EVAP.
Solución típica: Reemplazo de la válvula de ventilación EVAP.`,
  },
  {
    code: 'P0456',
    content: `CÓDIGO P0456 — Sistema EVAP: fuga muy pequeña detectada
Sistema: EVAP
Descripción: Fuga muy pequeña (menor a 0.5mm). Muy difícil de encontrar sin smoke test.
Causas probables: Tapa del tanque con sello desgastado, micro fisura en manguera EVAP, conector de manguera flojo.
Diagnóstico: 1) Reemplazar tapa del tanque. 2) Smoke test profesional de todo el sistema EVAP.
Solución típica: Tapa de combustible nueva o smoke test para ubicar la micro fuga.`,
  },
  // ─── Sistema de distribución variable ────────────────────────────────────────
  {
    code: 'P0014',
    content: `CÓDIGO P0014 — Árbol de levas de escape banco 1: sobreavance o atascado avanzado (VVT)
Sistema: VVT árbol de levas de escape
Descripción: El árbol de levas de escape está más avanzado de lo comandado.
Síntomas: Consumo elevado, traqueteo de cadena en frío, ralentí irregular.
Causas probables: Aceite sucio bloqueando solenoide VVT de escape, solenoide defectuoso, actuador atascado.
Diagnóstico: 1) Cambiar aceite con viscosidad correcta. 2) Limpiar o reemplazar solenoide VVT de escape.
Solución típica: Cambio de aceite + solenoide VVT.`,
  },
  {
    code: 'P0021',
    content: `CÓDIGO P0021 — Árbol de levas de admisión banco 2: sobreavance (VVT)
Sistema: VVT banco 2 árbol de admisión
Diagnóstico: Idéntico a P0011 pero para banco 2. Cambio de aceite primero.
Solución típica: Cambio de aceite + solenoide VVT banco 2.`,
  },
  // ─── Sensores de presión ─────────────────────────────────────────────────────
  {
    code: 'P0105',
    content: `CÓDIGO P0105 — Sensor MAP (presión absoluta del múltiple): mal funcionamiento
Sistema: Sensor MAP / sensor de presión del múltiple de admisión
Descripción: Problema general en el circuito del sensor MAP.
Síntomas: Motor irregular, consumo elevado, aceleración errática, posible modo de emergencia.
Causas probables: Sensor MAP defectuoso, manguera de vacío al sensor rota o desconectada, cableado dañado, conector corroído.
Diagnóstico: 1) Verificar manguera de vacío al sensor MAP. 2) Medir voltaje MAP: 1-1.5V en ralentí, ~4.5V con mariposa abierta. 3) Verificar cableado.
Solución típica: Reemplazo de manguera de vacío o sensor MAP.`,
  },
  {
    code: 'P0106',
    content: `CÓDIGO P0106 — Sensor MAP: rango/rendimiento
Sistema: Sensor MAP
Descripción: La señal del MAP no corresponde con las condiciones de carga del motor.
Causas probables: Manguera de vacío con fuga parcial, sensor MAP débil, fuga de vacío en el múltiple.
Diagnóstico: 1) Verificar manguera de vacío del MAP. 2) Medir señal en VIVO a diferentes cargas. 3) Comparar con especificaciones.
Solución típica: Reemplazo de manguera o sensor MAP.`,
  },
  {
    code: 'P0107',
    content: `CÓDIGO P0107 — Sensor MAP: señal baja
Sistema: Sensor MAP
Descripción: La señal del MAP está por debajo del mínimo. Indica alta presión o cortocircuito a masa.
Causas probables: Cortocircuito a masa en cableado, sensor defectuoso, manguera de vacío desconectada (vacío excesivo).
Diagnóstico: 1) Verificar que la manguera de vacío esté conectada. 2) Verificar cableado. 3) Reemplazar sensor.
Solución típica: Reconectar manguera de vacío o reemplazar sensor MAP.`,
  },
  {
    code: 'P0108',
    content: `CÓDIGO P0108 — Sensor MAP: señal alta
Sistema: Sensor MAP
Descripción: La señal del MAP supera el máximo (indica presión baja o circuito abierto).
Causas probables: Circuito abierto en cableado, sensor defectuoso, fuga de vacío severa.
Diagnóstico: 1) Verificar continuidad del cableado. 2) Reemplazar sensor MAP.
Solución típica: Reparación de cableado o reemplazo del sensor MAP.`,
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const shouldReset = process.argv.includes('--reset');
  const SOURCE_TAG = 'obd_codes_v1';

  console.log(`🔧 MechaIA — Seeder de Códigos OBD`);
  console.log(`📊 Total de entradas: ${OBD_CODES.length}`);

  if (shouldReset) {
    console.log('🗑️  Borrando códigos OBD existentes...');
    await supabase
      .from('knowledge_base')
      .delete()
      .eq('metadata->>source', SOURCE_TAG);
    console.log('✅ Limpio');
  }

  // Ver cuáles ya están cargados
  const { data: existing } = await supabase
    .from('knowledge_base')
    .select('metadata')
    .eq('metadata->>source', SOURCE_TAG);

  const existingCodes = new Set(
    (existing || []).map((r: any) => r.metadata?.code).filter(Boolean)
  );
  console.log(`📋 Ya cargados: ${existingCodes.size} códigos`);

  const pending = OBD_CODES.filter(c => !existingCodes.has(c.code));
  console.log(`⏳ Por cargar: ${pending.length} códigos\n`);

  let ok = 0;
  let errors = 0;

  for (let i = 0; i < pending.length; i++) {
    const entry = pending[i];
    process.stdout.write(`[${i + 1}/${pending.length}] ${entry.code} ... `);

    try {
      await sleep(250); // respetar rate limit de Google AI
      const embedding = await getEmbedding(entry.content);

      const { error } = await supabase.from('knowledge_base').insert({
        content: entry.content,
        metadata: {
          filename: `codigo-obd-${entry.code}`,
          path: `obd_codes/${entry.code}`,
          marca: 'GENERAL',
          folder: 'obd_codes',
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
  console.log(`📚 Total en base: ${existingCodes.size + ok} códigos OBD`);
}

main().catch(console.error);

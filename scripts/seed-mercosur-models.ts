#!/usr/bin/env tsx
/**
 * seed-mercosur-models.ts
 * Fallas específicas por modelo/motor para los 20 autos más comunes de Argentina/Brasil/MERCOSUR.
 * NO son códigos genéricos — son patrones reales de falla por modelo, kilometraje y síntoma.
 * Uso: npx tsx scripts/seed-mercosur-models.ts [--reset]
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
const googleApiKey = process.env.GOOGLE_AI_API_KEY || '';

if (!supabaseUrl || !supabaseKey || !googleApiKey) { console.error('❌ Faltan variables.'); process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(googleApiKey);
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
async function getEmbedding(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent({ content: { parts: [{ text }] }, outputDimensionality: 768 } as any);
  return result.embedding.values;
}

// ─── DATOS POR MODELO ─────────────────────────────────────────────────────────

const MERCOSUR_MODELS = [

  // ══════════════════════════════════════════════════════════════════════════
  // RENAULT LOGAN / SANDERO / CLIO — Motor K4M 1.6 16v
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'renault_k4m_general',
    content: `RENAULT LOGAN / SANDERO / CLIO — Motor K4M 1.6 16v (2004-2021)
Motor: K4M — 1.598cc, 16 válvulas, DOHC, inyección multipunto Sirius 32
Gestión electrónica: Sirius 32 (Sagem) o Bosch ME17

FALLAS MÁS FRECUENTES POR KILÓMETRO:
— 30.000-60.000 km: Bujías NGK BKR5EK desgastadas → P0300/P0301-P0304. Reemplazar cada 30k.
— 60.000-100.000 km: SENSOR CKP (posición cigüeñal) defectuoso → P0335, P0300, motor que no arranca o se apaga. FALLA MÁS FRECUENTE DEL K4M. Causa: vibración del motor degrada el sensor. El conector del CKP también se oxida.
— 60.000-100.000 km: Válvula IAC (control de ralentí) sucia → ralentí inestable, motor que se apaga en semáforos, sin código o P0505/P0506.
— 80.000-120.000 km: Sonda lambda upstream lenta → P0133, mayor consumo.
— 100.000-150.000 km: Junta del múltiple de admisión/plenum con fuga → P0171 (mezcla pobre), ralentí irregular.
— 100.000-150.000 km: Bobinas de encendido individuales → P0351-P0354 + misfire.
— 120.000+ km: Bomba de combustible débil → P0087, fallas bajo carga, difícil arranque en caliente.
— 150.000+ km: Distribución: correa de distribución. Cambio recomendado cada 60k km o 5 años.

ESPECIFICACIONES TÉCNICAS K4M:
Presión de combustible: 3.5 bar en reposo, 3.0 bar en marcha
Bujías: NGK BKR5EK o Renault 7700500155, separación 0.9mm
Resistencia sensor CKP: 200-400Ω
Correa de distribución: cambio cada 60.000 km o 5 años (crítico — motor interferente)
Aceite recomendado: 5W-40 API SN (1L cada 5000 km es normal en motores con km)`,
  },
  {
    id: 'renault_k4m_ckp',
    content: `RENAULT K4M — FALLA SENSOR CKP (P0335) — Diagnóstico específico
Modelos afectados: Logan, Sandero, Clio, Symbol, Kangoo con motor K4M 1.6

SÍNTOMAS TÍPICOS:
- Motor que no arranca (sin código visible porque el scanner no puede leer sin CKP)
- Motor que se apaga repentinamente mientras se conduce y vuelve a arrancar
- P0335 activo, a veces acompañado de P0300 (misfire random)
- Falla intermitente: a veces el motor anda bien, a veces se apaga
- Falla que empeora con el calor del motor (sensor térmicamente sensible)

UBICACIÓN: El sensor CKP del K4M está ubicado en la parte trasera inferior del motor, lado de la caja de cambios. Conector de 3 pines.

DIAGNÓSTICO PASO A PASO:
1) Verificar el conector del CKP — la oxidación en el conector es causa frecuente. Limpiar con limpia contactos.
2) Medir resistencia del sensor entre pines A y B: debe ser 200-400Ω. Si da infinito o 0Ω, el sensor está defectuoso.
3) Con osciloscopio: verificar señal limpia al craneado. Si hay señal pero con ruido, puede ser el reluctor.
4) Verificar el reluctor (corona dentada en el volante/cigüeñal) — buscar dientes rotos o acumulación de limaduras.
5) Verificar el espacio sensor-reluctor: 0.8-1.2mm. Si está muy alejado, la señal llega débil.

SOLUCIÓN: Reemplazar sensor CKP. Usar sensor original Renault o marca reconocida (Delphi, Bosch). Los sensores genéricos chinos fallan en semanas en este motor.
Costo aproximado: $15-30 USD. Mano de obra: 30-45 minutos.`,
  },
  {
    id: 'renault_k4m_mezcla_pobre',
    content: `RENAULT K4M — P0171 MEZCLA POBRE — Causas específicas
Modelos: Logan, Sandero, Clio, Symbol motor K4M 1.6

Cuando aparece P0171 en el K4M, el diagnóstico debe seguir este orden de probabilidad:

CAUSA 1 — JUNTA DEL PLENUM/MÚLTIPLE SUPERIOR (más frecuente):
La junta entre el plenum superior y el múltiple de admisión se degrada con el calor. La fuga es casi siempre del lado del cuerpo de mariposa. Síntoma: P0171, marcha irregular que mejora al calentarse. Solución: reemplazar junta del plenum.

CAUSA 2 — SENSOR MAF SUCIO:
El MAF del K4M se ensucia con aceite del filtro de aire si este está sobrecargado. Limpiar con limpiador MAF específico. Si el código vuelve después de limpiar, reemplazar MAF.

CAUSA 3 — MANGUERAS DE VACÍO ROTAS:
El K4M tiene varias mangueras de vacío pequeñas que se vuelven frágiles con el calor. Inspeccionar especialmente la manguera del regulador de presión de combustible y la del sensor MAP.

CAUSA 4 — VÁLVULA IAC SUCIA (secundaria al P0171):
La IAC sucia puede generar lectura de mezcla pobre en ciertos rangos de carga.

CAUSA 5 — PRESIÓN DE COMBUSTIBLE BAJA:
Verificar presión si la bomba tiene más de 100.000 km. Debe ser 3.0-3.5 bar en marcha.

DIAGNÓSTICO RÁPIDO: Spray de carburador sobre el plenum con motor en marcha — si las RPM varían, hay fuga de vacío en esa zona.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // RENAULT DUSTER — Motores K4M 1.6 y H4M 1.6
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'renault_duster_general',
    content: `RENAULT DUSTER — Motores K4M 1.6 y H4M 1.6 (2012-presente)
Gestión: Sirius 32 (K4M) / Bosch ME17 (H4M)

FALLAS ESPECÍFICAS DEL DUSTER:

MOTOR K4M (Duster 2012-2016):
Mismas fallas que Logan/Sandero K4M, más:
— Tracción 4x4: problemas en el acoplamiento Visco-Lok → ruido al doblar, tirones. No es OBD pero frecuente.
— P0335: CKP, igual que en otros K4M.
— Suspensión delantera: rótulas y bujes se gastan rápido por uso off-road.

MOTOR H4M 1.6 16v (Duster 2016+):
— Motor más moderno, cadena de distribución (no correa) — menos problemático en distribución.
— P0011/P0014: Sistema VVT — limpiar solenoides OCV si el aceite está sucio.
— P0171: Similar al K4M, verificar fugas en admisión.
— P0335/P0340: Sensores CKP y CMP — el H4M también tiene problemas con estos sensores aunque menos frecuentes que el K4M.
— Mariposa electrónica: el H4M tiene E-throttle. Limpiar cada 40-50k km.
— Consumo de aceite: algunos H4M consumen hasta 0.5L cada 1000 km por desgaste de anillos.

ESPECIFICACIONES H4M:
Aceite: 5W-40 SN/SP
Bujías: NGK PLFR5A-11 o similar, separación 1.1mm
Cadena de distribución: no tiene intervalo de cambio fijo pero inspeccionarla si hay ruido o P0016`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // VW GOL / SURAN / VOYAGE — Motor 1.6 MSI y 1.0 MPI
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'vw_gol_1_6_msi',
    content: `VW GOL / SURAN / VOYAGE / FOX — Motor 1.6 MSI (2013-presente)
Motor: EA211 1.6 MSI (Motor Spirits Injected) — 16v, cadena de distribución, DOHC, VVT simple
Gestión: Bosch MED17 / Simos 18

FALLAS MÁS FRECUENTES:
— P0011 / P0014 — SOLENOIDES VVT TAPADOS: La falla más frecuente del 1.6 MSI. Los solenoides OCV (Oil Control Valve) se tapan con barro de aceite cuando no se cambia el aceite en tiempo. Síntoma: traqueteo de cadena al arranque en frío, P0011 o P0014. SOLUCIÓN: cambio de aceite 5W-40 VW 504/507 + reemplazar los solenoides OCV.
— P0016 / P1336 — CADENA DE DISTRIBUCIÓN ELONGADA: La cadena del 1.6 MSI es conocida por elongarse temprano si el aceite no se cambia. A los 80-120k km sin mantenimiento. Síntoma: ruido de cascabel al arranque, P0016. SOLUCIÓN: kit de distribución completo.
— P0420 — CATALIZADOR: En el 1.6 MSI el P0420 frecuentemente es el sensor O2 downstream y no el catalizador. Verificar primero el sensor O2 sonda 2 antes de cambiar el catalizador.
— P1545 / P1580 — MARIPOSA ELECTRÓNICA SUCIA: La mariposa del 1.6 MSI se ensucia con carbonilla cada 30-40k km. Síntoma: marcha irregular, limp mode, ralentí inestable. Limpiar con VCDS + limpiador de mariposa. Después de limpiar, hacer adaptación básica.
— P0087 — BOMBA DE COMBUSTIBLE: A partir de los 100-120k km la bomba empieza a debilitarse. Síntoma: falla bajo carga, aceleración cortada.

ESPECIFICACIONES 1.6 MSI:
Aceite OBLIGATORIO: 5W-40 norma VW 504.00 / 507.00 (incumplir esto daña los solenoides VVT)
Bujías: NGK ILZKAR7B11 (iridio), separación 0.7mm, reemplazar cada 30k km
Solenoides OCV: resistencia aprox 6-8Ω
Cadena de distribución: sin intervalo fijo, inspeccionar con ruido o P0016`,
  },
  {
    id: 'vw_gol_1_0_mpi',
    content: `VW GOL / VOYAGE — Motor 1.0 MPI 8v (2012-presente)
Motor: EA111 1.0 MPI — 8 válvulas, SOHC, correa de distribución, sin VVT
Gestión: Bosch ME7 / Bosch Motronic

FALLAS MÁS FRECUENTES:
— P0335: Sensor CKP — falla frecuente. El 1.0 MPI tiene el CKP en posición accesible pero se degrada con vibración y calor.
— P0300-P0303: Misfires — principalmente por bujías (cada 20k km en este motor) o bobina de encendido (bobina única distribuida).
— P0171: Mezcla pobre por junta de admisión o MAF sucio.
— Correa de distribución: CAMBIO OBLIGATORIO cada 60.000 km. Motor interferente — si se rompe la correa, el motor se destruye.
— Termostato abierto: P0128 frecuente. El 1.0 MPI usa termostato económico que falla relativamente pronto.
— Válvula IAC: ralentí irregular, marcha inestable sin código.

ESPECIFICACIONES 1.0 MPI:
Bujías: NGK BKR5E, separación 0.9mm
Correa de distribución: CADA 60.000 km (motor interferente)
Aceite: 5W-30 o 5W-40 API SN
Presión de compresión: 12-14 bar por cilindro`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // VW AMAROK — Motor 2.0 TDI Biturbo
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'vw_amarok_2_0_tdi',
    content: `VW AMAROK — Motor 2.0 TDI Biturbo (EA189 / CR) 4 cilindros
Motor: EA189 / TDI — 2.0L common rail, biturbo (140CV/163CV/180CV)
Gestión: Bosch EDC17

FALLAS MÁS FRECUENTES:
— P0087 / P0088 — BOMBA DE ALTA PRESIÓN: La bomba CP4 del 2.0 TDI Amarok es sensible a combustible contaminado. Con gasoil de mala calidad (frecuente en Argentina) se desgasta prematuramente a los 80-150k km. Síntoma: dificultad para arrancar, pérdida de potencia progresiva, humo negro. SOLUCIÓN: reemplazo de bomba CP4 + limpieza del sistema de combustible + limpieza de inyectores. PREVENCIÓN: usar filtro de combustible adicional y gasoil premium.
— P0299 — TURBO VGT: El turbocompresor de geometría variable (VGT) del Amarok tiene el actuador electrónico que puede fallar. Síntoma: limp mode, falta de boost, pérdida de potencia. DIAGNÓSTICO: verificar actuador con VCDS, medir posición de las paletas.
— P2563 — ACTUADOR VGT: Similar a P0299. El actuador eléctrico del turbo VGT se desgasta. A veces se puede recalibrar con VCDS sin reemplazar.
— EGR VALVE: La válvula EGR del 2.0 TDI se tapa con carbonilla frecuentemente. Síntoma: P0400/P0401, humo negro, pérdida de potencia. Limpiar cada 80-100k km.
— INYECTORES: A partir de 150-200k km los inyectores Bosch pierden calibración. Síntoma: humo negro, consumo elevado, motor irregular. Verificar balance de inyectores.
— P0380/P0381 — CALENTADORES (glow plugs): En climas fríos, el arranque en frío falla por calentadores defectuosos.
— FILTRO DE PARTÍCULAS DPF (versiones con DPF): Obstrucción del DPF en uso urbano.

ESPECIFICACIONES:
Presión common rail: 250-1800 bar según carga
Aceite: 5W-30 norma VW 507.00 (OBLIGATORIO para DPF)
Filtro de combustible: cada 10-15k km con gasoil argentino
Torque de inyectores: 20 Nm + 90° (no reutilizar tornillos)`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CHEVROLET ONIX / PRISMA — Motor 1.4 MPFI y 1.0 Turbo
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'chevrolet_onix_1_4',
    content: `CHEVROLET ONIX / PRISMA — Motor 1.4 MPFI (2012-2020)
Motor: LDD 1.4 MPFI — 8 válvulas, SOHC, correa de distribución
Gestión: Bosch ME9 / Delphi

FALLAS MÁS FRECUENTES:
— P0300-P0304 — MISFIRES: Muy frecuentes en el 1.4 MPFI. Causas en orden: 1) Bujías desgastadas (cada 30k), 2) Bobina de encendido defectuosa (la bobina pack de 4 cilindros falla parcialmente), 3) Inyector tapado.
— P0171 — MEZCLA POBRE: La junta del múltiple de admisión se deforma con el calor. También verificar sello de la válvula PCV.
— P0507 — RALENTÍ ALTO: La válvula IAC del 1.4 se pega en posición abierta. Limpiar o reemplazar.
— P0335/P0340 — CKP/CMP: Sensores que fallan en motores con mucho km.
— COMPRESOR DE A/C: El compresor de A/C del Onix tiene una tasa de falla relativamente alta. Revisar si el A/C no enfría o hace ruido.
— P0128 — TERMOSTATO: El termostato del 1.4 MPFI falla prematuramente (pegado abierto). Síntoma: indicador de temperatura siempre bajo, consumo elevado, calefacción deficiente.
— CORREA DE DISTRIBUCIÓN: CAMBIO OBLIGATORIO cada 60.000 km. Motor interferente.

ESPECIFICACIONES:
Bujías: ACDelco R42LTSM o NGK BKR5EK
Aceite: 5W-30 dexos2 (GM specification)
Presión de compresión: 12-14 bar`,
  },
  {
    id: 'chevrolet_onix_1_0_turbo',
    content: `CHEVROLET ONIX PLUS / TRACKER — Motor 1.0 Turbo (LIH) (2020-presente)
Motor: LIH 1.0 Turbo — 3 cilindros, DOHC, inyección directa GDI + turbo
Gestión: Bosch MED17

FALLAS MÁS FRECUENTES:
— DEPÓSITO EN VÁLVULAS DE ADMISIÓN: Motor GDI (inyección directa) tiende a acumular carbonilla en las válvulas de admisión. A los 50-80k km puede causar misfires y pérdida de potencia. No hay OBD específico. Solución: limpieza con walnut blasting o carbono químico.
— P0300 — MISFIRE: En motor de 3 cilindros, el misfire es más perceptible. Verificar bujías, bobinas y presión de combustible.
— P0087 — PRESIÓN DE COMBUSTIBLE: El sistema GDI requiere alta presión. La bomba de alta presión puede debilitarse.
— P0299 — TURBO: El turbo pequeño del 1.0 puede perder eficiencia. Verificar sistema de boost y wastegate.
— CONSUMO DE ACEITE: Algunos motores 1.0 Turbo reportan consumo elevado. Verificar nivel regularmente.

ESPECIFICACIONES:
Aceite: 0W-20 dexos1 Gen2 (OBLIGATORIO — aceite liviano crítico para turbo)
Bujías: ACDelco iridio, separación 0.7mm, cada 40k km
Intervalo de aceite: 7.500 km máximo con aceite full sintético`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CHEVROLET S10 — Motor 2.8 Duramax TD
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'chevrolet_s10_2_8_duramax',
    content: `CHEVROLET S10 / TRAILBLAZER — Motor 2.8 Duramax TD (LWN/LML)
Motor: 2.8L common rail, 4 cilindros, 180CV/200CV
Gestión: Bosch EDC17

FALLAS MÁS FRECUENTES:
— P0087 — SISTEMA DE COMBUSTIBLE: El sistema common rail requiere gasoil de calidad. Con gasoil contaminado el filtro se tapa rápido y la bomba de alta presión se desgasta. PREVENCIÓN: cambiar filtro de combustible cada 10-15k km con gasoil argentino.
— P0380/P0381 — CALENTADORES: Los glow plugs se desgastan. Síntoma: arranque difícil en frío, P0380-P0384. Reemplazar en juego.
— P0191/P0192 — PRESIÓN COMMON RAIL: Sensor de presión del riel o bomba de alta presión.
— P0201-P0204 — INYECTORES: Los inyectores Bosch del Duramax son muy sensibles al combustible. A los 150-200k km pueden necesitar calibración o reemplazo.
— EGR VALVE: La válvula EGR del Duramax se tapa con carbonilla frecuentemente. Limpiar cada 80k km.
— TURBO VARIABLE: Actuador VGT puede fallar → P0299. En Argentina, suciedad del sistema de admisión afecta las paletas.
— JUNTA DE CULATA: Reportes de fuga de junta en motores con alta temperatura de operación por refrigerante bajo.

ESPECIFICACIONES:
Aceite: 5W-30 dexos2 (OBLIGATORIO para DPF en versiones con filtro)
Filtro de combustible: cada 10.000 km máximo
Presión common rail: 200-1800 bar
Glow plugs: verificar resistencia individual (aprox 0.5-1Ω)`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // TOYOTA COROLLA — Motor 2ZR-FE 1.8
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'toyota_corolla_2zr',
    content: `TOYOTA COROLLA — Motor 2ZR-FE 1.8 16v (2008-2019)
Motor: 2ZR-FE — 1.8L, 16v, DOHC, cadena de distribución, VVT-i dual (DVVT)
Gestión: Toyota ETCS-i (Bosch)

FALLAS MÁS FRECUENTES:
— P1349 / P0011 / P0014 — VVT-i SOLENOIDES (OCV): La falla más frecuente del 2ZR-FE. Los solenoides OCV (Oil Control Valve) de los árboles de levas se tapan con barro de aceite. El aceite sucio o de viscosidad incorrecta es la causa. SÍNTOMA: P1349 o P0011, traqueteo al arranque, limp mode en algunos casos. SOLUCIÓN: cambio de aceite 0W-20 o 5W-30 Toyota Genuine + reemplazar solenoides OCV (hay 2: admisión y escape). Costo: $30-60 USD el par. IMPORTANTE: usar aceite de viscosidad correcta.
— CONSUMO DE ACEITE 2ZR-FE: Este motor tiene un problema documentado de consumo de aceite en ciertas producciones (2007-2011 especialmente). Puede consumir 1L cada 2000-3000 km. Toyota extendió la garantía en algunos países. Causa: anillos de aceite que no sellan correctamente. En motores con este problema: verificar nivel regularmente, limpiar válvula PCV.
— P0304 — MISFIRE CILINDRO 4: El cilindro 4 del 2ZR es el más propenso a misfire por bobinas. Intercambiar bobinas para confirmar.
— P0420 — CATALIZADOR: A partir de los 150-200k km el catalizador pierde eficiencia.
— CADENA DE DISTRIBUCIÓN: Generalmente confiable si se cambia el aceite. Si hay ruido de cadena o P0016, verificar elongación y tensionador.
— P0335/P0340 — SENSORES CKP/CMP: Menos frecuentes que en otras marcas pero ocurren.

ESPECIFICACIONES:
Aceite OBLIGATORIO: 0W-20 Toyota Genuine o equivalente API SN/SP (viscosidad crítica para VVT)
Bujías: NGK DILKAR7B11 iridio, cada 80k km (recomendación Toyota)
Cadena distribución: sin intervalo fijo, inspeccionar a los 100k km
Solenoides OCV: resistencia 6.9-7.9Ω a 20°C`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // TOYOTA HILUX — Motores diesel 2KD-FTV y 1GD-FTV
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'toyota_hilux_2kd',
    content: `TOYOTA HILUX / SW4 — Motor 2KD-FTV 2.5 D4-D (2005-2015)
Motor: 2KD-FTV — 2.5L common rail, 4 cilindros, 144CV (N70)
Gestión: Toyota EDU (Denso)

FALLAS MÁS FRECUENTES:
— P0087 — BOMBA DE COMBUSTIBLE ALTA PRESIÓN: La bomba HP3 de Denso se desgasta con gasoil contaminado. Síntoma: arranque difícil en caliente, pérdida de potencia en carga, P0087. CRÍTICO: cambiar filtro de combustible cada 10.000 km con gasoil argentino.
— P0380-P0384 — CALENTADORES: Los glow plugs del 2KD fallan alrededor de los 80-100k km. Arranque difícil en frío. Medir resistencia individual.
— P0191/P0192 — PRESIÓN COMMON RAIL: Sensor del riel defectuoso o desgaste de bomba.
— JUNTA DE CULATA — PROBLEMA CONOCIDO 2KD-FTV: El motor 2KD-FTV tiene un problema documentado de fuga de junta de culata, especialmente en producciones 2005-2010. Síntoma: pérdida de refrigerante sin fuga visible, burbujas en el recipiente de expansión, humo blanco, motor que se sobrecalienta. DIAGNÓSTICO: test de gases de combustión en el refrigerante (kit Combustion Leak Tester).
— P0201-P0204 — INYECTORES: Desgaste a partir de 150-200k km. Verificar balance de inyectores.
— EGR VALVE: Tapa con carbonilla. Síntoma: P0400/P0401, humo negro, pérdida de potencia.
— TURBO: Las paletas del VGT se empastran con hollín en uso urbano. Limpiar o recalibrar.

ESPECIFICACIONES:
Filtro de combustible: CADA 10.000 km (crítico en Argentina)
Aceite: 5W-30 o 15W-40 API CF-4/CH-4
Torque culata: 90 Nm + 90° (usar tornillos nuevos)`,
  },
  {
    id: 'toyota_hilux_1gd',
    content: `TOYOTA HILUX / SW4 — Motor 1GD-FTV 2.8 D4-D (2015-presente)
Motor: 1GD-FTV — 2.8L common rail, 4 cilindros, 177CV (N80)
Gestión: Toyota EDU (Denso)

FALLAS MÁS FRECUENTES:
— P0087 — BOMBA DE ALTA PRESIÓN: Similar al 2KD, la bomba HP4 es sensible al combustible. Con gasoil de mala calidad o filtro de combustible sucio, la bomba se desgasta. La diferencia con el 2KD: la bomba HP4 es más costosa de reemplazar.
— P0191 — PRESIÓN COMMON RAIL: El sensor de presión del riel o regulador de presión pueden fallar.
— GLOW PLUGS (P0380-P0384): Igual que el 2KD, los calentadores fallan.
— P0299 — TURBO VGT: El actuador del turbo puede fallar. El 1GD tiene turbo de geometría variable eléctrico.
— DPF (FILTRO DE PARTÍCULAS): Las versiones con DPF (diesel particulate filter) se obstruyen con uso urbano. SÍNTOMA: luz DPF, pérdida de potencia, aumento del nivel de aceite (dilución por regeneración). SOLUCIÓN: regeneración forzada o reemplazo del DPF.
— INYECTORES: A partir de 200k km, los inyectores Denso pueden perder calibración. Verificar retorno de inyectores.
— EGR VALVE + EGR COOLER: El EGR cooler puede desarrollar fuga interna → refrigerante en gases de escape.

ESPECIFICACIONES:
Filtro de combustible: CADA 10.000 km (crítico)
Aceite: 0W-30 o 5W-30 Toyota Genuine con especificación DL-1 (si tiene DPF)
Presión common rail mínima en arranque: 50-100 bar
Presión common rail en carga: hasta 2000 bar`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // FORD KA / FIESTA — Motor 1.5 Ti-VCT Dragon y 1.6 Sigma
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'ford_ka_dragon_1_5',
    content: `FORD KA / KA+ — Motor 1.5 Ti-VCT "Dragon" 3 cilindros (2014-2022)
Motor: Dragon 1.5 — 3 cilindros, 12v o 16v, cadena de distribución, VCT (Variable Cam Timing)
Gestión: Bosch ME17 / Ford PCM

FALLAS MÁS FRECUENTES — MOTOR DRAGON (PROBLEMAS CONOCIDOS):
— CADENA DE DISTRIBUCIÓN RUIDOSA / ELONGADA — PROBLEMA DOCUMENTADO: El motor Dragon 1.5 tiene un problema conocido y documentado con la elongación prematura de la cadena de distribución. A los 40.000-80.000 km sin mantenimiento estricto (o incluso con él) la cadena se alarga. SÍNTOMA: ruido de cascabel al arranque en frío, P0016 o P0011, P0341. Ford reconoció el problema y extendió garantías en algunos mercados. SOLUCIÓN: kit de distribución completo (cadena + tensionador + guías). PREVENCIÓN: cambio de aceite cada 5.000 km máximo con aceite 5W-30 SN o superior.
— P0016 — CORRELACIÓN CKP-CMP: Consecuencia directa de la cadena elongada. Pérdida de potencia, consumo elevado.
— P0011 / P0014 — VCT: Sistema de variación de fase afectado por la cadena o solenoides sucios.
— CONSUMO DE ACEITE: El motor Dragon tiene reportes de consumo de aceite mayor al esperado (válvula PCV, anillos).
— P0300-P0302 — MISFIRES: En 3 cilindros es muy perceptible. Bujías, bobinas o inyectores.
— P0335 — CKP: Sensor de cigüeñal que falla en algunos motores con km avanzado.

ESPECIFICACIONES:
Aceite OBLIGATORIO: 5W-30 WSS-M2C913-D o equivalente Ford
Intervalo de aceite: MÁXIMO 5.000 km (este motor es muy sensible)
Bujías: Motorcraft SP-515 o NGK equivalente iridio, separación 0.75mm
Cadena de distribución: inspeccionar desde los 60.000 km`,
  },
  {
    id: 'ford_ranger_3_2_tdci',
    content: `FORD RANGER — Motor 3.2 TDCi Duratorq 5 cilindros (2012-2022)
Motor: P5AT 3.2 TDCi — 5 cilindros, 200CV, common rail
Gestión: Bosch EDC17

FALLAS MÁS FRECUENTES:
— EGR VALVE ATASCADA: La válvula EGR del 3.2 TDCi se tapa con carbonilla frecuentemente, especialmente en uso urbano. SÍNTOMA: P0400, P0401, humo negro, pérdida de potencia. SOLUCIÓN: limpieza cada 60-80k km.
— P0087 — BOMBA COMBUSTIBLE: La bomba Bosch CP3 del 3.2 TDCi es sensible al gasoil de mala calidad. El filtro de combustible debe cambiarse cada 10-15k km.
— P0380-P0384 — GLOW PLUGS: Los calentadores del 3.2 fallan en climas fríos, especialmente en la Patagonia. Medir resistencia individual.
— TURBO VGT: El actuador del turbo puede fallar → P0299. Las paletas del VGT se empastran en uso urbano.
— INYECTORES: A partir de 150-200k km los inyectores Bosch pierden calibración. Síntoma: humo negro, ralentí irregular.
— FILTRO DE PARTÍCULAS DPF: Las versiones 2015+ con DPF se obstruyen en uso urbano. Usar regeneración forzada preventivamente.
— COMPRESOR A/C: Falla relativamente frecuente en unidades con muchos km.

ESPECIFICACIONES:
Filtro combustible: cada 10.000 km (crítico en Argentina)
Aceite: 5W-30 Ford WSS-M2C913 (con DPF)
Presión common rail máx: 1800 bar`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // PEUGEOT 208 / 2008 / 308 — Motor 1.6 VTi (EP6) y 1.6 HDi
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'peugeot_ep6_1_6_vti',
    content: `PEUGEOT 208 / 2008 / 308 / PARTNER — Motor 1.6 VTi EP6 (Prince Engine)
Motor: EP6C / EP6DT — 1.6L, 16v, DOHC, cadena de distribución, VVT dual (Valvetronic opcional)
Gestión: Bosch ME7.4.5 / Siemens/Continental EMS3110

MOTOR CONOCIDO POR PROBLEMAS — EP6 tiene fallas documentadas:

— CADENA DE DISTRIBUCIÓN — FALLA CRÍTICA FRECUENTE: El EP6 tiene una tasa de falla de cadena de distribución muy alta comparado con otros motores. La cadena y el tensionador (especialmente el tensor primario) se deterioran rápidamente. SÍNTOMA: ruido de cascabel al arranque, P0016, P0011, P0014, P0340. En casos severos el motor puede sufrir daño catastrófico. SOLUCIÓN: kit completo de distribución (cadena primaria + secundaria + tensionadores + guías). Esto incluye el sello de la tapa de distribución que suele tener fuga de aceite.
— CONSUMO DE ACEITE EXCESIVO: El EP6 puede consumir 1L cada 1000-2000 km. Causas: válvulas de admisión con guías desgastadas, anillos de aceite, válvula PCV defectuosa.
— DEPÓSITO DE CARBONO EN VÁLVULAS: Con consumo de aceite o uso corto. Puede causar misfires y pérdida de potencia.
— P0420 — CATALIZADOR: Degradación acelerada por consumo de aceite.
— P1340 — CORRELACIÓN CKP/CMP: Directo de la cadena elongada.
— BOBINAS DE ENCENDIDO: Las bobinas del EP6 fallan con más frecuencia que la media.
— FUGA DE ACEITE TAPA DISTRIBUCIÓN: Prácticamente universal en motores con km.

ADVERTENCIA: Ante cualquier ruido de distribución en EP6, PRIORIZAR reparación. La cadena puede saltar y destruir el motor.

ESPECIFICACIONES:
Aceite: 5W-30 PSA B71 2290 o equivalente (Longlife). NUNCA usar aceite convencional.
Intervalo de aceite: máximo 10.000 km con sintético (no estirar el intervalo)
Bujías: NGK ILZKR7B-10 o similar, separación 1.0mm`,
  },
  {
    id: 'peugeot_hdi_1_6',
    content: `PEUGEOT 208 / 308 / PARTNER — Motor 1.6 HDi (DV6)
Motor: DV6 — 1.560cc, 4 cilindros, common rail, 90CV/110CV
Gestión: Bosch EDC16 / Siemens SID

FALLAS MÁS FRECUENTES:
— EGR VALVE ATASCADA: La válvula EGR del DV6 es notoriamente propensa a atascarse con carbonilla en uso urbano. SÍNTOMA: P0400, P0401, humo negro, pérdida de potencia, ralentí irregular. SOLUCIÓN: limpieza cada 60k km o reemplazo.
— P1340 / P0016 — CADENA DE DISTRIBUCIÓN: El DV6 también tiene la cadena en el lado del volante (no de los accesorios). Se elongan. Ruido al arranque en frío.
— P0087 — BOMBA COMBUSTIBLE: La bomba Bosch CP1 del DV6 se desgasta con gasoil contaminado o filtro sucio.
— P0380/P0381 — CALENTADORES: Los glow plugs fallan especialmente en climas fríos.
— FILTRO DPF OBSTRUIDO (modelos DPF): En uso urbano el DPF se obstruye. Necesita regeneración activa cada 500-800 km de ciclo corto. SÍNTOMA: luz DPF, pérdida de potencia severa.
— TURBO: El actuador del turbo variable puede fallar → P0299.
— SENSOR MAP/BOOST: P0106, señal incorrecta de presión de sobrealimentación.

ESPECIFICACIONES:
Filtro combustible: cada 15.000 km
Aceite: 5W-30 norma PSA B71 2290 (con especificación DPF)
EGR: limpiar cada 60.000 km preventivamente`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CITROËN C3 / C4 / BERLINGO — Motores VTi y HDi
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'citroen_c3_c4_general',
    content: `CITROËN C3 / C4 / BERLINGO — Motores VTi 1.6 (EP6) y HDi 1.6 (DV6)
Mismos motores que Peugeot 208/308. Ver fichas de EP6 y DV6 para fallas detalladas.

PARTICULARIDADES CITROËN:
— BSI (Boîtier de Servitude Intelligent): El módulo BSI de Citroën es el centro de comunicación de todo el vehículo. Los problemas de comunicación entre BSI y otros módulos generan múltiples códigos U (U0140, U0155, etc.). Síntoma: múltiples luces simultáneas, funciones que no responden. El BSI es sensible a sobretensiones. SOLUCIÓN: verificar alimentación del BSI, actualización de software, o reemplazo.
— PANTALLA TÁCTIL / NAV: Las pantallas de los C4 fallan frecuentemente. No es OBD pero es queja frecuente.
— MOTOR ELÉCTRICO DE VIDRIOS: Reguladores de ventana delantera con alta tasa de falla.
— SISTEMA DE SUSPENSIÓN HYDROPNEUMATIQUE (C5/C6 con suspensión hidráulica): Problemas específicos de la esfera de suspensión y la bomba hidráulica.

Para fallas específicas del motor: ver fichas EP6 VTi y DV6 HDi.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // FIAT CRONOS / ARGO / UNO / PALIO — Motores FireFly y Fire Evo
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'fiat_firefly_1_0_1_3',
    content: `FIAT CRONOS / ARGO / PULSE / TORO — Motor 1.0 y 1.3 FireFly Flex (2017-presente)
Motor: FireFly 1.0 (55kW) y 1.3 (72kW) — 3/4 cilindros, DOHC, cadena distribución, inyección directa + multipunto (flex fuel en Brasil)
Gestión: Marelli MJD (1.0) / Bosch ME17 (1.3)

FALLAS MÁS FRECUENTES:
— P0300-P0303 — MISFIRES: Bujías o bobinas. Las bujías del FireFly deben cambiarse cada 30k km. Las bobinas individuales pueden fallar individualmente.
— SISTEMA FLEX FUEL (Brasil): Sensor de composición de combustible (etanol/gasolina). Si falla → P0178/P0179. El motor puede funcionar mal con la mezcla incorrecta calculada.
— P0171/P0172 — CONTROL DE MEZCLA: El sistema flex fuel requiere ajustes precisos. El sensor O2 trabaja con ambos combustibles.
— P0335 — CKP: Falla en motores con más km, aunque menos frecuente que en motores Renault.
— MARIPOSA ELECTRÓNICA: El FireFly tiene E-throttle. Limpiar cada 40k km.
— P0128 — TERMOSTATO: El termostato electrónico del FireFly puede fallar (pegado abierto o cerrado).
— CONSUMO DE ACEITE ANORMAL: Algunos FireFly reportan consumo. Verificar válvula PCV.

ESPECIFICACIONES:
Aceite: 5W-30 full sintético API SN o superior
Bujías: Bosch o NGK, cada 30.000 km
En Brasil: verificar sensor de combustible flex cada 60k km`,
  },
  {
    id: 'fiat_fire_evo_1_4',
    content: `FIAT UNO / PALIO / STRADA / SIENA — Motor 1.4 Fire Evo (2010-2019)
Motor: 1.4 Fire Evo — 8 válvulas, SOHC, correa de distribución
Gestión: IAW 4CF o IAW 5NF (Marelli)

FALLAS MÁS FRECUENTES:
— P0335 / P1335 — SENSOR CKP: El sensor CKP del Fire Evo falla frecuentemente por vibración y calor. También es común el problema con el conector del sensor que se oxida. SÍNTOMA: motor que no arranca, se apaga, P0335.
— P0171 — MEZCLA POBRE: Fuga de vacío en la junta de admisión (muy frecuente en motores con km). El plástico de la junta se deforma con el calor.
— BOBINA DE ENCENDIDO: El Fire Evo usa bobina de encendido centralizada con cables de alta tensión. Los cables se degradan y generan misfires. P0300-P0304.
— VÁLVULA IAC SUCIA: Ralentí inestable sin código. Limpiar con limpiador de carburador.
— CORREA DE DISTRIBUCIÓN: CAMBIO OBLIGATORIO cada 60.000 km. Motor interferente — si se rompe, el motor se destruye.
— BOMBA DE COMBUSTIBLE: A partir de 120k km puede debilitarse.
— INYECTORES SUCIOS: Con combustible de mala calidad, los inyectores se tapan. Limpieza cada 60k km.

ESPECIFICACIONES:
Correa de distribución: CADA 60.000 km con kit completo
Bujías: NGK BKR5EK o Bosch FR8DC, separación 0.9mm
Aceite: 5W-40 API SN`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // NISSAN FRONTIER / NP300 — Motor 2.5 YD25 y 2.3 dCi
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'nissan_frontier_yd25',
    content: `NISSAN FRONTIER / NP300 — Motor 2.5 YD25DDTi (2004-2017)
Motor: YD25DDTi — 2.5L common rail, 4 cilindros, 190CV
Gestión: Bosch EDC16

FALLAS MÁS FRECUENTES:
— EGR VALVE — PROBLEMA CONOCIDO: La válvula EGR del YD25 se atasca con carbonilla con extrema frecuencia. SÍNTOMA: P0401, humo negro, pérdida de potencia, ralentí irregular. Muchos mecánicos optan por desactivar/bloquear la EGR como solución definitiva en mercados sin inspección estricta de emisiones. SOLUCIÓN correcta: limpieza cada 40-60k km.
— EGR COOLER CON FUGA: El refrigerador EGR puede desarrollar fuga interna → mezcla de refrigerante con gases. Síntoma: nivel de refrigerante que baja, humo blanco del escape.
— JUNTA DE CULATA — PROBLEMA CONOCIDO YD25: El motor YD25 tiene una tasa de falla de junta de culata significativamente mayor que la media. Especialmente en motores que han sufrido sobrecalentamiento por EGR o sistema de refrigeración deficiente. SÍNTOMA: nivel de refrigerante que baja sin fuga visible, burbujas en depósito de expansión, humo blanco por el escape.
— P0087 — BOMBA DE COMBUSTIBLE: Con gasoil de mala calidad se desgasta pronto.
— INYECTORES: Desgaste a partir de 150k km.
— TURBO VGT: Paletas que se empastran → P0299.
— P0380-P0384 — CALENTADORES: Falla especialmente en climas fríos.

ESPECIFICACIONES:
Filtro combustible: cada 10.000 km
Aceite: 5W-40 API CI-4
Verificar level de refrigerante: muy importante en este motor`,
  },
  {
    id: 'nissan_frontier_2_3_dci',
    content: `NISSAN FRONTIER / NP300 — Motor 2.3 dCi (R9M) (2017-presente)
Motor: R9M 2.3 dCi — 4 cilindros biturbo, 190CV, desarrollado con Renault
Gestión: Continental/Siemens SID310

FALLAS MÁS FRECUENTES:
— EGR VALVE: Igual que YD25, la EGR se tapa frecuentemente.
— P0087 — SISTEMA DE COMBUSTIBLE: La bomba de alta presión es sensible al gasoil.
— TURBO BITURBO VARIABLE: El sistema biturbo (turbo pequeño + turbo grande en secuencia) puede presentar problemas con el actuador de bypass entre turbos.
— DPF (Filtro de partículas): Las versiones más recientes tienen DPF que necesita regeneración activa.
— CADENA DE DISTRIBUCIÓN: El R9M tiene cadena. Ruido si el aceite no se cambia correctamente.
— P0380 — CALENTADORES: Similar a otros diesel.

ESPECIFICACIONES:
Aceite: 5W-30 con especificación Renault RN0720 o equivalente
Filtro combustible: cada 10.000 km`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // HONDA HR-V / CITY / FIT — Motor 1.5 L15 VTEC
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'honda_l15_vtec',
    content: `HONDA HR-V / CITY / FIT / WR-V — Motor 1.5 L15B VTEC (2015-presente)
Motor: L15B — 1.5L, 16v, DOHC, cadena de distribución, i-VTEC, inyección multipunto
Gestión: Honda PGM-FI (Bosch)

FALLAS MÁS FRECUENTES:
— P0341 / P0343 — SENSOR CMP: El sensor de posición del árbol de levas puede fallar, especialmente en motores con mucho km. Síntoma: arranque irregular, P0341.
— SISTEMA VTEC — P1259: Problema en el sistema de control de válvulas VTEC. Causas: aceite sucio o de nivel bajo (el VTEC es hidráulico), solenoide VTEC defectuoso. SOLUCIÓN: cambio de aceite + verificar solenoide VTEC.
— P0420 — CATALIZADOR: Después de 150-200k km.
— TRANSMISIÓN CVT (HR-V/FIT): La transmisión CVT Honda tiene su propio aceite específico (Honda HCF-2). Si no se cambia cada 40k km, genera ruidos y resbalamiento. No genera OBD específico hasta que la falla es avanzada.
— P0171 — MEZCLA POBRE: Fuga de vacío o MAF sucio.
— BOBINAS DE ENCENDIDO: Fallan con más km, especialmente en climas húmedos.
— COMPRESOR DE A/C: Falla relativamente frecuente en HR-V de primera generación.

ESPECIFICACIONES:
Aceite: 0W-20 Honda Genuine o equivalente SN/SP (viscosidad crítica para VTEC)
Bujías: NGK IFR6G-11KS iridio, cada 60-80k km
Aceite CVT: Honda HCF-2 CADA 40.000 km (no usar ATF estándar)`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // HYUNDAI HB20 / CRETA / TUCSON — Motores 1.0 Turbo y 1.6 DOHC
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'hyundai_hb20_1_0_turbo',
    content: `HYUNDAI HB20 / CRETA / TUCSON — Motor 1.0 T-GDI Kappa (2019-presente)
Motor: Kappa 1.0 T-GDI — 3 cilindros, DOHC, inyección directa GDI + turbo, 120CV
Gestión: Bosch ME17

FALLAS MÁS FRECUENTES:
— DEPÓSITO DE CARBONO EN VÁLVULAS (GDI): Motor de inyección directa. Sin el lavado de válvulas de la inyección multipunto, las válvulas de admisión acumulan carbonilla. A los 50-80k km puede causar misfires. No genera OBD específico. SOLUCIÓN: limpieza con walnut blasting o químico preventivo.
— P0299 — TURBO: El turbo pequeño puede tener problemas con el actuador de la wastegate. Verificar boost en datos en vivo.
— P0087 — PRESIÓN DE COMBUSTIBLE GDI: El sistema GDI necesita alta presión en el riel directo. La bomba de alta presión puede debilitarse.
— P0300 — MISFIRES: En 3 cilindros muy perceptible. Bujías, bobinas o inyectores.
— TRANSMISIÓN DCT (Doble Embrague): El DCT del HB20/Creta necesita aceite específico (Hyundai SP-IV-RR). El actuador del embrague puede fallar → traqueteo al partir.
— SENSOR CKP/CMP: Menos frecuente pero ocurre.

ESPECIFICACIONES:
Aceite: 5W-30 SP o 0W-20 SN (según año)
Bujías: NGK LKAR7CHX-9 o similar iridio, cada 60k km
Aceite DCT: Hyundai SP-IV-RR CADA 40.000 km`,
  },
  {
    id: 'hyundai_1_6_dohc',
    content: `HYUNDAI HB20 / ACCENT / i30 — Motor 1.6 MPI Gamma (2012-2020)
Motor: Gamma 1.6 MPI — 4 cilindros, 16v, DOHC, cadena de distribución, inyección multipunto
Gestión: Bosch ME17 / Kefico

FALLAS MÁS FRECUENTES:
— P0011/P0014 — CVVT (Continuously Variable Valve Timing): El sistema CVVT es el VVT de Hyundai. Los solenoides CVVT se tapan con aceite sucio. Síntoma: traqueteo al arranque, P0011, pérdida de potencia. SOLUCIÓN: cambio de aceite + reemplazar solenoides si persiste.
— P0335/P0340 — CKP/CMP: Sensores que fallan especialmente en motores con mucho km.
— P0171 — MEZCLA POBRE: Fuga de vacío en mangueras o junta de admisión.
— P0420 — CATALIZADOR: Después de 150k km.
— BOBINAS DE ENCENDIDO: Fallan individualmente. Intercambiar para identificar.
— CADENA DE DISTRIBUCIÓN: Generalmente confiable si se cambia el aceite. Inspeccionar si hay ruido.

ESPECIFICACIONES:
Aceite: 5W-20 o 5W-30 GF-5/SN
Bujías: NGK IFR6T11 iridio, cada 60k km
Solenoides CVVT: resistencia 6.9-7.9Ω`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // VW POLO / VIRTUS — Motor 1.0 TSI y 1.6 MSI
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'vw_polo_virtus_1_0_tsi',
    content: `VW POLO / VIRTUS / T-CROSS — Motor 1.0 TSI (EA211 evo)
Motor: EA211 1.0 TSI — 3 cilindros, 16v, DOHC, cadena de distribución, GDI + turbo, 116CV
Gestión: Bosch MED17 / Simos 18.10

FALLAS MÁS FRECUENTES:
— DEPÓSITO DE CARBONO EN VÁLVULAS (GDI): Motor de inyección directa (DI). Las válvulas de admisión acumulan carbono entre 50-100k km. Síntoma: misfires (P0300-P0302), pérdida de potencia, ralentí irregular. Limpiar con walnut blast o químico preventivo.
— P0011/P0014 — VVT SOLENOIDES: Igual que el 1.6 MSI, los solenoides OCV se tapan si el aceite no es el correcto.
— P1693 / P0299 — TURBO: El actuador de la wastegate (válvula N75/N249) puede fallar → pérdida de boost.
— P0087 — PRESIÓN GDI: La bomba de alta presión del sistema GDI puede debilitarse.
— CADENA DE DISTRIBUCIÓN: Menos problemática que el 1.6 MSI pero inspeccionar si hay ruido o P0016.
— P1545/P1580 — MARIPOSA ELECTRÓNICA: Limpiar y adaptar con VCDS cada 40-50k km.

ESPECIFICACIONES:
Aceite OBLIGATORIO: 0W-20 norma VW 508.00 / 509.00 (aceite liviano específico)
Bujías: NGK PFR7S8EG iridio, separación 0.75mm, cada 40k km`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DIAGNÓSTICO FLEX FUEL — BRASIL
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'flex_fuel_brasil',
    content: `MOTORES FLEX FUEL — BRASIL (etanol E25 a E100)
Modelos: Todos los vehículos flex vendidos en Brasil (Onix, HB20, Ka, Argo, Cronos, Polo, etc.)

LOS MOTORES FLEX FUEL TIENEN COMPONENTES ADICIONALES:
— Sensor de composición del combustible (ECS/FFS): mide la concentración de etanol/gasolina en el combustible. Si falla → P0178 (señal baja) o P0179 (señal alta). Síntoma: motor con ajuste de mezcla incorrecto, mayor consumo, arranque difícil en frío con E100.
— Inyectores de mayor flujo: los inyectores flex deben fluir más que los de gasolina pura. Si se cambian por inyectores no flex, el motor pierde potencia con E100.
— Sonda lambda wideband: el rango de lectura es más amplio para manejar ambos combustibles.

DIAGNÓSTICO ESPECÍFICO FLEX:
— P0178: Señal del sensor de etanol baja → verificar sensor y cableado
— P0179: Señal del sensor de etanol alta → verificar sensor y cableado
— Motor que consume mucho con E100: verificar calibración de inyectores y sensor de composición
— Arranque difícil en frío con etanol puro: normal con temperaturas bajo 15°C. Algunos tienen calentador de combustible.

MANTENIMIENTO ESPECIAL FLEX:
— Si el vehículo estará parado más de 30 días: usar gasolina pura para evitar problemas de arranque y oxidación
— Los inyectores flex son más costosos pero no deben reemplazarse por inyectores de gasolina`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DIAGNÓSTICO GENERAL MERCOSUR
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'mercosur_gasoil_calidad',
    content: `CALIDAD DE COMBUSTIBLE EN ARGENTINA/MERCOSUR — Impacto en diagnóstico diesel

PROBLEMA DOCUMENTADO: El gasoil distribuido en Argentina tiene mayor contenido de azufre y peores índices de lubricidad que el gasoil europeo. Esto acelera el desgaste de:
— Bombas de alta presión (CP3, CP4, HP3, HP4)
— Inyectores de precisión
— Reguladores de presión del common rail

CONSECUENCIAS TÍPICAS:
— Bombas de alta presión fallan 30-50% antes que en Europa
— P0087 (baja presión) es extremadamente frecuente en diesel argentinos
— Los inyectores se desgastan más rápido → pérdida de atomización, humo negro

RECOMENDACIONES PARA DIAGNÓSTICO EN ARGENTINA:
1) Siempre cambiar el filtro de combustible ante cualquier síntoma de baja presión
2) Medir presión del common rail antes de diagnosticar inyectores o bomba
3) En Patagonia y zonas frías: el gasoil de invierno es esencial para evitar parafinas
4) El gasoil premium (YPF Infinia Diesel, Shell V-Power Nitro+) tiene mejores aditivos — recomendarlo a clientes con motores de alta tecnología (Amarok, Hilux, Ranger)
5) Agua en combustible: frecuente en surtidores con mantenimiento deficiente. El separador de agua del filtro debe purgarse regularmente.`,
  },
  {
    id: 'mercosur_temperatura_diagnostico',
    content: `DIAGNÓSTICO EN CLIMAS EXTREMOS — ARGENTINA (Patagonia, NOA, Cuyo)

PATAGONIA (temperaturas bajo cero):
— Motores diesel: el gasoil puede parafinar con temperaturas bajo -5°C. El gasoil de invierno tiene menor punto de nube.
— Baterías: se descargan rápido. P0562 (voltaje bajo) frecuente en invierno.
— Glow plugs: falla más notable en frío. P0380-P0384.
— Aceites viscosos: si el aceite no es el correcto para bajas temperaturas, el arranque es difícil y el desgaste mayor.
— Mangueras de caucho: se agrietan más rápido por ciclos térmicos.

NOA Y CUYO (calor extremo, altitud):
— Temperatura: motores trabajan cerca del límite térmico. Sistema de refrigeración debe estar en perfecto estado.
— Altitud Cuyo/NOA (1500-4000m): El sensor MAP debe compensar la presión barométrica baja. En motores sin MAP, el PCM puede no compensar bien → mezcla rica.
— A/C: trabaja más → más carga eléctrica → alternadores se desgastan más rápido.
— Turbo: menos presión atmosférica → el turbo trabaja más.

LITORAL Y MESOPOTAMIA (humedad extrema):
— Corrosión en conectores y cableado acelerada.
— Sensores de O2 contaminados más rápido.
— Bujías con carbón acumulado más rápido.`,
  },

];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const shouldReset = process.argv.includes('--reset');
  const SOURCE_TAG = 'mercosur_models_v1';

  const entries = MERCOSUR_MODELS.filter(e => e.content.trim().length > 0);

  console.log(`🔧 MechaIA — Seeder Modelos MERCOSUR`);
  console.log(`🚗 Modelos y fichas: ${entries.length}`);

  if (shouldReset) {
    await supabase.from('knowledge_base').delete().eq('metadata->>source', SOURCE_TAG);
    console.log('🗑️  Reset completado');
  }

  const { data: existing } = await supabase
    .from('knowledge_base').select('metadata').eq('metadata->>source', SOURCE_TAG);
  const existingIds = new Set((existing || []).map((r: any) => r.metadata?.code).filter(Boolean));

  const pending = entries.filter(e => !existingIds.has(e.id));
  console.log(`📋 Ya cargados: ${existingIds.size} | Por cargar: ${pending.length}\n`);

  let ok = 0, errors = 0;

  for (let i = 0; i < pending.length; i++) {
    const entry = pending[i];
    process.stdout.write(`[${i + 1}/${pending.length}] ${entry.id} ... `);
    try {
      await sleep(250);
      const embedding = await getEmbedding(entry.content);

      // Inferir marca del ID
      const marca =
        entry.id.startsWith('renault') ? 'RENAULT' :
        entry.id.startsWith('vw') ? 'VW' :
        entry.id.startsWith('chevrolet') ? 'CHEVROLET' :
        entry.id.startsWith('toyota') ? 'TOYOTA' :
        entry.id.startsWith('ford') ? 'FORD' :
        entry.id.startsWith('peugeot') ? 'PEUGEOT' :
        entry.id.startsWith('citroen') ? 'CITROEN' :
        entry.id.startsWith('fiat') ? 'FIAT' :
        entry.id.startsWith('nissan') ? 'NISSAN' :
        entry.id.startsWith('honda') ? 'HONDA' :
        entry.id.startsWith('hyundai') ? 'HYUNDAI' : 'GENERAL';

      const { error } = await supabase.from('knowledge_base').insert({
        content: entry.content,
        metadata: {
          filename: entry.id,
          path: `mercosur_models/${entry.id}`,
          marca,
          folder: 'mercosur_models',
          source: SOURCE_TAG,
          code: entry.id,
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

  console.log(`\n🏁 Listo: ${ok} fichas insertadas, ${errors} errores`);
  const { count } = await supabase.from('knowledge_base').select('*', { count: 'exact', head: true });
  console.log(`📚 Total knowledge_base: ${count} entradas`);
}

main().catch(console.error);

#!/usr/bin/env tsx
/**
 * seed-mercosur-batch2.ts
 * Batch 2: Kia, Mitsubishi, Jeep, Suzuki, camiones (Iveco, MB Sprinter, VW Delivery),
 * maquinaria agrícola, eléctrico/transponder extendido, sistemas de frenos ABS.
 * Uso: npx tsx scripts/seed-mercosur-batch2.ts
 */

import fs from 'fs';
import path from 'path';

const envFile = path.resolve('.env.local');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const [k, ...rest] = line.split('=');
    if (k && rest.length) process.env[k.trim()] = rest.join('=').trim();
  }
}

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const googleApiKey = process.env.GOOGLE_AI_API_KEY_INGEST || process.env.GOOGLE_AI_API_KEY || '';

if (!supabaseUrl || !supabaseKey || !googleApiKey) { console.error('❌ Faltan variables.'); process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(googleApiKey);
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

const SOURCE_TAG = 'mercosur_models_v2';

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }
async function getEmbedding(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent({
    content: { parts: [{ text }] },
    outputDimensionality: 768,
  } as any);
  return result.embedding.values;
}

const ENTRIES = [

  // ══════════════════════════════════════════════════════════════════════════
  // KIA
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'kia_picanto_g3la',
    marca: 'KIA',
    content: `KIA PICANTO — Motor G3LA / G3LC 1.0 / 1.2 DOHC (2012-2024)
Mercado: Argentina, Chile, Uruguay — muy común en ciudad por bajo consumo.
Gestión: Kefico (Hyundai-Kia propio).

FALLAS FRECUENTES:
— 40.000-80.000 km: Sensor MAP defectuoso → P0105/P0108, consumo irregular, falta de potencia. Causa: vibración + humedad. Reemplazar con OEM o Bosch equivalente.
— 50.000-90.000 km: Bobina de encendido / bujías → P0300-P0303, misfire visible a 2.000 rpm. Bujías recomendadas: NGK SILKAR9A8DS (iridio).
— 60.000-100.000 km: Válvula EGR carbón → P0401, ralentí irregular, humo gris. Limpieza con spray EGR o reemplazo.
— 80.000-120.000 km: Sonda lambda (downstream) → P0141, falla MIL intermitente.
— 100.000+ km: Cadena de distribución — este motor usa cadena (no correa), pero los tensores se desgastan. Síntoma: ruido metálico al arranque en frío, P0011/P0016.
— 120.000+ km: Bomba de agua plástica → pérdida de refrigerante, recalentamiento súbito. Reemplazar de forma preventiva.

DIAGNÓSTICO ESPECÍFICO:
- Borrar códigos y medir LTFT/STFT: si ambos positivos (+15%+), verificar presión de combustible y estado de MAP.
- Motor G3LA (1.0): 69 hp — muy sensible a MAF y MAP degradados.
- Usar Hyundai/Kia GDS o equivalente (Autel, Launch) para acceso a parámetros live del Kefico.`,
  },

  {
    id: 'kia_sportage_nu',
    marca: 'KIA',
    content: `KIA SPORTAGE / KIA CERATO — Motor Nu 2.0 MPI (2014-2022)
Motor: Nu 2.0 MPI — 156 hp, inyección directa + port injection en versiones GDI.
Mercado: Argentina (popular en segmento SUV medio).
Gestión: Kefico / Bosch ME17.

FALLAS FRECUENTES:
— 30.000-60.000 km (GDI): Carbón en válvulas de admisión — problema CONOCIDO en motores GDI (inyección directa). Sin port injection, el combustible no limpia las válvulas. Síntoma: P0300, tirones a bajas rpm, pérdida de potencia gradual. Solución: walnut blasting (limpieza con nueces a presión) cada 60-80k km.
— 50.000-90.000 km: Sensor de temperatura de admisión (IAT) → P0110, consumo elevado.
— 80.000-120.000 km: Válvula VVT solenoide → P0011/P0021 (fasaje variable averiado). Verificar nivel y calidad de aceite — crítico para el sistema VVT. Usar aceite 5W-30 o 5W-40 de calidad SN+.
— 100.000+ km: Cadena de distribución — sistema VVT con cadena doble. Ruido al arranque en frío = desgaste de tensores. Reemplazar kit completo.
— Toda la vida: Consumo de aceite moderado — revisar nivel cada 5.000 km.

ADVERTENCIA: El motor Nu 2.0 GDI fue objeto de campañas de servicio por consumo de aceite en varios mercados. Verificar si el VIN del cliente está en campaña activa.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MITSUBISHI
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'mitsubishi_l200_4d56',
    marca: 'MITSUBISHI',
    content: `MITSUBISHI L200 TRITON — Motor 4D56 2.5 TD (2006-2015)
Motor: 4D56 — 2.477cc, turbo diésel, 136 hp. Inyección mecánica (precámara) en versiones viejas, common rail en versiones nuevas.
Mercado: Argentina, Uruguay, Paraguay — pickup muy popular en campo y uso rural.

FALLAS FRECUENTES (común rail):
— 60.000-100.000 km: Inyectores con desgaste → P0201-P0204, humo negro/gris, falta de potencia. Los inyectores del 4D56 CR son sensibles al gasoil de baja calidad (Argentina). Verificar con prueba de retorno de inyectores (back-leak test). Umbral: <30 ml/min es aceptable; >50 ml/min reemplazar.
— 80.000-120.000 km: Turbocompresor (KKK/IHI) con desgaste de cojinetes → ruido en aceleración, P0299, humo azul/gris. Causa principal: falta de precalentamiento y postcalentamiento (apagar el turbo inmediatamente después de uso fuerte).
— 100.000-150.000 km: EGR obstruida → P0401, humo negro, pérdida de potencia en bajas. Limpiar o bloquear con plato de bloqueo (muy frecuente en uso off-road/campo).
— 100.000-150.000 km: Junta de tapa de cilindros → mezcla de fluidos, recalentamiento. VERIFICAR antes de culpar al turbo.
— 150.000+ km: Bomba de alta presión (common rail) debilitada → P0087, difícil arranque en frío.

DIAGNÓSTICO DIFERENCIAL:
- Humo negro → exceso de combustible o falta de aire (filtro, EGR, turbo).
- Humo gris → aceite quemando (turbo, guías de válvulas).
- Humo blanco → refrigerante entrando (junta culata).
- Filtro de combustible: cada 15.000 km con gasoil argentino (no 30.000 como dice el manual).`,
  },

  {
    id: 'mitsubishi_outlander_4b12',
    marca: 'MITSUBISHI',
    content: `MITSUBISHI OUTLANDER / ECLIPSE CROSS — Motor 4B12 2.4 MIVEC (2007-2023)
Motor: 4B12 — 2.360cc, 170 hp, DOHC 16v, sistema MIVEC (variable valve timing).
Mercado: Argentina (SUV importado, segmento medio-alto).

FALLAS FRECUENTES:
— 40.000-70.000 km: Solenoide VVT (MIVEC) → P0011/P0021, tirones a bajas rpm, ralentí irregular en frío. Causa: aceite degradado obstruye el solenoide. Usar aceite 0W-20 o 5W-20 certificado SP/GF-6. Cambio cada 7.500 km máximo con gasoil argentino.
— 60.000-100.000 km: Válvula EGR → P0401, ralentí irregular.
— 80.000-120.000 km: Bobinas de encendido (set de 4) → P0300-P0304. El 4B12 quema bobinas con relativa frecuencia — reemplazar en set.
— 100.000+ km: Cadena de distribución — el 4B12 usa cadena doble con tensores hidráulicos. Ruido al arranque frío → verificar tensores.
— Transmisión CVT INVECS-III: sensible a temperatura. Usar ATF-SP III únicamente. No mezclar con Dexron. Si hay patinaje o vibración al arrancar en frío → verificar nivel y calidad de fluido CVT.

DIAGNÓSTICO:
- MIVEC: medir tiempo de respuesta del solenoide con osciloscopio. Respuesta >200ms = solenoide desgastado o circuito degradado.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // JEEP
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'jeep_renegade_tigershark',
    marca: 'JEEP',
    content: `JEEP RENEGADE / FIAT TORO — Motor Tigershark 2.0 / FireFly 1.3 Turbo (2015-2024)
Plataforma: FCA Small Wide (compartida con Fiat 500X, Alfa Romeo MiTo).
Motor gasolina: Tigershark 2.0 MPI (140 hp) o FireFly 1.3 Turbo (150-180 hp).
Mercado: Argentina (importado de Brasil), muy común en ciudades.

FALLAS FRECUENTES — Tigershark 2.0:
— 30.000-60.000 km: VÁLVULAS DE ADMISIÓN CARBÓN — inyección directa sin port. El Tigershark 2.0 es CONOCIDO por acumulación rápida de carbón. Síntoma: P0300, tirones a 1.500-2.500 rpm. Solución: walnut blasting o limpieza química (Seafoam vía admisión).
— 50.000-80.000 km: Válvula EGR con carbón → P0401, ralentí irregular.
— 80.000-120.000 km: Solenoide VVT → P0011/P0014, ruido en arranque.

FALLAS FRECUENTES — FireFly 1.3 Turbo (GSE):
— 20.000-50.000 km: Actuador turbo defectuoso → P0299/P0234, turbo que no llega a presión o se sobre-dispara. Falla REPORTADA masivamente en Argentina.
— 40.000-80.000 km: Junta de turbo → pequeñas fugas de aceite, humo azul al arranque.
— 60.000-100.000 km: Termostato de mapa (mapa de refrigerante) → P0126/P0128, consumo variable.

TRANSMISIÓN:
- Cambio automático 9 velocidades (ZF 9HP): muy sensible a calidad de fluido. ATF ZF LifeguardFluid 9 únicamente. Falla recurrente: trompicones al cambiar 1→2 y 2→3 en frío → muchas veces se resuelve con actualización de software (flash TCM).
- Verificar actualizaciones de software antes de reemplazar componentes mecánicos.`,
  },

  {
    id: 'jeep_compass_diesel',
    marca: 'JEEP',
    content: `JEEP COMPASS / JEEP CHEROKEE — Motor 2.0 MultiJet II Diesel (2017-2024)
Motor: 2.0 MultiJet II — 170 hp, common rail Bosch, EGR + DPF + SCR (urea).
Mercado: Argentina (importado de Brasil/India), segmento SUV medio-alto.

ADVERTENCIA CRÍTICA — Sistema de postratamiento:
Este motor tiene DPF (filtro de partículas) + sistema SCR (AdBlue/urea). En Argentina no hay infraestructura de AdBlue generalizada. Muchos propietarios desconectan el sistema — ESTO GENERA CÓDIGOS P20EE, P2BAD, P20EF y activa el modo de emergencia (limp mode). El mecánico debe saber que puede estar trabajando con un motor modificado.

FALLAS FRECUENTES:
— 30.000-60.000 km: DPF semi-obstruido → P2002/P2003, regeneración activa excesiva. Causa: ciclos cortos de ciudad (el DPF no alcanza temperatura para regenerar). Solución: regeneración forzada con scanner + viaje en ruta a >80 km/h por 30 min.
— 50.000-100.000 km: Válvula EGR → P0401/P0402, humo negro, pérdida de potencia.
— 80.000-130.000 km: Inyectores Bosch CRDI → variación de caudal, P0200-P0204. Verificar con balance de inyectores y test de retorno.
— 100.000+ km: Turbo variable VNT → P0299, actuador electrónico del turbo variable. Verificar con scanner — puede ser limpieza de aletas VNT.

DIAGNÓSTICO DPF:
1. Medir presión diferencial en el DPF (sensor antes/después).
2. Si diferencia >15 kPa en ralentí → obstruido.
3. Regeneración forzada: solo si temperatura de gases de escape es normal.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SUZUKI
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'suzuki_vitara_k14b',
    marca: 'SUZUKI',
    content: `SUZUKI VITARA / SWIFT / S-CROSS — Motor K14B 1.4 Boosterjet Turbo (2016-2024)
Motor: K14B — 1.373cc, turbo directo, 140 hp. Inyección directa GDI.
Mercado: Argentina (segmento SUV compacto), Uruguay.

FALLAS FRECUENTES:
— 30.000-60.000 km: Válvulas de admisión con carbón (GDI sin port injection) → P0300/P0301-P0304, tirones a 1.500-3.000 rpm. El K14B es especialmente sensible — ciclos cortos de ciudad aceleran la acumulación.
— 40.000-70.000 km: Sensor de presión del turbo / actuador de bypass → P0234/P0299. El turbo usa actuador eléctrico de paso — verificar posición real vs. esperada con scanner.
— 60.000-90.000 km: Válvula PCV (ventilación del cárter) → aceite en admisión, carbón acelerado. Limpiar o reemplazar cada 60k.
— 80.000-120.000 km: Bobinas de encendido → misfire (P0300+). En motores turbo, las bobinas trabajan más — reemplazar en set.
— 100.000+ km: Cadena de distribución con tensores → ruido en arranque frío. El K14B tiene cadena corta y confiable, pero los tensores hidráulicos fallan con aceite degradado.

NOTA DE ACEITE: El K14B requiere aceite 0W-20 sintético certificado GF-6/SP. Aceite de viscosidad mayor (5W-40) puede causar fallas en el sistema VVT y consumo elevado.

DIAGNÓSTICO:
- Usar Suzuki SDS o scanner genérico OBD2 completo.
- Para carbón en válvulas: verificar LTFT/STFT. Si STFT negativo (-10% o más) con RPM subiendo, es carbón tapando.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CAMIONES — IVECO
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'iveco_daily_f1ae',
    marca: 'IVECO',
    content: `IVECO DAILY — Motor F1AE 3.0 HPI / F1CE 3.0 EVO (2006-2024)
Motor: F1AE 3.0 HPI (180 hp) / F1CE 3.0 EVO (210 hp) — diesel common rail, turbo con intercooler.
Mercado: Argentina — el transporte de carga liviana más frecuente en talleres.
Gestión: Bosch EDC17 (F1CE) / Magneti Marelli MMDS (F1AE).

FALLAS FRECUENTES:
— 50.000-100.000 km: EGR obstruida → P0401, humo negro, pérdida de potencia a carga plena. Muy frecuente en uso urbano stop-and-go. Limpiar con solvente EGR cada 80k o bloquear (dependiendo de normativa local).
— 80.000-150.000 km: Turbocompresor (Garrett GT1544) → ruido de rodamiento, P0299, pérdida de potencia. Causa: postcalentamiento insuficiente. Verificar actuador eléctrico del turbo variable.
— 100.000-150.000 km: Inyectores Bosch CRDI → P0201-P0205, golpeteo en frío, humo negro. Back-leak test: el F1AE tolera hasta 40 ml/min. El F1CE hasta 30 ml/min.
— 150.000+ km: Bomba de alta presión CP3 → P0087, difícil arranque, caída de presión por debajo de 300 bar.
— Toda la vida: Filtro de combustible crítico — cambiar cada 15.000 km con gasoil argentino. Un filtro saturado destruye bomba e inyectores en 10.000 km.

DIAGNÓSTICO ESPECÍFICO:
- Verificar presión de rail en live data: ralentí >250 bar, plena carga >1.350 bar.
- Si presión baja solo en aceleración fuerte → bomba debilitada.
- Si presión baja en ralentí → inyectores con retorno excesivo.

ADVERTENCIA: El Iveco Daily es ampliamente used como ambulancia, reparto y transporte escolar. Siempre verificar el historial de mantenimiento — muchos tienen intervalos extendidos forzados.`,
  },

  {
    id: 'iveco_tector_cursor9',
    marca: 'IVECO',
    content: `IVECO TECTOR / EUROCARGO — Motor Cursor 9 / Tector 6 (2005-2024)
Motor: Tector 6 (5.9L, 220-280 hp) / Cursor 9 (8.7L, 310-360 hp) — diesel common rail, Euro V/VI.
Mercado: Argentina — camiones de distribución, volcadoras, municipales.
Gestión: Bosch EDC7 / EDC17.

FALLAS CRÍTICAS:
— 100.000-200.000 km: EGR de alta temperatura → P0401/P0402. El Cursor 9 con EGR de alta presión tiene problemas de fiabilidad con gasoil argentino. La válvula EGR y el refrigerador de EGR fallan prematuramente.
— 150.000-250.000 km: Inyectores Bosch CRIN3 → P0201-P0206. Recondicionamiento posible si el cuerpo está OK. Caudal de retorno: >60 ml/min = reemplazar.
— Sistema de frenado (freno motor): verificar válvula de freno motor (Jake brake) en el Cursor 9 — fallo común es que no responde a la palanca del tablero.
— Compresor de aire para frenos: el compresor de aire accionado por distribución falla en el Cursor 9 en versiones Euro V — pierde aceite al sistema de frenos.

DIAGNÓSTICO:
- El Tector 6 acepta diagnóstico con Launch Heavy Duty / Autel MaxiSys HD.
- El Cursor 9 requiere Iveco IDSS idealmente, pero el Autel MaxiSys Ultra con protocolo HD funciona.
- Verificar actualizaciones de firmware del ECM en vehículos post-2018.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CAMIONES — MERCEDES-BENZ
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'mb_sprinter_om651',
    marca: 'MERCEDES-BENZ',
    content: `MERCEDES-BENZ SPRINTER — Motor OM651 2.2 CDI (2007-2024)
Motor: OM651 — 2.143cc, 4 cilindros, turbo diesel common rail, 163-190 hp.
Mercado: Argentina — la van de carga y transporte de pasajeros más común en talleres.
Gestión: Bosch EDC17CP46.

FALLAS FRECUENTES (MUY CONOCIDAS EN ARGENTINA):
— 40.000-80.000 km: SWIRL FLAPS (mariposas de admisión) — PROBLEMA CONOCIDO GRAVE. Las mariposas de torbellino se fragmentan y el plástico entra al motor. Síntoma: P2008/P2009/P200A, pérdida de potencia repentina, ruido metálico. ACCIÓN INMEDIATA: extraer las mariposas y bloquear en posición abierta. Un motor con swirl flaps fragmentadas puede necesitar revisión de culata y pistones.
— 60.000-100.000 km: DPF obstruido → P2002/P2003. El OM651 con DPF es muy sensible al gasoil argentino. Regeneración forzada cada 30-40k km o cada vez que el indicador aparece.
— 80.000-120.000 km: EGR + refrigerador de EGR → P0401. El refrigerador de EGR del OM651 presenta fisuras internas — mezcla refrigerante con gases → P0116/P0128.
— 100.000-150.000 km: Inyectores Bosch CRIN → variación de caudal, arranque difícil en frío.
— Toda la vida: Cadena de distribución en la parte trasera del motor (¡lado de transmisión!) — acceso muy complejo y costoso. Ruido metálico = cadena elongada = trabajo mayor.

ADVERTENCIA CRÍTICA — SWIRL FLAPS:
Esta es la falla más cara del OM651. Si el cliente llega con P2008 o similar, NO limpiar las mariposas y volver a instalar. El riesgo de fragmentación e ingesta al motor es altísimo. Reemplazar actuador + mariposas por kit modificado de acero, o bloquear con plato bloqueador.`,
  },

  {
    id: 'mb_actros_om471',
    marca: 'MERCEDES-BENZ',
    content: `MERCEDES-BENZ ACTROS — Motor OM471 12.8L (2012-2024)
Motor: OM471 — 12.8L, 6 cilindros en línea, 422-460 hp. Euro V/VI con SCR (AdBlue).
Mercado: Argentina — camión de larga distancia más común.
Gestión: Bosch X3.0 / MB PowertrainControl.

FALLAS CRÍTICAS:
— Sistema SCR (AdBlue): P20EE, P2BA4, P2BAD — sensor de calidad de AdBlue defectuoso o contaminación del depósito. En Argentina, la calidad del AdBlue es variable. Verificar concentración con refractómetro (32.5% urea). Si hay cristalización → limpiar el sistema completo.
— 200.000-400.000 km: Turbo compuesto (en algunas versiones) → P0299/P0234. El OM471 puede tener turbo secuencial o compuesto. La válvula de bypass del turbo compuesto falla mecánicamente.
— 300.000+ km: Inyectores Bosch CRIN4 → variación de caudal. El OM471 tiene 2 inyectores por cilindro (piloto + principal) en versiones avanzadas. Muy costoso de reemplazar — verificar calibración primero.
— Sistema de frenos: compresor de aire (parte de distribución) → válvula de descarga defectuosa = compresor trabaja continuamente.

DIAGNÓSTICO:
- Requiere MB Star Diagnosis (Xentry) o Autel MaxiSys Ultra con protocolo HD.
- El CAN Bus del Actros tiene múltiples redes: PowerCAN, ChassisCANbus, BodyCAN.
- Verificar errores en cada red por separado.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // VW DELIVERY / CONSTELLATION
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'vw_delivery_mwm',
    marca: 'VOLKSWAGEN',
    content: `VW DELIVERY / CONSTELLATION — Motor MWM International 4.12 / 6.10 (2008-2024)
Motor: MWM 4.12 TCA (4 cilindros, 149 hp) / MWM 6.10 TCA (6 cilindros, 215-270 hp).
Mercado: Argentina y Brasil — el camión mediano más usado en reparto y volquetes.
Gestión: Bosch EDC7 / Denso.

FALLAS FRECUENTES:
— 80.000-150.000 km: Actuador del turbo electrónico → P0299/P0234. El MWM 4.12 usa turbo con actuador eléctrico de posición variable. La varilla del actuador se oxida y traba. Lubricar o reemplazar actuador.
— 100.000-200.000 km: Inyectores Bosch CRIN2 → P0201-P0204. El MWM tolera hasta 50 ml/min de retorno. Síntoma: humo negro, consumo elevado.
— 150.000+ km: Bomba de alta presión CP1 (en versiones más viejas) → P0087. Verificar presión de alimentación (baja presión) antes de culpar a la bomba de alta.
— Toda la vida: Filtro de combustible y trampa de agua — CRÍTICO con el gasoil argentino. Vaciar trampa de agua cada 10.000 km. Un filtro saturado destruye la bomba.
— Sistema eléctrico: conector del ECM (muy frecuente) → contactos oxidados por exposición. Limpiar y proteger con grasa dieléctrica.

NOTA: El VW Delivery es uno de los vehículos más sobreexigidos de Argentina — muchos tienen kilometraje real muy superior al indicado. Siempre verificar horas de motor si está disponible.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MAQUINARIA AGRÍCOLA
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'john_deere_powertech',
    marca: 'JOHN DEERE',
    content: `JOHN DEERE — Motores PowerTech 4.5L / 6.8L (tractores, cosechadoras, 2000-2024)
Motores: PowerTech E (mecánico), PowerTech M (common rail Stanadyne/Delphi), PowerTech PSS (rail presión alta).
Mercado: Argentina, Brasil, Uruguay — maquinaria agrícola más común.

FALLAS FRECUENTES:
— 500-1.500 hs: Inyectores Stanadyne (sistemas mecánicos) → goteo en frío, humo negro. El inyector Stanadyne falla por gasoil con agua — trampa de agua OBLIGATORIA.
— 1.000-3.000 hs (common rail): Inyectores Delphi/Bosch → P0201-P0206, variación de caudal. Back-leak test con tubos de medición: >30 ml/min = reemplazar.
— 500-2.000 hs: Turbocompresor → pérdida de potencia, humo negro. Las cosechadoras trabajan con carga variable extrema — el turbo falla por golpes de polvo si el filtro de aire no se limpia correctamente.
— Sistema hidráulico: bomba hidráulica accionada por motor → pérdida de presión hidráulica = problema de bomba o válvula de alivio, NO del motor.
— Todo el tiempo: Filtro de gasoil CRÍTICO — en cosecha con polvo y humedad, cambiar cada 250 horas (no 500 como indica el manual). El PowerTech es muy sensible a contaminación.

DIAGNÓSTICO AGRÍCOLA:
- John Deere Service ADVISOR (software oficial) para códigos de falla.
- Muchos talleres rurales usan Jaltest o Autel MaxiSys HD.
- Código DTC en JD tiene formato: ECU + número (ej. ECU 000190.00 = sobrerrevolución).
- SIEMPRE verificar el registro de horas del motor — más relevante que kilómetros.`,
  },

  {
    id: 'new_holland_iveco_f4ge',
    marca: 'NEW HOLLAND',
    content: `NEW HOLLAND / CASE — Motor Iveco F4GE / FPT NEF 4.5L / 6.7L (2005-2024)
Motor: FPT NEF 4.5 (150-175 hp) / FPT NEF 6.7 (180-250 hp) — diesel common rail.
Mercado: Argentina, Brasil — tractores T5/T6/T7, cosechadoras CR/CX.

FALLAS FRECUENTES:
— 500-2.000 hs: EGR obstruida → P0401, pérdida de potencia en trabajos pesados. Los tractores en campo hacen muchos ciclos a carga plena — EGR se obstruye rápido. Frecuente en zonas con soja/maíz (mucho polvo fino).
— 1.000-3.000 hs: Inyectores Bosch CRIN2 → variación de caudal, arranque difícil en frío extremo (invierno en La Pampa o Patagonia). Back-leak test: umbral 40 ml/min.
— Sistema DPF (versiones Euro IV/V): P2002 — obstrucción. En campo, la regeneración activa a veces no puede completarse por trabajos de baja carga. Requiere regeneración estacionaria con scanner.
— Bomba hidráulica del sistema LSC (Load Sensing Control) → baja presión hidráulica, hidráulica lenta. No confundir con fallas del motor.

HERRAMIENTA: New Holland Service Master o CNH EST para diagnóstico completo.

CLIMA ARGENTINO: En invierno patagónico (−10°C a −20°C), el gasoil estándar puede solidificar la parafina → filtro tapado, motor no arranca. Usar gasoil premium o agregar anti-gel. El NEF 6.7 tiene calentador de combustible eléctrico en versiones premium — verificar que funciona.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SISTEMA ELÉCTRICO / TRANSPONDER EXTENDIDO
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'transponder_pcf7935_7936',
    marca: 'GENERAL',
    content: `TRANSPONDER PCF7935 / PCF7936 — Copiado, programación e inmovilizador (Argentina)
Chips: PCF7935 (fijo, 40 bits) y PCF7936 (ID48, cifrado rolling) — los más comunes en el mercado argentino.

PCF7935 (ID40):
— Usado en: VW Gol G3/G4, Golf, Polo, Bora (1998-2006); Fiat Palio, Siena, Punto (1999-2007); Renault Clio, Laguna (antiguo).
— Se puede copiar con duplicadoras VVDI, Zed-Bull, CN900.
— Proceso: leer chip original → clonar en chip virgen PCF7935.
— IMPORTANTE: si el inmovilizador está sincronizado (transponder aprendido por el ECU), la copia directa funciona. Si está bloqueado (key lost), necesitar acceso al ECU para leer clave.

PCF7936 (ID48):
— Usado en: VW Gol G5/G6/G7, Tiguan, Passat; Audi A3/A4/A6 (2006+); Seat, Skoda.
— NO se puede copiar directamente — es cifrado rolling code. Requiere:
  a) Llave original presente → calculadoras VVDI2 + adaptador 48 clone.
  b) Sin llave (all keys lost) → acceso al ECU vía OBD (VAG Component Protection) + calculadora.
— El chip ID48 en modo "transponder" (no SmartKey) es más fácil que el "SmartKey" con BSI.

ERRORES COMUNES AL PROGRAMAR:
— ECU en modo "bloqueado" por intentos fallidos → esperar 30 minutos con llave encendida.
— Llave programada pero motor no arranca → verificar si el inmovilizador está en el ECU o en una unidad separada (Immobox en VW/Audi).
— PCF7935 copiado que no funciona → verificar que el número de serie del chip original sea correcto y que la duplicadora no haya fallado.`,
  },

  {
    id: 'transponder_megamos48_hitag2',
    marca: 'GENERAL',
    content: `TRANSPONDER MEGAMOS 48 / HITAG2 — Programación para VW, Audi, Skoda, Seat (Argentina)
Estos dos sistemas cubren la mayoría de los vehículos de grupo VAG en Argentina de 2003 en adelante.

MEGAMOS 48 (ID48):
— Sistema: basado en PCF7936, con capas adicionales de cifrado en la comunicación ECU-transponder.
— Modelos: VW Bora, Golf IV/V, Polo 9N/6R, Passat B6; Audi A3 8P, A4 B6/B7.
— Programación con llave original presente: VVDI2 + "48 Clone" puede hacer copia directa.
— Sin llave original: requiere pinout del ECU + calculadora Xhorse o Autel IM608.

HITAG2:
— Sistema: más seguro que Megamos 48. Rolling code bidireccional.
— Modelos: VW Tiguan, Touareg (2007-2012); Audi A6 C6, Q7 (primera gen).
— Programación: requiere VVDI2 o AVDI (Abrites). No funciona con equipos básicos.
— Advertencia: el Touareg tiene inmovilizador en el Gateway + BCM + ECU. Proceso complejo.

PROCESO GENERAL KEY LOST (sin ninguna llave):
1. Conectar scanner compatible (VVDI2, Autel IM608, o Abrites).
2. Ir a "Immobilizer" → "Key Learning" → elegir modo Key Lost.
3. El sistema intentará leer el PIN de acceso vía OBD (no siempre disponible — depende del año).
4. Si el PIN no está disponible OBD, requiere lectura por dump del EEPROM (desmontar ECU o usar sonda de lectura en circuito).
5. Con PIN en mano → borrar llaves → programar llaves nuevas.

IMPORTANTE EN ARGENTINA: muchos vehículos importados tienen inmovilizador de región diferente. Siempre verificar si el ECU fue "clonado" previamente (VIN mismatch).`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SISTEMAS ABS / FRENOS
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'abs_bosch_8_51_55',
    marca: 'GENERAL',
    content: `SISTEMA ABS Bosch 8 / 8.1 / 5.1 / 5.5 — Diagnóstico (Argentina)
Estos módulos ABS Bosch cubren la mayoría de los vehículos medianos y compactos del MERCOSUR.

MÓDULOS:
— Bosch 8 / 8.1: VW Gol G5/G6/G7, Polo, Amarok; Toyota Corolla E12/E15; Renault Logan/Sandero (post-2012).
— Bosch 5.1 / 5.5: Renault Logan/Sandero (2005-2012), Peugeot 207/208/308, Citroën C3/C4 (antiguo).

CÓDIGOS C (ABS) MÁS FRECUENTES:
— C0031/C0034/C0037/C0040: Sensor de velocidad de rueda (WSS) defectuoso. FALLA #1. Diagnosticar:
  a) Medir resistencia del sensor: 900-2.200 Ω (dependiendo del modelo).
  b) Verificar anillo ABS (reluctor) — oxidado o roto en ruedas traseras (especialmente Argentina por baches).
  c) Medir señal con osciloscopio: señal senoidal limpia = sensor OK; señal plana o ruidosa = sensor o reluctor.
— C0110/C0113/C0116: Motor o relevé de la bomba ABS. Verificar alimentación 12V y masa al módulo. El módulo ABS tiene 3 conexiones: potencia, masa de potencia, y conector de señal.
— C0196: Sensor de ángulo de dirección (si tiene ESP). Descalibración por cambio de rodamiento o dirección. Requiere calibración con scanner.
— C0265/C0267: Relé del módulo EBCM. Muy frecuente en Bosch 5.x. Verificar soldaduras dentro del módulo (reparación posible).

HERRAMIENTA:
- Bosch 8: cualquier scanner OBD2 con CAN funciona.
- Bosch 5.x: algunos requieren protocolo K-Line. Usar cable correcto.
- Para ABS con ESP: siempre calibrar sensor de ángulo después de reparación.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SISTEMAS DE DIRECCIÓN ELECTROASISTIDA (EPS)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'eps_diagnostico',
    marca: 'GENERAL',
    content: `DIRECCIÓN ELECTROASISTIDA (EPS) — Diagnóstico MERCOSUR
El sistema EPS reemplazó a la dirección hidráulica en la mayoría de los vehículos de 2010 en adelante.

MODELOS CON EPS MÁS COMUNES EN ARGENTINA:
— VW Gol G6/G7: EPS Continental / Bosch.
— Renault Logan/Sandero post-2012: EPS Jtekt / Koyo.
— Chevrolet Onix: EPS Nexteer.
— Ford Ka Dragon 1.5: EPS Bosch.
— Peugeot 208 / Citroën C3 post-2013: EPS Jtekt.

FALLAS Y CÓDIGOS:
— B1000/B1001 (o similares): Módulo EPS en falla general. Puede ser falla de alimentación, sensor de par, o motor de asistencia.
— Dirección pesada permanente: Motor EPS sin corriente o relé EPS fallado. Verificar fusible del EPS (generalmente alto amperaje, 40-60A en caja de fusibles bajo capot).
— Dirección pesada solo al arranque / intermitente: Sensor de par (torque sensor) degradado. El sensor de par está en la columna de dirección — reemplazarlo requiere calibración con scanner.
— Vibración en volante a velocidad constante: Desbalanceo de ruedas (no EPS) o problema en motor paso a paso del EPS.
— Testigo EPS permanente + codificación: después de reemplazar una columna EPS completa, hay que codificarla al VIN del vehículo. Sin codificación, el EPS funciona en modo degradado.

DIAGNÓSTICO:
1. Leer códigos con scanner compatible (el módulo EPS es un nodo del CAN).
2. Verificar tensión de alimentación: mínimo 11.5V en funcionamiento.
3. Medir corriente del motor EPS con pinza amperimétrica: en maniobra normal <30A; si supera 50A = motor o mecanismo trabado.
4. Calibración post-reparación: centrar volante → conectar scanner → ejecutar calibración EPS.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SISTEMAS DE AIRE ACONDICIONADO
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'ac_diagnostico_mercosur',
    marca: 'GENERAL',
    content: `AIRE ACONDICIONADO — Diagnóstico y fallas comunes en Argentina
El A/C es uno de los sistemas más consultados en taller argentino por el clima extremo.

REFRIGERANTES:
— R134a: todos los vehículos hasta ~2018. Todavía mayoría del parque automotor.
— R1234yf: vehículos post-2018 importados (VW nuevos, Audi, Mercedes). INCOMPATIBLE con R134a — no mezclar. Requiere equipo específico de carga.
— Los precios del R1234yf en Argentina son 4-5x el R134a. Verificar antes de cotizar al cliente.

FALLAS FRECUENTES:
— Compresor que no enciende: verificar presostato (sensor de presión), relé del compresor, embrague magnético del compresor. El presostato corta si la presión es <2 bar o >25 bar.
— A/C que enfría poco: presión baja en el lado de baja → fuga de refrigerante. Buscar con UV (lámpara UV + colorante UV) o detector electrónico.
— A/C que enfría intermitente: válvula de expansión (TXV) parcialmente obstruida. Síntoma: lado de baja congela y luego aumenta.
— Ruido en el compresor: rodamientos del compresor o paletas desgastadas. Drenar el sistema y verificar si hay limallas en el aceite.
— Mal olor del A/C: hongos en el evaporador. Tratar con biocida para evaporadores. No reemplazar el evaporador — limpiar.

PRESIONES DE REFERENCIA (R134a a 25°C ambiente):
— Lado baja: 1.5 - 2.5 bar (enfriando). Si >3 bar → válvula TXV trabada abierta.
— Lado alta: 12 - 18 bar. Si <10 bar → poco refrigerante o compresor débil. Si >22 bar → condensador sucio o poco flujo de aire.

HERRAMIENTA: Estación de carga A/C con manifold y termómetro de sonda.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MERCADO ARGENTINO — CONTEXTO GENERAL
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'argentina_repuestos_diagnostico',
    marca: 'GENERAL',
    content: `CONTEXTO ARGENTINA — Diagnóstico con repuestos alternativos y mercado local
Realidad del mercado argentino que el mecánico debe considerar en el diagnóstico.

REPUESTOS GENÉRICOS:
— Argentina tiene un mercado muy grande de repuestos alternativos (chinos, brasileños, y genéricos locales). La calidad varía enormemente.
— Sensores de posición de cigüeñal (CKP): los genéricos a veces fallan al poco tiempo. Si el cliente vuelve con el mismo problema 3 meses después → verificar si el sensor instalado es de calidad o genérico.
— Bobinas de encendido genéricas: problema frecuente. Una bobina genérica puede generar P0300 intermitente. Siempre sospechar de repuesto reciente si el código es nuevo y el vehículo era estable.
— Sensores MAP/MAF genéricos: pueden dar lecturas incorrectas pero no activar código. El técnico puede confundirse pensando que el sensor es OK porque no hay código.

SITUACIÓN ECONÓMICA Y DIAGNÓSTICO:
— Los clientes posponen mantenimiento preventivo por costo → el técnico recibe vehículos con múltiples fallas encadenadas.
— Correa de distribución vencida que rompió → destruyó válvulas → ahora hay misfire. No tratar cada falla por separado.
— Aceite nunca cambiado → desgaste de árbol de levas → código de fase → no es el sensor VVT, es desgaste mecánico.

DIAGNÓSTICO DIFERENCIAL POR REGIÓN:
— Buenos Aires / Córdoba (zona cálida): A/C muy demandado, problemas de refrigeración frecuentes.
— Patagonia: gasoil que solidifica en invierno, baterías que fallan por frío, gomas que se agrietan.
— NOA (Jujuy, Salta): altura > 1.500 msnm → la ECU ajusta la mezcla, pero sensores de presión barométrica defectuosos generan mezcla rica en bajada y pobre en altura.

HERRAMIENTAS MÁS USADAS EN ARGENTINA:
— Launch X431 Pro (el más difundido en talleres independientes).
— Autel MaxiSys MS906 / MS908 (talleres con más inversión).
— Icarsoft (talleres pequeños, específico por marca).
— VCDS / VAG-COM (talleres especializados en VAG).`,
  },

].filter(e => e.content.trim().length > 0);

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔧 MechaIA — Seeder Batch 2 (Kia, Mitsubishi, Jeep, Suzuki, camiones, más)');
  console.log(`🚗 Entradas: ${ENTRIES.length}`);

  // Cargar los ya existentes
  const { data: existing } = await supabase
    .from('knowledge_base')
    .select('metadata')
    .eq('metadata->>source', SOURCE_TAG);
  const existingIds = new Set((existing || []).map((r: any) => r.metadata?.entry_id).filter(Boolean));
  const pending = ENTRIES.filter(e => !existingIds.has(e.id));
  console.log(`📋 Ya cargados: ${existingIds.size} | Por cargar: ${pending.length}\n`);

  let errores = 0;
  for (let i = 0; i < pending.length; i++) {
    const entry = pending[i];
    const idx = ENTRIES.indexOf(entry) + 1;
    process.stdout.write(`[${String(idx).padStart(2, '0')}/${ENTRIES.length}] ${entry.id} ... `);
    try {
      const embedding = await getEmbedding(entry.content);
      const { error } = await supabase.from('knowledge_base').insert({
        content: entry.content,
        metadata: {
          filename: `${entry.id}.md`,
          path: `seeds/mercosur_batch2/${entry.id}.md`,
          marca: entry.marca,
          folder: 'mercosur_models',
          source: SOURCE_TAG,
          entry_id: entry.id,
        },
        embedding,
      });
      if (error) { console.log(`❌ ${error.message}`); errores++; }
      else console.log('✅');
    } catch (err: any) {
      console.log(`❌ ${err.message}`);
      errores++;
    }
    await sleep(260);
  }

  const { count } = await supabase.from('knowledge_base').select('*', { count: 'exact', head: true });
  console.log(`\n🏁 Listo: ${pending.length - errores} insertadas, ${errores} errores`);
  console.log(`📚 Total knowledge_base: ${count} entradas`);
}

main().catch(console.error);

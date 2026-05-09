#!/usr/bin/env tsx
/**
 * seed-mercosur-batch3.ts
 * Batch 3: Peugeot 3008/2008, Renault Duster diesel, VW Taos/T-Cross/Virtus,
 * Toyota Yaris/RAV4, Chevrolet Tracker/Cruze, Ford Focus/EcoSport,
 * Fiat Cronos/Argo, Honda Civic/HR-V, Hyundai Tucson/Creta.
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

const SOURCE_TAG = 'mercosur_models_v3';

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
  // PEUGEOT
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'peugeot_3008_thp_156',
    marca: 'PEUGEOT',
    content: `PEUGEOT 3008 / 5008 / 308 — Motor THP 156 / 1.6 THP (EP6DT) (2009-2020)
Motor: EP6DT — 1.598cc, turbo, 156 hp. Inyección directa (GDI). Versión turbo del EP6 que comparte con Citroën, Mini, BMW.
Mercado: Argentina — SUV compacto importado, muy frecuente en talleres de zona norte GBA.

PROBLEMA CRÍTICO — CADENA DE DISTRIBUCIÓN:
El EP6DT turbo hereda el MISMO problema de cadena que el EP6 atmosférico, AGRAVADO por la mayor temperatura del motor turbo. La cadena de distribución en la parte FRONTAL del motor (lado de la correa auxiliar) se estira prematuramente.
— Síntoma: ruido metálico a baja rpm en frío (primeros 30 segundos de marcha), luego desaparece.
— Kilómetros: desde 60.000 km en condiciones normales. Con aceite degradado, desde 40.000 km.
— Códigos: P0011/P0012 (sobreavance de árbol de levas admisión), P0341, P0016.
— RIESGO MOTOR: la cadena estirada puede saltar y doblar válvulas. Si el ruido es constante → NO seguir usando el auto.

OTROS PROBLEMAS CONOCIDOS DEL EP6DT:
— Turbocompresor IHI RHF3: falla por falta de postcalentamiento. Si el cliente apaga el motor inmediatamente después de conducción fuerte → rodamiento del turbo se destruye.
— Válvula PCV integrada en la tapa de válvulas: se obstruye con el carbón y devuelve aceite al colector de admisión → humo azul + carbón en válvulas.
— Consumo de aceite: el EP6DT puede consumir hasta 0.5L/1.000 km en algunos ejemplares — esto es considerado "normal" por Stellantis, pero en Argentina donde el aceite es caro, los clientes no revisan el nivel.

ACEITE CRÍTICO: 5W-30 LONGLIFE (norma PSA B71 2290). NO usar 5W-40 convencional — el sistema VVTi y la cadena dependen de baja viscosidad. Intervalo máximo 10.000 km con este motor.`,
  },

  {
    id: 'peugeot_2008_pure_tech',
    marca: 'PEUGEOT',
    content: `PEUGEOT 2008 / 208 II — Motor PureTech 1.2 Turbo (EB2DTS) (2019-2024)
Motor: EB2DTS — 1.199cc, 3 cilindros, turbo, 100-130 hp. Correa de distribución en baño de aceite.
Mercado: Argentina — SUV compacto muy popular, importado de Brasil.

PROBLEMA CONOCIDO — CORREA DE DISTRIBUCIÓN EN BAÑO DE ACEITE:
El PureTech 1.2 tiene la correa de distribución sumergida en aceite (timing belt in oil, TBIO). PSA aseguraba vida útil de 150.000 km. En la práctica:
— En Europa y Argentina hubo miles de casos de correa rota antes de los 100.000 km.
— PSA/Stellantis extendió la garantía en varios países por este motivo.
— Síntoma de desgaste: ruido a cadena al arranque frío, mínima caída de rpm al encender A/C, ralentí ligeramente irregular.
— Falla catastrófica: correa rota → válvulas dobladas → motor destruido.
— RECOMENDACIÓN: reemplazar correa a los 60.000 km o 5 años, NO respetar los 150.000 km del manual.

FALLAS ADICIONALES:
— Bobina de encendido triple (los 3 cilindros en un módulo) → misfire en los 3 cilindros simultáneo o alternado. P0300/P0301/P0302/P0303.
— Válvula wastegate del turbo → P0234/P0299, presión de turbo variable.
— Filtro de partículas GPF (gasolina, en versiones post-2018 Euro 6d) → regeneración frecuente si el auto hace ciclos cortos.
— Consumo de aceite: el EB2DTS consume aceite por diseño (~0.3L/1.000 km). Nivel cada 5.000 km.

DIAGNÓSTICO: usar scanner compatible (Peugeot Planet 2000, Diagbox, o Autel/Launch con perfil PSA). Verificar actualizaciones de software disponibles para el ECM — PSA publicó varias revisiones para el PureTech.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // RENAULT
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'renault_duster_k9k_diesel',
    marca: 'RENAULT',
    content: `RENAULT DUSTER — Motor K9K 1.5 dCi (diesel) (2012-2023)
Motor: K9K — 1.461cc, 4 cilindros, turbo diesel common rail, 85-110 hp.
Mercado: Argentina (4x4 diesel muy popular en campo, zona sur y NOA).
Gestión: Bosch EDC17C11 / EDC17C42.

FALLAS FRECUENTES:
— 40.000-80.000 km: Turbina de geometría variable (VGT/VNT) con aletas trabadas → P0299, humo negro, pérdida de potencia brusca. FALLA MÁS FRECUENTE del K9K. Causa: carbón en aletas de la turbina. Solución: limpieza química de las aletas con el turbo en el auto (WD40 + ciclos de aceleración con turbo libre). Si no mejora → desmontaje y limpieza mecánica.
— 60.000-100.000 km: Válvula EGR → P0401/P0402, ralentí irregular, humo negro. El K9K con uso urbano obstruye la EGR rápido. Limpieza o bloqueo.
— 80.000-120.000 km: Inyectores Delphi/Bosch → P0201-P0204, arranque difícil en frío, consumo alto. Test de retorno: hasta 35 ml/min OK.
— 100.000-150.000 km: Bomba de alta presión → P0087, difícil arranque.
— 150.000+ km: Correa de distribución — el K9K usa CORREA (no cadena). Cambio cada 120.000 km o 8 años. Si la correa incluye la bomba de agua, cambiarla junto a la correa.

ADVERTENCIA TURBO VNT:
El diagnóstico de P0299 en el K9K casi siempre es turbo con aletas trabadas, NO turbo destruido. Antes de cotizar un turbo nuevo:
1. Desconectar la varilla del actuador del turbo.
2. Mover las aletas manualmente — si están trabadas pero se pueden mover → limpieza.
3. Si el eje del turbo tiene juego axial > 0.5mm → turbo dañado.

GASOIL EN ARGENTINA: filtro cada 10.000 km obligatorio con el K9K. El gasoil B10 (biodiesel 10%) puede degradar las juntas de los inyectores Delphi.`,
  },

  {
    id: 'renault_kangoo_1_6_k7m',
    marca: 'RENAULT',
    content: `RENAULT KANGOO / CLIO II — Motor K7M 1.6 8v MPI (1999-2015)
Motor: K7M — 1.598cc, 8 válvulas, SOHC, carburador→ inyección. 90 hp.
Mercado: Argentina — utilitario de reparto y uso rural muy extendido, parque antiguo.

FALLAS FRECUENTES (motor de era antigua pero con muchos unidades en circulación):
— 60.000-100.000 km: Sensor CKP — mismo problema que el K4M pero el K7M es aún más sensible a vibración por ser 8v. P0335, motor que no arranca o se apaga en frío.
— 80.000-120.000 km: Carburador (versiones antiguas) o inyector único (monopunto) degradado → ralentí inestable, mezcla rica/pobre sin código claro.
— 100.000+ km: Junta de culata — el K7M es propenso a pequeñas fugas en la junta si el motor ha sufrido recalentamientos. Verificar niveles de refrigerante y presencia de emulsión en el aceite.
— Toda la vida: Correa de distribución — cambio OBLIGATORIO cada 60.000 km. Muchos Kangoo de reparto llegan con la correa original al taller. El K7M es motor interferente — si la correa rompe, dobla válvulas.
— Sistema de inyección (Sirius 32): sensor de temperatura de refrigerante (CLT) → cuando falla, la ECU usa valor de reserva (90°C fijo) → mezcla incorrecta en frío → arranques difíciles.

NOTA: El Kangoo es el vehículo de trabajo más sobreexigido de Argentina. Verificar siempre: nivel de aceite, estado de correa de distribución, y temperatura de funcionamiento. Muchos llegan al taller "fríos" porque el termostato está retirado.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // VOLKSWAGEN
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'vw_taos_1_4_tsi',
    marca: 'VOLKSWAGEN',
    content: `VOLKSWAGEN TAOS / TIGUAN (MQB) — Motor EA211 1.4 TSI (2021-2024)
Motor: EA211 1.4 TSI evo — 150 hp, turbo, inyección directa + indirecta (doble inyección).
Mercado: Argentina — importado de México, segmento SUV medio en crecimiento.
Gestión: Bosch MED17 / Continental Simos 18.

VENTAJA vs EP6 / Tigershark: el EA211 tiene DOBLE INYECCIÓN (directa + indirecta), lo que reduce significativamente el problema de carbón en válvulas. Sin embargo, no lo elimina completamente.

FALLAS REPORTADAS EN ARGENTINA:
— 20.000-50.000 km: Actuador del wastegate del turbo → P0234/P0299, boost irregular. El EA211 usa actuador electrónico — puede ser problema de calibración (reseteable con VCDS/ODIS) antes de reemplazar.
— 40.000-80.000 km: Válvula de control de aceite VVT → P0010/P0011 (árbol de levas admisión fuera de rango). Cambio de aceite 0W-20 o 5W-30 VW 508.00/509.00 es OBLIGATORIO — usar 5W-40 convencional destruye el sistema VVT.
— 60.000-100.000 km: Bobinas de encendido → misfire en 1 o más cilindros. Las bobinas del EA211 son más confiables que las del EP6, pero no inmunes.
— Transmisión DSG 7 (DQ200): la caja de doble embrague seco es sensible a temperatura. En verano argentino o atascos prolongados, puede activar modo de protección térmica (ralentí elevado, no acepta marcha). Solución: dejar enfriar o actualizar software de la TCU.

ACEITE CRÍTICO: VW 508.00 o 509.00 (0W-20 o 5W-30 Full Synthetic LSPI-resistant). El EA211 TSI tiene advertencia de LSPI (pre-ignición de baja velocidad) con aceites de viscosidad equivocada.

HERRAMIENTA: VCDS / ODIS para diagnóstico completo. Los scanners genéricos acceden a OBD2 básico pero no a la codificación del DSG ni al sistema de adaptaciones.`,
  },

  {
    id: 'vw_tcross_1_0_tsi',
    marca: 'VOLKSWAGEN',
    content: `VOLKSWAGEN T-CROSS / POLO GTS — Motor EA211 1.0 TSI (2019-2024)
Motor: EA211 1.0 TSI — 3 cilindros, 110 hp, turbo, cadena de distribución.
Mercado: Argentina — importado de Brasil (Anchieta), el más vendido del segmento SUV compacto.
Gestión: Bosch MED17.

CARACTERÍSTICAS:
— 3 cilindros: vibración inherente en ralentí y a bajas rpm. Normal — no es falla. Si el cliente reporta "vibración en ralentí", verificar si es la vibración estructural del 3 cilindros o misfire real (medir con scanner).
— Cadena de distribución (no correa): vida útil mayor, pero los tensores hidráulicos dependen de la calidad y frecuencia de cambio de aceite.

FALLAS FRECUENTES:
— 20.000-50.000 km: Sensor de presión del turbo o manguito de turbo → P0299/P0234. El 1.0 TSI por ser pequeño y muy cargado de trabajo → las mangueras del turbo se aflojan o agrietan.
— 40.000-80.000 km: Válvula PCV / sello de cabeza de cárter → aceite en la admisión, carbón en el intercooler.
— 60.000-100.000 km: Bobina de encendido triple (1 módulo para 3 cilindros) → cualquier cilindro fallando genera P0300/P0301-P0303.
— Tensores de cadena con aceite degradado → ruido metálico al arranque frío + P0016/P0011.

IMPORTANTE:
— Cambio de aceite cada 10.000 km MÁXIMO (no respetar 15.000 del manual con aceite argentino).
— Aceite: VW 508.00/509.00. No sustituir por 5W-40 genérico.
— El DSG 7 (DQ200) seco tiene las mismas limitaciones que en el Taos.

DIAGNÓSTICO DE VIBRACIÓN:
1. Medir misfire con scanner en live data — si hay misfire real, aparece en "misfires por cilindro".
2. Si no hay misfire → es vibración estructural del 3 cil. Normal.
3. Verificar montaje del motor (silentblock) en ejemplares con más de 80.000 km.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // TOYOTA
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'toyota_yaris_1nz_2nz',
    marca: 'TOYOTA',
    content: `TOYOTA YARIS / ETIOS — Motor 1NZ-FE / 2NZ-FE 1.3-1.5 (2005-2022)
Motor: 1NZ-FE (1.5L, 109 hp) / 2NZ-FE (1.3L, 87 hp) — DOHC, VVT-i, cadena.
Mercado: Argentina — muy común en flota de remises y uso urbano intensivo.
Gestión: Denso (Toyota-propio).

FALLAS FRECUENTES:
— 60.000-100.000 km: Aceite quemando — el 1NZ-FE es CONOCIDO por consumo de aceite. Toyota emitió un TSB (Technical Service Bulletin) para este problema. Causa: sellos de guías de válvulas blandos. Síntoma: humo azul al arranque, nivel de aceite baja 1L/5.000 km. Solución: reemplazar sellos de guías (trabajo de culata).
— 60.000-100.000 km: Solenoide VVT-i (OCV — Oil Control Valve) → P0011/P0012, ralentí irregular en frío. Verificar PRIMERO si el filtro del OCV está obstruido (problema de aceite viejo). Limpiar el filtro antes de reemplazar el OCV.
— 80.000-120.000 km: Bomba de agua de plástico → fuga gradual de refrigerante. Toyota usó bomba de agua con impulsor de plástico que se degrada. Reemplazar por versión metálica si está disponible.
— 100.000+ km: Bobinas de encendido → misfire intermitente P0300-P0304.
— Toda la vida: Termostato → en la mayoría de los 1NZ con mucho uso, el termostato queda abierto → motor no llega a temperatura → mezcla rica → consumo elevado. P0128.

CONTEXTO ARGENTINA: El Yaris/Etios es el taxi y remis por excelencia. Llegará al taller con 300.000 km y habrá tenido 4 dueños. Verificar todo antes de diagnosticar.`,
  },

  {
    id: 'toyota_rav4_2ar_fe',
    marca: 'TOYOTA',
    content: `TOYOTA RAV4 — Motor 2AR-FE 2.5 / 2GR-FE 3.5 V6 (2006-2019)
Motor: 2AR-FE — 2.494cc, 180 hp, DOHC 16v, Dual VVT-i. / 2GR-FE — 3.456cc, 269 hp, V6.
Mercado: Argentina — SUV importado, muy demandado en talleres.
Gestión: Denso, sistema Toyota ETCS-i.

FALLAS 2AR-FE:
— 50.000-90.000 km: Aceite quemando — el 2AR-FE también fue objeto de TSB por consumo de aceite (sellos de anillos). Toyota extendió garantía en EE.UU. por este motivo. En Argentina muchos no lo saben. Verificar nivel cada 3.000 km.
— 60.000-100.000 km: Solenoides Dual VVT-i → P0010/P0011/P0020/P0021. SIEMPRE verificar calidad y nivel de aceite antes de reemplazar solenoide — el aceite sucio obstruye el circuito hidráulico del VVT.
— 100.000+ km: Cadena de distribución + tensores → ruido al arranque frío, P0016/P0018. El 2AR tiene cadena larga — el ruido al arranque es síntoma temprano que debe tomarse en serio.
— Transmisión automática U241E/U241F → si hay trompicones o retrasos en los cambios → verificar fluido (ATF-WS Toyota únicamente, NO Dexron).

FALLAS 2GR-FE:
— Consumo de aceite también documentado — mismo origen: sellos de anillos de primera generación.
— El V6 es más caro de reparar — cualquier intervención de distribución implica trabajo doble.

ADVERTENCIA: No usar fluido ATF genérico en el RAV4. Toyota ATF-WS es el único compatible con la caja electrónica. El uso de Dexron puede dañar los frenos hidráulicos internos de la transmisión.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CHEVROLET
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'chevrolet_tracker_1_2_turbo',
    marca: 'CHEVROLET',
    content: `CHEVROLET TRACKER / CRUZE HATCH — Motor 1.2 Turbo / LTG 1.4 Turbo (2021-2024)
Motor Tracker: 1.2 Turbo (SGE) — 133 hp, 3 cilindros, inyección directa + port.
Motor Cruze: LTG 1.4 Turbo — 153 hp, 4 cilindros, turbo.
Mercado: Argentina — importados de Brasil (Gravataí). Muy vendidos.
Gestión: Bosch ME17.

FALLAS 1.2 TURBO (TRACKER):
— 20.000-50.000 km: Vibración a ralentí — normal en 3 cilindros (igual que VW 1.0 TSI). El cliente puede percibirla como falla. Verificar con scanner si hay misfire real.
— 30.000-60.000 km: Actuador del turbo → P0299/P0234. El 1.2 trabaja muy cargado para el tamaño del auto.
— 50.000-80.000 km: Solenoide VVT → P0011/P0021. Aceite VW 508/GM dexos2 obligatorio.
— Transmisión CVT (en versión base): muy sensible a temperatura. Fluido Dexron VI o equivalente específico GM CVT.

FALLAS LTG 1.4 TURBO (CRUZE):
— 30.000-60.000 km: PROBLEMA CONOCIDO — junta de la tapa de válvulas / sello del árbol de levas → fuga de aceite por la parte trasera del motor. Muy frecuente en Argentina. Reemplazar con junta de material mejorado.
— 40.000-80.000 km: Válvula PCV integrada → aceite en el admisión, turbo contaminado.
— 50.000-100.000 km: Cadena de distribución → ruido al arranque + P0016. El LTG tiene tensores hidráulicos sensibles al aceite.
— Transmisión automática 6T45: trompiconazo 1→2 en frío → actualización de software del TCM como primer paso.

ACEITE: el 1.2 SGE requiere 0W-20 dexos2. El LTG requiere 5W-30 dexos2. Usar 5W-40 genérico → fallas garantizadas en VVT y cadena.`,
  },

  {
    id: 'chevrolet_spin_cruze_ecotec',
    marca: 'CHEVROLET',
    content: `CHEVROLET SPIN / COBALT / CRUZE — Motor Ecotec 1.8 (Z18XER / LFH) (2012-2022)
Motor: Z18XER / LFH — 1.796cc, 140 hp, DOHC 16v, sin VVT (versiones base).
Mercado: Argentina y Brasil — el Spin es uno de los utilitarios familiares más usados.

FALLAS FRECUENTES:
— 40.000-70.000 km: Sonda lambda upstream → P0135/P0141 (calefactor), consumo elevado, mezcla en bucle abierto.
— 50.000-80.000 km: Bobinas de encendido → P0300-P0304, misfire a carga parcial.
— 80.000-120.000 km: Bomba de combustible débil → P0087, fallas en subida o bajo carga. Las bombas de combustible del Spin fallan relativamente pronto por mala calidad de nafta.
— 100.000-150.000 km: Throttle body (cuerpo de mariposa) sucio → ralentí inestable, falla al soltar el acelerador. Limpieza con spray de mariposa cada 60k.
— Toda la vida: Correa de distribución — cambio cada 60.000 km o 5 años. El Ecotec 1.8 es motor interferente.

SISTEMA DE TRANSMISIÓN AUTOMÁTICA (4T45-E):
— Trompicones al cambiar a velocidades altas → degradación del fluido ATF. Cambiar el fluido cada 60.000 km (no es de por vida). Usar Dexron VI.
— Patinaje en 2ª marcha → banda secundaria desgastada. Requiere apertura.

NOTA: El Spin es ampliamente usado como taxi en Argentina (igual que el Corsa). Alta exigencia → mantenimiento postergado. Siempre revisar estado de distribución antes de diagnosticar fallas de motor.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // FORD
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'ford_ecosport_sigma_1_6',
    marca: 'FORD',
    content: `FORD ECOSPORT / FIESTA — Motor Sigma 1.6 / Rocam 1.0-1.6 (2004-2018)
Motor Sigma: 1.596cc, 110 hp, DOHC 16v, iVCT (variable timing).
Motor Rocam: 0.999cc-1.596cc, 8v, SOHC. Más antiguo y simple.
Mercado: Argentina — el EcoSport primera generación es muy común en el parque.

FALLAS SIGMA 1.6:
— 40.000-70.000 km: Sensor CKP → P0335/P0336, el Sigma tiene el CKP en posición expuesta a vibraciones y calor. Falla frecuente.
— 60.000-100.000 km: Solenoides iVCT → P0010/P0011. Verificar calidad de aceite — muy sensible.
— 80.000-120.000 km: Cadena de distribución + tensor → ruido al arranque. El Sigma tiene cadena en la parte trasera del motor — acceso complejo.
— 100.000+ km: Consumo de aceite por sellos de válvulas → humo azul al arranque.
— Toda la vida: Termostato → P0128, motor frío → mezcla rica → consumo.

FALLAS ROCAM:
— El Rocam es un motor muy simple y robusto, pero:
— Correa de distribución: cambio obligatorio cada 60.000 km. Motor INTERFERENTE.
— Sensor de temperatura de refrigerante (ECT) → cuando falla, mezcla permanentemente rica → consumo elevado + bujías cubiertas de hollín.
— Carburador en versiones muy antiguas → ralentí inestable, mezcla fija.

TRANSMISIÓN AUTOMÁTICA (Jatco CVT — EcoSport pos-2012):
— La CVT Jatco que usa el EcoSport 1.6 flex (Brasil) es muy sensible a calor. En Argentina, con alta temperatura ambiente y atascos, puede activar modo de protección.
— Fluido NS-2 o NS-3 (Jatco) — no sustituir.`,
  },

  {
    id: 'ford_focus_2_0_duratec',
    marca: 'FORD',
    content: `FORD FOCUS II / III — Motor Duratec 2.0 / EcoBoost 1.6 Turbo (2005-2019)
Motor Duratec HE 2.0: 145 hp, DOHC 16v, iVCT (variable timing admisión).
Motor EcoBoost 1.6: 150 hp, turbo, inyección directa.
Mercado: Argentina — el Focus es uno de los sedanes más frecuentes en talleres de zona norte y Córdoba.

FALLAS DURATEC 2.0:
— 50.000-80.000 km: Solenoide VCT (variable cam timing) → P0010/P0011, ralentí irregular en frío, código P0012 también.
— 80.000-120.000 km: Cadena de distribución → ruido al arranque frío. El Duratec 2.0 tiene cadena simple con tensor hidráulico — muy sensible a calidad y nivel de aceite.
— 100.000+ km: Bobinas de encendido → P0300-P0304.
— Toda la vida: Termostato variable (ThermoManagement) → P0128 intermitente. El Focus usa termostato electrónico que falla frecuentemente.

FALLAS ECOBOOST 1.6:
— 30.000-60.000 km: PROBLEMA CONOCIDO — junta de culata. Ford reconoció fallos en la junta de culata del EcoBoost 1.6 en varios mercados. Síntoma: pérdida de refrigerante sin fuga visible, recalentamiento.
— 40.000-70.000 km: Carbón en válvulas (GDI) → P0300, tirones.
— 50.000-80.000 km: Manguito del intercooler → P0299, pérdida de boost.
— Turbocompresor → falla por postcalentamiento insuficiente.

TRANSMISIÓN PowerShift (DCT de doble embrague seco):
— PROBLEMA CONOCIDO Y GRAVE. La caja PowerShift DCT del Focus fue objeto de litigios legales en EE.UU. Síntomas: trompicones 1→2, vibración al arrancar, marcha que se escapa. Ford emitió extensiones de garantía. Si el cliente tiene estos síntomas → primero actualización TCU, luego considerar reemplazo de embrague.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // FIAT
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'fiat_cronos_argo_firefly_1_3',
    marca: 'FIAT',
    content: `FIAT CRONOS / ARGO — Motor FireFly 1.3 Flex (GSE T4) (2018-2024)
Motor: FireFly 1.3 GSE — 4 cilindros, 109 hp (gasolina) / 107 hp (etanol), inyección directa + indirecta, cadena de distribución.
Mercado: Argentina (importado de Brasil) — el Cronos es el sedán de bajo costo más vendido de Argentina.
Gestión: Bosch ME17.9.

FALLAS FRECUENTES:
— 20.000-50.000 km: Ruido de motor frío en arranque — los primeros 3-5 segundos hay ruido metálico. Puede ser NORMAL (circulación de aceite por el VVT) o síntoma de tensores de cadena. Evaluar: si desaparece en 5 segundos → normal. Si persiste más → P0016/P0011.
— 40.000-70.000 km: Bobina de encendido → P0300-P0304. En Argentina las bobinas Magneti Marelli del Cronos han mostrado mayor tasa de falla con gasolina premium de baja calidad.
— 60.000-100.000 km: Válvula PCV / sistema de ventilación del cárter → aceite en la admisión, carbón, P0171 (mezcla pobre por falsa entrada de aire).
— 80.000-120.000 km: Solenoide VVT → P0010/P0011. ACEITE CRÍTICO: 5W-30 OW-20 certified ACEA C2/C3.
— Sistema flex (en versiones Brasil): sensor de composición de combustible → P0178/P0179 cuando el sensor falla o hay contaminación del combustible.

DIAGNÓSTICO:
- Usar scanner Fiat (Examiner) o Autel/Launch con perfil Stellantis.
- Verificar actualizaciones de software — Stellantis ha publicado varias revisiones para el FireFly en Argentina.
- El Cronos es uno de los autos con más flota en Argentina (taxis, remises, uso familiar) — llegará al taller con muchos km.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // HONDA
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'honda_civic_hrv_1_5_vtec_turbo',
    marca: 'HONDA',
    content: `HONDA CIVIC / HR-V / CR-V — Motor L15B7 1.5 VTEC Turbo (2016-2024)
Motor: L15B7 — 1.496cc, turbo, 174 hp, inyección directa, cadena de distribución.
Mercado: Argentina — segmento sedán y SUV compacto.
Gestión: Honda PGM-FI propio.

PROBLEMA CONOCIDO — DILUCIÓN DE ACEITE CON COMBUSTIBLE:
El L15B7 presenta un problema documentado a nivel mundial: en climas fríos y con ciclos cortos, el combustible se mezcla con el aceite del motor. Honda emitió actualizaciones de software y amplió los intervalos de calentamiento.
— Síntoma: nivel de aceite SUBE en la varilla de nivel (hay más aceite de lo normal — está diluido). Olor a combustible en el aceite.
— Causa: ciclos de inyección directa en frío dejan combustible que escapa por las paredes del cilindro.
— Riesgo: el aceite diluido con combustible lubrica peor → desgaste prematuro.
— Solución: usar el A/C encendido (calienta el motor más rápido), hacer recorridos más largos, actualizar software del ECU.

OTRAS FALLAS:
— 30.000-60.000 km: Válvula EGR / sistema VTEC → P0011/P0021. El VTEC turbo tiene actuadores de apertura de válvulas — verificar si la activación del VTEC se produce en el punto esperado (~2.500 rpm).
— 60.000-100.000 km: Bobinas de encendido → P0300-P0304.
— 100.000+ km: Tensores de cadena → ruido al arranque frío.
— Transmisión CVT (Earth Dreams): fluido Honda HCF-2 únicamente. La CVT Honda es más confiable que la Jatco, pero muy sensible al fluido.

ACEITE: 0W-20 Honda Ultra LEO Full Synthetic o equivalente certificado. Honda especifica 0W-20 para la dilución de combustible sea mínima.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // HYUNDAI
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'hyundai_tucson_creta_nu_2_0',
    marca: 'HYUNDAI',
    content: `HYUNDAI TUCSON / CRETA / ELANTRA — Motor Nu 2.0 MPI / Kappa 1.6 GDI (2015-2024)
Motor Nu 2.0 MPI: 156 hp, DOHC 16v, CVVT (variable valve timing).
Motor Kappa 1.6 GDI: 132 hp, inyección directa.
Mercado: Argentina — Tucson y Creta muy frecuentes.
Gestión: Kefico.

FALLAS Nu 2.0 MPI:
— 30.000-60.000 km: Solenoide CVVT → P0011/P0021. El Nu 2.0 es SENSIBLE a aceite degradado. Usar 5W-30 o 5W-20 certificado SN+. Cambio cada 7.500 km MÁXIMO.
— 40.000-80.000 km: Tapa válvulas con fuga de aceite en la zona de las juntas en O-ring laterales → mancha de aceite en el lateral del motor.
— 100.000+ km: Cadena de distribución → ruido al arranque frío + P0011/P0016.
— Transmisión automática A6MF2 (6 velocidades): trompicones al cambio 3→4 en frío → actualización de software TCU. No se resuelve mecánicamente.

FALLAS Kappa 1.6 GDI:
— 30.000-60.000 km: CARBÓN EN VÁLVULAS — el 1.6 GDI es inyección directa pura (sin port). Acumulación rápida en válvulas de admisión. P0300, tirones.
— Bomba de alta presión (GDI) → P0087 en algunos casos. La bomba GDI del Kappa falla prematuramente si el nivel de nafta en el tanque es habitualmente bajo (la nafta lubrica la bomba).

ADVERTENCIA RECALL HYUNDAI/KIA — INCENDIO DE MOTOR:
Hyundai y Kia han tenido campañas de recall masivas por riesgo de incendio de motor en varios modelos Nu y Theta II. Antes de cualquier trabajo mayor en un Tucson/Elantra, verificar si el VIN del cliente está afectado por una campaña activa.`,
  },

  // ══════════════════════════════════════════════════════════════════════════
  // CÓDIGOS P ADICIONALES — SISTEMAS MODERNOS
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'codigos_turbo_boost',
    marca: 'GENERAL',
    content: `CÓDIGOS DE SISTEMA TURBO / BOOST — Diagnóstico MERCOSUR
Guía de diagnóstico para los códigos de turbo más frecuentes en talleres argentinos.

P0299 — BAJA PRESIÓN DE TURBO (underboost):
Causas más comunes por frecuencia:
1. Turbo VNT/VGT con aletas trabadas (Renault K9K, VW TDI, Iveco Daily, Ford Transit TDCi) → mover aletas manualmente desconectando varilla.
2. Manguito del intercooler fisurado o desconectado → buscar fuga de aire soplando en el circuito.
3. Actuador del turbo defectuoso (wastegate o VNT eléctrico) → medir señal eléctrica con osciloscopio.
4. Válvula de bypass (BOV) abierta permanentemente → pérdida de boost.
5. Turbo con desgaste interno (juego axial > 0.5mm) → solo si todo lo anterior está OK.

P0234 — ALTA PRESIÓN DE TURBO (overboost):
1. Actuador de wastegate trabado cerrado → presión no se limita.
2. Válvula limitadora de boost defectuosa.
3. Software ECU con mapa incorrecto (chip tuning mal calibrado).

P0236/P0237/P0238 — SENSOR DE PRESIÓN DE TURBO:
— P0236: señal fuera de rango. Verificar alimentación 5V y masa del sensor.
— P0237: señal baja (circuito abierto o sensor defectuoso).
— P0238: señal alta (cortocircuito a positivo).

DIAGNÓSTICO UNIVERSAL:
1. Medir presión de turbo en live data con el motor en carga (en ruta o dinamómetro).
2. Comparar con el mapa del fabricante (varía por RPM y carga).
3. Si la presión real difiere >15% de la esperada → investigar pérdida o ganancia de boost.
4. Usar manómetro analógico en la línea de presión para confirmar el valor del scanner.`,
  },

  {
    id: 'codigos_combustible_presion',
    marca: 'GENERAL',
    content: `CÓDIGOS DE SISTEMA DE COMBUSTIBLE — Presión y caudal (MERCOSUR)
Guía de diagnóstico para P0087, P0088, P0171, P0172 — los más frecuentes en talleres.

P0087 — PRESIÓN DE COMBUSTIBLE BAJA:
Causas por frecuencia en Argentina:
1. Filtro de combustible obstruido (muy frecuente con gasoil/nafta de baja calidad). Verificar primero.
2. Bomba de combustible débil — medir presión con manómetro en el rail. Valores de referencia:
   — Motores nafteros MPI: 3.0-4.5 bar en ralentí, 4.0-5.0 bar con vacío desconectado.
   — Common rail diesel: 250-350 bar en ralentí, >1.000 bar en plena carga.
3. Regulador de presión defectuoso (en sistemas con regreso de combustible).
4. Bomba de alta presión (GDI / common rail) debilitada — si la bomba de baja presión está OK.

P0088 — PRESIÓN DE COMBUSTIBLE ALTA:
1. Regulador de presión trabado cerrado.
2. Retorno de combustible obstruido.

P0171 — MEZCLA POBRE (Banco 1):
Causas comunes:
1. Fuga de vacío en múltiple de admisión o manguera de vacío → verificar con spray de carburador.
2. Inyector obstruido → test de balance de inyectores.
3. MAF sucio o defectuoso → limpiar con limpiador de MAF y verificar LTFT.
4. Bomba de combustible débil (P0087 + P0171 simultáneos).
5. Fuga de escape antes del sensor lambda upstream.

P0172 — MEZCLA RICA (Banco 1):
1. Inyector que gotea → presión de combustible cae después de apagar el motor.
2. Sensor de temperatura de refrigerante leyendo frío → mezcla de arranque permanente.
3. Purga del cánister de carbón activo obstruida (mezcla rica a bajas rpm).

MÉTODO DE DIAGNÓSTICO LTFT/STFT:
— STFT (corrección a corto plazo): normal ±5%.
— LTFT (corrección a largo plazo): normal ±10%.
— LTFT muy positivo (+15%+) = mezcla pobre. LTFT muy negativo (-15%-) = mezcla rica.`,
  },

].filter(e => e.content.trim().length > 0);

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔧 MechaIA — Seeder Batch 3 (Peugeot, Renault diesel, VW nuevos, Toyota, Ford, Fiat, Honda, Hyundai)');
  console.log(`🚗 Entradas: ${ENTRIES.length}`);

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
          path: `seeds/mercosur_batch3/${entry.id}.md`,
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

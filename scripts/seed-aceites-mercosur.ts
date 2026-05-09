#!/usr/bin/env tsx
/**
 * seed-aceites-mercosur.ts
 * Seed dedicado de especificaciones de aceite para los modelos populares
 * de Argentina/Brasil/MERCOSUR. Cada chunk: viscosidad, spec del fabricante,
 * capacidad, intervalo, filtro recomendado.
 *
 * El RAG va a recuperar estos chunks cuando la query mencione aceite,
 * lubricacion, presion de aceite, o codigos OBD relacionados (P0011, etc.).
 *
 * Uso: npx tsx scripts/seed-aceites-mercosur.ts
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

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
const googleApiKey = process.env.GOOGLE_AI_API_KEY!;

async function getEmbedding(text: string): Promise<number[]> {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${googleApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'models/gemini-embedding-001', content: { parts: [{ text }] }, outputDimensionality: 768 }),
  });
  const d = await r.json() as { embedding?: { values?: number[] } };
  if (!d.embedding?.values) throw new Error('no embedding');
  return d.embedding.values;
}

interface OilSpec {
  id: string;
  marca: string;
  modelo: string;
  motores: string;        // ej "1.4 MPFI, 1.0 Turbo"
  viscosidad: string;     // ej "5W-30"
  especificacion: string; // ej "dexos2"
  capacidad: string;      // litros
  intervalo: string;      // km
  filtro?: string;        // referencia del filtro de aceite
  notas?: string;         // notas particulares (ej "OBLIGATORIO para DPF")
}

const SPECS: OilSpec[] = [
  // ── CHEVROLET ──────────────────────────────────────────────────────────────
  { id: 'aceite_chevrolet_onix_14',  marca: 'CHEVROLET', modelo: 'Onix',     motores: '1.4 MPFI, 1.0 Aspirado',     viscosidad: '5W-30', especificacion: 'GM dexos2 (API SN)', capacidad: '3.5 L',       intervalo: '10.000 km / 1 año',  filtro: 'PF457 / Mahle OC468', notas: 'Si se usa aceite no dexos, reducir intervalo a 7.500 km. El termostato del 1.4 falla con aceite degradado.' },
  { id: 'aceite_chevrolet_onix_10t', marca: 'CHEVROLET', modelo: 'Onix Plus / Onix Turbo', motores: '1.0 Turbo (LIH) GDI', viscosidad: '0W-20', especificacion: 'GM dexos1 Gen2 (API SP, ILSAC GF-6A)', capacidad: '3.8 L', intervalo: '7.500 km MÁXIMO',    filtro: 'AC Delco PF66 / Mahle OC1577', notas: 'OBLIGATORIO 0W-20 dexos1 Gen2. Aceite incorrecto causa falla del actuador VCT y consumo excesivo.' },
  { id: 'aceite_chevrolet_cruze',    marca: 'CHEVROLET', modelo: 'Cruze',    motores: '1.4 Turbo Ecotec, 1.8 LUW',  viscosidad: '5W-30', especificacion: 'GM dexos2',           capacidad: '4.25 L',       intervalo: '10.000 km',           filtro: 'AC Delco PF457 / Mahle OC468', notas: 'El 1.4 Turbo es muy sensible a aceite degradado. Evitar 5W-40 (no recomendado por GM).' },
  { id: 'aceite_chevrolet_corsa',    marca: 'CHEVROLET', modelo: 'Corsa Classic / Celta',  motores: '1.0/1.4/1.8 8v Multec', viscosidad: '15W-40 (más de 100k km) o 10W-40', especificacion: 'API SL/SM',          capacidad: '3.5 L',     intervalo: '5.000-7.500 km',     filtro: 'Tecfil PSL71 / Wega WO-128', notas: 'Motor antiguo, tolera aceite mineral o semi-sintético. En servicio severo (taxi/remis), reducir intervalo a 5.000 km.' },
  { id: 'aceite_chevrolet_tracker_18', marca: 'CHEVROLET', modelo: 'Tracker (2014-2019)',  motores: '1.8 LUJ',                viscosidad: '5W-30', especificacion: 'GM dexos2',           capacidad: '4.25 L',       intervalo: '10.000 km',           filtro: 'AC Delco PF457' },
  { id: 'aceite_chevrolet_tracker_12t', marca: 'CHEVROLET', modelo: 'Tracker Turbo (2020+)', motores: '1.2 Turbo LT2',         viscosidad: '0W-20', especificacion: 'GM dexos1 Gen2',     capacidad: '4.5 L',         intervalo: '7.500 km',           filtro: 'AC Delco PF66' },
  { id: 'aceite_chevrolet_s10_28',   marca: 'CHEVROLET', modelo: 'S10 Diesel',  motores: '2.8 Duramax LWN/LML',           viscosidad: '5W-30', especificacion: 'GM dexos2 (OBLIGATORIO para DPF)', capacidad: '7.5 L', intervalo: '10.000 km máx con gasoil ARG',  filtro: 'AC Delco PF63 / Wega WO-922', notas: 'Con gasoil de baja calidad, reducir a 7.500 km. Filtro de combustible cada 10k.' },
  { id: 'aceite_chevrolet_spin',     marca: 'CHEVROLET', modelo: 'Spin',     motores: '1.8 SPE/4',                          viscosidad: '5W-30', especificacion: 'API SN',              capacidad: '4.5 L',         intervalo: '10.000 km',           filtro: 'Tecfil PSL64' },

  // ── PEUGEOT ────────────────────────────────────────────────────────────────
  { id: 'aceite_peugeot_208_14',     marca: 'PEUGEOT',   modelo: '208',      motores: '1.4 8v / 1.6 16v VTi (TU3/TU5)', viscosidad: '5W-30', especificacion: 'PSA B71 2290 / ACEA C2',        capacidad: '3.25 L',  intervalo: '10.000 km / 1 año',  filtro: 'Mahle OX160D1 / Tecfil PSL62', notas: 'Especificación PSA B71 2290 es OBLIGATORIA. Aceite genérico daña el filtro de partículas si lo tiene.' },
  { id: 'aceite_peugeot_208_thp',    marca: 'PEUGEOT',   modelo: '208 GT / 308 GT', motores: '1.6 THP (Prince EP6)',     viscosidad: '5W-30', especificacion: 'PSA B71 2290',                  capacidad: '4.25 L',  intervalo: '10.000 km',           filtro: 'Mahle OX413D / Tecfil PSL620', notas: 'Motor Prince EP6 famoso por consumo de aceite. Verificar nivel cada 1.000 km. Cadena de distribución se estira con aceite degradado.' },
  { id: 'aceite_peugeot_308',        marca: 'PEUGEOT',   modelo: '308 / 408 / 3008',         motores: '1.6 16v VTi, 1.6 HDi',          viscosidad: '5W-30', especificacion: 'PSA B71 2290 (nafta), PSA B71 2294 (HDi)',  capacidad: '4 L',  intervalo: '10.000 km / 1 año', filtro: 'Mahle OX160D1' },
  { id: 'aceite_peugeot_partner',    marca: 'PEUGEOT',   modelo: 'Partner / Berlingo',       motores: '1.6 HDi DV6',                    viscosidad: '5W-30', especificacion: 'PSA B71 2294 (con DPF)',                    capacidad: '3.75 L', intervalo: '15.000 km', filtro: 'Mahle OX160D1', notas: 'Para uso comercial intenso (delivery), reducir intervalo a 10.000 km.' },

  // ── RENAULT ────────────────────────────────────────────────────────────────
  { id: 'aceite_renault_logan_k4m',  marca: 'RENAULT',   modelo: 'Logan / Sandero / Clio',   motores: '1.6 16v K4M',                    viscosidad: '5W-40', especificacion: 'API SN / ACEA A3/B4 (Renault RN0700)',      capacidad: '4.8 L',  intervalo: '10.000 km / 1 año', filtro: 'Mahle OC205 / Tecfil PSL63', notas: 'Motor K4M consume 1L cada 5.000 km es normal en motores con +100.000 km. Aceite 5W-40 ayuda al sello de retenes.' },
  { id: 'aceite_renault_sandero_h4m', marca: 'RENAULT',  modelo: 'Sandero / Logan / Stepway', motores: '1.6 H4M (Renault-Nissan)',     viscosidad: '5W-30', especificacion: 'Renault RN0700 / API SN',                    capacidad: '4.4 L',  intervalo: '15.000 km',           filtro: 'Mahle OC205' },
  { id: 'aceite_renault_kwid',       marca: 'RENAULT',   modelo: 'Kwid',     motores: '1.0 SCe (B4D)',                  viscosidad: '5W-30', especificacion: 'API SN / Renault RN0700',                   capacidad: '2.8 L',  intervalo: '10.000 km',           filtro: 'Mahle OC205' },
  { id: 'aceite_renault_duster_k4m', marca: 'RENAULT',   modelo: 'Duster',   motores: '1.6 K4M, 2.0 F4R',               viscosidad: '5W-40', especificacion: 'API SN / Renault RN0700',                   capacidad: '4.8 L (1.6) / 5.4 L (2.0)', intervalo: '10.000 km', filtro: 'Mahle OC205', notas: 'Servicio severo (off-road, polvo): cambiar cada 7.500 km y revisar filtro de aire frecuentemente.' },
  { id: 'aceite_renault_duster_dci', marca: 'RENAULT',   modelo: 'Duster Diesel / Oroch Diesel', motores: '1.5 dCi K9K',                viscosidad: '5W-30', especificacion: 'Renault RN0720 (con FAP)',                  capacidad: '4.5 L',  intervalo: '15.000 km',           filtro: 'Mahle OX339D', notas: 'OBLIGATORIO RN0720 si tiene FAP/DPF. Aceite incorrecto tapa el FAP en 30.000 km.' },
  { id: 'aceite_renault_megane_kangoo', marca: 'RENAULT', modelo: 'Megane / Kangoo / Symbol', motores: '1.6 16v K4M, 1.5 dCi K9K',     viscosidad: '5W-40 (nafta) / 5W-30 (dCi)', especificacion: 'Renault RN0700 (nafta) / RN0720 (diesel con FAP)', capacidad: '4.8 L', intervalo: '10.000 km', filtro: 'Mahle OC205' },

  // ── FIAT ───────────────────────────────────────────────────────────────────
  { id: 'aceite_fiat_palio_uno',     marca: 'FIAT',      modelo: 'Palio / Siena / Uno / Mobi', motores: '1.0/1.4 Fire Evo, 1.0/1.4 GSE Firefly', viscosidad: '5W-30', especificacion: 'API SN / Fiat 9.55535-G2',           capacidad: '2.5 L',  intervalo: '10.000 km', filtro: 'Tecfil PSL40', notas: 'Motor Fire es muy tolerante. En GNC recomendado reducir intervalo a 7.500 km.' },
  { id: 'aceite_fiat_cronos_argo',   marca: 'FIAT',      modelo: 'Cronos / Argo',             motores: '1.3/1.8 E.torQ',                viscosidad: '5W-30', especificacion: 'API SN / Fiat 9.55535-G2',                  capacidad: '4 L (1.8) / 3.2 L (1.3)', intervalo: '10.000 km', filtro: 'Tecfil PSL40 / Mahle OC1098' },
  { id: 'aceite_fiat_punto',         marca: 'FIAT',      modelo: 'Punto / Linea',             motores: '1.4 Fire, 1.4 T-Jet, 1.6/1.8 E.torQ', viscosidad: '5W-30', especificacion: 'API SN / Fiat 9.55535-G2',           capacidad: '4 L',     intervalo: '10.000 km', filtro: 'Tecfil PSL40' },
  { id: 'aceite_fiat_toro',          marca: 'FIAT',      modelo: 'Toro / Strada / Doblò',     motores: '1.8 E.torQ, 2.0 Multijet diesel', viscosidad: '5W-30 (nafta) / 5W-40 (diesel)', especificacion: 'API SN (nafta) / ACEA C3 (diesel con DPF)', capacidad: '4.2 L (nafta) / 5.5 L (diesel)', intervalo: '10.000 km', filtro: 'Tecfil PSL40 (nafta) / Tecfil PSL580 (diesel)' },

  // ── VOLKSWAGEN ─────────────────────────────────────────────────────────────
  { id: 'aceite_vw_gol_voyage',      marca: 'VOLKSWAGEN', modelo: 'Gol / Voyage / Saveiro',   motores: '1.6 MSI EA111, 1.6 MSI EA211',  viscosidad: '5W-40', especificacion: 'VW 502.00 / API SN',                       capacidad: '4.2 L',  intervalo: '10.000 km / 1 año', filtro: 'Mahle OC1098 / Wega WO-322' },
  { id: 'aceite_vw_polo_virtus',     marca: 'VOLKSWAGEN', modelo: 'Polo / Virtus / Vento',    motores: '1.6 MSI EA211, 1.0 200 TSI, 1.4 TSI', viscosidad: '5W-40 (MSI) / 5W-30 (TSI)', especificacion: 'VW 502.00 (MSI) / VW 504.00 (TSI con LongLife)', capacidad: '4 L', intervalo: '10.000 km MSI / 15.000 km TSI con 504.00', filtro: 'Mahle OC1098', notas: 'TSI requiere VW 504.00 LongLife OBLIGATORIO. Usar API SN común causa carbonización en válvulas de admisión GDI.' },
  { id: 'aceite_vw_amarok_20',       marca: 'VOLKSWAGEN', modelo: 'Amarok',                    motores: '2.0 TDI BiTDI',                  viscosidad: '5W-30', especificacion: 'VW 507.00 (con DPF)',                       capacidad: '6.5 L',  intervalo: '15.000 km',           filtro: 'Mahle OX370D / Mann HU 718/5', notas: 'OBLIGATORIO VW 507.00 con DPF. Aceite incorrecto tapa el DPF en menos de 50.000 km.' },
  { id: 'aceite_vw_tcross_taos',     marca: 'VOLKSWAGEN', modelo: 'T-Cross / Taos / Nivus',  motores: '1.0/1.4 TSI, 1.4 250 TSI',       viscosidad: '5W-30', especificacion: 'VW 504.00',                                  capacidad: '4 L',     intervalo: '15.000 km con 504.00', filtro: 'Mahle OC1098', notas: 'OBLIGATORIO 504.00. Sin esa spec, reducir intervalo a 10.000 km.' },

  // ── FORD ───────────────────────────────────────────────────────────────────
  { id: 'aceite_ford_ka',            marca: 'FORD',      modelo: 'Ka',       motores: '1.0/1.5 TI-VCT Sigma, 1.5 Dragon', viscosidad: '5W-30', especificacion: 'Ford WSS-M2C913-D / API SN',                capacidad: '3.8 L',  intervalo: '10.000 km',           filtro: 'Mahle OC619 / Tecfil PSL35' },
  { id: 'aceite_ford_fiesta_ecosport', marca: 'FORD',    modelo: 'Fiesta / EcoSport',         motores: '1.5/1.6 Sigma TI-VCT',           viscosidad: '5W-30', especificacion: 'Ford WSS-M2C913-D',                          capacidad: '4.1 L',  intervalo: '10.000 km',           filtro: 'Mahle OC619' },
  { id: 'aceite_ford_focus_20',      marca: 'FORD',      modelo: 'Focus',                      motores: '2.0 Duratec, 1.6 Sigma',         viscosidad: '5W-30', especificacion: 'Ford WSS-M2C913-D / API SN',                capacidad: '4.3 L',  intervalo: '10.000 km',           filtro: 'Mahle OC619' },
  { id: 'aceite_ford_ranger_32',     marca: 'FORD',      modelo: 'Ranger',                     motores: '3.2 Duratorq Diesel, 2.2 Diesel', viscosidad: '5W-30', especificacion: 'Ford WSS-M2C913-D (con DPF: M2C950-A)',     capacidad: '7.8 L (3.2) / 6 L (2.2)', intervalo: '15.000 km', filtro: 'Mahle OX380D', notas: 'Si tiene DPF (Euro V/VI) usar M2C950-A. Servicio severo: reducir a 10.000 km.' },

  // ── TOYOTA ─────────────────────────────────────────────────────────────────
  { id: 'aceite_toyota_corolla_2zr', marca: 'TOYOTA',    modelo: 'Corolla',                    motores: '1.8 2ZR-FE Dual VVT-i',          viscosidad: '5W-30 (o 0W-20 desde 2014)', especificacion: 'API SN ILSAC GF-5 / Toyota 08880-83883', capacidad: '4.4 L', intervalo: '10.000 km / 6 meses', filtro: 'Toyota 04152-YZZA1 / Mahle OX416', notas: 'Cadena de distribución sin mantenimiento si se respeta el aceite. NUNCA usar 5W-40 — daña el VVT-i.' },
  { id: 'aceite_toyota_etios',       marca: 'TOYOTA',    modelo: 'Etios',                      motores: '1.5 2NR-FE',                     viscosidad: '5W-30',                       especificacion: 'API SN',                                    capacidad: '3.7 L', intervalo: '10.000 km', filtro: 'Toyota 04152-YZZA6' },
  { id: 'aceite_toyota_hilux_kun',   marca: 'TOYOTA',    modelo: 'Hilux / SW4',                motores: '2.8 GD-6 / 1GD-FTV Diesel',       viscosidad: '5W-30',                       especificacion: 'ACEA C2/C3 (con DPF) / API CK-4',           capacidad: '7.5 L', intervalo: '10.000 km / 6 meses', filtro: 'Toyota 90915-YZZK1', notas: 'Servicio severo (4x4 trabajo): cambiar cada 5.000 km. Filtro de combustible cada 10.000 km.' },
  { id: 'aceite_toyota_yaris',       marca: 'TOYOTA',    modelo: 'Yaris',                      motores: '1.5 2NR-FBE Dual VVT-iE',         viscosidad: '0W-20',                       especificacion: 'API SP ILSAC GF-6A',                        capacidad: '3.4 L', intervalo: '10.000 km',           filtro: 'Toyota 04152-YZZA6' },

  // ── HYUNDAI ────────────────────────────────────────────────────────────────
  { id: 'aceite_hyundai_hb20',       marca: 'HYUNDAI',   modelo: 'HB20',                       motores: '1.0/1.6 Kappa, 1.0 Turbo GDi',   viscosidad: '5W-30 (aspirado) / 0W-20 (Turbo GDi)', especificacion: 'API SN / ILSAC GF-5', capacidad: '3.3 L', intervalo: '10.000 km / 1 año', filtro: 'Hyundai 26300-35530' },
  { id: 'aceite_hyundai_creta',      marca: 'HYUNDAI',   modelo: 'Creta / Tucson',             motores: '1.6/2.0 MPi Nu, 1.6 T-GDi',     viscosidad: '5W-30 (MPi) / 5W-30 (T-GDi)', especificacion: 'API SN / ACEA A5/B5',                       capacidad: '4 L',     intervalo: '10.000 km',           filtro: 'Hyundai 26300-35530' },

  // ── CITROËN ────────────────────────────────────────────────────────────────
  { id: 'aceite_citroen_c3',         marca: 'CITROEN',   modelo: 'C3 / C4',                    motores: '1.6 16v VTi, 1.6 HDi',           viscosidad: '5W-30', especificacion: 'PSA B71 2290 (nafta) / PSA B71 2294 (HDi)', capacidad: '4 L',  intervalo: '10.000 km / 1 año', filtro: 'Mahle OX160D1' },
  { id: 'aceite_citroen_berlingo',   marca: 'CITROEN',   modelo: 'Berlingo',                   motores: '1.6 HDi',                        viscosidad: '5W-30', especificacion: 'PSA B71 2294 (con DPF)',                     capacidad: '3.75 L', intervalo: '15.000 km',          filtro: 'Mahle OX160D1' },

  // ── HONDA ──────────────────────────────────────────────────────────────────
  { id: 'aceite_honda_civic_hrv',    marca: 'HONDA',     modelo: 'Civic / HR-V / WR-V',        motores: '1.5/1.8/2.0 i-VTEC',             viscosidad: '0W-20 (recientes) / 5W-30 (más viejos)', especificacion: 'Honda HTO-06 / API SN', capacidad: '3.7 L', intervalo: '10.000 km',           filtro: 'Honda 15400-PLM-A02', notas: 'Honda especifica 0W-20 desde 2012 — usar 5W-30 acepta pero Honda no lo recomienda en climas calientes.' },
  { id: 'aceite_honda_fit_city',     marca: 'HONDA',     modelo: 'Fit / City / Jazz',          motores: '1.4/1.5 L15 i-VTEC',             viscosidad: '0W-20',                                 especificacion: 'Honda HTO-06',                              capacidad: '3.6 L',     intervalo: '10.000 km',           filtro: 'Honda 15400-PFB-007' },

  // ── NISSAN ─────────────────────────────────────────────────────────────────
  { id: 'aceite_nissan_kicks_versa', marca: 'NISSAN',    modelo: 'Kicks / Versa / March',      motores: '1.6 HR16DE',                     viscosidad: '5W-30',                                 especificacion: 'API SN / ILSAC GF-5',                       capacidad: '3.4 L',     intervalo: '10.000 km / 1 año',  filtro: 'Nissan 15208-65F0E' },
  { id: 'aceite_nissan_frontier',    marca: 'NISSAN',    modelo: 'Frontier',                   motores: '2.3/2.5 dCi YS23DDTT, YD25DDTi', viscosidad: '5W-30',                                 especificacion: 'ACEA C3 (con DPF)',                         capacidad: '7 L',       intervalo: '10.000 km',           filtro: 'Nissan 15208-EB70A' },

  // ── JEEP ───────────────────────────────────────────────────────────────────
  { id: 'aceite_jeep_renegade_compass', marca: 'JEEP',   modelo: 'Renegade / Compass',         motores: '1.3/1.8/2.0 GSE T-jet, 2.0 MultiJet diesel', viscosidad: '0W-20 (turbo) / 5W-30 (aspirado/diesel)', especificacion: 'Fiat 9.55535-GS1 (turbo nafta) / ACEA C2 (diesel)', capacidad: '4.8 L', intervalo: '10.000 km', filtro: 'Tecfil PSL580' },

  // ── KIA ────────────────────────────────────────────────────────────────────
  { id: 'aceite_kia_picanto_rio',    marca: 'KIA',       modelo: 'Picanto / Rio / Cerato',     motores: '1.0/1.4/1.6 Kappa/Gamma',        viscosidad: '5W-30',                                 especificacion: 'API SN / ACEA A5/B5',                       capacidad: '3.3 L',     intervalo: '10.000 km',           filtro: 'Kia 26300-35530' },

  // ── SUZUKI ─────────────────────────────────────────────────────────────────
  { id: 'aceite_suzuki_swift_jimny', marca: 'SUZUKI',    modelo: 'Swift / Jimny / Vitara',     motores: '1.2/1.4 K-Series, 1.5 M15A',     viscosidad: '5W-30',                                 especificacion: 'API SN ILSAC GF-5',                         capacidad: '3.1 L',     intervalo: '10.000 km',           filtro: 'Suzuki 16510-61A30' },

  // ── MERCEDES-BENZ ──────────────────────────────────────────────────────────
  { id: 'aceite_mb_sprinter',        marca: 'MERCEDES-BENZ', modelo: 'Sprinter',               motores: '2.1 OM651, 2.0 OM654',           viscosidad: '5W-30',                                 especificacion: 'MB 229.51 (con DPF) / MB 229.31',           capacidad: '8 L',       intervalo: '20.000 km',           filtro: 'Mahle OX370D', notas: 'Servicio comercial intenso: cambiar cada 15.000 km. NUNCA usar API SN común sin spec MB.' },
];

function buildContent(s: OilSpec): string {
  // Estructuramos el chunk con palabras clave que el embedding capture bien
  // (aceite, lubricacion, viscosidad, intervalo, cambio, filtro).
  const lines = [
    `${s.marca} ${s.modelo} — ACEITE DE MOTOR (${s.motores})`,
    ``,
    `Aceite recomendado: ${s.viscosidad}`,
    `Especificación del fabricante: ${s.especificacion}`,
    `Capacidad de aceite del motor: ${s.capacidad}`,
    `Intervalo de cambio de aceite: ${s.intervalo}`,
  ];
  if (s.filtro) lines.push(`Filtro de aceite: ${s.filtro}`);
  if (s.notas) lines.push(``, `Notas técnicas: ${s.notas}`);
  lines.push(``);
  lines.push(`Códigos OBD relacionados al aceite: P0011, P0012, P0014, P0016 (VVT/VCT con aceite degradado), P0521-P0523 (sensor de presión de aceite), P0420 puede agravarse con aceite vencido en algunos motores.`);
  return lines.join('\n');
}

async function main() {
  console.log(`Seeding ${SPECS.length} especificaciones de aceite\n`);

  let saved = 0;
  let skipped = 0;
  let errors = 0;

  for (const spec of SPECS) {
    const { count: existing } = await supabase
      .from('knowledge_base')
      .select('*', { count: 'exact', head: true })
      .eq('metadata->>seed_id', spec.id);
    if ((existing ?? 0) > 0) {
      console.log(`  ⏭️  ${spec.id} ya existe`);
      skipped++;
      continue;
    }

    const content = buildContent(spec);
    try {
      const embedding = await getEmbedding(content);
      const { error } = await supabase.from('knowledge_base').insert({
        content,
        metadata: {
          source: 'seed_aceites',
          seed_id: spec.id,
          marca: spec.marca,
          modelo: spec.modelo,
          tipo: 'aceite_motor',
          filename: `aceite_${spec.marca}_${spec.modelo.replace(/\s+/g, '_').toLowerCase()}`,
        },
        embedding,
      });
      if (error) { console.error(`  ❌ ${spec.id}:`, error.message); errors++; continue; }
      console.log(`  ✅ ${spec.marca.padEnd(13)} ${spec.modelo}`);
      saved++;
    } catch (e) {
      console.error(`  ❌ ${spec.id}:`, (e as Error).message);
      errors++;
    }
    await new Promise(r => setTimeout(r, 250));
  }

  console.log(`\n────────────────────────────`);
  console.log(`Guardados: ${saved}`);
  console.log(`Saltados:  ${skipped}`);
  console.log(`Errores:   ${errors}`);
}

main().catch(e => { console.error(e); process.exit(1); });

#!/usr/bin/env tsx
/**
 * cleanup-kb.ts
 * Limpieza de knowledge_base:
 *   1) Borra chunks duplicados (mismo content exacto).
 *   2) Borra chunks de archivos ruidosos que dominan el RAG sin aportar diagnóstico
 *      (listados de drivers de programadoras, listados de chips, etc).
 *   3) Reporta el estado final por marca.
 *
 * Uso:
 *   npx tsx scripts/cleanup-kb.ts            # dry run (muestra qué borraría)
 *   npx tsx scripts/cleanup-kb.ts --apply    # aplica los cambios
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

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!supabaseUrl || !supabaseKey) { console.error('Faltan env vars'); process.exit(1); }

const supabase = createClient(supabaseUrl, supabaseKey);
const APPLY = process.argv.includes('--apply');

// Patrones de filename de archivos que NO sirven para diagnóstico clínico:
// son listados de drivers de programadoras, chips, eepproms, mascaras, etc.
const NOISE_FILENAMES = [
  'lista_de_vehiculos_y_driver',
  'curso_potenciacion',                 // curso teórico genérico, no diagnóstico
  'Codigos_Bosch_de_Circuitos_Integrados_de_uso_automotivo',
  'Mascara_de_Micros',
  'CD PATS II',                          // dump de PATS, no diagnóstico
  'Guia_de_Clase_1-_Lectura_y_Programacion',
  'Guia_para_desinmovilizar',
  'material  curso chip',
];

async function main() {
  console.log(`Modo: ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);

  const { count: total0 } = await supabase
    .from('knowledge_base').select('*', { count: 'exact', head: true });
  console.log(`Total inicial: ${total0} chunks\n`);

  // 1) DUPLICADOS: agrupar por content y dejar el más viejo
  console.log('— Buscando duplicados...');
  const { data: rows } = await supabase
    .from('knowledge_base').select('id, content, created_at').limit(50000);
  const byContent = new Map<string, { id: string; created_at: string }[]>();
  for (const r of rows || []) {
    const key = r.content as string;
    const arr = byContent.get(key) || [];
    arr.push({ id: r.id as string, created_at: r.created_at as string });
    byContent.set(key, arr);
  }
  const idsToDelete: string[] = [];
  let dupGroups = 0;
  for (const arr of byContent.values()) {
    if (arr.length <= 1) continue;
    dupGroups++;
    arr.sort((a, b) => a.created_at.localeCompare(b.created_at));
    // dejar el primero (más viejo), borrar el resto
    for (let i = 1; i < arr.length; i++) idsToDelete.push(arr[i].id);
  }
  console.log(`  Grupos duplicados: ${dupGroups} | chunks redundantes a borrar: ${idsToDelete.length}`);

  // 2) NOISE: chunks de archivos ruidosos
  console.log('\n— Buscando ruido por filename...');
  for (const fname of NOISE_FILENAMES) {
    const { data: noiseRows } = await supabase
      .from('knowledge_base')
      .select('id, metadata')
      .ilike('metadata->>filename', `%${fname}%`)
      .limit(5000);
    const ids = (noiseRows || []).map(r => r.id as string);
    console.log(`  "${fname}": ${ids.length} chunks`);
    idsToDelete.push(...ids);
  }

  const uniq = Array.from(new Set(idsToDelete));
  console.log(`\n→ Total a borrar (uniq): ${uniq.length} chunks (${((uniq.length / (total0 || 1)) * 100).toFixed(1)}% de la KB)`);

  if (!APPLY) {
    console.log('\n[DRY RUN] No se borró nada. Re-ejecutá con --apply para aplicar.');
    return;
  }

  // 3) Ejecutar deletes en batches (Supabase no acepta in() con miles de items)
  const BATCH = 200;
  let deleted = 0;
  for (let i = 0; i < uniq.length; i += BATCH) {
    const batch = uniq.slice(i, i + BATCH);
    const { error } = await supabase.from('knowledge_base').delete().in('id', batch);
    if (error) { console.error('Error en batch:', error.message); break; }
    deleted += batch.length;
    process.stdout.write(`\r  Borrados: ${deleted}/${uniq.length}`);
  }
  console.log();

  // 4) Reporte final
  const { count: total1 } = await supabase
    .from('knowledge_base').select('*', { count: 'exact', head: true });
  const { data: rowsFinal } = await supabase
    .from('knowledge_base').select('metadata').limit(50000);
  const byMarca: Record<string, number> = {};
  for (const r of rowsFinal || []) {
    const m = (r.metadata as { marca?: string })?.marca || 'UNKNOWN';
    byMarca[m] = (byMarca[m] || 0) + 1;
  }
  console.log(`\nTotal final: ${total1} chunks (Δ ${(total1 || 0) - (total0 || 0)})`);
  console.log('\nDistribución final por marca:');
  for (const [k, v] of Object.entries(byMarca).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(20)} ${v}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });

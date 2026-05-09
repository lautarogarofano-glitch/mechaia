#!/usr/bin/env tsx
/**
 * normalize-marcas.ts
 * Normaliza metadata.marca de todos los chunks a la forma canónica que matchea
 * el filtro del RPC. Sin esto, queda mismatch entre lo que manda el form
 * (ej "Volkswagen") y lo que está taggeado en la DB (ej "VW").
 *
 * Mapeos:
 *   VW            → VOLKSWAGEN
 *   VAG           → VOLKSWAGEN
 *   GM_FIAT       → GENERAL  (chunks abstractos, aplica a varios)
 *   PSA           → GENERAL  (Peugeot+Citroen, contenido genérico)
 *   CITROËN       → CITROEN  (sin tilde)
 *
 * Uso:
 *   npx tsx scripts/normalize-marcas.ts            # dry run
 *   npx tsx scripts/normalize-marcas.ts --apply    # aplica
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
const APPLY = process.argv.includes('--apply');

// Mapa de normalización: clave = lo que está en la DB hoy, valor = forma canónica.
const MARCA_MAP: Record<string, string> = {
  'VW': 'VOLKSWAGEN',
  'VAG': 'VOLKSWAGEN',
  'GM_FIAT': 'GENERAL',
  'PSA': 'GENERAL',
  'CITROËN': 'CITROEN',
};

async function main() {
  console.log(`Modo: ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);

  let totalUpdated = 0;
  let totalScanned = 0;

  for (const [from, to] of Object.entries(MARCA_MAP)) {
    const { data: rows } = await supabase
      .from('knowledge_base')
      .select('id, metadata')
      .eq('metadata->>marca', from)
      .limit(50000);

    const ids = (rows || []).map(r => r.id as string);
    totalScanned += ids.length;
    console.log(`${from.padEnd(15)} → ${to.padEnd(15)}: ${ids.length} chunks`);

    if (!APPLY || ids.length === 0) continue;

    // Update en batches: leemos cada metadata, mergeamos {marca: nuevo}, y persistimos.
    // Supabase no acepta merge JSONB en update directo del cliente; hacemos por id.
    const BATCH = 50;
    let updated = 0;
    for (let i = 0; i < (rows || []).length; i += BATCH) {
      const batch = (rows || []).slice(i, i + BATCH);
      await Promise.all(batch.map(async (r) => {
        const newMeta = { ...(r.metadata as Record<string, unknown>), marca: to };
        const { error } = await supabase
          .from('knowledge_base')
          .update({ metadata: newMeta })
          .eq('id', r.id as string);
        if (!error) updated++;
      }));
      process.stdout.write(`\r  ${updated}/${ids.length}`);
    }
    console.log();
    totalUpdated += updated;
  }

  console.log(`\n────────────────────────────`);
  console.log(`Scanneados: ${totalScanned}`);
  console.log(`Actualizados: ${totalUpdated}`);

  // Reporte final
  if (APPLY) {
    const { data: rows } = await supabase.from('knowledge_base').select('metadata').limit(50000);
    const byMarca: Record<string, number> = {};
    for (const r of rows || []) {
      const m = (r.metadata as { marca?: string })?.marca || 'UNKNOWN';
      byMarca[m] = (byMarca[m] || 0) + 1;
    }
    console.log('\nDistribución final por marca:');
    for (const [k, v] of Object.entries(byMarca).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${k.padEnd(20)} ${v}`);
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });

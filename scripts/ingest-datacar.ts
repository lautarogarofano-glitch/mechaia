#!/usr/bin/env tsx
/**
 * ingest-datacar.ts
 * Fetchea las páginas de códigos OBD2 de datacar-manualrepair.com,
 * extrae texto, embebe con Gemini y guarda en knowledge_base.
 *
 * Cada chunk se guarda con metadata.marca='GENERAL' (aplica a todas las marcas).
 *
 * Uso: npx tsx scripts/ingest-datacar.ts [--limit=N]
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

// Códigos OBD2 más frecuentes en MERCOSUR (por categoría)
const OBD_CODES: string[] = [
  // P00xx — Combustible y aire
  'P0010', 'P0011', 'P0012', 'P0014', 'P0016', 'P0020', 'P0021',
  'P0030', 'P0031', 'P0032', 'P0036', 'P0037', 'P0038',
  'P0087', 'P0088', 'P0089',
  'P0100', 'P0101', 'P0102', 'P0103', 'P0104',
  'P0106', 'P0107', 'P0108', 'P0110', 'P0111', 'P0112', 'P0113', 'P0114',
  'P0115', 'P0116', 'P0117', 'P0118', 'P0120', 'P0121', 'P0122', 'P0123',
  'P0125', 'P0128', 'P0130', 'P0131', 'P0132', 'P0133', 'P0134', 'P0135',
  'P0136', 'P0137', 'P0138', 'P0140', 'P0141',
  'P0170', 'P0171', 'P0172', 'P0174', 'P0175',
  'P0190', 'P0191', 'P0192', 'P0193',
  'P0200', 'P0201', 'P0202', 'P0203', 'P0204',
  'P0220', 'P0221', 'P0222', 'P0223',
  'P0299',
  // P03xx — Encendido / misfire
  'P0300', 'P0301', 'P0302', 'P0303', 'P0304', 'P0305', 'P0306',
  'P0325', 'P0326', 'P0327', 'P0328',
  'P0335', 'P0336', 'P0340', 'P0341', 'P0344',
  'P0350', 'P0351', 'P0352', 'P0353', 'P0354', 'P0355',
  'P0380', 'P0381',
  // P04xx — Sistema de emisiones
  'P0420', 'P0421', 'P0430', 'P0431',
  'P0440', 'P0441', 'P0442', 'P0443', 'P0446', 'P0455', 'P0456', 'P0480',
  // P05xx — Velocidad / ralentí
  'P0500', 'P0501', 'P0505', 'P0506', 'P0507',
  // P06xx — ECU
  'P0601', 'P0606',
  // P07xx — Transmisión
  'P0700', 'P0703', 'P0705', 'P0710', 'P0715', 'P0720', 'P0725', 'P0730',
  'P0740', 'P0741', 'P0750',
  // P08xx-P09xx
  'P0820', 'P0830', 'P0840',
];

function chunkText(text: string, chunkSize = 1200, overlap = 150): string[] {
  const out: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 80) out.push(chunk);
    if (end >= text.length) break;
    start = end - overlap;
  }
  return out;
}

async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${googleApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'models/gemini-embedding-001', content: { parts: [{ text }] }, outputDimensionality: 768 }),
    }
  );
  if (!res.ok) throw new Error(`embedding failed: ${res.status}`);
  const data = await res.json() as { embedding?: { values?: number[] } };
  if (!data.embedding?.values) throw new Error('no embedding values');
  return data.embedding.values;
}

function htmlToText(html: string): string {
  // Quitar scripts, estilos, nav, footer
  let s = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<form[\s\S]*?<\/form>/gi, '');
  // Aislar el <article> o <main> si existe
  const articleMatch = s.match(/<(article|main)[^>]*>([\s\S]*?)<\/\1>/i);
  if (articleMatch) s = articleMatch[2];
  // Eliminar tags y normalizar
  s = s
    .replace(/<br\s*\/?>(\s*)/gi, '\n')
    .replace(/<\/(p|h[1-6]|li|tr|div)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return s;
}

async function fetchCode(code: string): Promise<string | null> {
  const url = `https://www.datacar-manualrepair.com/codigos-de-falla/codigo-de-falla-${code.toLowerCase()}/`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MechaIA-RAG-Builder/1.0)' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      console.log(`  ${code}: HTTP ${res.status} — saltando`);
      return null;
    }
    const html = await res.text();
    const text = htmlToText(html);
    if (text.length < 200) {
      console.log(`  ${code}: contenido muy chico (${text.length} chars) — saltando`);
      return null;
    }
    return text;
  } catch (e) {
    console.log(`  ${code}: error ${(e as Error).message}`);
    return null;
  }
}

async function main() {
  const limitArg = process.argv.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : OBD_CODES.length;
  const codes = OBD_CODES.slice(0, limit);

  console.log(`Ingesting ${codes.length} OBD codes desde datacar-manualrepair.com\n`);

  let totalChunks = 0;
  let processedCodes = 0;
  let skippedCodes = 0;

  for (const code of codes) {
    console.log(`📄 ${code}`);

    // Skip si ya existe ese codigo en la KB
    const { count: existing } = await supabase
      .from('knowledge_base')
      .select('*', { count: 'exact', head: true })
      .eq('metadata->>source', 'datacar')
      .eq('metadata->>obd_code', code);
    if ((existing ?? 0) > 0) {
      console.log(`  ya existe (${existing} chunks) — saltando`);
      skippedCodes++;
      continue;
    }

    const text = await fetchCode(code);
    if (!text) { skippedCodes++; continue; }

    // Anteponer el código y descripción para que el embedding capture mejor el match
    const enrichedText = `Código OBD2 ${code}\n\n${text}`;
    const chunks = chunkText(enrichedText);
    console.log(`  ${text.length} chars → ${chunks.length} chunks`);

    let saved = 0;
    for (let i = 0; i < chunks.length; i++) {
      try {
        const embedding = await getEmbedding(chunks[i]);
        const { error } = await supabase.from('knowledge_base').insert({
          content: chunks[i],
          metadata: {
            source: 'datacar',
            obd_code: code,
            marca: 'GENERAL',
            filename: `obd_${code}_datacar`,
            chunk: String(i),
          },
          embedding,
        });
        if (error) { console.error(`  insert error:`, error.message); continue; }
        saved++;
      } catch (e) {
        console.error(`  chunk ${i} error:`, (e as Error).message);
      }
      await new Promise(r => setTimeout(r, 250)); // rate limit embeddings
    }
    console.log(`  ✅ ${saved}/${chunks.length} guardados`);
    totalChunks += saved;
    processedCodes++;
    await new Promise(r => setTimeout(r, 500)); // rate limit datacar
  }

  console.log(`\n────────────────────────────`);
  console.log(`Códigos procesados: ${processedCodes}`);
  console.log(`Códigos saltados:   ${skippedCodes}`);
  console.log(`Chunks insertados:  ${totalChunks}`);
}

main().catch(e => { console.error(e); process.exit(1); });

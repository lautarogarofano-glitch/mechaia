#!/usr/bin/env tsx
/**
 * ingest-opinautos.ts
 * Fetchea reportes reales de fallas por marca/modelo + código OBD desde opinautos.com.
 * Estos son los chunks más valiosos: casos reales con km, síntomas y solución.
 *
 * URL pattern: https://www.opinautos.com/[marca]/[modelo]/defectos/obd2-[codigo]
 *
 * Estrategia:
 *   1) Para cada (marca, modelo) → fetchear /[marca]/[modelo]/defectos/ y extraer
 *      los códigos OBD listados (los que la comunidad reportó).
 *   2) Para cada código encontrado → fetchear la página detallada y guardar.
 *
 * Uso: npx tsx scripts/ingest-opinautos.ts [--marca=chevrolet] [--modelo=onix]
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

// Lista de modelos populares en MERCOSUR. Las marcas en metadata se guardan
// uppercase (CHEVROLET) para matchear con el filtro del RPC.
const MODELS: { marca: string; modelo: string; marcaTag: string }[] = [
  { marca: 'chevrolet', modelo: 'onix',      marcaTag: 'CHEVROLET' },
  { marca: 'chevrolet', modelo: 'cruze',     marcaTag: 'CHEVROLET' },
  { marca: 'chevrolet', modelo: 'corsa',     marcaTag: 'CHEVROLET' },
  { marca: 'chevrolet', modelo: 'tracker',   marcaTag: 'CHEVROLET' },
  { marca: 'chevrolet', modelo: 'aveo',      marcaTag: 'CHEVROLET' },
  { marca: 'chevrolet', modelo: 'astra',     marcaTag: 'CHEVROLET' },
  { marca: 'chevrolet', modelo: 'celta',     marcaTag: 'CHEVROLET' },
  { marca: 'chevrolet', modelo: 'spin',      marcaTag: 'CHEVROLET' },
  { marca: 'chevrolet', modelo: 's10',       marcaTag: 'CHEVROLET' },
  { marca: 'chevrolet', modelo: 'prisma',    marcaTag: 'CHEVROLET' },

  { marca: 'peugeot',   modelo: '208',       marcaTag: 'PEUGEOT' },
  { marca: 'peugeot',   modelo: '308',       marcaTag: 'PEUGEOT' },
  { marca: 'peugeot',   modelo: '408',       marcaTag: 'PEUGEOT' },
  { marca: 'peugeot',   modelo: '2008',      marcaTag: 'PEUGEOT' },
  { marca: 'peugeot',   modelo: '3008',      marcaTag: 'PEUGEOT' },
  { marca: 'peugeot',   modelo: 'partner',   marcaTag: 'PEUGEOT' },
  { marca: 'peugeot',   modelo: '207',       marcaTag: 'PEUGEOT' },

  { marca: 'renault',   modelo: 'logan',     marcaTag: 'RENAULT' },
  { marca: 'renault',   modelo: 'sandero',   marcaTag: 'RENAULT' },
  { marca: 'renault',   modelo: 'duster',    marcaTag: 'RENAULT' },
  { marca: 'renault',   modelo: 'clio',      marcaTag: 'RENAULT' },
  { marca: 'renault',   modelo: 'kangoo',    marcaTag: 'RENAULT' },
  { marca: 'renault',   modelo: 'megane',    marcaTag: 'RENAULT' },
  { marca: 'renault',   modelo: 'symbol',    marcaTag: 'RENAULT' },
  { marca: 'renault',   modelo: 'stepway',   marcaTag: 'RENAULT' },

  { marca: 'fiat',      modelo: 'cronos',    marcaTag: 'FIAT' },
  { marca: 'fiat',      modelo: 'argo',      marcaTag: 'FIAT' },
  { marca: 'fiat',      modelo: 'palio',     marcaTag: 'FIAT' },
  { marca: 'fiat',      modelo: 'siena',     marcaTag: 'FIAT' },
  { marca: 'fiat',      modelo: 'punto',     marcaTag: 'FIAT' },
  { marca: 'fiat',      modelo: 'uno',       marcaTag: 'FIAT' },
  { marca: 'fiat',      modelo: 'toro',      marcaTag: 'FIAT' },
  { marca: 'fiat',      modelo: 'strada',    marcaTag: 'FIAT' },
  { marca: 'fiat',      modelo: 'mobi',      marcaTag: 'FIAT' },
  { marca: 'fiat',      modelo: '500',       marcaTag: 'FIAT' },

  { marca: 'volkswagen', modelo: 'gol',      marcaTag: 'VOLKSWAGEN' },
  { marca: 'volkswagen', modelo: 'polo',     marcaTag: 'VOLKSWAGEN' },
  { marca: 'volkswagen', modelo: 'voyage',   marcaTag: 'VOLKSWAGEN' },
  { marca: 'volkswagen', modelo: 'suran',    marcaTag: 'VOLKSWAGEN' },
  { marca: 'volkswagen', modelo: 'saveiro',  marcaTag: 'VOLKSWAGEN' },
  { marca: 'volkswagen', modelo: 'amarok',   marcaTag: 'VOLKSWAGEN' },
  { marca: 'volkswagen', modelo: 't-cross',  marcaTag: 'VOLKSWAGEN' },
  { marca: 'volkswagen', modelo: 'taos',     marcaTag: 'VOLKSWAGEN' },
  { marca: 'volkswagen', modelo: 'virtus',   marcaTag: 'VOLKSWAGEN' },
  { marca: 'volkswagen', modelo: 'vento',    marcaTag: 'VOLKSWAGEN' },
  { marca: 'volkswagen', modelo: 'bora',     marcaTag: 'VOLKSWAGEN' },
  { marca: 'volkswagen', modelo: 'fox',      marcaTag: 'VOLKSWAGEN' },

  { marca: 'ford',      modelo: 'ka',         marcaTag: 'FORD' },
  { marca: 'ford',      modelo: 'fiesta',     marcaTag: 'FORD' },
  { marca: 'ford',      modelo: 'ecosport',   marcaTag: 'FORD' },
  { marca: 'ford',      modelo: 'focus',      marcaTag: 'FORD' },
  { marca: 'ford',      modelo: 'ranger',     marcaTag: 'FORD' },
  { marca: 'ford',      modelo: 'territory',  marcaTag: 'FORD' },

  { marca: 'toyota',    modelo: 'corolla',    marcaTag: 'TOYOTA' },
  { marca: 'toyota',    modelo: 'etios',      marcaTag: 'TOYOTA' },
  { marca: 'toyota',    modelo: 'yaris',      marcaTag: 'TOYOTA' },
  { marca: 'toyota',    modelo: 'hilux',      marcaTag: 'TOYOTA' },
  { marca: 'toyota',    modelo: 'sw4',        marcaTag: 'TOYOTA' },
  { marca: 'toyota',    modelo: 'rav4',       marcaTag: 'TOYOTA' },

  { marca: 'hyundai',   modelo: 'hb20',       marcaTag: 'HYUNDAI' },
  { marca: 'hyundai',   modelo: 'creta',      marcaTag: 'HYUNDAI' },
  { marca: 'hyundai',   modelo: 'tucson',     marcaTag: 'HYUNDAI' },
  { marca: 'hyundai',   modelo: 'i30',        marcaTag: 'HYUNDAI' },

  { marca: 'citroen',   modelo: 'c3',         marcaTag: 'CITROEN' },
  { marca: 'citroen',   modelo: 'c4',         marcaTag: 'CITROEN' },
  { marca: 'citroen',   modelo: 'berlingo',   marcaTag: 'CITROEN' },
];

function chunkText(text: string, chunkSize = 1500, overlap = 150): string[] {
  const out: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 100) out.push(chunk);
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
  if (!res.ok) throw new Error(`embedding ${res.status}`);
  const data = await res.json() as { embedding?: { values?: number[] } };
  if (!data.embedding?.values) throw new Error('no embedding');
  return data.embedding.values;
}

function htmlToText(html: string): string {
  // Opinautos.com no usa <article>/<main>, sino divs con clase js-report* y mucho
  // chrome (lista de países, navegación, login). Truncamos por marcadores conocidos
  // y luego limpiamos tags.
  let s = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<form[\s\S]*?<\/form>/gi, '');

  // Cortar antes del primer js-report (descartamos topbar/breadcrumb/sidebar inicial).
  // Avanzamos hasta el `>` que cierra ese tag para no arrastrar atributos.
  const startIdx = s.search(/<[^>]+class="[^"]*js-report\b/i);
  if (startIdx > -1) {
    const closeIdx = s.indexOf('>', startIdx);
    s = closeIdx > -1 ? s.slice(closeIdx + 1) : s.slice(startIdx);
  }

  // Cortar despues del bloque útil. Los marcadores son textuales y consistentes.
  const stopMarkers = [
    'Resolví mi problema',
    'Crea tu usuario',
    'Elige tu país',
    'class="Footer"',
    'class="FooterBar"',
    'js-comment-register',
  ];
  for (const mk of stopMarkers) {
    const idx = s.indexOf(mk);
    if (idx > 200) { s = s.slice(0, idx); break; }
  }

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

async function fetchUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MechaIA-RAG-Builder/1.0)' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function findCodesForModel(marca: string, modelo: string): Promise<string[]> {
  // Página /[marca]/[modelo]/defectos/ lista códigos OBD reportados.
  // Algunos códigos OBD también aparecen embebidos en slugs de reportes individuales.
  const url = `https://www.opinautos.com/${marca}/${modelo}/defectos`;
  const html = await fetchUrl(url);
  if (!html) return [];
  const codes = new Set<string>();
  // (1) hrefs directos al índice del código
  for (const m of html.matchAll(/\/defectos\/obd2-(p[0-9a-z]{4})/gi)) codes.add(m[1].toUpperCase());
  // (2) códigos mencionados en slugs de reportes individuales
  for (const m of html.matchAll(/codigo-(p[0-9a-z]{4})/gi)) codes.add(m[1].toUpperCase());
  return Array.from(codes);
}

interface CommunityReport { id: string; slug: string; url: string; }

async function findCommunityReports(marca: string, modelo: string): Promise<CommunityReport[]> {
  // Reportes individuales: /[marca]/[modelo]/defectos/[id]/[slug]
  const url = `https://www.opinautos.com/${marca}/${modelo}/defectos`;
  const html = await fetchUrl(url);
  if (!html) return [];
  const reports = new Map<string, CommunityReport>();
  const re = new RegExp(`href="(/${marca}/${modelo}/defectos/(\\d+)/([a-z0-9-]+))"`, 'gi');
  let m;
  while ((m = re.exec(html)) !== null) {
    if (!reports.has(m[2])) {
      reports.set(m[2], { id: m[2], slug: m[3], url: `https://www.opinautos.com${m[1]}` });
    }
  }
  return Array.from(reports.values());
}

async function main() {
  const args = process.argv.slice(2);
  const marcaArg = args.find(a => a.startsWith('--marca='))?.split('=')[1]?.toLowerCase();
  const modeloArg = args.find(a => a.startsWith('--modelo='))?.split('=')[1]?.toLowerCase();
  const maxPerModel = parseInt(args.find(a => a.startsWith('--max='))?.split('=')[1] || '20');

  let targets = MODELS;
  if (marcaArg) targets = targets.filter(t => t.marca === marcaArg);
  if (modeloArg) targets = targets.filter(t => t.modelo === modeloArg);
  if (targets.length === 0) {
    console.error('Sin modelos para procesar (verificá --marca y --modelo)');
    process.exit(1);
  }

  console.log(`Ingesting opinautos: ${targets.length} modelos, máx ${maxPerModel} códigos c/u\n`);

  let totalChunks = 0;
  let totalCombos = 0;
  let skippedCombos = 0;

  for (const t of targets) {
    console.log(`\n🚗 ${t.marcaTag} ${t.modelo}`);

    // (A) Páginas por código OBD (ej /defectos/obd2-p0420)
    const codes = await findCodesForModel(t.marca, t.modelo);
    console.log(`  Códigos OBD reportados: ${codes.length}`);

    for (const code of codes.slice(0, maxPerModel)) {
      const { count: existing } = await supabase
        .from('knowledge_base')
        .select('*', { count: 'exact', head: true })
        .eq('metadata->>source', 'opinautos_obd')
        .eq('metadata->>marca', t.marcaTag)
        .eq('metadata->>modelo', t.modelo)
        .eq('metadata->>obd_code', code);
      if ((existing ?? 0) > 0) { skippedCombos++; continue; }

      const url = `https://www.opinautos.com/${t.marca}/${t.modelo}/defectos/obd2-${code.toLowerCase()}`;
      const html = await fetchUrl(url);
      if (!html) { skippedCombos++; continue; }
      const text = htmlToText(html);
      if (text.length < 300) { skippedCombos++; continue; }

      const enriched = `${t.marcaTag} ${t.modelo.toUpperCase()} — Código OBD2 ${code} (reportes reales de la comunidad)\n\n${text}`;
      const chunks = chunkText(enriched);

      let saved = 0;
      for (let i = 0; i < chunks.length; i++) {
        try {
          const embedding = await getEmbedding(chunks[i]);
          const { error } = await supabase.from('knowledge_base').insert({
            content: chunks[i],
            metadata: {
              source: 'opinautos_obd',
              marca: t.marcaTag,
              modelo: t.modelo,
              obd_code: code,
              filename: `${t.marcaTag}_${t.modelo}_${code}_opinautos`,
              chunk: String(i),
            },
            embedding,
          });
          if (!error) saved++;
        } catch { /* siguiente chunk */ }
        await new Promise(r => setTimeout(r, 250));
      }
      console.log(`    OBD ${code}: ${saved} chunks`);
      totalChunks += saved;
      totalCombos++;
      await new Promise(r => setTimeout(r, 400));
    }

    // (B) Reportes individuales de la comunidad (más valiosos: casos reales con síntomas y solución)
    const reports = await findCommunityReports(t.marca, t.modelo);
    console.log(`  Reportes individuales: ${reports.length} (procesando ${Math.min(reports.length, maxPerModel)})`);

    for (const r of reports.slice(0, maxPerModel)) {
      const { count: existing } = await supabase
        .from('knowledge_base')
        .select('*', { count: 'exact', head: true })
        .eq('metadata->>source', 'opinautos_report')
        .eq('metadata->>report_id', r.id);
      if ((existing ?? 0) > 0) { skippedCombos++; continue; }

      const html = await fetchUrl(r.url);
      if (!html) { skippedCombos++; continue; }
      const text = htmlToText(html);
      if (text.length < 200) { skippedCombos++; continue; }

      // Detectar si el slug menciona un código OBD
      const obdMatch = r.slug.match(/p[0-9a-z]{4}/i);
      const obdCode = obdMatch ? obdMatch[0].toUpperCase() : null;

      const titleHint = r.slug.replace(/-/g, ' ');
      const enriched = `${t.marcaTag} ${t.modelo.toUpperCase()} — Reporte de comunidad: "${titleHint}"${obdCode ? ` (código ${obdCode})` : ''}\n\n${text}`;
      const chunks = chunkText(enriched);

      let saved = 0;
      for (let i = 0; i < chunks.length; i++) {
        try {
          const embedding = await getEmbedding(chunks[i]);
          const { error } = await supabase.from('knowledge_base').insert({
            content: chunks[i],
            metadata: {
              source: 'opinautos_report',
              marca: t.marcaTag,
              modelo: t.modelo,
              report_id: r.id,
              slug: r.slug,
              obd_code: obdCode || '',
              filename: `${t.marcaTag}_${t.modelo}_${r.slug.slice(0, 40)}`,
              chunk: String(i),
            },
            embedding,
          });
          if (!error) saved++;
        } catch { /* siguiente chunk */ }
        await new Promise(r2 => setTimeout(r2, 250));
      }
      if (saved > 0) console.log(`    REP ${r.slug.slice(0, 50)}: ${saved} chunks`);
      totalChunks += saved;
      totalCombos++;
      await new Promise(r2 => setTimeout(r2, 400));
    }
  }

  console.log(`\n────────────────────────────`);
  console.log(`Combos procesados: ${totalCombos}`);
  console.log(`Combos saltados:   ${skippedCombos}`);
  console.log(`Chunks insertados: ${totalChunks}`);
}

main().catch(e => { console.error(e); process.exit(1); });

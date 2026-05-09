#!/usr/bin/env tsx
/**
 * process-docs.ts
 * Procesa los PDFs de mechani_ai/, extrae texto, genera embeddings (Google AI)
 * y los guarda en Supabase knowledge_base.
 *
 * Uso: npx tsx scripts/process-docs.ts [--reset]
 *   --reset: borra todos los embeddings existentes antes de procesar
 */

import fs from 'fs';
import path from 'path';

// Cargar .env.local manualmente
const envFile = path.resolve('.env.local');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
  }
}
import { execSync } from 'child_process';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ─── Config ───────────────────────────────────────────────────────────────────
const DOCS_DIR = path.resolve('./mechani_ai');
const CHUNK_SIZE = 800;       // caracteres por chunk
const CHUNK_OVERLAP = 100;    // solapamiento entre chunks
const BATCH_SIZE = 50;        // chunks por insert batch
const EMBED_DELAY_MS = 200;   // delay entre llamadas a embedding API (rate limit)

// Variables de entorno (requiere .env.local o env seteados)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
// Preferimos GOOGLE_AI_API_KEY_INGEST (cuota separada para no tirar prod abajo).
const googleApiKey = process.env.GOOGLE_AI_API_KEY_INGEST || process.env.GOOGLE_AI_API_KEY || '';

if (!supabaseUrl || !supabaseKey || !googleApiKey) {
  console.error('❌ Faltan variables de entorno. Verificá VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y GOOGLE_AI_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(googleApiKey);
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 50) chunks.push(chunk);
    if (end >= text.length) break;
    start = end - CHUNK_OVERLAP;
  }
  return chunks;
}

async function getEmbedding(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent({ content: { parts: [{ text }] }, outputDimensionality: 768 } as any);
  return result.embedding.values;
}

function extractMetaFromPath(filePath: string): Record<string, string> {
  const relative = path.relative(DOCS_DIR, filePath);
  const parts = relative.split(path.sep);
  const filename = parts[parts.length - 1].replace('.pdf', '');

  // Inferir marca del path
  const brandKeywords = ['RENAULT', 'PEUGEOT', 'VW', 'VOLKSWAGEN', 'FORD', 'FIAT', 'GM', 'CHEVROLET', 'HYUNDAI', 'CITROEN', 'TOYOTA'];
  const pathUpper = relative.toUpperCase();
  const marca = brandKeywords.find(b => pathUpper.includes(b)) || 'GENERAL';

  return {
    filename,
    path: relative,
    marca,
    folder: parts.slice(0, -1).join('/'),
  };
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getAllPdfs(dir: string): Promise<string[]> {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...await getAllPdfs(full));
    } else if (entry.name.toLowerCase().endsWith('.pdf')) {
      results.push(full);
    }
  }
  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const shouldReset = process.argv.includes('--reset');

  if (shouldReset) {
    console.log('🗑️  Borrando embeddings existentes...');
    await supabase.from('knowledge_base').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('✅ Tabla limpia');
  }

  // Obtener archivos ya procesados para no duplicar
  const { data: existing } = await supabase
    .from('knowledge_base')
    .select('metadata')
    .not('metadata->>path', 'is', null);

  const processedPaths = new Set(
    (existing || []).map(r => r.metadata?.path).filter(Boolean)
  );
  console.log(`📋 Ya procesados: ${processedPaths.size} archivos únicos`);

  const allPdfs = await getAllPdfs(DOCS_DIR);
  console.log(`📁 PDFs encontrados: ${allPdfs.length}`);

  let totalChunks = 0;
  let processedFiles = 0;
  let skippedFiles = 0;
  let errorFiles = 0;

  for (const pdfPath of allPdfs) {
    const relative = path.relative(DOCS_DIR, pdfPath);

    if (processedPaths.has(relative)) {
      skippedFiles++;
      continue;
    }

    console.log(`\n📄 [${processedFiles + 1}/${allPdfs.length}] ${relative}`);

    try {
      const text = execSync(`pdftotext "${pdfPath}" -`, { maxBuffer: 10 * 1024 * 1024, timeout: 15000 }).toString().trim();

      if (!text || text.length < 100) {
        console.log(`  ⚠️  Texto insuficiente (${text?.length || 0} chars) — saltando`);
        skippedFiles++;
        continue;
      }

      console.log(`  ✏️  Texto extraído: ${text.length} chars`);

      const chunks = chunkText(text);
      console.log(`  🔪 Chunks: ${chunks.length}`);

      const meta = extractMetaFromPath(pdfPath);
      let savedChunks = 0;

      // Generar embedding e insertar de inmediato (sin acumular en RAM)
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        await sleep(EMBED_DELAY_MS);
        const embedding = await getEmbedding(chunk);
        const { error } = await supabase.from('knowledge_base').insert({
          content: chunk,
          metadata: { ...meta, chunk: String(i) },
          embedding,
        });
        if (error) throw error;
        savedChunks++;
        process.stdout.write(`\r  🧠 ${savedChunks}/${chunks.length} chunks`);
      }
      console.log();

      totalChunks += savedChunks;
      processedFiles++;
      console.log(`  ✅ Guardados ${savedChunks} chunks`);

    } catch (err) {
      console.error(`  ❌ Error:`, (err as Error).message);
      errorFiles++;
    }
  }

  console.log('\n─────────────────────────────────────');
  console.log(`✅ Procesados: ${processedFiles} archivos`);
  console.log(`⏭️  Saltados:   ${skippedFiles} (ya existían o sin texto)`);
  console.log(`❌ Errores:    ${errorFiles}`);
  console.log(`📦 Total chunks insertados: ${totalChunks}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});

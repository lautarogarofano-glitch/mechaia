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
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pdfParse from 'pdf-parse';

// ─── Config ───────────────────────────────────────────────────────────────────
const DOCS_DIR = path.resolve('./mechani_ai');
const CHUNK_SIZE = 800;       // caracteres por chunk
const CHUNK_OVERLAP = 100;    // solapamiento entre chunks
const BATCH_SIZE = 50;        // chunks por insert batch
const EMBED_DELAY_MS = 200;   // delay entre llamadas a embedding API (rate limit)

// Variables de entorno (requiere .env.local o env seteados)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const googleApiKey = process.env.GOOGLE_AI_API_KEY || '';

if (!supabaseUrl || !supabaseKey || !googleApiKey) {
  console.error('❌ Faltan variables de entorno. Verificá VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y GOOGLE_AI_API_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(googleApiKey);
const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 50) chunks.push(chunk); // ignorar chunks muy cortos
    start = end - CHUNK_OVERLAP;
  }
  return chunks;
}

async function getEmbedding(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent(text);
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
      const buffer = fs.readFileSync(pdfPath);
      const parsed = await pdfParse(buffer);
      const text = parsed.text?.trim();

      if (!text || text.length < 100) {
        console.log(`  ⚠️  Texto insuficiente (${text?.length || 0} chars) — saltando`);
        skippedFiles++;
        continue;
      }

      console.log(`  ✏️  Texto extraído: ${text.length} chars`);

      const chunks = chunkText(text);
      console.log(`  🔪 Chunks: ${chunks.length}`);

      const meta = extractMetaFromPath(pdfPath);
      const rows: Array<{ content: string; metadata: Record<string, string>; embedding: number[] }> = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        await sleep(EMBED_DELAY_MS);
        const embedding = await getEmbedding(chunk);
        rows.push({ content: chunk, metadata: { ...meta, chunk: String(i) }, embedding });
        process.stdout.write(`\r  🧠 Embedding ${i + 1}/${chunks.length}`);
      }
      console.log();

      // Insertar en batches
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const { error } = await supabase.from('knowledge_base').insert(batch);
        if (error) throw error;
      }

      totalChunks += rows.length;
      processedFiles++;
      console.log(`  ✅ Guardados ${rows.length} chunks`);

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

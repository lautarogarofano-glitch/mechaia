/**
 * _rag.ts — Utilidad de RAG search para las serverless functions
 * Genera el embedding de la consulta y busca en knowledge_base de Supabase.
 * Usa fetch directo a la API de Google AI (sin SDK) para evitar problemas de bundling en Vercel.
 */

import { createClient } from '@supabase/supabase-js';

export interface RagChunk {
  content: string;
  metadata: Record<string, string>;
  similarity: number;
}

async function getEmbedding(text: string, apiKey: string): Promise<number[] | null> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'models/gemini-embedding-001',
          content: { parts: [{ text }] },
          outputDimensionality: 768,
        }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json() as { embedding?: { values?: number[] } };
    return data.embedding?.values ?? null;
  } catch {
    return null;
  }
}

export async function searchKnowledgeBase(
  query: string,
  supabaseUrl: string,
  supabaseKey: string,
  matchCount = 4,
  minSimilarity = 0.35
): Promise<RagChunk[]> {
  const googleApiKey = process.env.GOOGLE_AI_API_KEY;
  if (!googleApiKey) return [];

  try {
    const embedding = await getEmbedding(query, googleApiKey);
    if (!embedding) return [];

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.rpc('search_knowledge_base', {
      query_embedding: embedding,
      match_count: matchCount,
      min_similarity: minSimilarity,
    });

    if (error || !data) return [];
    return data as RagChunk[];
  } catch {
    return [];
  }
}

export function formatRagContext(chunks: RagChunk[]): string {
  if (chunks.length === 0) return '';
  const lines = chunks.map((c, i) =>
    `[Doc ${i + 1} — ${c.metadata?.filename || 'técnico'}, similitud: ${(c.similarity * 100).toFixed(0)}%]\n${c.content}`
  );
  return `\nINFORMACIÓN TÉCNICA DE LA BASE DE CONOCIMIENTO:\n${lines.join('\n\n')}\n`;
}

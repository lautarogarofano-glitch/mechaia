/**
 * _rag.ts — Utilidad de RAG search para las serverless functions
 * Genera el embedding de la consulta y busca en knowledge_base de Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface RagChunk {
  content: string;
  metadata: Record<string, string>;
  similarity: number;
}

export async function searchKnowledgeBase(
  query: string,
  supabaseUrl: string,
  supabaseKey: string,
  matchCount = 4,
  minSimilarity = 0.35
): Promise<RagChunk[]> {
  if (!process.env.GOOGLE_AI_API_KEY) return [];

  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
    const result = await embeddingModel.embedContent({ content: { parts: [{ text: query }] }, outputDimensionality: 768 } as any);
    const embedding = result.embedding.values;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await supabase.rpc('search_knowledge_base', {
      query_embedding: embedding,
      match_count: matchCount,
      min_similarity: minSimilarity,
    });

    if (error || !data) return [];
    return data as RagChunk[];
  } catch {
    // Si falla el RAG, el diagnóstico continúa sin contexto extra
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

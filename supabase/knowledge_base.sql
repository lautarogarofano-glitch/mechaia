-- Habilitar extensión pgvector
create extension if not exists vector;

-- Tabla de base de conocimiento
create table if not exists knowledge_base (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  metadata jsonb default '{}',
  embedding vector(768),
  created_at timestamptz default now()
);

-- Índice para búsqueda por similitud coseno
create index if not exists knowledge_base_embedding_idx
  on knowledge_base using ivfflat (embedding vector_cosine_ops)
  with (lists = 50);

-- Función para búsqueda semántica
create or replace function search_knowledge_base(
  query_embedding vector(768),
  match_count int default 5,
  min_similarity float default 0.3
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    kb.id,
    kb.content,
    kb.metadata,
    1 - (kb.embedding <=> query_embedding) as similarity
  from knowledge_base kb
  where 1 - (kb.embedding <=> query_embedding) > min_similarity
  order by kb.embedding <=> query_embedding
  limit match_count;
end;
$$;

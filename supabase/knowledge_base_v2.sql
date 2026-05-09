-- =============================================
-- MECHAIA — knowledge_base RPC v2
-- Agrega filtro por marca al search_knowledge_base.
-- Ejecutar en: Supabase Dashboard > SQL Editor
--
-- Cambio vs v1:
--   - Acepta marca_filter (nullable). Si está seteado, sólo retorna chunks
--     de esa marca o de marca='GENERAL' (contenido aplicable a todos).
--   - Defaults: match_count=8 (antes 5), min_similarity=0.25 (antes 0.3).
-- =============================================

-- 0. Asegurar índice GIN sobre metadata para que el filtro por marca sea rápido.
create index if not exists knowledge_base_marca_idx
  on knowledge_base ((metadata->>'marca'));

-- 1. Drop la versión vieja (la firma cambia, CREATE OR REPLACE no alcanza).
drop function if exists search_knowledge_base(vector(768), int, float);
drop function if exists search_knowledge_base(vector(768), int, float, text);

-- 2. Versión nueva con filtro por marca.
create or replace function search_knowledge_base(
  query_embedding vector(768),
  match_count int default 8,
  min_similarity float default 0.25,
  marca_filter text default null
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
declare
  v_marca text;
begin
  v_marca := nullif(upper(trim(coalesce(marca_filter, ''))), '');

  return query
  select
    kb.id,
    kb.content,
    kb.metadata,
    1 - (kb.embedding <=> query_embedding) as similarity
  from knowledge_base kb
  where 1 - (kb.embedding <=> query_embedding) > min_similarity
    and (
      v_marca is null
      or upper(coalesce(kb.metadata->>'marca', '')) = v_marca
      or upper(coalesce(kb.metadata->>'marca', '')) = 'GENERAL'
    )
  order by kb.embedding <=> query_embedding
  limit match_count;
end;
$$;

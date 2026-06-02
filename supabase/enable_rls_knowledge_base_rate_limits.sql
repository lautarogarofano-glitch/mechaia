-- 2026-06-02: Cerrar alerta de seguridad de Supabase (rls_disabled_in_public).
-- knowledge_base y rate_limits estaban SIN RLS → cualquiera con la URL del
-- proyecto podía leer/editar/borrar. Ambas se acceden SOLO desde el servidor
-- con el service role key (que bypassa RLS), así que habilitar RLS sin políticas
-- bloquea el acceso anónimo/público sin romper la app.
--
-- Verificado: anon recibe [] en ambas, service role lee normal, RAG intacto (49k chunks).

ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits   ENABLE ROW LEVEL SECURITY;

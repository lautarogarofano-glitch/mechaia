# Mechaia — Cerebro del Agente

> Asistente de diagnostico mecanico con IA + RAG + reportes PDF para talleres.
> Este archivo es el contexto principal para Claude Code en este proyecto.

---

## Que es Mechaia

SaaS B2B para mecanicos: el usuario carga datos del vehiculo (marca, modelo, motor, ECU, falla, codigo OBD), conversa con un asistente IA, y obtiene un diagnostico tecnico con plan de reparacion. Modelo de negocio freemium con planes Base/Turbo via Lemon Squeezy.

**Estado:** En produccion (Vercel). i18n ES/EN activado. RAG sobre knowledge_base en pgvector.

---

## Stack Real (Golden Path de Mechaia)

| Capa | Tecnologia | Notas |
|------|------------|-------|
| Build | Vite 5 + TypeScript 5.5 | NO es Next.js |
| Framework | React 18.3 (no React 19) | |
| Estilos | Tailwind 3.4 + tailwind-merge + class-variance-authority | shadcn/ui parcial (solo helpers) |
| Backend | Vercel Serverless Functions en `api/` | Estilo `VercelRequest/VercelResponse` |
| DB + Auth | Supabase (`@supabase/supabase-js`) | RLS activo, pgvector para RAG |
| Pagos | Lemon Squeezy (NO Polar, NO Stripe) | Webhook en `api/lemon-webhook.ts` |
| IA | Anthropic SDK (`@anthropic-ai/sdk`) + Google Gemini (`@google/generative-ai`) | NO Vercel AI SDK |
| Embeddings | Gemini `gemini-embedding-001` (768 dims) | Para RAG |
| PDF | `@react-pdf/renderer` | Reportes descargables |
| Analytics | Vercel Analytics | |
| Deploy | Vercel | `vercel.json` con rewrite a `index.html` (SPA) |

**Variables de entorno relevantes (no commitear):**
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_EMAIL` (gating del AdminDashboard)
- `GOOGLE_AI_API_KEY` (server-side, embeddings + Gemini)
- `ANTHROPIC_API_KEY` (server-side)
- `LEMON_*` (webhook secret + checkout)

---

## Arquitectura Actual

```
mechaia/
├── api/                          # Vercel functions
│   ├── diagnose.ts              # Chat IA + RAG (294 lineas)
│   ├── _rag.ts                  # Helpers RAG
│   ├── create-checkout.ts       # Checkout Lemon Squeezy
│   ├── lemon-webhook.ts         # Webhook suscripciones
│   ├── consume-report.ts        # Decremento de cuota
│   ├── admin-stats.ts           # Metricas admin
│   ├── send-reset-email.ts      # Reset password
│   └── test-health.ts           # Health check
│
├── src/
│   ├── App.tsx                  # Router manual con useState (404 lineas)
│   ├── main.tsx
│   ├── components/              # Flat (NO feature-first todavia)
│   │   ├── Landing.tsx          # 676 lineas — refactor pendiente
│   │   ├── Auth.tsx             # Login/signup
│   │   ├── ResetPassword.tsx
│   │   ├── WelcomeSetup.tsx     # Onboarding workshop_name
│   │   ├── VehicleForm.tsx      # Form de vehiculo
│   │   ├── ChatInterface.tsx    # Chat con diagnose (402 lineas)
│   │   ├── DiagnosticPDF.tsx    # Render PDF
│   │   ├── ReportModal.tsx
│   │   ├── HistorySidebar.tsx   # Historial de diagnosticos
│   │   ├── Pricing.tsx
│   │   ├── Settings.tsx         # 403 lineas
│   │   └── AdminDashboard.tsx
│   ├── lib/
│   │   ├── supabase.ts          # Cliente unico
│   │   └── utils.ts             # cn(), helpers
│   └── types/
│       └── vehicle.ts           # VehicleData, Message, DiagnosisSession, Subscription
│
├── supabase/
│   ├── knowledge_base.sql       # pgvector + search_knowledge_base RPC
│   ├── rate_limits.sql          # Tabla rate_limits (20 req/min/IP)
│   └── admin_stats_fn.sql       # Funcion para AdminDashboard
│
├── docs/
│   └── superpowers/
│       ├── plans/               # Implementation plans
│       └── specs/               # Design specs
│
└── .claude/
    ├── skills/                  # 19 skills (V4) — copiadas de SaaS Factory
    └── memory/                  # Memoria persistente del proyecto
```

---

## Decision Tree: Que Hacer con Cada Request

```
Usuario dice algo
    |
    ├── "Necesito una feature compleja" (DB + UI + API coordinados)
    |       → Skill PRP → aprobar → Skill BUCLE-AGENTICO
    |
    ├── "Quiero agregar IA / chat / vision / RAG"
    |       → Mantener stack actual: Anthropic SDK directo o Gemini directo
    |       → NO migrar a Vercel AI SDK sin aprobacion explicita
    |       → Skill AI sirve como referencia pero adaptar
    |
    ├── "Necesito una tabla / migracion / RLS / query"
    |       → Skill SUPABASE
    |
    ├── "Testealo / hay un bug / verificalo en browser"
    |       → Skill PLAYWRIGHT-CLI
    |
    ├── "Recuerda esto / guarda / no olvides / en que quedamos"
    |       → Skill MEMORY-MANAGER
    |
    ├── "Genera imagen / thumbnail / banner"
    |       → Skill IMAGE-GENERATION
    |
    ├── "Optimiza este skill / mejoralo"
    |       → Skill AUTORESEARCH
    |
    ├── "Crea un skill nuevo"
    |       → Skill SKILL-CREATOR
    |
    └── No encaja
            → Leer codebase, entender patrones, ejecutar con juicio
```

**Skills que NO aplican directo (asumen Next.js App Router):**
`add-login`, `add-payments`, `add-emails`, `add-mobile`, `website-3d`, `new-app`, `eject-sf`, `update-sf`. Servir como **referencia**, no ejecutar tal cual.

---

## Convenciones

- **KISS / YAGNI / DRY**
- Archivos max 500 lineas, funciones max 50 lineas
- `camelCase` para variables/funciones, `PascalCase` para componentes, `kebab-case` para archivos nuevos (los existentes son `PascalCase.tsx`)
- NUNCA `any` (usar `unknown` y narrowing)
- SIEMPRE validar entradas de API con Zod (PENDIENTE — hoy no se valida formal)
- SIEMPRE habilitar RLS en tablas Supabase
- NUNCA commitear secrets ni `.env*`
- Vite env: `VITE_*` para client, sin prefijo para server (`api/`)

### React/Frontend
- Cliente Supabase unico desde `src/lib/supabase.ts`
- `cn()` desde `src/lib/utils.ts` para merging de clases Tailwind
- Sin Zustand: hoy se usa `useState` lift en `App.tsx`. Si se introduce Zustand, hablarlo primero.

### API/Server
- Estilo `(req: VercelRequest, res: VercelResponse) => Promise<...>`
- Rate limiting: tabla `rate_limits` (ver `api/diagnose.ts`)
- Service role solo en server, jamas en cliente
- Embeddings con Gemini `gemini-embedding-001` (768 dims, NO 1536)

---

## Flujos Criticos

### 1. Diagnostico (chat IA + RAG)
```
ChatInterface
  → POST /api/diagnose con { vehicle, messages }
    → searchKnowledgeBase(query, ...) [Gemini embedding → Supabase RPC]
    → Anthropic streaming con context RAG inyectado
    → consume-report decrementa cuota
  → mensaje renderizado en UI
```

### 2. Auth + Onboarding
```
Auth (login/signup) → Supabase Auth
  → si user_metadata.workshop_name vacio → WelcomeSetup
  → si no → currentView 'form'
```

### 3. Billing
```
Pricing → POST /api/create-checkout → Lemon Squeezy URL
  → user paga → webhook a /api/lemon-webhook → tabla subscriptions
  → al volver con ?checkout=success → loadSubscription()
```

### 4. Admin
```
gating: VITE_ADMIN_EMAIL === user.email
  → AdminDashboard → /api/admin-stats (RPC admin_stats_fn)
```

---

## Auto-Blindaje

Cada error que aparece se documenta para que NO vuelva a ocurrir:

| Tipo de error | Donde documentar |
|---------------|------------------|
| Especifico de feature | El plan/PRP de esa feature en `docs/superpowers/plans/` |
| Aplica a multiples features | Skill relevante en `.claude/skills/*/SKILL.md` |
| Aplica a TODO el proyecto | Este `CLAUDE.md` (seccion "Aprendizajes" mas abajo) |

---

## No Hacer

- **NO migrar a Next.js** sin aprobacion explicita del owner. Mechaia esta en produccion en Vite + Vercel functions y funciona.
- **NO cambiar de Lemon Squeezy a Polar/Stripe** sin discusion previa.
- **NO introducir Vercel AI SDK** sin migrar primero los flujos existentes.
- **NO usar OAuth** mas alla del que ya existe (Supabase Email + Google si esta configurado). Mantener simple.
- **NO crear backends separados** (FastAPI, Express, etc.). Todo es Vercel functions.
- **NO subir el limite de archivos** sobre 500 lineas: si excede, refactorizar.
- **NO commitear** `.env`, claves de Supabase service role, secrets de Lemon, ni el `mechaia-content-creator.json` con tokens.

---

## Sistema de Docs (existente)

Antes de SaaS Factory, el proyecto ya tenia un workflow propio:

```
docs/superpowers/
├── plans/      # Implementation plans con bucle agentico previo
└── specs/      # Design specs
```

**Convivencia:** los nuevos PRPs (skill `prp`) pueden ir en `docs/superpowers/plans/` para no romper el sistema existente. Decidir caso por caso.

---

## Comandos npm

```bash
npm run dev                  # Vite dev server
npm run build                # tsc -b && vite build
npm run lint                 # ESLint
npm run preview              # Preview del build
npm run process-docs         # tsx scripts/process-docs.ts (RAG ingest)
npm run process-docs:reset   # Reset de la knowledge_base
```

---

## Aprendizajes

### 2026-05-08: Rutas API dinamicas vs query params en Vite + Vercel
- **Error**: archivos como `api/admin/users/[id].ts` y `api/admin/users/[id]/action.ts` no son ruteados correctamente por `vercel dev` con `framework: "vite"` — caen al SPA fallback (`/index.html`) por el rewrite catch-all de `vercel.json`.
- **Fix**: usar query params en lugar de path params. Endpoints como `api/admin/user-detail.ts` y `api/admin/user-action.ts` que reciben `?id=<uuid>`. Mas a prueba de balas y compatible 100% con Vite + Vercel.
- **Aplicar en**: cualquier endpoint nuevo en `api/`. Evitar `[param]` en folder names; preferir un solo archivo plano que parsee `req.query`.

### 2026-05-08: Imports cross-directory en api/ + prefix `_` rompen en produccion
- **Error**: handlers en subdirectorios (ej `api/admin/users.ts`) que importan helpers cross-directory con prefix `_` (ej `api/_admin-auth.ts`) crashean en runtime con `FUNCTION_INVOCATION_FAILED` 500. En `vercel dev` local funciona, pero al deployar Vercel no incluye el helper en el bundle de la function en subdirectorio. Sintoma: HTTP 500 con `text/plain` body "A server error has occurred".
- **Fix**: inlinear el helper en cada handler (codigo repetido pero a prueba de balas). Para 3 handlers son ~10 lineas de helper duplicadas, no vale la pena la abstraccion.
- **Aplicar en**: cualquier handler en `api/<sub>/`. Si necesitas codigo compartido, inlinearlo o crear el helper SIN prefix `_` y en el mismo nivel que los handlers que lo usan. Verificar siempre con `curl -L` directo al endpoint en prod despues de deployar.

### 2026-05-09: RAG estatico ignoraba sintomas del chat — sistema entero refactorizado
- **Error**: el `searchKnowledgeBase` en `api/diagnose.ts` armaba la query SOLO con campos del form (`marca + modelo + falla + obd`). Cuando el mecanico aportaba sintomas en el chat ("foco quemado", "resistencia baja"), esos terminos no llegaban al RAG nunca. Ademas: `matchCount=4`, `minSimilarity=0.35`, sin filtrar por marca, y la KB tenia 31% de chunks ruido (`lista_de_vehiculos_y_driver`, `curso_potenciacion`, listados de chips) que dominaban el top-k con 60% de similitud sobre los chunks utiles. Resultado: respuestas cualquiera en casos reales.
- **Fix**: 
  1. Query del RAG incluye `vehicle.marca + modelo + motor + obd + falla + ULTIMO MENSAJE DEL CHAT` (slice 500 chars).
  2. `matchCount=8`, `minSimilarity=0.25`, **filtro por marca** via RPC con `marca_filter` parameter (matchea marca exacta + chunks `marca='GENERAL'`).
  3. `normalizeMarca()` mapea aliases comunes (VW↔VOLKSWAGEN, Citroën↔CITROEN, GM↔CHEVROLET, Mercedes-Benz). El form acepta tildes, los seeds usan formas canonicas.
  4. System prompt ahora obliga a citar `[Doc N]` cuando usa datos del contexto, decir explicitamente cuando NO tiene info, y entregar **proactivamente** datos de servicio (aceite, bujias, correa) cuando aplica.
  5. Modelo hibrido: Sonnet 4.6 si hay codigo OBD (en form o chat detectado por regex `/\b[PCBU][0-9][0-9a-fA-F]{3}\b/`), Haiku 4.5 para charla generica. Balance calidad/costo.
  6. Logs de chunks retornados (marca, filename, sim) en cada request para visibilidad en Vercel logs.
  7. Cleanup script borra duplicados (mismo content) + chunks de archivos ruidosos. **Correr `scripts/cleanup-kb.ts --apply` periodicamente** despues de ingestas masivas.
- **Aplicar en**: cualquier futura mejora del RAG. Patrones a recordar:
  - **La query del RAG debe enriquecerse con el contexto conversacional**, no solo con datos del form.
  - **El RPC debe filtrar por dimension dura (marca)**, sino los chunks ruidosos dominan via similitud.
  - **Etiquetado consistente**: chunks deben tener `metadata.marca` en forma canonica (UPPERCASE, sin tildes). Correr `scripts/normalize-marcas.ts --apply` despues de cualquier ingest nuevo.
  - **Observabilidad obligatoria**: si no logueas que chunks vinieron, no podes diagnosticar fallas del RAG en prod.

### 2026-05-09: opinautos.com sin `<article>` — parser HTML necesita selectores especificos
- **Error**: el parser generico de HTML extraia toda la pagina de opinautos (incluyendo lista de paises, navegacion, footer) porque el sitio NO usa `<article>` ni `<main>`. Resultado: chunks de 90k+ chars con 5% de info util, embedding malo, RAG inservible.
- **Fix**: el parser de opinautos en `scripts/ingest-opinautos.ts` usa selectores especificos: arranca despues del primer `<div class="...js-report...">` (cierra el tag de apertura para no arrastrar atributos) y trunca antes de marcadores textuales conocidos del footer (`Resolví mi problema`, `Crea tu usuario`, `Elige tu país`, `class="Footer"`).
- **Aplicar en**: cualquier scraper futuro de sitios sin tags semanticos estandar — buscar selectores especificos de la app (clases con prefix `js-`, ids de container) antes de hacer regex generico de tags. Ver tambien la limitacion de codigosdtc.com: los diagnosticos por modelo son **paywall premium $7-10/mes**, solo el listado generico es libre.

### 2026-05-09: Supabase trunca queries a 1000 rows si no se pagina con range()
- **Error**: scripts como `scripts/cleanup-kb.ts` y `scripts/normalize-marcas.ts` usaban `.limit(50000)` para traer todos los chunks pero Supabase devuelve **maximo 1000 rows por request** sin importar el limit. Resultado: el cleanup detecto solo 175 duplicados en una pasada (cuando habia mas), y los reportes finales mostraban distribuciones truncadas.
- **Fix**: paginar explicitamente con `.range(from, from + 999)` en un loop, acumulando hasta que un batch venga con menos de 1000 filas.
- **Aplicar en**: cualquier script de mantenimiento que necesite procesar TODA la KB (`knowledge_base`, `subscriptions`, `diagnostics`). Nunca confiar en `.limit(N)` para N > 1000.

### 2026-05-10: Pipeline de generacion de videos pitch con IA (`scripts/video/`)
- **Que es**: pipeline 100% autonomo que genera videos pitch a partir de un `.md` en `marketing/scripts/` (ej `pitch-60s.md`). Usa Edge TTS (voz argentina free) + Gemini Image (con avatar persistente) + ffmpeg con Ken Burns. Output a `marketing/output/`.
- **TTS provider preference order**:
  1. `MECHAIA_TTS_PROVIDER=edge|elevenlabs|gemini` explicito si esta seteado.
  2. **ElevenLabs** si `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID` estan en `.env.local` (clone de voz tuya, paga $5+/mes desde 2025).
  3. **Edge TTS** (es-AR-TomasNeural argentino, 100% gratis, sin signup) si el CLI `edge-tts` esta en PATH. **Es el default actual** porque no cuesta nada y suena natural argentino. Instalar: `brew install pipx && pipx install edge-tts`.
  4. **Gemini Charon** como fallback (es OK pero acento mas neutro LATAM).
  - Override de voz Edge: `MECHAIA_EDGE_VOICE=es-AR-ElenaNeural` (femenino) o `es-MX-JorgeNeural`, etc.
- **Avatar persistente**: si `marketing/avatar/base.png` existe, `imagen.ts` lo manda como inline reference en CADA call a Gemini con el prefix "The SAME character shown in the reference image". Esto mantiene la identidad visual (cara, pelo, vestimenta) a traves de todos los beats. Personaje canonico actual: hombre 40 años, tecnico-fundador, look ingeniero-mecanico-SaaS hibrido. Para cambiarlo: `npm run avatar:variants` regenera 4 candidatos en `marketing/avatar/variants/`, copiar el elegido a `base.png`.
- **Uso**: `npm run video -- pitch-60s` (horizontal 1920x1080) o `npm run video -- pitch-60s --vertical` (1080x1920).
- **Cuotas free tier de Gemini para video**:
  - `gemini-2.5-flash-tts`: 10 RPM, free tier OK con la key de prod o INGEST.
  - `gemini-2.5-flash-image`: 10 RPM **SOLO** con `GOOGLE_AI_API_KEY` (prod). En `GOOGLE_AI_API_KEY_INGEST` el limit es `0` para image gen. El pipeline ya prefiere la prod para imagen automaticamente.
  - `imagen-4.0-*`: requiere paid tier.
  - **Override**: exportar `MECHAIA_VIDEO_KEY` o `MECHAIA_IMAGE_KEY` para forzar otra key.
- **Rate limiting**: el orchestrator tiene `DELAY_BETWEEN_BEATS_MS = 12_000` + retry parseando `"retry in Xs"` de la respuesta 429. Para scripts de 8+ beats puede tardar 2+ min pero no rompe.
- **ffmpeg debe tener libass**: el `brew install ffmpeg` base NO incluye libass/subtitles/drawtext. Hay que usar el tap: `brew uninstall ffmpeg && brew install homebrew-ffmpeg/ffmpeg/ffmpeg`. Verificar con `ffmpeg -version | grep enable-libass` y `ffmpeg -filters | grep subtitles`.
- **Subtitulos en `.ass`, no `.srt`**: el filter `subtitles=path:force_style='X,Y'` de ffmpeg 8.x tira problemas de escaping de comas en linea de comando (ni con `\,` ni con spawnSync funciona consistente). La solucion robusta es generar un `.ass` con estilo embedido en el header `[V4+ Styles]` y pasarlo crudo: `-vf "subtitles=path.ass"`. Implementado en `scripts/video/lib/subtitles.ts`.
- **ffmpeg concat demuxer resuelve paths relativos al `.txt`, no al cwd**: al armar `clips.txt` o `audios.txt` siempre usar `path.resolve(p)` para escribir paths absolutos. Si usas relativos, ffmpeg los concatena con el dirname del `.txt` y falla con "No such file or directory".
- **Aplicar en**: cualquier extension del pipeline. Para musica de fondo: input adicional + `amix=duration=longest`. Para mas formatos (square 1:1): cambiar `[width, height]` en el orchestrator. Reutilizar tmp existente para iterar sin quemar cuota: ver `scripts/video/test-assemble.ts` (usa los assets cacheados de una corrida previa).

### 2026-05-09: ⚠️ Cuota DIARIA del Gemini Embedding free tier (1000 req/dia)
- **Error**: el ingest masivo de opinautos (~824 chunks → 824+ embeddings) consumio toda la cuota diaria del free tier de `gemini-embedding-001`. Resultado: HTTP 429 con `quotaId: EmbedContentRequestsPerDayPerProjectPerModel-FreeTier`. La cuota NO se renueva hasta el siguiente dia UTC. **Esto rompe la app en prod**: cada call a `/api/diagnose` necesita 1 embedding para el RAG. Sin cuota, `searchKnowledgeBase` devuelve `[]` y el RAG no aporta contexto al modelo.
- **Fix inmediato**: activar billing en Google AI Studio (https://aistudio.google.com/) → la cuota pasa de 1000/dia a tier pago (10K-1M segun plan). Mientras no haya billing: limitar el ingest masivo a tandas pequeñas distribuidas en varios dias.
- **Aplicar en**:
  1. **NUNCA hacer un ingest masivo (+500 embeddings) sin verificar primero que el proyecto Google tiene billing activado.** Free tier es para desarrollo, no para poblar KB de prod.
  2. **El Google AI key del ingest debe estar SEPARADO del key de produccion** — si comparten cuota, un bulk job tira la app abajo.
  3. Antes de cualquier script de ingest grande: agregar un check de cuota inicial (1 request de prueba), y al detectar 429, salir con mensaje claro.
  4. Considerar alternativa: usar el embedding API en modo batch o en horario nocturno cuando la cuota se renueva.

### 2026-05-22: Ingests largos requieren `caffeinate` para que la Mac no duerma
- **Error**: el ingest de dtc-database (15,722 chunks, ~4-5 horas estimadas) terminó tardando **8.5 horas** porque la Mac entró en sleep durante la noche. El cronómetro wall-clock del script siguió contando pero los requests se pausaron. NHTSA igual: 100 chunks en 267 min de wall clock vs los ~1.5 min esperados. La culpa NO es del script, ni de la red, ni de Gemini — es macOS poniendo el sistema a dormir cuando no hay actividad del usuario.
- **Fix**: lanzar todos los ingests con `caffeinate -i npx tsx scripts/ingest-X.ts ...`. `caffeinate -i` previene **idle sleep** mientras el comando corra. Cuando termina, vuelve al comportamiento normal de energía. Cero impacto persistente.
- **Aplicar en**: cualquier ingest > 30 min. Patrón:
  ```bash
  caffeinate -i npx tsx scripts/ingest-nhtsa.ts --delay=200 > /tmp/nhtsa.log 2>&1 &
  ```

### 2026-05-22: NHTSA borró `FLAT_TSBS.zip` de S3 — usar Wayback Machine
- **Error**: `https://static.nhtsa.gov/odi/ffdd/tsbs/FLAT_TSBS.zip` devuelve HTTP 404 con `x-amz-delete-marker: true`. El mirror viejo `www-odi.nhtsa.dot.gov/downloads/folders/TSBS/` redirige al portal nuevo. Los endpoints API REST de NHTSA (`/safetyIssues/byKeywords?issueType=manufacturerCommunication`) **NO** exponen TSBs — devuelven consumer complaints incluso con ese filtro (bug del API). El dataset Socrata `hczg-qbhf` es solo un puntero "href" al archivo muerto.
- **Fix**: bajar la copia del Wayback Machine (snapshot 2024-06-10, 41 MB zip / 1.1 GB descomprimido, 4.7M filas tab-separated):
  ```
  curl -sSL -o scripts/.cache/FLAT_TSBS.zip "https://web.archive.org/web/20240610104106id_/https://static.nhtsa.gov/odi/ffdd/tsbs/FLAT_TSBS.zip"
  cd scripts/.cache && unzip -o FLAT_TSBS.zip
  ```
  Formato: 10 columnas TSV. Stream-parse obligatorio (no carga en RAM con readline). El script `scripts/ingest-nhtsa.ts` ya implementa este flujo: filtra marca MERCOSUR + año + summary > 80 chars + dedup por record_id, agrega modelos/años por TSB, cachea a `scripts/.cache/nhtsa-mercosur.json`.
- **Aplicar en**: cualquier re-ingest de NHTSA. Si Wayback pierde la copia: scraping de `nhtsa.gov/recalls` per (year, make, model) como Plan C (más laburo).

<!-- Cada vez que un error se repita, documentar aqui:
### YYYY-MM-DD: Titulo
- **Error:**
- **Fix:**
- **Aplicar en:**
-->

### 2026-05-31: "Mensaje demasiado largo" en respuestas cortas del usuario
- **Error**: el chat tiraba `Error: Mensaje demasiado largo` cuando el mecanico escribia un mensaje corto (ej "1.Aleatoriamente sin importar la condicion", 42 chars). La validacion en `api/diagnose.ts` recorria **todos** los mensajes del historial con `msg.content.length > 4000`, incluidas las **respuestas del propio asistente**. El frontend reenvia la conversacion entera en cada request; una respuesta de diagnostico de la IA (capada en `max_tokens=1500` ≈ 5000-7000 chars) supera los 4000 y, a partir de ahi, **todos** los mensajes siguientes del usuario fallan con 400.
- **Fix**: validar el largo SOLO en mensajes con `role === 'user'` (los del asistente los genera el modelo y ya estan limitados por `max_tokens`), y subir el tope a 8000 para permitir pegar logs de OBD. Ver `api/diagnose.ts` (~linea 203).
- **Aplicar en**: cualquier validacion de input en endpoints que reciben el historial completo de chat. No validar contenido generado por el servidor con las mismas reglas que el input del usuario. La regla de abuso (largo maximo) aplica solo a lo que escribe el humano.

### 2026-06-02: Alerta de seguridad Supabase — `knowledge_base` y `rate_limits` sin RLS
- **Error**: Supabase mando un mail "Critical issue: Table publicly accessible" (`rls_disabled_in_public`). Las tablas `knowledge_base` (49k chunks del RAG) y `rate_limits` tenian RLS **deshabilitado**, asi que cualquiera con la URL del proyecto + la anon key podia leer/editar/borrar todo su contenido. Las demas tablas (`diagnostics`, `subscriptions`, etc.) ya tenian RLS + policies.
- **Fix**: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` en ambas, **sin crear policies**. Ambas se acceden SOLO server-side con el service role key (que bypassa RLS): `knowledge_base` via RPC `search_knowledge_base` y `rate_limits` via insert/select en `api/diagnose.ts`. El frontend (`src/`) no las toca. RLS sin policies = acceso anonimo bloqueado del todo, servidor sigue igual. Ver `supabase/enable_rls_knowledge_base_rate_limits.sql`. Verificado: anon recibe `[]`, service role lee normal, 49096 chunks intactos.
- **Aplicar en**: TODA tabla nueva debe tener RLS habilitado desde el `CREATE TABLE` (es regla del CLAUDE.md pero se coló). Si la tabla es solo server-side (service role), habilitar RLS sin policies alcanza. Si la lee/escribe el cliente con anon key, ademas hay que crear las policies. Correr `get_advisors(type: "security")` o el query de `pg_class.relrowsecurity` despues de cualquier `CREATE TABLE` para no volver a recibir el mail.

---

*Mechaia V1 | Vite + React 18 + Supabase + Vercel functions. No es Next.js. Filosofia Agent-First aplicada al stack actual.*

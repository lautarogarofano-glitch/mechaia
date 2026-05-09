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

### 2026-05-09: ⚠️ Cuota DIARIA del Gemini Embedding free tier (1000 req/dia)
- **Error**: el ingest masivo de opinautos (~824 chunks → 824+ embeddings) consumio toda la cuota diaria del free tier de `gemini-embedding-001`. Resultado: HTTP 429 con `quotaId: EmbedContentRequestsPerDayPerProjectPerModel-FreeTier`. La cuota NO se renueva hasta el siguiente dia UTC. **Esto rompe la app en prod**: cada call a `/api/diagnose` necesita 1 embedding para el RAG. Sin cuota, `searchKnowledgeBase` devuelve `[]` y el RAG no aporta contexto al modelo.
- **Fix inmediato**: activar billing en Google AI Studio (https://aistudio.google.com/) → la cuota pasa de 1000/dia a tier pago (10K-1M segun plan). Mientras no haya billing: limitar el ingest masivo a tandas pequeñas distribuidas en varios dias.
- **Aplicar en**:
  1. **NUNCA hacer un ingest masivo (+500 embeddings) sin verificar primero que el proyecto Google tiene billing activado.** Free tier es para desarrollo, no para poblar KB de prod.
  2. **El Google AI key del ingest debe estar SEPARADO del key de produccion** — si comparten cuota, un bulk job tira la app abajo.
  3. Antes de cualquier script de ingest grande: agregar un check de cuota inicial (1 request de prueba), y al detectar 429, salir con mensaje claro.
  4. Considerar alternativa: usar el embedding API en modo batch o en horario nocturno cuando la cuota se renueva.

<!-- Cada vez que un error se repita, documentar aqui:
### YYYY-MM-DD: Titulo
- **Error:**
- **Fix:**
- **Aplicar en:**
-->

---

*Mechaia V1 | Vite + React 18 + Supabase + Vercel functions. No es Next.js. Filosofia Agent-First aplicada al stack actual.*

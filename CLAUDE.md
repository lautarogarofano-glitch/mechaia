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

<!-- Cada vez que un error se repita, documentar aqui:
### YYYY-MM-DD: Titulo
- **Error:**
- **Fix:**
- **Aplicar en:**
-->

---

*Mechaia V1 | Vite + React 18 + Supabase + Vercel functions. No es Next.js. Filosofia Agent-First aplicada al stack actual.*

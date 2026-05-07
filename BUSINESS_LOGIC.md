# BUSINESS_LOGIC.md — Mechaia

> Logica de negocio del SaaS. Este archivo describe **que hace** Mechaia, no **como** se implementa.
> Para el stack tecnico ver `CLAUDE.md`. Para diseño visual ver `docs/superpowers/specs/`.

> Esqueleto inicial generado a partir del codigo. **Refinar con el owner** (skill `new-app` adaptada o entrevista guiada).

---

## 1. Vision

Mechaia es un asistente IA para **mecanicos de taller** que acelera el diagnostico de fallas vehiculares.
El mecanico carga datos del vehiculo y la falla, conversa con el agente, y obtiene un diagnostico tecnico con plan de reparacion descargable en PDF.

**Audiencia:** talleres mecanicos independientes y multimarca (B2B, mercado hispano y angloparlante).

**Propuesta de valor:**
- Diagnosticos mas rapidos respaldados por IA + base de conocimiento tecnica.
- Acceso 24/7 sin depender de mecanicos senior.
- Reportes profesionales para entregar al cliente final.

---

## 2. Usuarios

| Rol | Que hace en el sistema |
|-----|------------------------|
| **Mecanico (usuario regular)** | Crea cuenta, configura su taller, carga vehiculos, consulta diagnosticos, descarga PDFs, gestiona suscripcion. |
| **Admin** | Acceso al `AdminDashboard` (gateado por `VITE_ADMIN_EMAIL`). Ve metricas globales: usuarios, suscripciones, uso. |

**No existen** roles intermedios (multi-usuario por taller, equipos, jerarquias). Si surge la necesidad, es un PRP.

---

## 3. Modelo de Datos (resumen)

### `subscriptions` (Supabase)
```
plan: 'base' | 'turbo'
status: 'trial' | 'active' | 'inactive' | 'cancelled' | 'past_due'
messages_used: number
messages_limit: number | null
trial_diagnostics_remaining: number
```

### `auth.users.user_metadata`
```
workshop_name: string  // nombre del taller, gating del onboarding
```

### Diagnostico (cliente, persistido como sesiones)
```
VehicleData: { patente, marca, modelo, año, motor, ecu, falla, codigoObd?, kilometraje? }
Message:     { id, role: 'user' | 'assistant', content, timestamp }
DiagnosisSession: { id, vehicle, messages[], createdAt, status: 'active' | 'completed' }
```

### `knowledge_base` (pgvector)
- Documentos tecnicos vectorizados con `gemini-embedding-001` (768 dims).
- Funcion RPC `search_knowledge_base(query_embedding, match_count, min_similarity)`.

### `rate_limits`
- 20 requests por IP por minuto sobre `/api/diagnose`.

### `admin_stats_fn`
- Funcion SQL que agrega metricas para el `AdminDashboard`.

---

## 4. Planes y Pricing (CONFIRMADO 2026-05-07)

| Plan | Precio | Mensajes | Notas |
|------|--------|----------|-------|
| **Trial** | Gratis | 5 diagnosticos totales | Decrementa `trial_diagnostics_remaining`. Al llegar a 0 → bloqueo + Pricing. |
| **Base** | USD $11.45/mes | **150 mensajes/mes** | Limite hard-coded en `api/lemon-webhook.ts:11` (`PLAN_LIMITS.base = 150`). |
| **Turbo** | USD $19.20/mes | **Ilimitado** | `PLAN_LIMITS.turbo = null`. Marcado RECOMENDADO en UI. |

**Provider:** Lemon Squeezy (Merchant of Record). NO se usa Stripe ni Polar.

**Politica:**
- **Sin reembolsos.** No hay devoluciones.
- **Cancelacion libre** desde el perfil del usuario en cualquier momento.
- Cobro automatico mensual con tarjeta.

**Reset de cuota:** Cuando Lemon dispara `subscription_payment_success` (renovacion mensual), `messages_used` vuelve a 0 (`api/lemon-webhook.ts:109-115`).

**Flujo de pago:**
1. Usuario clickea plan en `Pricing`.
2. `POST /api/create-checkout` retorna URL de Lemon Squeezy.
3. Usuario paga en Lemon.
4. Lemon dispara webhook → `POST /api/lemon-webhook` → actualiza tabla `subscriptions`.
5. Usuario vuelve con `?checkout=success` → la app re-lee la suscripcion.

**ATENCION — coherencia de precios/limites:** Si cambia un precio o limite, hay que actualizar **3 lugares acoplados**:
- `src/components/Pricing.tsx` (precio mostrado)
- `src/components/Landing.tsx` (precio en ES y EN)
- `api/lemon-webhook.ts` (`PLAN_LIMITS`)
- Y los productos en Lemon Squeezy.

---

## 5. Flujos de Usuario

### 5.1 Onboarding
1. Landing publica → CTA "Empezar".
2. Auth (signup con email + password).
3. Si `user_metadata.workshop_name` vacio → `WelcomeSetup`.
4. Aterrizaje en `VehicleForm`.

### 5.2 Diagnostico
1. `VehicleForm`: cargar datos del vehiculo y descripcion de falla.
2. Pasar a `ChatInterface`.
3. El usuario describe sintomas; el agente responde con diagnostico iterativo.
4. Backend (`/api/diagnose`):
   - Aplica rate limit (20 req/min/IP).
   - Hace busqueda RAG en `knowledge_base` (Gemini embedding + pgvector).
   - Llama a Anthropic con contexto inyectado (streaming).
5. Cuando el usuario considera el diagnostico cerrado → `consume-report` decrementa cuota → `DiagnosticPDF` genera reporte descargable → `ReportModal` lo muestra.

### 5.3 Historial
- `HistorySidebar` lista las sesiones (`DiagnosisSession[]`) del usuario.
- Selecionar una sesion la rehidrata en `ChatInterface`.

### 5.4 Settings
- Editar `workshop_name` y datos del taller.
- Cambiar plan / cancelar suscripcion (gestion via Lemon).
- Reset de password.

### 5.5 Admin
- Solo si `user.email === VITE_ADMIN_EMAIL`.
- Metricas: usuarios totales, suscriptos, revenue, uso por plan.

---

## 6. Reglas de Negocio

| Regla | Donde se aplica |
|-------|-----------------|
| Trial: N diagnosticos gratis (campo `trial_diagnostics_remaining`). | Decrementado en `consume-report` y/o backend. |
| Si plan terminado o `messages_used >= messages_limit` → bloquear chat. | Frontend (Subscription gating en App.tsx) + validacion server. |
| Rate limit `/api/diagnose`: 20 req/min/IP, fail-open. | `api/diagnose.ts`. |
| Solo el dueño de una sesion puede leerla. | RLS en Supabase. |
| Embeddings: Gemini 768 dims, NO cambiar sin re-vectorizar la KB. | `api/_rag.ts`. |

---

## 7. i18n

- Idiomas: ES (default) + EN.
- Toggle activado en commit `348461f`.
- Mensajes del agente se generan en el idioma del prompt (no hay traduccion automatica del output).

---

## 8. Estado del Producto

**En produccion:** Vercel.
**Analytics:** Vercel Analytics activo (commit `7e70dcc`).
**Ultimo cambio:** Fix de `FUNCTION_INVOCATION_FAILED` en `api/diagnose` + RAG en produccion (commit `dbd56b6`).

**Planes/specs activos:**
- `docs/superpowers/specs/2026-03-31-landing-page-design.md`
- `docs/superpowers/plans/2026-03-31-landing-page.md`
- `docs/superpowers/specs/2026-04-02-n8n-content-generator-design.md`
- `docs/superpowers/plans/2026-04-03-n8n-content-generator.md`

---

## 9. Pendientes / Decisiones Abiertas

> Lista de cosas que el agente NO debe asumir; preguntar al owner.

### Confirmados 2026-05-07
- [x] **Trial**: 5 diagnosticos gratis.
- [x] **Plan Base**: $11.45/mes, 150 mensajes/mes.
- [x] **Plan Turbo**: $19.20/mes, ilimitado.
- [x] **Sin reembolsos.** Cancelacion libre desde el perfil.

### Pendientes para lanzar
- [ ] **Politica de privacidad** (no existe, hay que escribirla y linkearla).
- [ ] **Terminos y condiciones** (no existen).
- [ ] **Politica de reembolso/cancelacion** (escribirla aclarando que no hay reembolsos).
- [ ] Configurar variables de Lemon en Vercel (webhook secret, IDs de producto).
- [ ] Verificar que el webhook Lemon apunte a `https://mechaia.app/api/lemon-webhook`.

### Pendientes futuros
- [ ] SLA de uptime / latencia objetivo del chat.
- [ ] Roadmap de features (multi-usuario por taller, OBD-II live, catalogo de autopartes).
- [ ] Estrategia de marketing (n8n content generator esta planificado).

---

*Esta es la version 0 del BUSINESS_LOGIC. Refinar en sesion con el owner.*

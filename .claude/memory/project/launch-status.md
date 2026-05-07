---
name: Mechaia launch status
description: Estado de lanzamiento de Mechaia. Lemon listo, faltan politicas y configuracion final.
type: project
---

# Estado de Lanzamiento (2026-05-07)

## Confirmado por el owner
- **Lemon Squeezy:** Plataforma lista para lanzar. Productos creados con precios definitivos (Base $11.45, Turbo $19.20).
- **Stack actual se queda:** Vite + React 18 + Vercel functions + Supabase + Anthropic + Gemini + Lemon Squeezy. NO migrar.
- **Sin reembolsos**, sin politica de privacidad escrita aun, sin terminos.

## Pendientes para lanzar
1. Configurar variables de Lemon en Vercel (`LEMONSQUEEZY_WEBHOOK_SECRET`, IDs de producto/variant, store ID).
2. Verificar que el webhook de Lemon apunte a `https://mechaia.app/api/lemon-webhook`.
3. **Politica de privacidad** (no existe).
4. **Terminos y condiciones** (no existen).
5. **Politica de reembolso/cancelacion** (no existe; aclarar que no hay reembolsos).
6. Linkear las politicas desde Pricing, Landing y Settings.

**Why:** El owner quiere lanzar y pidio explicitamente "configurar Lemon y las politicas". Datos legales son requisito tanto de Lemon Squeezy (MoR exige terminos) como de Stores (Apple/Google si en el futuro hay app).

**How to apply:** Priorizar politicas + configuracion de Lemon antes que refactors o features nuevas. Solo cuando esto este listo, volver a Fase 1 (refactor archivos largos + Zod).

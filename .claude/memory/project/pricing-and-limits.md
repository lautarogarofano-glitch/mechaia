---
name: Mechaia pricing and plan limits
description: Precios, limites y reglas de cobro confirmados por el owner. Datos hard-coded en el repo.
type: project
---

# Pricing y limites de planes (CONFIRMADO 2026-05-07)

## Trial
- **5 diagnosticos gratis** al crear cuenta.
- Definido en `src/App.tsx:92` (`trial_diagnostics_remaining: 5`).
- Mostrado en UI: `src/components/Settings.tsx:296`, `src/components/HistorySidebar.tsx:140`, `src/components/Pricing.tsx:48`.

## Plan Base
- **USD $11.45 / mes**
- **150 mensajes / mes**
- Precio en UI: `src/components/Pricing.tsx:69`, `src/components/Landing.tsx:102`
- Limite real (server): `api/lemon-webhook.ts:11` (`PLAN_LIMITS.base = 150`)

## Plan Turbo
- **USD $19.20 / mes**
- **Mensajes ilimitados**
- Precio en UI: `src/components/Pricing.tsx:109`
- Limite real (server): `api/lemon-webhook.ts:12` (`PLAN_LIMITS.turbo = null`)

## Reset de cuota
- Cuando Lemon dispara `subscription_payment_success` se ejecuta `messages_used = 0`.
- Logica en `api/lemon-webhook.ts:109-115`.

## Politica de reembolso
- **NO hay reembolsos.** Decision del owner.
- Cancelacion disponible en cualquier momento desde el perfil del usuario (texto visible en UI: "Cobro automatico mensual con tarjeta. Cancela cuando quieras desde tu perfil.").

**Why:** Datos definitivos para el lanzamiento. Si cambian precios o limites, hay que tocar Pricing.tsx, Landing.tsx (en ES y EN) y `PLAN_LIMITS` en lemon-webhook.ts simultaneamente para no quedar inconsistentes.

**How to apply:** Cuando el owner pregunte "cuanto cobramos" o "cuanto da el trial" responder con estos numeros. Antes de cambiar uno, avisar al owner que hay 3 lugares acoplados.

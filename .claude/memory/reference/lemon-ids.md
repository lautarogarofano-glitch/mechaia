---
name: Lemon Squeezy IDs de Mechaia
description: IDs publicos de la cuenta Lemon Squeezy para Mechaia. NO incluye secrets (API key, webhook secret).
type: reference
---

# Lemon Squeezy — IDs de Mechaia

> Estos son IDs publicos (no secretos). Los secrets (API key, webhook secret) viven solo en Vercel env vars y nunca se commitean.

## Cuenta
- Dashboard: https://app.lemonsqueezy.com
- Tienda: Mechaia.app

## Productos

### Plan Base
- **Product ID:** `1036041`
- **Nombre en Lemon:** Base MechaIA
- **Precio:** USD $11.45 / mes
- **Variant ID:** `1624900` _(confirmado por owner 2026-05-07)_
- **Estado:** Publicado

### Plan Turbo
- **Product ID:** _PENDIENTE_
- **Nombre en Lemon:** MechaIA Turbo
- **Precio:** USD $19.20 / mes
- **Variant ID:** `1625028` _(confirmado por owner 2026-05-07)_
- **Estado:** Publicado

## API Keys
- **Activa:** "Producción Mechaia" (creada 7 mayo 2026, caduca 7 noviembre 2026)
  - El secret real solo se guarda en Vercel env var `LEMONSQUEEZY_API_KEY`. NUNCA en este repo.

## Store ID
- **Store ID:** `319148`
- **Slug:** mechaia.lemonsqueezy.com
- **Nombre:** Mechaia.app

## Webhook
- **URL configurada:** _PENDIENTE — debe ser https://mechaia.app/api/lemon-webhook_
- **Eventos a escuchar:** subscription_created, subscription_updated, subscription_resumed, subscription_unpaused, subscription_cancelled, subscription_expired, subscription_payment_success, subscription_payment_failed

## Variables de entorno requeridas en Vercel
```
LEMONSQUEEZY_API_KEY            (secret)
LEMONSQUEEZY_STORE_ID           (numerico)
LEMONSQUEEZY_VARIANT_BASE       (numerico)
LEMONSQUEEZY_VARIANT_TURBO      (numerico)
LEMONSQUEEZY_WEBHOOK_SECRET     (secret)
APP_URL                         (https://mechaia.app)
```

**Why:** Estos IDs son necesarios para que `api/create-checkout.ts` y `api/lemon-webhook.ts` funcionen. Documentados aca para no perderlos entre conversaciones.

**How to apply:** Cuando un agente futuro tenga que tocar el flujo de pagos, revisar este archivo primero. Si los IDs no coinciden con Vercel env vars, las llamadas a Lemon API van a fallar con 404.

---
name: Email forwarder configurado para mechaia.app
description: ImprovMX free reenvia legal@/soporte@mechaia.app a lautarogarofano@gmail.com. MX records en Vercel DNS.
type: project
---

# Email forwarder mechaia.app

## Estado: ACTIVO desde 2026-05-08

`legal@mechaia.app` y otros aliases del dominio reenvian a `lautarogarofano@gmail.com` via **ImprovMX free**.

Verificado con email de prueba enviado y recibido el 2026-05-08 12:21 UTC (thread Gmail `19e078302a2caf0f`).

## Setup actual

**Servicio:** ImprovMX free (cuenta `lautarogarofano@gmail.com`)
**Dominio configurado:** `mechaia.app`
**DNS:** Vercel DNS (records gestionados via `vercel dns` CLI con scope `team_bNxeaFHm6MilkNS7JSHTEShx`)

### MX records en apex
```
@  MX  mx1.improvmx.com  priority 10  TTL 60   (rec_4037a86239f2cdb59a73c0a4)
@  MX  mx2.improvmx.com  priority 20  TTL 60   (rec_d7b4229bd1c0728ceb79f97b)
```

### Aliases activos en ImprovMX
- `legal@mechaia.app` -> `lautarogarofano@gmail.com`
- `soporte@mechaia.app` -> `lautarogarofano@gmail.com`
- (`hola@` no esta creado todavia, agregar si se referencia publicamente)

## Limites del plan free
- 25 aliases max
- Reenvio entrante ilimitado
- **No permite enviar** correos *desde* legal@mechaia.app via SMTP — solo recibe y reenvia
- 99% uptime no garantizado (best effort)

## Cuando migrar a plan pago / Workspace
Cuando se necesite cualquiera de estas:
- Responder *desde* `legal@mechaia.app` (no desde Gmail) -> upgrade a ImprovMX Premium $9/mes (SMTP) o pasar a Google Workspace ($6/mes/buzon) / Zoho Mail (free hasta 5 buzones)
- Imagen profesional con dominio propio en el From -> Workspace/Zoho
- Constitucion formal de empresa -> buena oportunidad para pasar a Workspace

## Coexistencia con Resend (transactional)
Resend usa el subdominio `send.mechaia.app` (DKIM, SPF, MX). No conflictua con ImprovMX que usa el apex. Los dos pueden convivir.

## Como verificar / debuggear

```bash
# DNS publico
dig MX mechaia.app +short @8.8.8.8
dig MX mechaia.app +short @1.1.1.1

# DNS autoritativo (Vercel)
dig MX mechaia.app @ns1.vercel-dns.com +noall +answer

# Listar records desde CLI
vercel dns ls mechaia.app --scope team_bNxeaFHm6MilkNS7JSHTEShx

# UI ImprovMX
https://app.improvmx.com (login con lautarogarofano@gmail.com)
```

**Why:** La app referencia `legal@mechaia.app` en `/privacy`, `/terms`, `/refund` y Settings -> Legal. Ley 25.326 de Argentina exige canal funcional para ejercer derechos de privacidad. Sin esto, las politicas serian inejecutables.

**How to apply:** Si en el futuro hay que cambiar a donde reenvian los emails, modificar en ImprovMX panel (no toca DNS). Si hay que migrar de proveedor (ej. Workspace), reemplazar los 2 MX en Vercel DNS y desactivar el dominio en ImprovMX.

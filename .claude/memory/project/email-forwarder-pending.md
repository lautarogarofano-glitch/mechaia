---
name: Email forwarder pendiente para legal@mechaia.app
description: Las politicas y la app referencian legal@mechaia.app pero el email no esta funcionando todavia.
type: project
---

# Email forwarder pendiente

## Estado
Las politicas (`/privacy`, `/terms`, `/refund`) y la pagina de Settings → Legal de Mechaia muestran `legal@mechaia.app` como email de contacto. **Ese email no recibe nada todavia.**

El dominio `mechaia.app` esta en Namecheap (vence Mar 1, 2027) pero los DNS apuntan a Vercel (custom nameservers). El forwarder nativo de Namecheap solo funciona si los DNS estan en BasicDNS, asi que hay que usar otra ruta.

## Opciones para configurarlo (cualquiera funciona)

### Opcion 1: ImprovMX (la mas rapida, gratis)
1. Crear cuenta gratis en https://improvmx.com
2. Agregar el dominio `mechaia.app`.
3. Agregar 2 registros MX en Vercel DNS (Project → Settings → Domains → mechaia.app → DNS Records):
   ```
   Type: MX  Host: @  Priority: 10  Value: mx1.improvmx.com
   Type: MX  Host: @  Priority: 20  Value: mx2.improvmx.com
   ```
4. En el panel de ImprovMX, crear alias `legal@mechaia.app → lautarogarofano@gmail.com`.
5. Verificar enviando un correo a `legal@mechaia.app` — deberia llegar a Gmail.

### Opcion 2: Cloudflare Email Routing (gratis, requiere mover DNS a Cloudflare)
1. Crear cuenta en Cloudflare y agregar el dominio.
2. Cambiar nameservers de Namecheap a los de Cloudflare.
3. Recrear los registros DNS de Vercel en Cloudflare (A o CNAME segun aplique).
4. Activar Email Routing y crear el alias.

### Opcion 3: Google Workspace o Zoho Mail (paga, mas profesional)
- Google Workspace ~USD 6/mes por buzon
- Zoho Mail tiene plan gratis para hasta 5 cuentas en un dominio.

## Recomendacion
**Opcion 1 (ImprovMX)** para arrancar. Migrar a Workspace/Zoho cuando se constituya la empresa.

## Otros emails a configurar (mismo forwarder)
- `legal@mechaia.app` (politicas)
- `hola@mechaia.app` (contacto general, opcional)
- `soporte@mechaia.app` (tickets de soporte, futuro)

**Why:** La app referencia `legal@mechaia.app` en publico y los usuarios necesitan poder ejercer derechos de privacidad (Ley 25.326 lo exige).

**How to apply:** Antes del lanzamiento publico, configurar al menos `legal@mechaia.app` con cualquiera de las 3 opciones. Tiempo estimado: 15 min con ImprovMX.

# Proyecto Inicial - Flujos para Mechaia en n8n

## Fecha
9 de marzo de 2026

---

## Contexto
App: **Mechaia.app** — asistente de diagnóstico automotriz para mecánicos.
Permite ingresar patente, vehículo, año, ECU, motor y código de falla para obtener diagnósticos y múltiples alternativas de solución. Funciona con cualquier scanner básico.

---

## Lo que construimos

### Flow 1 — Creador de Contenido para Meta Ads
Archivo: `n8n/real-estate/mechaia-content-creator.json`

**Estructura del flow:**
```
Formulario → Claude (genera contenido) → Formatear Respuesta → Google Sheets
```

**Formulario recibe:**
- Objetivo (Descargas / Registros / Visitas al sitio)
- Tono (Profesional / Directo / Cercano)
- Plataforma (Facebook / Instagram / Ambas)

**Claude genera:**
- 3 variantes de copies para Meta Ads (título, texto, descripción, CTA)
- Guión completo del reel (gancho, problema, solución, demo, CTA)
- Caption para postear
- 5 hashtags relevantes

**Google Sheets:**
- ID planilla: `1lBxHgSX2HgaFQCU33dg7o8jVRKQJcetEgwrndmfNze8`
- Nombre hoja: `Sheet1`
- Columnas: Fecha / Objetivo / Tono / Plataforma / Contenido

---

## Credenciales configuradas
- **Anthropic API Key** → guardada en `proyectos/n8n/_credenciales.env`
- **HeyGen API Key** → guardada en `proyectos/n8n/_credenciales.env` (plan gratuito no incluye API)
- **Google Sheets** → credencial OAuth2 configurada en n8n

---

## n8n
- URL: `https://n8n-n8n.vysrrc.easypanel.host/`
- Versión: 1.123.16
- Hosting: Hostinger / Easypanel
- Conexión a Anthropic: vía HTTP Request (el nodo nativo de Anthropic no funciona desde el servidor)

---

## Pendientes

### Flow 2 — Auditor de Campañas Meta
- Requiere verificación de negocio en Meta Business Manager
- Una vez verificado: conectar Meta Ads API → Claude → reporte

### Videos con IA
- HeyGen requiere plan pago para API
- Por ahora: Claude genera el guión → se pega manualmente en HeyGen
- Alternativas a evaluar: Runway, Kling

### Landing + VSL para Mechaia
- Página con video explicativo
- Proyecto aparte a desarrollar

---

## Cómo retomar
1. Abrí VS Code
2. Abrí la terminal con `Cmd + `` `
3. Escribí `claude`
4. Decile: "Retomemos el proyecto inicial de flujos para Mechaia en n8n"

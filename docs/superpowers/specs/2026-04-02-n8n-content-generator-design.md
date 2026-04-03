# n8n Social Content Generator — MechaIA

**Fecha:** 2026-04-02
**Estado:** Aprobado

## Contexto

Flow de n8n para generar batches de 7 posts orgánicos semanales para Instagram y TikTok de MechaIA. El contenido se basa en pain points reales de mecánicos (investigación previa: P0301 con 10 causas posibles, fallas intermitentes, justificar diagnósticos al cliente). El output va a Google Sheets y WhatsApp.

Existe un flow previo `Mechaia - Creador de Contenido Meta Ads` (ID: QlnJWDfVA1rcyyKX) para ads pagos — este flow es independiente y cubre contenido **orgánico**.

## Arquitectura

Flow lineal: `Formulario → Claude (1 llamada) → Parse JSON → Split 7 ítems → Google Sheets → Armar mensaje WhatsApp → WhatsApp HTTP`

Una sola llamada a Claude que genera los 7 posts como array JSON. Se parsea, se splitea en ítems individuales, se guardan en Sheets uno por fila, y se manda un resumen por WhatsApp.

## Nodos del flow

### 1. Formulario (Form Trigger)
Campos:
- `idioma` — dropdown: "Español" / "English"
- `reels` — número (0-7, default 3)
- `carruseles` — número (0-7, default 2)
- `posts_imagen` — número (0-7, default 2)
- `tono` — dropdown: "Educativo" / "Directo" / "Motivacional"
- `tema_semana` — texto libre opcional (ej: "fallas eléctricas", "P0300", vacío = variado)

Validación implícita: reels + carruseles + posts_imagen debe sumar exactamente 7. Si no suma 7, Claude recibe la instrucción de completar con el tipo más pedido.

### 2. Claude — Genera Batch (HTTP Request a Anthropic API)
- Modelo: `claude-sonnet-4-6`
- Max tokens: 4096
- Endpoint: `https://api.anthropic.com/v1/messages`
- Headers: misma API key del flow existente

**System prompt:**
```
Eres un experto en contenido para redes sociales especializado en herramientas para mecánicos automotrices profesionales.

PRODUCTO: MechaIA (mechaia.app)
Una IA que ayuda al mecánico a diagnosticar vehículos: ingresa los datos del auto, el código OBD y los síntomas, y recibe un diagnóstico paso a paso con un informe PDF para el cliente.

PAIN POINTS REALES DEL MECÁNICO (úsalos en el contenido):
- "P0301 puede ser 10 cosas distintas — el código no te dice cuál"
- Las fallas intermitentes que desaparecen en cuanto el auto entra al taller
- Clientes que creen que el scanner "lo lee solo" y no entienden por qué cobras el diagnóstico
- Horas perdidas buscando en foros o llamando a otros talleres
- La presión del cliente mientras el mecánico todavía no sabe qué tiene el auto

TONO DE MARCA: Profesional pero cercano. Habla de mecánico a mecánico. Sin jerga de startup.

PLATAFORMAS: Instagram y TikTok (mismo contenido sirve para ambas).
```

**User prompt (dinámico):**
```
Genera exactamente {{reels}} reels + {{carruseles}} carruseles + {{posts_imagen}} posts de imagen = 7 posts en total.
Idioma: {{idioma}}
Tono: {{tono}}
Tema de la semana: {{tema_semana}} (si está vacío, variá los temas)

Devuelve SOLO un array JSON válido, sin texto adicional, con esta estructura exacta:

[
  {
    "tipo": "reel" | "carrusel" | "post_imagen",
    "hook": "frase de apertura que detiene el scroll (máx 10 palabras)",
    "cuerpo": "desarrollo del contenido (para reel: guión de 30-60 seg; para carrusel: títulos de cada slide; para post: caption completo)",
    "cta": "llamada a la acción con link a mechaia.app",
    "hashtags": ["hashtag1", "hashtag2", ...] (5-8 hashtags relevantes),
    "descripcion_visual": "qué se muestra en pantalla o qué imagen usar en Canva"
  }
]
```

### 3. Parse JSON (Code Node)
Extrae el array JSON de la respuesta de Claude:
```javascript
const text = $input.first().json.content[0].text;
const posts = JSON.parse(text);
return posts.map(post => ({ json: post }));
```

### 4. Google Sheets — Append Row
- Sheet: mismo de `Mechaia - Creador de Contenido Meta Ads` (ID: `1lBxHgSX2HgaFQCU33dg7o8jVRKQJcetEgwrndmfNze8`)
- Hoja nueva: `"Orgánico"` (separada de la hoja de ads)
- Columnas: FECHA, IDIOMA, TIPO, HOOK, CUERPO, CTA, HASHTAGS, DESCRIPCIÓN_VISUAL

### 5. Aggregate (Aggregate Node)
Junta los 7 ítems procesados en un solo item para armar el mensaje de WhatsApp.

### 6. Code — Armar Mensaje WhatsApp
```javascript
const posts = $input.all();
const fecha = new Date().toLocaleDateString('es-AR');
let msg = `*MechaIA — 7 posts generados ✅*\n_${fecha}_\n\n`;
posts.forEach((p, i) => {
  const tipo = p.json.tipo.toUpperCase();
  msg += `*${i+1}. [${tipo}]* ${p.json.hook}\n`;
});
msg += `\nGuardados en Google Sheets → hoja "Orgánico"`;
return [{ json: { mensaje: msg } }];
```

### 7. WhatsApp — HTTP Request
- Método: POST a WhatsApp Business API (o Twilio si no hay acceso directo)
- Envía el mensaje resumen al número del usuario
- Si WhatsApp no está disponible: fallback a email via Gmail node

## Google Sheets — Estructura de la hoja "Orgánico"

| FECHA | IDIOMA | TIPO | HOOK | CUERPO | CTA | HASHTAGS | DESCRIPCIÓN_VISUAL |
|---|---|---|---|---|---|---|---|

## Credenciales necesarias
- Anthropic API key: ya existe en el flow de Meta Ads
- Google Sheets OAuth: ya existe (`oznLinTRYqMlGoYZ`)
- WhatsApp: requiere configurar credencial nueva (WhatsApp Business API o Twilio)

## Lo que NO incluye este spec
- Publicación automática a Instagram/TikTok (requiere APIs de Meta + TikTok for Business)
- Generación de imágenes (Canva es manual con la descripción visual)
- Aprobación/revisión de contenido antes de postear
- Programación automática (se usa Buffer manualmente)

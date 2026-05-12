# n8n Social Content Generator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear un flow de n8n que genere 7 posts orgánicos semanales para Instagram/TikTok de MechaIA via Claude, guardando en Google Sheets y enviando resumen por Gmail.

**Architecture:** Form Trigger → Claude HTTP (1 llamada, devuelve JSON array de 7) → Code parse → Google Sheets append (7 rows) → Aggregate → Code email → Gmail.

**Tech Stack:** n8n MCP tools, Anthropic claude-sonnet-4-6, Google Sheets API (OAuth ya configurado), Gmail (OAuth ya configurado).

---

## Contexto para el agente

- n8n URL: https://n8n-n8n.vysrrc.easypanel.host/
- Flow existente de referencia (Meta Ads): ID `QlnJWDfVA1rcyyKX`
- Anthropic API key: vive en n8n como credential / env var del workflow. NUNCA pegarla en este archivo.
- Google Sheets credential ID: `oznLinTRYqMlGoYZ`
- Sheet ID: `1lBxHgSX2HgaFQCU33dg7o8jVRKQJcetEgwrndmfNze8`
- Hoja destino: `Orgánico` (nueva, a crear)
- Recipient email: `lautarogarofano@gmail.com`

---

### Task 1: Encontrar credencial de Gmail

**Files:** n8n MCP tools

- [ ] **Step 1: Listar workflows para encontrar un flow que use Gmail**

Usar `n8n_list_workflows` y buscar un workflow que tenga Gmail. Si no hay ninguno, el agente necesita crear la credencial manualmente en n8n UI antes de continuar.

- [ ] **Step 2: Obtener el workflow de Gestor de Redes Sociales para ver si tiene Gmail**

Llamar `n8n_get_workflow` con ID `Q2vWiTLtHhPZX4Up` y buscar en los nodos alguno de tipo `n8n-nodes-base.gmail` para extraer su `credentials.gmailOAuth2.id`.

- [ ] **Step 3: Anotar el credential ID de Gmail**

Si se encuentra, guardar el ID. Si no existe ninguna credencial Gmail en n8n, el agente debe reportar NEEDS_CONTEXT — el usuario necesita conectar Gmail en n8n UI (Settings → Credentials → Add Credential → Gmail OAuth2) antes de continuar.

---

### Task 2: Crear el workflow completo

**Files:** n8n MCP tools — `n8n_create_workflow`

- [ ] **Step 1: Crear el workflow con todos los nodos**

Llamar `n8n_create_workflow` con el siguiente JSON (reemplazar `GMAIL_CREDENTIAL_ID` con el ID encontrado en Task 1):

```json
{
  "name": "Mechaia - Generador de Contenido Orgánico",
  "nodes": [
    {
      "id": "form-trigger",
      "name": "Formulario",
      "type": "n8n-nodes-base.formTrigger",
      "typeVersion": 2,
      "position": [240, 300],
      "parameters": {
        "formTitle": "MechaIA — Generador de Contenido Orgánico",
        "formDescription": "Completá los datos para generar 7 posts semanales para Instagram y TikTok",
        "formFields": {
          "values": [
            {
              "fieldLabel": "Idioma",
              "fieldType": "dropdown",
              "fieldOptions": { "values": [{"option": "Español"}, {"option": "English"}] },
              "requiredField": true
            },
            {
              "fieldLabel": "Reels",
              "fieldType": "number",
              "requiredField": true,
              "placeholder": "3"
            },
            {
              "fieldLabel": "Carruseles",
              "fieldType": "number",
              "requiredField": true,
              "placeholder": "2"
            },
            {
              "fieldLabel": "Posts de imagen",
              "fieldType": "number",
              "requiredField": true,
              "placeholder": "2"
            },
            {
              "fieldLabel": "Tono",
              "fieldType": "dropdown",
              "fieldOptions": { "values": [{"option": "Educativo"}, {"option": "Directo"}, {"option": "Motivacional"}] },
              "requiredField": true
            },
            {
              "fieldLabel": "Tema de la semana",
              "fieldType": "text",
              "requiredField": false,
              "placeholder": "Ej: fallas eléctricas, P0300 — dejá vacío para variado"
            }
          ]
        },
        "responseMode": "lastNode",
        "options": {}
      },
      "webhookId": "mechaia-content-gen-v1"
    },
    {
      "id": "claude-generate",
      "name": "Claude — Genera 7 Posts",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4,
      "position": [520, 300],
      "parameters": {
        "method": "POST",
        "url": "https://api.anthropic.com/v1/messages",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {"name": "x-api-key", "value": "{{ $env.ANTHROPIC_API_KEY }}"},
            {"name": "anthropic-version", "value": "2023-06-01"},
            {"name": "Content-Type", "value": "application/json"}
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"model\": \"claude-sonnet-4-6\",\n  \"max_tokens\": 4096,\n  \"system\": \"Eres un experto en contenido para redes sociales especializado en herramientas para mecánicos automotrices profesionales.\\n\\nPRODUCTO: MechaIA (mechaia.app) — Una IA que ayuda al mecánico a diagnosticar vehículos: ingresa los datos del auto, el código OBD y los síntomas, y recibe un diagnóstico paso a paso con un informe PDF para el cliente.\\n\\nPAIN POINTS REALES DEL MECÁNICO (úsalos en el contenido):\\n- P0301 puede ser 10 cosas distintas — el código no te dice cuál\\n- Las fallas intermitentes que desaparecen en cuanto el auto entra al taller\\n- Clientes que creen que el scanner \\\"lo lee solo\\\" y no entienden por qué cobras el diagnóstico\\n- Horas perdidas buscando en foros o llamando a otros talleres\\n- La presión del cliente mientras el mecánico todavía no sabe qué tiene el auto\\n\\nTONO DE MARCA: Profesional pero cercano. Habla de mecánico a mecánico. Sin jerga de startup.\\nPLATAFORMAS: Instagram y TikTok (mismo contenido sirve para ambas).\",\n  \"messages\": [\n    {\n      \"role\": \"user\",\n      \"content\": \"Genera exactamente {{ $json.Reels }} reels + {{ $json.Carruseles }} carruseles + {{ $json['Posts de imagen'] }} posts de imagen = 7 posts en total.\\nIdioma: {{ $json.Idioma }}\\nTono: {{ $json.Tono }}\\nTema de la semana: {{ $json['Tema de la semana'] || 'variado' }}\\n\\nDevuelve SOLO un array JSON válido, sin texto adicional, con esta estructura exacta por cada post:\\n[\\n  {\\n    \\\"tipo\\\": \\\"reel|carrusel|post_imagen\\\",\\n    \\\"hook\\\": \\\"frase de apertura que detiene el scroll (máx 10 palabras)\\\",\\n    \\\"cuerpo\\\": \\\"para reel: guión 30-60 seg; para carrusel: títulos de cada slide numerados; para post: caption completo\\\",\\n    \\\"cta\\\": \\\"llamada a la acción con link a mechaia.app\\\",\\n    \\\"hashtags\\\": [\\\"hashtag1\\\", \\\"hashtag2\\\", \\\"hashtag3\\\", \\\"hashtag4\\\", \\\"hashtag5\\\"],\\n    \\\"descripcion_visual\\\": \\\"qué mostrar en pantalla o qué imagen crear en Canva\\\"\\n  }\\n]\"\n    }\n  ]\n}",
        "options": {}
      }
    },
    {
      "id": "parse-json",
      "name": "Parsear Posts",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [800, 300],
      "parameters": {
        "jsCode": "const response = $input.first().json;\nconst text = response.content[0].text.trim();\n\n// Extraer JSON limpio (Claude a veces agrega ```json ... ```)\nlet jsonText = text;\nconst jsonMatch = text.match(/\\[[\\s\\S]*\\]/);\nif (jsonMatch) jsonText = jsonMatch[0];\n\nconst posts = JSON.parse(jsonText);\nconst idioma = $('Formulario').first().json.Idioma;\nconst tono = $('Formulario').first().json.Tono;\nconst fecha = new Date().toLocaleDateString('es-AR');\n\nreturn posts.map(post => ({\n  json: {\n    ...post,\n    idioma,\n    tono,\n    fecha,\n    hashtags_str: Array.isArray(post.hashtags) ? post.hashtags.join(' ') : post.hashtags\n  }\n}));"
      }
    },
    {
      "id": "sheets-append",
      "name": "Guardar en Sheets",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 4.7,
      "position": [1080, 300],
      "parameters": {
        "operation": "append",
        "documentId": {
          "__rl": true,
          "value": "1lBxHgSX2HgaFQCU33dg7o8jVRKQJcetEgwrndmfNze8",
          "mode": "id"
        },
        "sheetName": {
          "__rl": true,
          "value": "Orgánico",
          "mode": "name"
        },
        "columns": {
          "mappingMode": "defineBelow",
          "value": {
            "FECHA": "={{ $json.fecha }}",
            "IDIOMA": "={{ $json.idioma }}",
            "TONO": "={{ $json.tono }}",
            "TIPO": "={{ $json.tipo }}",
            "HOOK": "={{ $json.hook }}",
            "CUERPO": "={{ $json.cuerpo }}",
            "CTA": "={{ $json.cta }}",
            "HASHTAGS": "={{ $json.hashtags_str }}",
            "DESCRIPCION_VISUAL": "={{ $json.descripcion_visual }}"
          },
          "matchingColumns": [],
          "schema": [
            {"id": "FECHA", "displayName": "FECHA", "required": false, "defaultMatch": false, "display": true, "type": "string", "canBeUsedToMatch": true},
            {"id": "IDIOMA", "displayName": "IDIOMA", "required": false, "defaultMatch": false, "display": true, "type": "string", "canBeUsedToMatch": true},
            {"id": "TONO", "displayName": "TONO", "required": false, "defaultMatch": false, "display": true, "type": "string", "canBeUsedToMatch": true},
            {"id": "TIPO", "displayName": "TIPO", "required": false, "defaultMatch": false, "display": true, "type": "string", "canBeUsedToMatch": true},
            {"id": "HOOK", "displayName": "HOOK", "required": false, "defaultMatch": false, "display": true, "type": "string", "canBeUsedToMatch": true},
            {"id": "CUERPO", "displayName": "CUERPO", "required": false, "defaultMatch": false, "display": true, "type": "string", "canBeUsedToMatch": true},
            {"id": "CTA", "displayName": "CTA", "required": false, "defaultMatch": false, "display": true, "type": "string", "canBeUsedToMatch": true},
            {"id": "HASHTAGS", "displayName": "HASHTAGS", "required": false, "defaultMatch": false, "display": true, "type": "string", "canBeUsedToMatch": true},
            {"id": "DESCRIPCION_VISUAL", "displayName": "DESCRIPCION_VISUAL", "required": false, "defaultMatch": false, "display": true, "type": "string", "canBeUsedToMatch": true}
          ]
        },
        "options": {}
      },
      "credentials": {
        "googleSheetsOAuth2Api": {
          "id": "oznLinTRYqMlGoYZ",
          "name": "Completar sheet, produccion"
        }
      }
    },
    {
      "id": "aggregate",
      "name": "Juntar Posts",
      "type": "n8n-nodes-base.aggregate",
      "typeVersion": 1,
      "position": [1360, 300],
      "parameters": {
        "aggregate": "aggregateAllItemData",
        "destinationFieldName": "posts",
        "options": {}
      }
    },
    {
      "id": "build-email",
      "name": "Armar Email",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1600, 300],
      "parameters": {
        "jsCode": "const posts = $input.first().json.posts;\nconst fecha = posts[0]?.fecha || new Date().toLocaleDateString('es-AR');\n\nconst tipoEmoji = { reel: '🎬', carrusel: '🎠', post_imagen: '🖼️' };\n\nlet html = `<h2>MechaIA — 7 posts generados ✅</h2><p><strong>Fecha:</strong> ${fecha}</p><hr>`;\n\nposts.forEach((p, i) => {\n  const emoji = tipoEmoji[p.tipo] || '📌';\n  html += `<p><strong>${i + 1}. ${emoji} [${p.tipo.toUpperCase()}]</strong><br>`;\n  html += `<em>Hook:</em> ${p.hook}<br>`;\n  html += `<em>CTA:</em> ${p.cta}<br>`;\n  html += `<em>Hashtags:</em> ${p.hashtags_str}</p>`;\n});\n\nhtml += `<hr><p><a href=\"https://docs.google.com/spreadsheets/d/1lBxHgSX2HgaFQCU33dg7o8jVRKQJcetEgwrndmfNze8\">Ver en Google Sheets →</a></p>`;\n\nreturn [{ json: { subject: `MechaIA — 7 posts generados ✅ (${fecha})`, html } }];"
      }
    },
    {
      "id": "gmail-send",
      "name": "Enviar por Gmail",
      "type": "n8n-nodes-base.gmail",
      "typeVersion": 2.1,
      "position": [1840, 300],
      "parameters": {
        "sendTo": "lautarogarofano@gmail.com",
        "subject": "={{ $json.subject }}",
        "emailType": "html",
        "message": "={{ $json.html }}",
        "options": {}
      },
      "credentials": {
        "gmailOAuth2": {
          "id": "GMAIL_CREDENTIAL_ID",
          "name": "Gmail account"
        }
      }
    }
  ],
  "connections": {
    "Formulario": {
      "main": [[{"node": "Claude — Genera 7 Posts", "type": "main", "index": 0}]]
    },
    "Claude — Genera 7 Posts": {
      "main": [[{"node": "Parsear Posts", "type": "main", "index": 0}]]
    },
    "Parsear Posts": {
      "main": [[{"node": "Guardar en Sheets", "type": "main", "index": 0}]]
    },
    "Guardar en Sheets": {
      "main": [[{"node": "Juntar Posts", "type": "main", "index": 0}]]
    },
    "Juntar Posts": {
      "main": [[{"node": "Armar Email", "type": "main", "index": 0}]]
    },
    "Armar Email": {
      "main": [[{"node": "Enviar por Gmail", "type": "main", "index": 0}]]
    }
  },
  "settings": {"executionOrder": "v1"},
  "tags": [{"name": "MAIN"}]
}
```

- [ ] **Step 2: Verificar que el workflow fue creado**

El tool debe devolver `success: true` con un ID. Anotar el ID del workflow creado.

---

### Task 3: Crear la hoja "Orgánico" en Google Sheets

**Files:** Google Sheets (manual)

- [ ] **Step 1: Abrir el Google Sheet**

Ir a: `https://docs.google.com/spreadsheets/d/1lBxHgSX2HgaFQCU33dg7o8jVRKQJcetEgwrndmfNze8`

- [ ] **Step 2: Crear nueva hoja llamada exactamente "Orgánico"**

Click en el `+` abajo → renombrar como `Orgánico` (con acento).

- [ ] **Step 3: Agregar headers en fila 1**

En la fila 1, agregar estas columnas en orden:
`FECHA | IDIOMA | TONO | TIPO | HOOK | CUERPO | CTA | HASHTAGS | DESCRIPCION_VISUAL`

---

### Task 4: Actualizar Gmail credential ID en el workflow

**Files:** n8n MCP tools — `n8n_update_partial_workflow`

- [ ] **Step 1: Obtener el Gmail credential ID real**

Si se encontró en Task 1, usar ese ID. Si no, el usuario debe crearlo en n8n UI primero.

- [ ] **Step 2: Actualizar el nodo Gmail con el credential ID correcto**

Llamar `n8n_update_partial_workflow` con el ID del workflow creado en Task 2 para reemplazar `GMAIL_CREDENTIAL_ID` con el credential ID real en el nodo `Enviar por Gmail`.

---

### Task 5: Probar el flow end-to-end

**Files:** n8n MCP tools — `n8n_test_workflow`

- [ ] **Step 1: Ejecutar el workflow con datos de prueba**

Llamar `n8n_test_workflow` con el ID del workflow y estos datos de prueba:

```json
{
  "Idioma": "Español",
  "Reels": 3,
  "Carruseles": 2,
  "Posts de imagen": 2,
  "Tono": "Directo",
  "Tema de la semana": "fallas de encendido"
}
```

- [ ] **Step 2: Verificar que Claude devolvió 7 posts válidos**

Revisar el output del nodo `Parsear Posts`. Debe tener exactamente 7 ítems con los campos: tipo, hook, cuerpo, cta, hashtags, descripcion_visual.

- [ ] **Step 3: Verificar Google Sheets**

Abrir `https://docs.google.com/spreadsheets/d/1lBxHgSX2HgaFQCU33dg7o8jVRKQJcetEgwrndmfNze8` → hoja "Orgánico". Deben aparecer 7 filas nuevas.

- [ ] **Step 4: Verificar email**

Revisar lautarogarofano@gmail.com. Debe haber llegado un email con asunto `MechaIA — 7 posts generados ✅` con los 7 hooks listados y el link al Sheet.

- [ ] **Step 5: Activar el workflow**

Llamar `n8n_update_partial_workflow` para setear `active: true` en el workflow.

---

## Self-Review del plan

- Spec coverage: Form ✅, Claude ✅, Parse JSON ✅, Sheets ✅, Aggregate ✅, Email ✅, Gmail ✅
- Placeholder: `GMAIL_CREDENTIAL_ID` es intencional — se resuelve en Task 1 y Task 4
- Consistencia: el nodo `Parsear Posts` devuelve `hashtags_str` y `Armar Email` usa `p.hashtags_str` ✅
- La hoja "Orgánico" debe existir antes de que el flow corra — Task 3 lo cubre ✅

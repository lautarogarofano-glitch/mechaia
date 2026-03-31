# Primeros Pasos — Por Dónde Empezar

> Leé esto primero. Es el orden correcto para arrancar sin perderte.

---

## Antes de abrir Claude Code

### 1. Instalá Node.js
Descargá la versión LTS desde [nodejs.org](https://nodejs.org) e instalala normalmente (siguiente, siguiente, finalizar).

Para verificar que funcionó, abrí tu terminal y ejecutá:
```
node --version
```
Tiene que aparecer un número de versión (ej. `v22.0.0`).

### 2. Instalá Claude Code
En la misma terminal:
```
npm install -g @anthropic-ai/claude-code
```

### 3. Creá tu cuenta en Anthropic
Ir a [claude.ai](https://claude.ai) → registrarse → activar el plan Pro ($20/mes).

### 4. Creá las cuentas de servicios gratuitos
- [supabase.com](https://supabase.com) — crear cuenta gratis
- [aistudio.google.com](https://aistudio.google.com) — para obtener la Gemini API key (gratis)
- [console.groq.com](https://console.groq.com) — para obtener la Groq API key (gratis)
- [developers.facebook.com](https://developers.facebook.com) — para la Instagram API (ver `referencia/ig-api-guide.md`)

---

## Cómo abrir este workspace con Claude Code

1. Abrí tu terminal
2. Navegá hasta la carpeta de este workspace:
```
cd ruta/a/esta/carpeta
```
3. Abrí Claude Code:
```
claude
```
4. Corré el comando de inicio:
```
/iniciar
```

Claude va a leer todo el contexto y decirte exactamente qué falta completar.

---

## Orden recomendado para construir el sistema

**Semana 1 — Setup y contexto**
1. Completar los tres archivos en `contexto/`
2. Configurar Instagram Graph API (ver `referencia/ig-api-guide.md`)
3. Pedirle a Claude: `/crear-plan conectar Instagram y mostrar mis reels`

**Semana 2 — Dashboard base**
1. Implementar el plan de Instagram
2. Ver tus reels con métricas en el dashboard
3. Pedirle a Claude: `/crear-plan agregar transcripciones con IA`

**Semana 3 — AI Chat**
1. Configurar Supabase
2. Pedirle a Claude: `/crear-plan agregar chat IA con mis datos de contenido`

---

## Cómo hablarle a Claude Code

No necesitás usar lenguaje técnico. Describí lo que querés en castellano normal:

✅ "Quiero ver mis últimos 20 reels con las vistas y los guardados"
✅ "Hace que cuando clickeo un reel se abra con la transcripción completa"
✅ "Agregá un chat donde pueda preguntarle a la IA qué tipo de contenido me funciona mejor"

Claude entiende la intención y traduce eso a código.

---

## Si algo no funciona

1. Describile el error a Claude en la misma sesión — generalmente lo resuelve solo
2. Si el problema persiste, abrí una nueva sesión con `/iniciar` y contale el contexto
3. Si necesitás ayuda humana → [cal.com/nexum/content](https://cal.com/nexum/content)

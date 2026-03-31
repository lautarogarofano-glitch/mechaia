# Stack Técnico — Content OS

> Referencia del stack que usa Claude para construir el dashboard. No necesitás entender cada herramienta en profundidad — Claude las maneja. Este archivo es para que tengas contexto.

---

## Herramientas y costos

| Herramienta | Para qué sirve | Costo |
|-------------|----------------|-------|
| **Node.js** | Entorno de ejecución — base de todo | Gratis |
| **Claude Code** | Construye y modifica el código | $20/mes |
| **Next.js 15** | Framework del dashboard web | Gratis |
| **TypeScript** | Lenguaje de programación con tipos | Gratis |
| **Tailwind CSS** | Estilos visuales del dashboard | Gratis |
| **shadcn/ui** | Componentes de interfaz (cards, tablas, etc.) | Gratis |
| **Gemini API** | Transcripciones y análisis de contenido | Gratis hasta 1M tokens/mes |
| **Groq API** | Limpieza de transcripciones | Gratis |
| **Supabase** | Base de datos + búsqueda semántica | Gratis (tier gratuito) |
| **Instagram Graph API** | Métricas reales de tu cuenta | Gratis |

**Costo total mensual: $20** — solo Claude Code.

---

## Arquitectura general

```
Tu cuenta de Instagram
        ↓
  Instagram Graph API
  (trae métricas reales)
        ↓
   instagramClient.ts
   (cliente que hace los pedidos)
        ↓
     Gemini API
  (transcribe cada video)
        ↓
      Groq API
  (corrige errores del STT)
        ↓
     Supabase
  (guarda todo: posts, métricas,
   transcripciones + vectores semánticos)
        ↓
   Dashboard Web
  (visualiza métricas, top reels, tendencias)
        ↓
     AI Chat
  (responde preguntas sobre tu contenido
   usando búsqueda semántica en tus datos)
```

---

## Módulos del dashboard

### Dashboard (overview)
- Métricas globales del mes
- Progress bars hacia objetivos
- Top reels del período

### Instagram Intelligence
- Feed de reels con métricas
- Modal expandible por reel con:
  - Transcripción formateada
  - Métricas detalladas
  - Análisis IA ("por qué funcionó / no funcionó")

### AI Chat
- Chat que conoce todo tu historial de contenido
- Responde preguntas como:
  - "¿Qué tipo de contenido me genera más guardados?"
  - "Dame ideas basadas en mis 5 mejores reels"
  - "¿Qué temas no he explorado todavía?"

---

## Patrones de código a seguir

- **Cache local:** los datos de Instagram se guardan en `data/` para no hacer llamadas a la API en cada request
- **Variables de entorno:** todas las claves van en `.env.local` — nunca en el código
- **Tipos TypeScript:** cada entidad tiene su tipo definido en `lib/types.ts`
- **API routes:** cada módulo tiene su endpoint en `app/api/`

---

## Qué instalás una sola vez

Antes de que Claude empiece a construir, necesitás tener instalado en tu computadora:

1. **Node.js** — descargar desde [nodejs.org](https://nodejs.org), versión LTS
2. **Claude Code** — desde la terminal: `npm install -g @anthropic-ai/claude-code`

El resto (Next.js, dependencias, etc.) lo instala Claude automáticamente.

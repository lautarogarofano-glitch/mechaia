# CLAUDE.md — Content OS

Este archivo le da contexto a Claude Code sobre este proyecto. Se carga automáticamente al inicio de cada sesión.

---

## Qué Es Esto

**Content OS** es un sistema de inteligencia de contenido para tu marca personal. Centraliza los datos de tus redes sociales (Instagram, YouTube) en un dashboard con análisis impulsado por IA.

El sistema:
- Se conecta a la API de Instagram y trae las métricas reales de cada video
- Transcribe y analiza el contenido de cada reel con IA
- Permite chatear con un agente que conoce todo tu historial de contenido
- Genera ideas basadas en lo que realmente te funcionó a vos

---

## Tu Rol y el Rol de Claude

Vos definís qué querés construir. Claude diseña, planifica e implementa.

No necesitás saber programar. Describile lo que querés en lenguaje natural y Claude lo construye paso a paso, pidiéndote confirmación antes de hacer cambios importantes.

---

## Estructura del Workspace

```
.
├── CLAUDE.md                  # Este archivo — siempre cargado
├── .claude/
│   └── commands/
│       ├── iniciar.md         # /iniciar — inicialización de sesión
│       ├── crear-plan.md      # /crear-plan — planes de implementación
│       └── implementar.md     # /implementar — ejecutar planes
├── contexto/                  # Tu información: marca, negocio, métricas
├── planes/                    # Planes de implementación generados por Claude
├── salidas/                   # Entregables, notas, documentos
├── referencia/                # Guías técnicas de APIs y herramientas
└── backups/                   # Snapshots antes de cambios importantes
```

---

## Lo Primero Que Hay Que Hacer

Antes de construir cualquier cosa, completá los archivos en `contexto/`:

1. `contexto/mi-marca.md` — tu marca, nicho, plataformas activas
2. `contexto/mis-datos.md` — tus métricas actuales y objetivos
3. `contexto/mi-negocio.md` — tu modelo de negocio y cliente ideal

Claude necesita ese contexto para darte recomendaciones relevantes a tu caso específico.

---

## Stack Técnico

El dashboard se construye con:

- **Framework:** Next.js 15 (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS + shadcn/ui
- **IA:** Gemini 2.5 Flash (transcripciones, análisis, chat)
- **Base de datos:** Supabase (PostgreSQL + pgvector para búsqueda semántica)
- **APIs:** Instagram Graph API
- **Limpieza de transcripciones:** Groq LLaMA (free tier)

Todo esto lo instala y configura Claude Code. Vos solo necesitás tener Node.js instalado y las cuentas creadas en cada servicio.

---

## Variables de Entorno Necesarias

Se guardan en un archivo `.env.local` dentro del proyecto del dashboard. Claude te guía para completarlas.

```
GEMINI_API_KEY=
GROQ_API_KEY=
INSTAGRAM_ACCESS_TOKEN=
INSTAGRAM_USER_ID=
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

**Nunca compartir este archivo. Está excluido del control de versiones.**

---

## Comandos Disponibles

| Comando | Qué hace |
|---------|----------|
| `/iniciar` | Inicializa la sesión — carga contexto y confirma disposición |
| `/crear-plan [pedido]` | Crea un plan detallado antes de implementar algo |
| `/implementar [ruta-plan]` | Ejecuta un plan paso a paso |

---

## Instrucción Importante

Cada vez que se agregue un módulo nuevo o cambie la estructura del proyecto, actualizar las secciones relevantes de este archivo para mantenerlo al día.

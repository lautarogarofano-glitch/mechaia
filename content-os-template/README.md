# Content OS — Workspace Template

Sistema de inteligencia de contenido para creadores. Construido con Claude Code.

---

## Qué es esto

Un workspace listo para usar con Claude Code que te guía a construir tu propio dashboard de contenido con IA.

El sistema se conecta a tu cuenta de Instagram, analiza el rendimiento de cada video y te ayuda a generar ideas basadas en lo que realmente te funcionó.

---

## Cómo empezar

1. Cloná o descargá este repositorio
2. Instalá Node.js desde [nodejs.org](https://nodejs.org) (versión LTS)
3. Instalá Claude Code: `npm install -g @anthropic-ai/claude-code`
4. Abrí la carpeta en la terminal y ejecutá: `claude`
5. Corré `/iniciar` para comenzar

Para el paso a paso completo: `referencia/primeros-pasos.md`

---

## Estructura

```
├── CLAUDE.md              # Instrucciones para Claude Code
├── .claude/commands/      # Comandos /iniciar /crear-plan /implementar
├── contexto/              # Tu marca, datos y negocio — completar antes de empezar
├── referencia/            # Guías técnicas (Instagram API, stack, primeros pasos)
├── planes/                # Planes de implementación generados por Claude
├── salidas/               # Documentos y entregables
└── backups/               # Snapshots del proyecto
```

---

## Costo

- Claude Code (Anthropic Pro): $20/mes
- Todo lo demás: gratis

---

Diseñado por Agustín Badt — [cal.com/nexum/content](https://cal.com/nexum/content)

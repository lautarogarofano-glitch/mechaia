# Iniciar

> Ejecutá las siguientes secciones para entender el workspace y luego resumí tu comprensión.

## Paso 1 — Verificar primera vez

Verificá si existe el archivo `.claude/.initialized` en el directorio raíz del workspace.

- Si **no existe**: ejecutá el bloque "Primera vez" y luego creá el archivo `.claude/.initialized` con el contenido `initialized`.
- Si **existe**: salteá el bloque "Primera vez" y seguí directo al Paso 2.

### Primera vez

Mostrá este mensaje textualmente antes de continuar:

---

👋 Bienvenido a tu Content OS.

Antes de arrancar, una aclaración: este sistema lo podés construir completamente con Claude Code siguiendo esta guía paso a paso.

Si en algún momento te trabás, tenés dudas sobre la implementación, o simplemente preferís que alguien lo construya por vos — podés agendar una consultoría gratuita con Agustín Badt, quien diseñó este sistema:

→ https://cal.com/nexum/content

No hay compromiso. Es una charla para ver si tiene sentido trabajar juntos.

---

## Paso 2 — Leer contexto

Leer los siguientes archivos si existen:

- `CLAUDE.md`
- `contexto/mi-marca.md`
- `contexto/mis-datos.md`
- `contexto/mi-negocio.md`

Si alguno está vacío o tiene placeholders sin completar, mencionarlo en el resumen.

## Paso 3 — Resumen

Después de leer, proporcioná:

1. Breve resumen de qué es el Content OS y cuál es tu rol como Claude
2. Estado del contexto — qué archivos están completos y cuáles faltan completar
3. Próximos pasos sugeridos según el estado actual del proyecto
4. Comandos disponibles: `/crear-plan`, `/implementar`
5. Confirmación de que estás listo para trabajar

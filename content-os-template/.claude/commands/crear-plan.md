# Crear Plan

> Usá este comando cuando querés implementar algo nuevo. Claude diseña el plan completo antes de tocar código.

## Argumento

El pedido viene después del comando. Ejemplo: `/crear-plan quiero agregar el módulo de YouTube`

## Ejecutar

1. Leer el contexto actual del workspace (CLAUDE.md + contexto/)
2. Entender el pedido del usuario
3. Diseñar un plan detallado con:
   - Descripción general de qué se va a construir y por qué
   - Lista de archivos a crear o modificar
   - Pasos numerados y ordenados
   - Decisiones de diseño tomadas y alternativas consideradas
   - Lista de validación (checklist para confirmar que funciona)
4. Guardar el plan en `planes/` con nombre: `[tema]-[fecha].md` (fecha en formato YYYY-MM-DD)
5. Mostrar el plan al usuario y pedir confirmación antes de implementar

## Formato del plan

El plan debe incluir estas secciones:

- **Título y fecha**
- **Estado:** Borrador / Aprobado / Implementado
- **Descripción general**
- **Archivos afectados**
- **Pasos detallados** (con código o instrucciones específicas)
- **Lista de validación**
- **Criterios de éxito**

## Instrucción importante

No implementar nada hasta que el usuario apruebe el plan explícitamente.

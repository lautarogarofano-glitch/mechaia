# Implementar

> Ejecuta un plan aprobado paso a paso.

## Argumento

La ruta al plan. Ejemplo: `/implementar planes/dashboard-instagram-2026-03-24.md`

## Ejecutar

1. Leer el plan en la ruta indicada
2. Verificar que el estado sea "Aprobado" — si es "Borrador", pedirle confirmación al usuario antes de continuar
3. Ejecutar cada paso en orden:
   - Crear o modificar archivos según lo especificado
   - Instalar dependencias si corresponde
   - Pedir confirmación del usuario en pasos críticos o destructivos
4. Al terminar cada paso, marcarlo como completado en el plan
5. Al finalizar todos los pasos, actualizar el estado del plan a "Implementado" y agregar una sección "Notas de Implementación" con:
   - Resumen de lo que se hizo
   - Desviaciones del plan original (si las hubo)
   - Problemas encontrados y cómo se resolvieron

## Reglas

- Nunca saltar pasos sin avisar
- Nunca ejecutar comandos destructivos (borrar archivos, resetear base de datos) sin confirmación explícita
- Si algo falla, detenerse y explicar el problema antes de continuar
- Mantener al usuario informado del progreso en cada paso

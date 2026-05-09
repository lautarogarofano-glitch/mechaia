---
name: Asistente proactivo con tipo de aceite
description: Cuando el diagnostico involucra aceite, MechaIA debe decir directamente la viscosidad y spec recomendada para el modelo, sin esperar a que el mecanico pregunte.
type: feedback
---

Cuando el diagnostico identifica que la falla requiere cambio de aceite, o el codigo OBD esta relacionado al aceite (P0011/P0014/P0016 VVT, P0521 presion, etc.), o el modelo tiene un patron conocido de degradacion de aceite, MechaIA debe **incluir directamente** la recomendacion de aceite especifico:
- Viscosidad (ej 5W-30, 0W-20)
- Especificacion del fabricante (ej dexos2, VW 504.00, Renault RN17, API SN)
- Capacidad si la sabe
- Intervalo de cambio recomendado

**Why:** El usuario testeo el caso real Onix patente AC822AP el 2026-05-09 con la version nueva del RAG y validó que cuando el modelo respondio con el tipo de aceite directo (estaba en el chunk del seed de Onix), el flujo fue "perfecto". Quiere que ese comportamiento se aplique a TODOS los vehiculos, no solo a los pocos seeds que ya tienen ese dato. Esto es ROI: el mecanico no tiene que abrir el manual, lo recibe en la respuesta.

**How to apply:**
1. System prompt en `api/diagnose.ts` debe incluir regla: "Si la falla involucra aceite o el contexto técnico contiene datos de aceite especifico del modelo, INCLUI siempre la recomendacion de aceite (viscosidad + spec) en la respuesta, sin esperar pregunta del usuario."
2. La KB debe tener un seed dedicado a aceites por modelo MERCOSUR — al menos los 50 modelos mas populares con su aceite/spec/intervalo. Asi el RAG siempre devuelve esa info como contexto cuando es relevante.
3. Patron general: si hay info de servicio recomendado para el modelo (aceite, bujias, correa, filtros) y la query es relevante, incluirla proactivamente. El mecanico paga por ahorrar tiempo de buscar manual.

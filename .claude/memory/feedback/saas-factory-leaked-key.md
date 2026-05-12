---
name: SaaS Factory video-visuals/levy.png tenia API key filtrada
description: El PNG levy.png del skill video-visuals tenia una OpenRouter API key embebida en metadata XMP. Excluido del repo de Mechaia.
type: feedback
---

# levy.png del skill video-visuals tenia API key

**Regla:** No commitear `.claude/skills/video-visuals/assets/levy.png` al repo. Si en el futuro se actualizan las skills de SaaS Factory (via `update-sf` o re-clone), revisar y eliminar ese archivo antes de commitear.

**Why:** Cuando se hizo el primer push del setup SaaS Factory (commit b22be54, 2026-05-07), GitHub Push Protection bloqueo el push porque detecto una **OpenRouter API key** embebida en la metadata XMP de `.claude/skills/video-visuals/assets/levy.png`. El archivo es un PNG legitimo (1080x1080) usado como referencia de estilo del skill, pero alguien de SaaS Factory dejo una API key en los metadatos cuando lo exporto desde Photoshop/Adobe.

Solucion aplicada: se elimino el archivo localmente, se rehizo el commit (a6d911f), y el 2026-05-08 se modifico `SKILL.md` del skill `video-visuals` para eliminar todas las referencias a Levy (seccion "Personaje Levy" + ejemplo de bash con `--image`). La carpeta `assets/` tambien fue eliminada. El skill ahora funciona standalone sin esperar el asset.

**How to apply:**
- Si `update-sf` o un re-clone del template re-introduce `.claude/skills/video-visuals/assets/levy.png` o restaura la seccion "Personaje Levy" en `SKILL.md`, eliminar ambas cosas antes de commitear.
- Si en el futuro se quiere mascota propia: generar un PNG **sin metadata** (en Photoshop: File > Export > Save for Web → unchecked metadata) y re-agregar la seccion al skill.
- Considerar reportar a SaaS Factory que su template filtra una API key.

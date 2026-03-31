# Instagram Graph API — Guía de Configuración

> Cómo obtener acceso a las métricas reales de tu cuenta de Instagram.

---

## Requisitos previos

- Cuenta de Instagram de tipo **Profesional** (Creador o Empresa) — no funciona con cuentas personales
- Cuenta de Facebook vinculada a tu Instagram
- Acceso a [developers.facebook.com](https://developers.facebook.com)

---

## Paso 1 — Crear la App en Meta

1. Ir a [developers.facebook.com](https://developers.facebook.com) e iniciar sesión con tu cuenta de Facebook
2. Clic en "Mis apps" → "Crear app"
3. Tipo de app: seleccioná **"Empresa"** (Business)
4. Completá nombre de la app (ej. "mi-content-os") y correo de contacto
5. Clic en "Crear app"

---

## Paso 2 — Agregar Instagram Graph API

1. En el panel de tu app, buscá el producto "Instagram" y hacé clic en "Configurar"
2. Seleccioná "Instagram Graph API"
3. En el menú lateral aparecerá "Instagram" con sus opciones

---

## Paso 3 — Obtener el token de acceso

1. En el menú lateral: **Herramientas** → **Explorador de la API Graph**
2. En el selector de app (arriba a la derecha), seleccioná tu app
3. En "Permisos", agregá estos tres:
   - `instagram_basic`
   - `instagram_manage_insights`
   - `pages_read_engagement`
4. Clic en "Generar token de acceso" → autorizar con tu cuenta de Facebook
5. Copiá el token generado

Este token dura **1 hora**. El siguiente paso lo convierte en un token de larga duración.

---

## Paso 4 — Convertir a token de larga duración (60 días)

Reemplazá los valores y pegá esto en tu terminal:

```
curl -i -X GET "https://graph.facebook.com/v21.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id=TU_APP_ID
  &client_secret=TU_APP_SECRET
  &fb_exchange_token=TU_TOKEN_CORTO"
```

- `TU_APP_ID` y `TU_APP_SECRET` están en Configuración → Básica de tu app en Meta
- La respuesta incluye el token largo — guardalo en tu `.env.local`

**El token de larga duración dura 60 días. Renovarlo mensualmente.**

---

## Paso 5 — Obtener tu Instagram User ID

Con el token largo, ejecutá:

```
curl "https://graph.facebook.com/v21.0/me/accounts?access_token=TU_TOKEN_LARGO"
```

Buscá en la respuesta el `id` de tu página de Facebook. Luego:

```
curl "https://graph.facebook.com/v21.0/TU_PAGE_ID?fields=instagram_business_account&access_token=TU_TOKEN_LARGO"
```

El valor de `instagram_business_account.id` es tu `INSTAGRAM_USER_ID`.

---

## Variables resultantes para `.env.local`

```
INSTAGRAM_ACCESS_TOKEN=TU_TOKEN_LARGO
INSTAGRAM_USER_ID=TU_IG_USER_ID
```

---

## Permisos disponibles y para qué sirven

| Permiso | Para qué |
|---------|----------|
| `instagram_basic` | Leer posts, captions, timestamps |
| `instagram_manage_insights` | Leer métricas (views, reach, likes, saves, etc.) |
| `pages_read_engagement` | Necesario para acceder a través de la página de Facebook |

---

## Limitaciones a tener en cuenta

- Solo funciona con cuentas **Profesionales** (no personales)
- El token expira cada 60 días — hay que renovarlo
- Rate limit: 200 llamadas por hora por token
- Las métricas de posts tienen un delay de ~24hs para estabilizarse
- Historias: métricas disponibles solo por 24hs después de publicarse

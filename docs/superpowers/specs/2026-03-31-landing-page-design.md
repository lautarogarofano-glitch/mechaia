# Landing Page — MechaIA

**Fecha:** 2026-03-31
**Estado:** Aprobado

## Contexto

Landing page pública para MechaIA que se muestra cuando no hay usuario autenticado (en lugar de ir directo al login). Se implementa como un componente `Landing.tsx` dentro del mismo proyecto Vite/React existente. El botón de "Empezar gratis" / "Iniciar sesión" abre el componente `Auth` existente.

El cobro via Lemon Squeezy no está habilitado aún — los botones de planes llevan al registro (Auth), no a checkout.

## Stack y restricciones

- React + TypeScript + Tailwind CSS (igual que el resto del proyecto)
- Lucide React para íconos (ya instalado)
- Dark mode por defecto (`slate-950` / `slate-900` como fondos)
- Paleta: azul/índigo (igual que la app — `blue-600`, `indigo-600`)
- Sin animaciones JS complejas — solo CSS/Tailwind (hover, transitions)
- Responsive: mobile-first

## Arquitectura

- **`src/components/Landing.tsx`** — componente principal con todas las secciones
- **`src/App.tsx`** — modificar la condición `if (!user)` para mostrar `<Landing onAuth={() => setShowAuth(true)} />` en lugar de `<Auth />` directamente. El Auth se activa desde los CTAs de la landing.

## Secciones

### 1. Navbar

- Fondo transparente que pasa a `slate-900/80` + `backdrop-blur` al hacer scroll (listener `scroll` o `IntersectionObserver`)
- Izquierda: logo (`/logo.png`) + texto "MechaIA"
- Derecha: botón "Iniciar sesión" (outline) + botón "Empezar gratis →" (azul sólido)
- Ambos botones abren el componente Auth (prop callback)

### 2. Hero

- Fondo `slate-950` con glow sutil centrado (gradiente radial azul/índigo con `opacity-20` aprox, via `bg-[radial-gradient(...)]` inline o una `div` posicionada)
- Badge: chip pequeño `"IA para talleres mecánicos"`
- Título (`text-4xl md:text-6xl font-bold`): `"El asistente de diagnóstico que trabaja junto a tu scanner"`
- Subtítulo: `"Ingresás los datos del vehículo, chateás con la IA y recibís un diagnóstico paso a paso — con informe PDF para entregar al cliente."`
- Botones: `"Empezar gratis"` (azul sólido) + `"Ver cómo funciona ↓"` (anchor scroll a sección #como-funciona, outline)
- Mockup: imagen estática simulada del chat de la app (screenshot o SVG decorativo con el estilo de la app), con `shadow-2xl rounded-2xl border border-slate-700`

### 3. El Problema

- Fondo `slate-900`
- Título: `"Diagnosticar sin contexto cuesta tiempo y plata"`
- Tres tarjetas en grid (`grid-cols-1 md:grid-cols-3`), fondo `slate-800`, borde `slate-700`, ícono Lucide arriba, texto descriptivo:
  - `"El scanner tira un código pero no te dice qué hacer después"`
  - `"Perdés horas buscando en foros o llamando a otros talleres"`
  - `"El cliente pregunta qué tiene el auto y no sabés cómo explicarlo"`
- Línea de cierre centrada: `"MechaIA cambia eso."` en negrita

### 4. Cómo funciona

- Fondo `slate-950`
- ID: `como-funciona` (target del anchor del hero)
- Título: `"Tres pasos y ya estás diagnosticando"`
- Tres pasos con número grande (estilo decorativo), título e ícono:
  1. **Ingresá los datos del vehículo** — marca, modelo, motor, falla, código OBD
  2. **Chateá con la IA** — te hace preguntas, analiza síntomas, sugiere causas y pasos a seguir
  3. **Descargá el informe PDF** — documento profesional listo para entregar al cliente
- Layout: columnas en desktop, vertical en mobile

### 5. Features

- Fondo `slate-900`
- Título: `"Todo lo que necesita tu taller"`
- Grid 2x3 de cards (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`), fondo `slate-800`, borde `slate-700`:
  1. **Diagnóstico guiado por IA** — hace las preguntas correctas en el orden correcto
  2. **PDF descargable** — informe profesional para entregar al cliente
  3. **Historial de diagnósticos** — todos tus casos guardados y accesibles
  4. **Compatible con cualquier scanner** — ingresás el código OBD manualmente
  5. **Funciona en el celular** — desde el taller sin computadora
  6. **5 diagnósticos gratis** — empezás sin tarjeta de crédito

### 6. Precios

- Fondo `slate-950`
- Título: `"Planes simples, sin sorpresas"`
- Dos cards lado a lado (igual que `Pricing.tsx` actual pero adaptado al estilo landing):
  - **Base**: $11.45/mes — 150 mensajes/mes, diagnóstico guiado, historial, soporte email
  - **Turbo** (recomendado, badge): $19.20/mes — mensajes ilimitados, PDF, historial, soporte prioritario, acceso a novedades primero
- Botones dicen `"Empezar con Base"` / `"Empezar con Turbo"` — abren Auth (registro), **no** checkout (Lemon Squeezy pendiente)
- Nota al pie: `"Empezá con 5 diagnósticos gratis. Sin tarjeta."`

### 7. CTA Final + Footer

- **CTA:** caja con gradiente `from-blue-600 to-indigo-600`, texto `"Tu taller merece mejores diagnósticos"`, subtítulo breve, botón grande `"Empezar gratis hoy"`
- **Footer:** fondo `slate-950`, borde superior `slate-800`. Logo + nombre a la izquierda, copyright a la derecha. Minimalista.

## Integración con App.tsx

Actualmente `App.tsx` hace `if (!user) return <Auth />`. Se agrega un estado `showAuth: boolean` en `App.tsx`:

- Si `!user && !showAuth` → renderiza `<Landing onStartAuth={() => setShowAuth(true)} />`
- Si `!user && showAuth` → renderiza `<Auth onAuthSuccess={() => setShowAuth(false)} />`

Los CTAs de la landing (navbar, hero, precios, CTA final) llaman todos a `onStartAuth()`. No hay modal/overlay — es un swap de componente full-screen igual a como funciona hoy.

## Lo que NO incluye este spec

- Animaciones scroll-triggered con JS
- Blog, FAQ, términos de servicio
- Integración real con Lemon Squeezy (va en otro ciclo)
- Soporte multi-idioma

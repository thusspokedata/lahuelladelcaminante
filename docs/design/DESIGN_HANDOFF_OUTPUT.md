# DESIGN_HANDOFF_OUTPUT.md
## Rediseño La Huella del Caminante — paquete de entrega a desarrollo (v1.1)

Acompaña al brief y a `DESIGN_HANDOFF_INPUT.md`. v1.1 incorpora las correcciones del PM (Tailwind v4 `@theme inline`, subset `latin`, CTA data-driven, componentes custom, fallback de flyer).

> **Ver también:** `DESIGN_HANDOFF_OUTPUT_v2.md` cubre las 5 pantallas auxiliares (sign-in, sign-up, solicitud enviada, user-pending, user-blocked) que quedaron afuera de v1.

---

## 1. Decisiones de diseño tomadas

### 1.1 Dirección visual (firme)

| | |
|---|---|
| Modo | **Dark only**, forzado. Sin toggle de light. |
| Temperatura | Negro tibio (oklch lightness ≈ 0.14, hue 50°). NO negro azulado. |
| Densidad | Estilo RA.co / Songkick (alta densidad de agenda), pero con textura editorial. |
| Imágenes | **4:5 vertical** para hero y cards. **1:1 cuadrado** para artistas en grilla compacta. Nunca landscape forzado. |
| Iconografía latina | Cero. La identidad viene del color, la tipografía y el tono. |

### 1.2 Tipografía elegida — Bricolage Grotesque

| Token | Familia | Por qué |
|---|---|---|
| `--font-display` | **Bricolage Grotesque** (Google) | Sans con personalidad humanista. Variable. Renders bien en hero (96px) y card title (20px). |
| `--font-body` | **Hanken Grotesk** (Google) | Sans neutra con buen ritmo. Limpia para body, datos, navegación. |
| `--font-mono` | **JetBrains Mono** (Google) | Fechas, precios, eyebrows. Marca el "ritmo de máquina" que diferencia metadata del contenido. |

**Subset: `latin` únicamente.** Cubre todos los acentos ES, EN y los caracteres alemanes (`ä/ö/ü/ß/Ä/Ö/Ü`). El subset `latin-ext` agrega diacríticos de polaco/checo/turco que no usamos — ahorrar ese KB importa con el VPS de 1GB.

### 1.3 Roles de color — cerrados

| Color | Hex | Rol | Aparece en |
|---|---|---|---|
| **Sangre** | `#D43029` | Brand público · CTA primario · brand mark | Botón "Conseguir entradas", logo, links activos, badge "EN VIVO" |
| **Dorado** | `#E5A93B` | Editorial · curaduría · destacado · "esta semana" | Eyebrow "DESTACADOS", badge "★ DESTACADO", date tile en eventos featured |
| **Fucsia** | `#E4458A` | Creator panel · noche tarde · contexto urbano | Sidebar del panel creator, badge "● NOCHE TARDE", géneros urbanos |

**Regla dura:** sangre aparece **una vez por pantalla, dos como máximo**. Si empieza a aparecer en chips, separadores y hovers, perdió el rol.

### 1.4 Tratamiento de imagen + fallback

- **Hero (detalle de evento / artista):** 4:5, contenida (no recortada) sobre padding de 12px en surface elevada.
- **Cards en grilla:** 4:5.
- **Compactos (agenda strip, dashboard, avatar):** 1:1.
- **Imagen mal ratio'd:** contener sobre blur de la misma imagen. Nunca recortar texto del flyer.
- **Hover de cards:** transición 200ms ease-out — *no es decorativo, es parte del feel*.

#### Fallback de `FlyerImage` (comportamiento por defecto — no caso de borde)

Si un evento no tiene flyer subido, la card / hero muestra el **portrait del artista headliner** con el patrón de **iniciales gigantes** (mismo recurso que `MS / WP / FC` en el listado de artistas). Si tampoco hay portrait del artista, cae a iniciales gigantes sobre el color de acento que corresponda al evento (sangre, dorado o fucsia según las reglas de §1.3).

```ts
// FlyerImage.tsx — selector de imagen (pseudocódigo)
function pickFlyerSource(event: Event): FlyerSource {
  if (event.flyerUrl)                       return { kind: 'flyer',    url: event.flyerUrl };
  if (event.headliner?.portraitUrl)         return { kind: 'portrait', url: event.headliner.portraitUrl, initials: event.headliner.initials };
  return { kind: 'initials', initials: event.headliner?.initials ?? event.title.slice(0, 2), accent: accentFor(event) };
}
```

El fallback es parte del contrato del componente, no un edge case. Documentar en el JSDoc del componente.

### 1.5 Estados vacíos como onboarding

Aplicado en `Creator · primer ingreso`: tres step-cards (perfil, evento, share) con preview de cómo se verá el contenido del creator antes de que exista. El "No events available" actual queda eliminado.

---

## 2. Design tokens — Tailwind v4 `@theme inline`

El proyecto usa **Tailwind v4** con `@theme inline` en `src/app/globals.css` (no hay `tailwind.config.ts`). Este es el bloque canónico para pegar:

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme inline {
  /* ── Color · surfaces ───────────────────────────────────── */
  --color-bg-page:        #15100B;
  --color-bg-surface:     #1C150F;
  --color-bg-surface-2:   #241B13;
  --color-bg-surface-3:   #2E2419;   /* hover / pressed */
  --color-border:         #332618;
  --color-border-hi:      #4A3826;

  /* ── Color · text ───────────────────────────────────────── */
  --color-fg-primary:     #F4ECE0;
  --color-fg-secondary:   #A89889;
  --color-fg-tertiary:    #6E6053;

  /* ── Color · accents (semantic, role-bound) ─────────────── */
  --color-brand:          #D43029;   /* sangre */
  --color-brand-dim:      #7E1B16;
  --color-on-brand:       #FFE6E3;

  --color-editorial:      #E5A93B;   /* dorado */
  --color-editorial-dim:  #7C5A1A;
  --color-on-editorial:   #1F1407;

  --color-creator:        #E4458A;   /* fucsia */
  --color-creator-dim:    #7B1F46;
  --color-on-creator:     #FFE7F0;

  /* ── Color · status ─────────────────────────────────────── */
  --color-status-ok:      #8DB87A;
  --color-status-warn:    #E5A93B;
  --color-status-danger:  #D43029;

  /* ── Type · families ────────────────────────────────────── */
  --font-display: "Bricolage Grotesque", system-ui, sans-serif;
  --font-body:    "Hanken Grotesk", system-ui, sans-serif;
  --font-mono:    "JetBrains Mono", ui-monospace, "SF Mono", monospace;

  /* ── Type · text utilities (Tailwind v4 text-*) ─────────── */
  --text-display-xl:                96px;
  --text-display-xl--line-height:   0.92;
  --text-display-xl--letter-spacing: -0.04em;
  --text-display-xl--font-weight:   800;

  --text-display-l:                 72px;
  --text-display-l--line-height:    0.94;
  --text-display-l--letter-spacing: -0.035em;
  --text-display-l--font-weight:    800;

  --text-display-m:                 56px;
  --text-display-m--line-height:    0.98;
  --text-display-m--letter-spacing: -0.03em;
  --text-display-m--font-weight:    700;

  --text-heading-l:                 40px;
  --text-heading-l--line-height:    1.05;
  --text-heading-l--letter-spacing: -0.025em;
  --text-heading-l--font-weight:    700;

  --text-heading-m:                 28px;
  --text-heading-m--line-height:    1.15;
  --text-heading-m--letter-spacing: -0.015em;
  --text-heading-m--font-weight:    700;

  --text-heading-s:                 20px;
  --text-heading-s--line-height:    1.25;
  --text-heading-s--letter-spacing: -0.01em;
  --text-heading-s--font-weight:    600;

  --text-body-l:                    17px;
  --text-body-l--line-height:       1.5;

  --text-body:                      15px;
  --text-body--line-height:         1.5;

  --text-body-s:                    13px;
  --text-body-s--line-height:       1.45;

  --text-caption:                   12px;
  --text-caption--line-height:      1.35;
  --text-caption--letter-spacing:   0.02em;
  --text-caption--font-weight:      500;

  --text-eyebrow:                   11px;
  --text-eyebrow--line-height:      1.2;
  --text-eyebrow--letter-spacing:   0.16em;
  --text-eyebrow--font-weight:      600;

  --text-mono:                      12px;
  --text-mono--line-height:         1.3;
  --text-mono--letter-spacing:      0.02em;
  --text-mono--font-weight:         500;

  /* ── Spacing (base 4) ───────────────────────────────────── */
  --spacing-xs:   4px;
  --spacing-s:    8px;
  --spacing-m:   16px;
  --spacing-l:   24px;
  --spacing-xl:  40px;
  --spacing-2xl: 64px;
  --spacing-3xl: 96px;

  /* ── Radius ─────────────────────────────────────────────── */
  --radius-s:    4px;
  --radius-m:    8px;
  --radius-l:   12px;
  --radius-xl:  18px;
  --radius-pill: 9999px;
}

/* Layout primitives no semánticos quedan fuera de @theme:
   ancho máximo, header height, gutter del contenedor. */
:root {
  --layout-max-w:    1280px;
  --layout-gutter:     32px;
  --layout-header-h:   72px;
}

/* Forzar dark warm en body. Sin theme toggle por ahora. */
html, body {
  background: var(--color-bg-page);
  color: var(--color-fg-primary);
  font-family: var(--font-body);
}
```

Tras pegar este bloque, Tailwind v4 expone automáticamente las utilities derivadas: `bg-brand`, `text-on-brand`, `text-display-l`, `font-display`, `rounded-l`, `p-xl`, etc.

### Fuentes — next/font

```ts
// app/layout.tsx
import { Bricolage_Grotesque, Hanken_Grotesk, JetBrains_Mono } from 'next/font/google';

const display = Bricolage_Grotesque({
  subsets: ['latin'],                                // NO latin-ext
  weight: ['400','500','600','700','800'],
  variable: '--font-display',
  display: 'swap',
});
const body = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400','500','600','700'],
  variable: '--font-body',
  display: 'swap',
});
const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400','500','600'],
  variable: '--font-mono',
  display: 'swap',
});
```

---

## 3. Mapeo pantallas → rutas del repo

Las rutas se mantienen como están hoy (`/[locale]/events`, no `/de/veranstaltungen`). Ver §7 (Backlog) para localización SEO.

| Pantalla diseñada | Reemplaza / modifica |
|---|---|
| Home pública | `src/app/[locale]/(public)/page.tsx` |
| Listado de eventos | `src/app/[locale]/(public)/events/page.tsx` |
| Detalle de evento | `src/app/[locale]/(public)/events/[slug]/page.tsx` |
| Listado de artistas | `src/app/[locale]/(public)/artists/page.tsx` |
| Detalle de artista | `src/app/[locale]/(public)/artists/[slug]/page.tsx` |
| Header / Footer | `src/components/layout/Header.tsx` · `Footer.tsx` |
| Dashboard creator — overview | `src/app/[locale]/(creator)/dashboard/page.tsx` |
| Dashboard creator — eventos | `src/app/[locale]/(creator)/dashboard/events/page.tsx` |
| Dashboard creator — artistas | `src/app/[locale]/(creator)/dashboard/artists/page.tsx` |
| 404 | `src/app/[locale]/not-found.tsx` |
| Loading skeletons | `loading.tsx` files al nivel de cada ruta |

**Nuevo (no existe hoy):** la sección "Esta semana" en home, los date-grouping headers en /events, la pantalla de onboarding del creator (reemplaza al estado vacío actual).

---

## 4. Inventario de componentes propuestos

**Todos los componentes del §4.1 son custom puros — no extienden shadcn ni base-ui.** Los shadcn ya instalados (`Button`, `Dialog`, `Select`, `Input`) se mantienen donde están en uso; se reemplazan gradualmente cuando molesten, no en una épica formal.

### 4.1 Nuevos a crear (custom, alineados a los tokens)

```text
src/components/brand/BrandMark.tsx        — ícono cuadrado (huella + sangre)
src/components/brand/BrandLockup.tsx      — ícono + "La Huella / del Caminante"
src/components/events/EventCard.tsx       — card 4:5 con date tile, badge género, late marker
src/components/events/EventRow.tsx        — fila densa para agenda compacta
src/components/events/DateTile.tsx        — bloque "JUN 7" reutilizable
src/components/events/EventCta.tsx        — CTA data-driven según Event.price (ver §5.3)
src/components/artists/ArtistCard.tsx     — card cuadrada con portrait + initials watermark
src/components/ui/Chip.tsx                — filter chip pill con accent prop
src/components/ui/SectionHeader.tsx       — eyebrow + h2 + acción a la derecha
src/components/ui/FlyerImage.tsx          — wrapper con fallback a portrait → iniciales (ver §1.4)
src/components/dashboard/StepCard.tsx     — card de onboarding (3 pasos)
src/components/dashboard/DashboardShell.tsx — sidebar + main, role-aware
```

### 4.2 Existentes a modificar

```text
Header.tsx       — nueva lockup, lang switcher en pill, nav con underline-on-active sangre
Footer.tsx       — 4 columnas con eyebrow titles, copy compacto
EventCard.tsx    — cambio fuerte: imagen 4:5 (no landscape), date tile overlay
Layout root      — body con bg dark forzado, sin theme toggle
```

### 4.3 Existentes a eliminar (o deprecar)

```text
Cualquier componente de light-mode (no se usa hasta nueva orden)
El bloque "Want to post your events?" como hero card oscuro fullwidth — reemplazado por la sección CTA inline en home
```

---

## 5. Notas de implementación

### 5.1 Crítico vs. simplificable (para MVP visual)

| Crítico | Simplificable en v1 |
|---|---|
| Dark warm + tipografía + paleta + ratio 4:5 — todo eso es la marca | Hover micro-animaciones (200ms ease-out) — pueden quedar para v2 |
| Date tile + badge sobre flyer | Pattern de fondo del flyer placeholder cuando falta imagen — un solid color sirve para v1 |
| Onboarding del creator (3 step cards) | Las preview-chips de "así te verán" — pueden ser texto simple en v1 |
| **Fallback de FlyerImage a portrait → iniciales** | — (es parte del contrato, no MVP-able) |
| **CTA data-driven** según Event.price | — (es parte de la corrección de copy, no MVP-able) |
| Estados vacíos como guía | Filtros combinados con sugerencias — el JSON de sugerencias puede ser hardcoded por ahora |
| Loading skeletons en lugar de "No events available" | Skeleton con animación de pulse — un static gray sirve para v1 |

### 5.2 Iconos — política

- **Componentes nuevos:** preferir iconos como texto cuando sea posible (`←`, `→`, `●`, `↗`, `+`, `×`).
- **Cuando no se puede expresar en texto:** importar de **lucide-react** (ya está en el repo, tree-shakeable; cada import suma ~0.5–1KB).
- **No remover** lucide-react del bundle — sigue en uso en componentes existentes que no se reemplazan en esta vuelta.

### 5.3 Decisiones implícitas que el dev debe respetar

1. **Las cards de evento usan `<a>`** envolviendo todo el bloque. No usar `onClick` en el `<div>` — perdemos accesibilidad, abrir-en-pestaña-nueva, etc.
2. **Los hovers transicionan en 200ms ease-out.** Es la "respiración" del producto. No los acortes a 100ms ni los extendas a 400ms.
3. **El flyer del evento nunca se recorta.** Contener + blur fill como fallback. Comportamiento crítico.
4. **El language switcher siempre se renderiza como tres pills (`ES · EN · DE`) tappables.** NUNCA se convierte en dropdown, en ningún breakpoint. En mobile, las pills se compactan (font-size menor, sin separador `·` entre ellas), pero siguen siendo tres elementos visibles e individualmente tappables.
5. **La sangre se usa una vez por pantalla, máximo dos.**
6. **Densidad: respetar las escalas de spacing.** No agregar paddings ad-hoc; si falta uno, agregar al token system.
7. **El h1 del home es data-driven** según el estado de la agenda (cascada §7.3 del input de respuesta):
   - Si hay shows esta semana → `home.hero.h1.thisWeek` → *"La huella **de esta semana**."*
   - Sino, si hay shows el mes que viene → `home.hero.h1.nextMonth` → *"La huella **del mes que viene**."*
   - Sino → `home.hero.h1.fallback` → *"La huella, **lo que viene**."*
   Las tres viven en `messages/{es,en,de}.json`, nunca hardcoded.
8. **El CTA del detalle de evento es data-driven** según el modo de acceso (derivado de `Event.price`):

   | `Event.price` (normalizado) | UI | Comportamiento |
   |---|---|---|
   | `{ kind: 'external', url: 'https://…' }` | Botón sangre **"Conseguir entradas ↗"** | `<a target="_blank" rel="noopener noreferrer">` |
   | `{ kind: 'donation' }` | Etiqueta **"Aporte voluntario"** (no clickeable, fondo `surface`, borde `border-hi`) | — |
   | `{ kind: 'free' }` | Etiqueta **"Entrada libre"** (no clickeable) | — |
   | `{ kind: 'door' }` | Etiqueta **"Entrada en puerta"** (no clickeable) | — |
   | `null` o `kind: 'unknown'` | No mostrar CTA; solo bloque de precio si existe | — |

   La normalización del campo `Event.price` (hoy string libre) se hace en server o en migración — fuera del scope de diseño, pero el componente `EventCta.tsx` ya recibe el shape estructurado.

   Etiquetas i18n: `event.cta.tickets`, `event.cta.donation`, `event.cta.free`, `event.cta.door`. Ver demo en la artboard "Evento · variantes de CTA" del canvas.

---

## 6. Comportamiento responsive

### Breakpoints (alineados con Tailwind defaults)

```text
sm:  640px
md:  768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

### Por pantalla

| Pantalla | Mobile (< 768) | Tablet (768–1024) | Desktop (≥ 1024) |
|---|---|---|---|
| **Home hero** | h1 a 40px en una columna, stats stack vertical | h1 a 64px, stats en 2 cols | h1 a 96px, stats en 4 cols |
| **Featured grid** | 1 col, full width | 2 cols | 3 cols |
| **Agenda strip** | Stack vertical, oculta el badge género | Filtros wrap | Filtros inline |
| **Artistas grid** | 2 cols compactas | 3 cols | 4 cols |
| **Events list** | Cards full-width agrupadas por día, filtros en scroll horizontal | 2 cols | 3 cols |
| **Event detail** | Flyer al tope, fact grid 2 cols, ticket button sticky bottom | igual mobile, flyer al tope | 5+7 cols: flyer sticky izq, info derecha |
| **Artist detail** | Portrait al tope, info debajo | igual | 4+8 cols |
| **Dashboard creator** | Sidebar colapsa a tab bar inferior + drawer | Sidebar 220px | Sidebar 260px + main |

### Qué se oculta / muestra en mobile

- Header nav: drawer con icono `≡` a la derecha.
- Tab bar inferior fija con Inicio · Eventos · Artistas · Guardado.
- Lang switcher: las tres pills (`ES · EN · DE`) se compactan (font-size `var(--text-caption)`, padding reducido, sin separador `·` entre ellas). El componente ocupa el mismo espacio horizontal en el header que la hamburguesa de nav, equilibrando el header simétricamente. **NO dropdown** — la decisión es pills siempre, en todos los breakpoints (ver §5.3, regla 4).
- En event detail desktop, el flyer es sticky en la columna izquierda. En mobile, scroll normal.

---

## 7. Backlog post-rediseño (épicas aparte)

Estas no son decisiones abiertas — son cosas que **decidimos no abordar en este rediseño** y se planifican como épicas posteriores:

1. **Rutas localizadas por idioma para SEO local** (`/de/veranstaltungen`, `/de/künstler`, etc.). Hoy las rutas están en inglés en los tres idiomas — funcional, pero subóptimo para SEO alemán. Mover post-rediseño.
2. **OG image / share preview templates.** Template del flyer + branding para previews en redes (1 día de trabajo). No bloquea.
3. **Cookie banner + Impressum + Datenschutz + AGB.** El footer ya reserva el slot. Se completa cuando esté el contenido legal redactado.
4. **Autoposteo a Instagram / Facebook / TikTok.** Marcado en el brief original como fuera del scope.
5. **Sistema de tickets in-house / pagos.** Fuera del scope: solo redirección externa.
6. **Sistema de notificaciones in-app.** No existe hoy, no se diseña.
7. **Migración total fuera de shadcn.** Reemplazos custom van ocurriendo a medida que los componentes shadcn molesten — no es épica formal.

---

## 8. Cómo está armado el archivo de diseño

`index.html` es un canvas con secciones:

1. **Dirección visual** (moodboard + roles de color)
2. **Sistema visual** (tokens, type scale, espaciado, componentes núcleo)
3. **Pantallas públicas desktop** — incluye un **prototipo navegable** (la primera artboard) donde podés clickear de home → detalle de evento → artista. También incluye la artboard *"Evento · variantes de CTA"* con los 4 modos.
4. **Panel creator + admin** (empty/onboarding y filled)
5. **Mobile** (375px — home, eventos, detalle)
6. **Estados especiales** (loading, sin resultados, 404)
7. **Auth + estados de cuenta** (sign-in, sign-up, solicitud enviada, user-pending, user-blocked) → ver `DESIGN_HANDOFF_OUTPUT_v2.md`

**Tweaks panel** (toggleable desde la toolbar): tipografía display/body, color brand, temperatura del dark.

---

## 9. Trabajo restante después de v1

Cubierto en `DESIGN_HANDOFF_OUTPUT_v2.md`:

- Sign-in / sign-up (desktop + mobile)
- "Solicitud enviada" (post-apply)
- User-pending (cuenta en revisión)
- User-blocked

**A implementar por el equipo sin diseño dedicado** (siguiendo tokens + patrones del handoff):

- Formularios de creación / edición de evento y artista en el dashboard creator
- Formulario público de `/apply`
- Panel admin completo (gestión de usuarios, vista global de eventos, cola de aplicaciones)
- Páginas legales (cuando esté el contenido legal redactado)

— Claude Design · 2026-05-15 · v1.1

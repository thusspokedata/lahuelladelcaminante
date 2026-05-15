# Design Handoff Input — La Huella del Caminante

**Generado:** 2026-05-15
**Branch:** `docs/design-handoff-input`
**Commit base:** `7103e81`

Este documento es **input** para el rediseño visual del sitio. Describe lo que existe hoy en el repo: rutas, datos, componentes, paquetes, strings, tokens y restricciones técnicas. No propone ningún diseño — es un inventario neutral para que Claude Design construya sobre la base real, no sobre suposiciones.

---

## 1. Rutas existentes

El sitio usa Next.js App Router con segmentos por locale (`/es`, `/en`, `/de`). Los `route groups` con paréntesis (`(public)`, `(protected)`, etc.) **no aparecen en la URL** — sirven para agrupar layouts y permisos.

Las URLs públicas mostradas abajo asumen `/es` como locale; cambiar a `/en` o `/de` da la versión equivalente.

### Públicas (sin login)

| Archivo | URL pública | Descripción |
|---|---|---|
| `(public)/page.tsx` | `/es` | Home. Hero, próximos eventos (6 destacados), explora por género, carruseles de artistas (próximos y pasados), CTA "Solicitar acceso". |
| `(public)/events/page.tsx` | `/es/events` | Listado de próximos eventos con filtro por género. |
| `(public)/events/past/page.tsx` | `/es/events/past` | Listado de eventos pasados. |
| `(public)/events/[slug]/page.tsx` | `/es/events/<slug>` | Detalle de un evento (hero con imagen, descripción, fechas, lugar, artista, mapa). |
| `(public)/artists/page.tsx` | `/es/artists` | Listado de artistas. |
| `(public)/artists/[slug]/page.tsx` | `/es/artists/<slug>` | Perfil público de artista (hero, biografía, géneros, redes, eventos asociados). |
| `(public)/apply/page.tsx` | `/es/apply` | Formulario para solicitar acceso como creator (nombre, email, mensaje). |

### Auth

| Archivo | URL pública | Descripción |
|---|---|---|
| `(auth)/sign-in/page.tsx` | `/es/sign-in` | Login email/password + botón "Continuar con Google". |
| `(auth)/sign-up/page.tsx` | `/es/sign-up` | Registro email/password (open registration, queda en estado `PENDING` hasta aprobación). |
| `user-pending/page.tsx` | `/es/user-pending` | Landing para usuarios cuya cuenta está en revisión. |
| `user-blocked/page.tsx` | `/es/user-blocked` | Landing para usuarios bloqueados. |

### Dashboard creator (rol `creator`, requiere login)

| Archivo | URL pública | Descripción |
|---|---|---|
| `(protected)/dashboard/page.tsx` | `/es/dashboard` | Home del dashboard. Resumen + accesos a "Mis eventos" y "Mis artistas". |
| `(protected)/dashboard/profile/page.tsx` | `/es/dashboard/profile` | Gestión de cuenta: nombre, email, contraseña, borrado de cuenta. |
| `(protected)/dashboard/events/page.tsx` | `/es/dashboard/events` | Listado de eventos del creator con acciones (editar, borrar, restaurar). |
| `(protected)/dashboard/events/create/page.tsx` | `/es/dashboard/events/create` | Formulario de creación de evento. |
| `(protected)/dashboard/events/[id]/edit/page.tsx` | `/es/dashboard/events/<id>/edit` | Formulario de edición de evento. |
| `(protected)/dashboard/artists/page.tsx` | `/es/dashboard/artists` | Listado de artistas del creator. |
| `(protected)/dashboard/artists/create/page.tsx` | `/es/dashboard/artists/create` | Formulario de creación de artista. |
| `(protected)/dashboard/artists/[id]/edit/page.tsx` | `/es/dashboard/artists/<id>/edit` | Formulario de edición de artista. |

### Panel admin (rol `admin`, requiere login)

| Archivo | URL pública | Descripción |
|---|---|---|
| `(admin)/admin/applications/page.tsx` | `/es/admin/applications` | Cola de solicitudes (`/apply`) con aprobar/rechazar. Tabs Pendientes/Revisadas. |
| `(admin)/admin/users/page.tsx` | `/es/admin/users` | Gestión de usuarios: cambio de rol y de estado. |
| `(admin)/admin/events/page.tsx` | `/es/admin/events` | Vista global de eventos con soft-delete, restore y borrado definitivo. |

### Raíz sin locale

| Archivo | URL pública | Descripción |
|---|---|---|
| `app/page.tsx` | `/` | Redirect al locale por defecto. No tiene UI propia. |

---

## 2. Modelo de datos (resumen)

Solo se incluyen los modelos relevantes para el diseño. Los modelos de Better Auth (`Session`, `Account`, `Verification`) están omitidos porque no aparecen en pantalla.

| Entidad | Campos clave para UI | Relaciones | Notas |
|---|---|---|---|
| **User** | `name`, `email`, `image` (avatar opcional), `role` (`user`/`creator`/`admin`), `banned`, `createdAt` | Tiene perfil (`UserProfile`), puede crear artistas y eventos | Es quien se loguea. Email es único. **Nota sobre `banned`:** el campo existe en el modelo (es parte del schema generado por Better Auth) pero **no se usa en el producto**. Ningún flujo del repo lee ni escribe `User.banned` — el bloqueo de cuentas se maneja exclusivamente con `UserProfile.status = BLOCKED`. Para el diseño, considerar el bloqueo solo a través de `UserProfile.status`. |
| **UserProfile** | `status` (`PENDING`/`ACTIVE`/`BLOCKED`), `bio` | Pertenece a un User | El status determina el acceso al sitio. Nuevas cuentas arrancan en `PENDING`. Es el campo de verdad para el ciclo de vida de la cuenta (no `User.banned`). |
| **Artist** | `name`, `slug`, `bio`, `origin`, `genres` (array de strings), `socialMedia` (JSON con redes), `profileImageId` | Pertenece opcionalmente a un User, tiene muchas imágenes y muchos eventos | El slug es la URL pública (`/artists/<slug>`). `genres` es lista libre, no enum. |
| **Event** | `title`, `slug`, `description`, `location` (texto plano "Venue, Ciudad"), `address`, `organizer`, `genre`, `time`, `price`, `isActive`, `isDeleted`, `deletedAt` | Creado por un User, opcionalmente vinculado a un Artist, tiene muchas fechas e imágenes | Soft-delete (no se borra físicamente; `isDeleted` + `deletedAt`). `location` es un string único, no separado en venue/city en DB. |
| **EventDate** | `date` (timestamp) | Pertenece a un Event | Un evento puede tener varias fechas (mismo show repetido). Se borra en cascade si se borra el evento. |
| **Image** | `url`, `alt`, `publicId` (Cloudinary) | Pertenece a un Event o a un Artist (uno u otro, no ambos) | Cascade delete con el padre. El `publicId` permite transformaciones on-the-fly en Cloudinary. |
| **Application** | `name`, `email`, `message`, `status` (`pending`/`approved`/`rejected`), `createdAt` | Independiente (no FK) | Lo que se envía desde `/apply`. Lo procesa el admin desde `/admin/applications`. |

**Enums relevantes:**
- `UserStatus`: `PENDING`, `ACTIVE`, `BLOCKED`.
- `User.role`: string libre con valores convencionales `user`, `creator`, `admin` (no es enum en DB).

**Journey de datos resumido:**

1. Visitante anónimo navega `/events` y `/artists` (lectura pública).
2. Si quiere publicar eventos, manda `/apply` → se crea una `Application`.
3. Admin revisa `Application` y aprueba → se crea un `User` con rol `creator` y `UserProfile.status = ACTIVE`.
4. Creator entra al dashboard, crea uno o varios `Artist` (perfiles que va a usar como "artistas detrás del evento").
5. Creator crea `Event`s y opcionalmente los vincula a un `Artist`. Cada evento tiene 1+ `EventDate`s y 0+ `Image`s.
6. Los eventos publicados salen a `/events` y a la home automáticamente.

Lo que importa para el diseño: el flujo principal es **Apply → Crear Artist → Crear Event**. El rediseño del dashboard debe optimizar para usuarios que están haciendo eso por primera vez (mayoría hoy) y para los recurrentes (eventos repetidos del mismo artista).

---

## 3. Componentes UI disponibles

### 3.1 shadcn/ui instalados

Variante `base-nova`, baseColor `neutral`, icon library `lucide`. Viven en `src/components/ui/`:

`badge`, `button`, `card`, `dialog`, `dropdown-menu`, `input`, `label`, `select`, `sonner` (toaster), `table`, `tabs`, `textarea`.

12 componentes en total. Lo que **no está instalado** y suele aparecer en redesigns: `accordion`, `alert`, `alert-dialog`, `avatar`, `breadcrumb`, `calendar`, `checkbox`, `command`, `form`, `hover-card`, `popover`, `progress`, `radio-group`, `scroll-area`, `separator`, `sheet`, `skeleton`, `slider`, `switch`, `toggle`, `tooltip`.

### 3.2 Componentes propios reutilizables

Componentes que aparecen en más de una pantalla:

| Componente | Archivo | Qué hace |
|---|---|---|
| `EventCard` | `components/events/EventCard.tsx` | Card de evento (imagen, título, fechas, lugar, género). Usado en home, listados públicos, dashboard. |
| `EventList` | `components/events/EventList.tsx` | Grid de `EventCard`s con estado vacío. |
| `EventFilter` | `components/events/EventFilter.tsx` | Selector de género para filtrar listados. |
| `EventForm` | `components/events/EventForm.tsx` | Formulario de creación/edición de evento (compartido entre create y edit). |
| `ArtistCard` | `components/artists/ArtistCard.tsx` | Card de artista (imagen, nombre, géneros). |
| `ArtistList` | `components/artists/ArtistList.tsx` | Grid de artistas con estado vacío y búsqueda. |
| `ArtistCarousel` | `components/artists/ArtistCarousel.tsx` | Carrusel horizontal de artistas (home: próximos y pasados). |
| `ArtistForm` | `components/artists/ArtistForm.tsx` | Formulario de creación/edición de artista. |
| `Header` | `components/layout/Header.tsx` | Header del sitio con navegación, switcher de idioma y menú de usuario. |
| `Footer` | `components/layout/Footer.tsx` | Footer con links, redes, copyright. |
| `LanguageSwitcher` | `components/layout/LanguageSwitcher.tsx` | Selector ES/EN/DE en el header. |
| `ThemeToggle` | `components/layout/ThemeToggle.tsx` | Toggle light/dark (puede dejar de usarse si el rediseño fija dark). |
| `DashboardNav` | `components/dashboard/DashboardNav.tsx` | Navegación lateral del dashboard. |

Componentes específicos de una sola pantalla (no listados como reusables, pero existen en el repo): `ApplyForm`, `DashboardEventActions`, `StatusBadge`, `UserTable`.

---

## 4. Paquetes UI/visuales

Solo los que afectan al diseño. Auth, ORM, framework, testing, build, email, etc. están omitidos.

| Paquete | Versión | Para qué se usa |
|---|---|---|
| `@base-ui/react` | ^1.4.0 | Primitivas headless (la base que usa la variante `base-nova` de shadcn en este repo, en vez de Radix). |
| `tailwindcss` | ^4 | Tailwind v4. Sin `tailwind.config` — todo se configura desde `globals.css`. |
| `@tailwindcss/postcss` | ^4 | Plugin PostCSS de Tailwind v4. |
| `tw-animate-css` | ^1.4.0 | Pack de animaciones (fade, slide, etc.) usable con clases Tailwind. |
| `tailwind-merge` | ^3.5.0 | Resuelve conflictos de clases Tailwind al mergearlas. |
| `class-variance-authority` | ^0.7.1 | Define variantes tipadas (size, intent) para componentes (`button`, `badge`). |
| `clsx` | ^2.1.1 | Concatena clases condicionales. |
| `lucide-react` | ^1.8.0 | Librería de iconos (la oficial de shadcn). |
| `next-themes` | ^0.4.6 | Manejo de dark/light mode. Hoy activo; el rediseño puede dejarlo solo en dark. |
| `next-cloudinary` | ^6.17.5 | Componente `<CldImage>` para imágenes con transformaciones server-side (recorte, formato, calidad). |
| `react-hook-form` | ^7.72.1 | Manejo de formularios. |
| `@hookform/resolvers` | ^5.2.2 | Adapta validators (zod) a react-hook-form. |
| `zod` | ^4.3.6 | Validación de schemas. Lo usan los formularios y los route handlers. |
| `sonner` | ^2.0.7 | Toasts (notificaciones flotantes). |
| `next-intl` | ^4.9.1 | i18n. ES/EN/DE. |

---

## 5. Internacionalización (i18n)

- **Locales soportados:** `es` (default), `en`, `de`.
- **Archivos de mensajes:** `src/messages/es.json`, `src/messages/en.json`, `src/messages/de.json`.
- **Total de claves por idioma:** **191** (idéntico en los tres archivos — los tres están sincronizados).
- **Dominios principales:**

| Dominio | Claves | Qué cubre |
|---|---|---|
| `nav` | 5 | Header (links, sign in/out). |
| `home` | 15 | Hero, secciones de la home, CTA. |
| `apply` | 25 | Página y formulario de solicitud de acceso. |
| `events` | 12 | Listados, filtros, mensajes de éxito. |
| `artists` | 4 | Listado de artistas (mínimo). |
| `dashboard` | 25 | Dashboard del creator + perfil + borrado de cuenta. |
| `admin` | 29 | Panel admin (users, eventos, applications). |
| `forms` | 37 | Labels y placeholders de los formularios de evento y artista. |
| `footer` | 5 | Links y copyright. |
| `status` | 3 | Etiquetas de estado (pending, active, blocked). |
| `auth` | 12 | Login, registro, landings de pending/blocked. |
| `common` | 19 | Botones genéricos (save, cancel, delete), confirmaciones, errores. |

### Ejemplos de copy por dominio

Una clave representativa por dominio, con las 3 traducciones, para que el rediseño calibre tono y longitud:

| Clave | ES | EN | DE |
|---|---|---|---|
| `home.tagline` | "La escena musical latinoamericana en Berlín, Múnich, Hamburgo y más ciudades alemanas." | "The Latin American music scene in Berlin, Munich, Hamburg and more German cities." | "Die lateinamerikanische Musikszene in Berlin, München, Hamburg und weiteren deutschen Städten." |
| `events.title` | "Próximos Eventos" | "Upcoming Events" | "Kommende Veranstaltungen" |
| `dashboard.myEvents` | "Mis Eventos" | "My Events" | "Meine Veranstaltungen" |
| `auth.signIn` | "Iniciar Sesión" | "Sign In" | "Anmelden" |
| `common.save` | "Guardar" | "Save" | "Speichern" |
| `apply.submit` | "Enviar solicitud" | "Send request" | "Anfrage senden" |
| `admin.users` | "Gestión de Usuarios" | "User Management" | "Benutzerverwaltung" |
| `forms.createEvent` | "Crear Evento" | "Create Event" | "Veranstaltung erstellen" |

**Tono general:** informal pero no chistoso. Argentino-neutro en español (uso de "vos" en mensajes de copy más conversacionales). Alemán formal estándar.

---

## 6. Tokens visuales actuales

Tailwind v4 no usa archivo `tailwind.config.*` en este proyecto. Todo se define en `src/app/globals.css` con `@theme inline` + variables CSS. Los colores están en `oklch` (perceptual).

### 6.1 Paleta

**Modo claro (`:root`):**

| Token | Valor | Uso |
|---|---|---|
| `--background` | `oklch(0.985 0.003 60)` | Fondo de la página (casi blanco crema). |
| `--foreground` | `oklch(0.15 0.02 30)` | Texto principal (casi negro cálido). |
| `--card` | `oklch(1 0 0)` | Fondo de cards (blanco puro). |
| `--card-foreground` | `oklch(0.15 0.02 30)` | Texto sobre cards. |
| `--primary` | `oklch(0.50 0.22 20)` | **"Crimson tango"** — rojo profundo, color de marca. Usado en CTAs y acentos. |
| `--primary-foreground` | `oklch(0.99 0 0)` | Texto sobre primary (blanco). |
| `--secondary` | `oklch(0.94 0.02 60)` | Crema cálido para superficies secundarias. |
| `--accent` | `oklch(0.90 0.06 75)` | **"Warm gold"** — dorado suave. Usado para badges y detalles. |
| `--muted` | `oklch(0.95 0.01 60)` | Fondos muteados (filtros, separadores). |
| `--muted-foreground` | `oklch(0.50 0.02 30)` | Texto secundario / labels. |
| `--destructive` | `oklch(0.577 0.245 27.325)` | Rojo de error / borrado. |
| `--border` / `--input` | `oklch(0.90 0.01 60)` | Bordes sutiles. |
| `--ring` | `oklch(0.50 0.22 20)` | Anillo de focus (mismo hue que primary). |

**Modo oscuro (`.dark`):**

| Token | Valor | Notas |
|---|---|---|
| `--background` | `oklch(0.12 0.015 30)` | Casi negro, ligeramente cálido. |
| `--foreground` | `oklch(0.94 0.01 60)` | Crema sobre el fondo oscuro. |
| `--card` | `oklch(0.17 0.018 30)` | Cards apenas más claras que el fondo. |
| `--primary` | `oklch(0.62 0.22 20)` | Rojo tango más brillante para compensar fondo oscuro. |
| `--accent` | `oklch(0.28 0.04 60)` | Acento muteado en dark (cambia de rol respecto a light). |
| `--border` / `--input` | `oklch(1 0 0 / 8%)` y `10%` | Bordes apenas visibles con alpha. |

**Conclusión:** la paleta hoy está pensada bicromo (light + dark) y enfocada en una identidad rojo-dorada inspirada en tango.

### 6.2 Tipografía

- **Familia única:** **Geist Sans** (Google Fonts, `next/font/google`), expuesta como CSS variable `--font-geist`. Se aplica al `<html>` via la variable. No hay tipografía secundaria.
- **Subset cargado:** `latin` (no incluye latin-ext; alemán con `ä/ö/ü/ß` funciona, español sin problemas).
- **Sin escala tipográfica definida en CSS** — la jerarquía de headings se construye con utilidades Tailwind en cada componente (no hay tokens `--text-xl` propios; se usan los defaults de Tailwind: `text-xs` 12px → `text-base` 16px → `text-7xl` 72px).
- **Pesos en uso (observado en componentes):** `font-bold` para CTAs, `font-black` para hero, `font-semibold` para botones secundarios. No hay regla central.
- **Tamaños observados en componentes existentes:**
  - Hero home: `text-5xl sm:text-7xl lg:text-8xl` (responsive masivo).
  - Subtítulos de sección: típicamente `text-3xl` a `text-4xl`.
  - Cards de evento/artist: título `text-base` o `text-lg`, metadata `text-sm` o `text-xs`.
  - Body / descripciones: `text-base` (16px).
  - Microcopy y badges: `text-xs` (12px) con `uppercase tracking-[0.2em]` para los chips de categoría del hero.

### 6.3 Espaciado, radios, bordes

- **Espaciado:** defaults de Tailwind v4. No hay tokens de spacing propios.
- **Radios:** un solo token base `--radius: 0.625rem` (10px), con derivados `--radius-sm` (calc -2px), `--radius-md` (-1px), `--radius-lg` (=radius), `--radius-xl` (+4px). Esto fija un lenguaje de esquinas redondeadas moderado.
- **Bordes:** 1px sólido por convención de shadcn. Color desde `--border`.
- **Sombras:** no hay tokens. Se usan utilidades Tailwind directamente (`shadow-lg`, `shadow-xl/40`, etc.) en cada lugar.
- **Scrollbars:** una sola utilidad propia, `.scrollbar-none`, que oculta scrollbars en contenedores horizontales (carruseles de artistas en la home).

### 6.4 Patrones visuales actuales (observados en código)

El diseño actual de la home introduce algunos patrones que conviene conocer antes de decidir si mantenerlos, evolucionarlos o reemplazarlos:

- **Hero con base oscura + radial gradients de color:** el hero combina un fondo `oklch(0.06 0.02 20)` con dos radial gradients (rojo tango + acento dorado) posicionados en lados opuestos. Da una textura "club nocturno" sin imagen de fondo.
- **Dot grid sutil:** un patrón de puntos blancos con opacidad ~3.5% encima del hero, generado con CSS (`radial-gradient(circle, white 1px, transparent 1px)`, 36px de spacing). Aporta textura sin pesar nada.
- **Badge con anillo pulsante:** una píldora con borde translúcido, blur de backdrop y un punto rojo animado (`animate-pulse`) al inicio. Marca la categoría de la sección.
- **Tipografía hero a tamaño masivo:** `text-7xl` a `text-8xl`, `font-black`, dos líneas con la segunda en color primary. Es el único lugar con `font-black`; el resto del sitio usa `font-bold` máximo.
- **Botones CTA con sombra teñida:** los CTAs primarios usan `shadow-xl shadow-primary/40`, que tiñe la sombra con el color de marca. Da una sensación de "botón emisor de luz".

---

## 7. Restricciones técnicas relevantes para el diseño

- **VPS de 1GB RAM:** el sitio corre en un servidor chico. Bundle pesado degrada experiencia. Evitar agregar fuentes nuevas (cada fuente extra suma KB), animaciones JS pesadas, librerías de iconos completas (preferir importar iconos individuales de `lucide-react`).
- **Build local + rsync:** no hay CI/CD. Cada deploy lo dispara el dev a mano. Cambios de diseño que requieran builds frecuentes durante el rediseño son aceptables, pero conviene no fragmentar en muchas iteraciones chicas.
- **Imágenes en Cloudinary:** **todas** las imágenes pasan por Cloudinary y pueden transformarse on-the-fly (recortes, ratios, blur, formato moderno). El rediseño puede asumir que el componente `<CldImage>` se puede pedir cualquier dimensión y crop mode (`fill`, `crop`, `thumb` con focus, etc.). No hay imágenes en local del repo.
- **Multilingüe ES/EN/DE:** el alemán suele ser **30–40% más largo** que el español/inglés. Botones, badges, items de menú deben tolerarlo (ej. "Crear Evento" → "Veranstaltung erstellen"). Evitar diseños que dependen de longitudes parejas.
- **Dark mode forzado (decisión del brief):** el rediseño va a fijar dark mode como único tema. El `ThemeToggle` actual queda obsoleto; conviene removerlo del header pero NO borrar las variables `.dark` del CSS (es lo que se va a usar siempre). Las variables `:root` (light) pueden quedar o irse.
- **Imágenes en formato vertical / cuadrado (decisión del brief):** los artistas suben flyers de Instagram (1:1 o 4:5). Hoy se muestran forzadas a landscape, lo que recorta info clave del flyer. El rediseño debe diseñar **asumiendo vertical/cuadrado** como ratio principal de cards y heros.
- **Sin tests automatizados ni monitoreo:** cualquier regresión visual aparece en producción. Diseño debe ser implementable sin necesitar refactors grandes que rompan flows existentes (auth, CRUD de eventos).
- **Stack moderno (Next 16 + React 19 + Tailwind 4):** se pueden usar features nuevas (server components, server actions, CSS nesting nativo, `oklch`). No hace falta diseñar pensando en browsers viejos — el público objetivo (Berlín latino, smartphone-first) usa navegadores actuales.
- **Tipografía limitada a Geist Sans hoy:** si el rediseño quiere una secundaria (serif para hero, mono para precios), hay que sumarla via `next/font` con su impacto en bundle. Una secundaria está OK; tres es demasiado.
- **shadcn variant `base-nova` con `@base-ui/react`:** los componentes shadcn ya instalados usan base-ui (no Radix). Si el rediseño quiere componentes nuevos de shadcn, hay que respetar la variante para no romper interop (`dropdown-menu` con base-ui no soporta `asChild`, por ejemplo).
- **Iconos solo de `lucide-react`:** el set existente usa exclusivamente Lucide. Mantener ese set en el rediseño evita sumar paquetes; si se necesita un icono que Lucide no tiene, conviene inline-SVG antes que agregar otra librería de iconos.
- **Cloudinary smart crop:** las imágenes pueden pedirse con `g_auto`, `g_face`, `g_faces`, `c_fill`, `c_thumb` y otros modos. Útil cuando el rediseño quiera un ratio fijo (ej. 4:5 en cards) y necesite que el sujeto importante no se recorte. No requiere cambiar el upload, solo el render.
- **Algunos strings de marca están hardcoded:** el nombre "La Huella del Caminante" aparece literal en el hero y en el footer, no via i18n. Si el rediseño quiere tratar el nombre como logotipo o lockup gráfico, conviene tenerlo presente.

---

## 8. Pantallas que el equipo sabe que están rotas o flojas (heads-up)

Lista de problemas conocidos que el rediseño tiene que resolver. No es una lista exhaustiva — son los más visibles para el usuario hoy.

- **Cards de evento en listados:** los flyers vienen de Instagram (vertical / cuadrado), pero las cards los fuerzan a landscape. Resultado: el flyer aparece recortado por la mitad, perdiendo título y fecha. Afecta home, `/events`, `/events/past`, `/dashboard/events` y `/admin/events`.
- **Detalle de evento (`/events/<slug>`):** el hero usa la imagen del flyer recortada arriba/abajo y pierde el texto del flyer (que para muchos eventos es la única info visual). El detalle pasa a depender de los campos de texto que el creator completó, que muchas veces son mínimos.
- **Perfil de artista (`/artists/<slug>`):** mismo problema de hero recortado. La imagen de perfil suele ser vertical y el rediseño debería respetar ese ratio.
- **Estado vacío del dashboard del creator (`/dashboard`, `/dashboard/events`, `/dashboard/artists`):** hoy es solo `"No tienes eventos aún."` / `"No tienes artistas aún."`. No hay onboarding, ni ilustración, ni guía de primeros pasos. El primer login después de aprobada la solicitud aterriza en una pantalla muerta.
- **Flujo "Crear evento" como CTA principal del dashboard:** es el camino central del creator (entrar → crear primer artista → crear primer evento). El rediseño debe asumir que este flujo funciona end-to-end y diseñar pensando en optimizarlo (jerarquía clara del CTA, onboarding empty-state que guíe al primer evento, feedback de éxito post-creación). Cualquier defecto técnico existente en este flujo va a ser parcheado por el equipo antes del lanzamiento del rediseño.
- **Filtro por género (`/events`, home):** es un `select` plano sin estado visual claro de "filtro aplicado". Cuando hay pocos eventos por género el listado queda casi vacío sin explicar por qué.
- **Header en mobile:** existe pero no hay menú hamburguesa propio; en pantallas chicas los links se apretujan. Falta un menú móvil bien resuelto.
- **Sign-in / Sign-up:** páginas funcionales pero "desnudas" — sin contexto visual del producto, ningún elemento que refuerce identidad. Es la primera impresión para usuarios que llegan por OAuth.
- **Página de "Solicitud enviada" (`/apply`):** después de mandar el formulario se muestra un mensaje plano de éxito. No hay próximos pasos visibles (qué esperar, cuándo, dónde mirar el resultado). Es el último touchpoint del journey de aplicación y queda sin remate.
- **Listados de eventos pasados (`/events/past`):** hoy comparten exactamente la misma card que los próximos eventos. No hay diferenciación visual de "esto ya pasó" — solo el orden cronológico, que un usuario casual no infiere.
- **Footer:** existe (links, redes, copyright "Hecho con ♥ en Berlín by Thusspokedata"), pero es simple. Si el rediseño quiere darle más peso (newsletter, links a ciudades, AGB/Impressum una vez que existan), tiene espacio para hacerlo.
- **Home: jerarquía competida entre 4 bloques:** el hero, "Próximos eventos", "Explora por género" y los dos carruseles de artistas (próximos / pasados) compiten por atención al mismo nivel visual. El usuario que llega buscando "qué se viene este fin de semana" tiene que scrollear bastante para llegar a un evento concreto.
- **Detalle de evento — fechas múltiples:** un evento puede tener varias fechas (`EventDate[]`). Hoy se muestran como lista plana sin distinguir "próxima" vs "ya pasadas" cuando algunas fechas ya quedaron atrás (típico de un show con repeticiones). Conviene un patrón claro de "próxima fecha" vs "histórico".
- **Géneros como tags libres:** `Artist.genres` y `Event.genre` son strings libres (no enum), así que aparecen variantes ("Cumbia", "cumbia", "Cumbia villera") en el dataset real. Cualquier diseño que use chips/tags de género debe tolerar inconsistencia hasta que se normalice en producto.

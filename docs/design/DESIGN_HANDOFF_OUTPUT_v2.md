# DESIGN_HANDOFF_OUTPUT_v2.md
## Auth + estados de cuenta — paquete de entrega complementario (final)

Complemento de `DESIGN_HANDOFF_OUTPUT.md` v1.1. Mismos tokens, mismos patrones, sin sistema nuevo. Cubre las 4 pantallas que quedaron afuera de v1, con los 3 ajustes del segundo pase incorporados:

- Sin checkbox "Mantener sesión" en sign-in (Better Auth maneja la sesión).
- Sin nombres hardcoded en el copy del timeline ("Un humano mira tu perfil").
- Mapeo explícito de los dos destinos del footer del sign-in.

> Pantallas: sign-in · sign-up · solicitud enviada · user-pending · user-blocked. Listadas en la sección **07** del canvas.

---

## 1. Pantallas

### 1.1 Sign-in

Layout en dos columnas (7:5) en desktop, single-column en mobile.

- **Izquierda:** lockup arriba, formulario centrado en columna estrecha (`max-width: 440px`). Orden:
  1. Botón Google ("Continuar con Google")
  2. Divider "O CON EMAIL"
  3. Email
  4. Contraseña
  5. Link "¿Olvidaste tu contraseña?" alineado a la derecha (sin checkbox "Mantener sesión" — la sesión la maneja Better Auth de forma transparente)
  6. CTA primario sangre "Iniciar sesión →"
- **Derecha:** panel atmosférico con el manifiesto editorial:
  > *"Hecho por uno **de ustedes**. La Huella es un portal independiente. No vendemos entradas, no tomamos comisión. Solo mostramos lo que está sonando."*
  + 3 thumbnails 1:1 + tira de metadata ("12 SHOWS PRÓXIMOS · 3 CIUDADES").

**Footer del form — dos destinos distintos:**

> *"¿Primera vez por acá? **Crear cuenta** o **aplicá como artista** →"*

| Link | Ruta | Resultado |
|---|---|---|
| **Crear cuenta** | `/[locale]/(auth)/sign-up` | Usuario nuevo con rol `user` (público). Lo único que habilita es guardar eventos / hacer follow de artistas (post-MVP). |
| **Aplicá como artista** | `/[locale]/(public)/apply` | Form público de solicitud. Tras aprobación del admin, el rol pasa a `creator`. |

Son **dos rutas reales distintas, no variantes del mismo form**. El dev no debe colapsarlas en una sola pantalla.

**Mobile:** la columna derecha desaparece; el formulario queda full-bleed con padding generoso.

### 1.2 Sign-up

Mismo shell que sign-in, con el panel derecho cambiado: ahora explicita los **3 pasos** (creás cuenta → aplicás → publicás) con tiempos estimados:

| # | Paso | Tiempo |
|---|---|---|
| 01 | Creás la cuenta | Ahora mismo · 1 min. |
| 02 | Aplicás como creator | Nosotros revisamos · 1-2 días. |
| 03 | Publicás tu primer evento | Cuando quieras · 3 min. |

Aclarar "tomamos 1-2 días" donde lo va a ver primero — reduce ansiedad futura en `user-pending`.

Campos: nombre, email, password (con hint de fortaleza), checkbox de términos.

### 1.3 Solicitud enviada

Es el **último touchpoint del journey de aplicación** y hoy es texto plano. Lo rediseñé con peso editorial:

- **Eyebrow pill dorado** ("✓ SOLICITUD RECIBIDA") — la confirmación viva.
- **Display h1** con cierre afectivo: *"Recibimos tu solicitud, **caminante**."* Caminante en sangre + itálica. Es el momento para ser cálido.
- **Right card "QUÉ SIGUE":** timeline visual de 4 estados con timestamps:

  | Estado | Subtítulo | Cuándo |
  |---|---|---|
  | ✓ Recibida | Hace un momento | `{now}` |
  | ◐ En revisión | **Un humano mira tu perfil** | ~ 1-2 días |
  | ○ Aprobada · email | Te llega un mail con el link a tu panel | Cuando aprobemos |
  | ○ Publicás | Subís tu primer evento | Cuando estés |

  El paso "En revisión" está visualmente activo (dot dorado). El copy es **deliberadamente genérico** ("un humano") — sin nombres hardcoded.

- **CTA secundaria:** "Ver agenda mientras tanto" (mantiene al usuario en el sitio público mientras espera).
- **Footnote:** call-out a Instagram para que no se desconecte del proyecto.

### 1.4 User pending

Aparece cuando el usuario hace login y su cuenta sigue en revisión. Distinto de "solicitud enviada" — esto es para los logins recurrentes que vuelven a ver el estado.

- **Bombilla con glow** (radial gradient + glow del color dorado) — metáfora visual de la peña.
- **Eyebrow dorado** "CUENTA EN REVISIÓN", h1 *"Tu solicitud está prendida y se está horneando."*
- **Fecha de aplicación visible** ("Aplicaste como creator el **{date}**").
- **Escape hatch:** *"¿Pasaron más de 3 días y no tuviste respuesta? Algo se rompió. Escribinos a info@lahuelladelcaminante.de y lo resolvemos."* → reduce ansiedad sin saturar de info.

### 1.5 User blocked

Mismo layout que pending pero rojo y sin animación (es estado terminal).

- Eyebrow `sangre` "ACCESO SUSPENDIDO" — directo, sin eufemismos.
- H1 explícita: *"Tu cuenta no puede acceder al panel."*
- **Lista clara de "QUÉ SIGUE FUNCIONANDO":**
  - Eventos públicos del sitio.
  - Perfiles de artistas.
  - NO publicar, editar ni acceder al panel creator.

  Es lo que distingue "bloqueado del panel" de "bloqueado del sitio entero". Sin esta lista el usuario asume lo peor.
- **CTA primario:** "Escribirnos →". Es la única acción que puede tomar para resolver.

---

## 2. Tokens nuevos

**Ninguno.** Estas pantallas usan el sistema cerrado en v1.1.

---

## 3. Componentes

### 3.1 Nuevos a crear

```
src/components/auth/AuthShell.tsx           — layout 2-col (form izq, panel atmosférico der)
                                              acepta `hero` prop para customizar la columna derecha
src/components/auth/AuthField.tsx           — label + input + hint estilizado a los tokens
src/components/auth/OAuthButton.tsx         — botón "Continuar con [provider]"
src/components/auth/OrDivider.tsx           — divisor "O CON EMAIL" entre OAuth y form
src/components/auth/StatusHero.tsx          — bombilla glow / sello / icono central reutilizable
                                              variantes: 'pending' (dorado + glow) | 'blocked' (sangre + dash)
src/components/auth/StepTimeline.tsx        — timeline vertical de 4 estados con dots + connector
                                              usado en "Solicitud enviada"; reusable si lo necesitamos
                                              en otra parte del journey
```

### 3.2 Existentes a modificar

```
src/components/layout/Header.tsx  — agregar variante "auth" (oculta nav, deja solo BrandLockup)
                                    O bien: que las páginas /sign-in y /sign-up usen su propio
                                    layout root sin Header. Decisión del dev.
```

### 3.3 Glyph de Google

La "G" de Google la dibujamos como **letra en monospace** dentro de un círculo del color del foreground. No usamos la "G" cuatricromática oficial — evita issues de licencia y queda alineada al sistema. Si Better Auth requiere el glyph oficial por TOS, reemplazar `<GoogleGlyph />` por el SVG provisto sin tocar el resto.

---

## 4. Mapeo pantallas → rutas

| Pantalla | Ruta del repo |
|---|---|
| Sign-in | `src/app/[locale]/(auth)/sign-in/page.tsx` |
| Sign-up | `src/app/[locale]/(auth)/sign-up/page.tsx` |
| Forgot password | `src/app/[locale]/(auth)/forgot-password/page.tsx` *(reusa AuthShell + AuthField; trivial)* |
| Form `/apply` | `src/app/[locale]/(public)/apply/page.tsx` |
| Solicitud enviada (estado post-submit) | Mismo archivo que `/apply` con `useState` / server state, **O** ruta separada `/apply/sent`. Decisión del dev en implementación, no necesita ser explícita en el handoff. |
| User pending | `src/app/[locale]/user-pending/page.tsx` |
| User blocked | `src/app/[locale]/user-blocked/page.tsx` |

---

## 5. i18n — claves de copy

Para que las tres versiones funcionen sin hardcode, se proponen estas keys en `messages/{es,en,de}.json`:

```jsonc
{
  "auth": {
    "signIn": {
      "eyebrow": "BIENVENIDO DE VUELTA",
      "title": "Iniciá sesión.",
      "subtitle": "¿Sos público? No necesitás cuenta para ver shows. Esto es para artistas y organizadores.",
      "continueWith": "Continuar con {provider}",
      "orEmail": "O CON EMAIL",
      "email": "Email",
      "password": "Contraseña",
      "forgot": "¿Olvidaste tu contraseña?",
      "submit": "Iniciar sesión →",
      "footer": "¿Primera vez por acá? <createAccount>Crear cuenta</createAccount> o <applyAsArtist>aplicá como artista →</applyAsArtist>"
    },
    "signUp": {
      "eyebrow": "CREAR CUENTA",
      "title": "Empezá a publicar.",
      "subtitle": "Crear cuenta es el primer paso. Después aplicás como creator y revisamos tu perfil — suele tomar 1-2 días.",
      "name": "Nombre",
      "nameHint": "Cómo te llamamos",
      "passwordHint": "Mezclá mayúsculas, números y un símbolo.",
      "acceptTerms": "Acepto los <terms>términos</terms> y la <privacy>política de privacidad</privacy>.",
      "submit": "Crear cuenta →",
      "hasAccount": "¿Ya tenés cuenta?",
      "signInLink": "Iniciar sesión"
    }
  },
  "apply": {
    "submitted": {
      "badge": "✓ SOLICITUD RECIBIDA",
      "title": "Recibimos tu solicitud, <accent>caminante</accent>.",
      "body": "Un humano la mira en los próximos 1-2 días. Si todo da, te avisamos por mail y desbloqueamos tu panel para que publiques.",
      "ctaPrimary": "Ver agenda mientras tanto →",
      "ctaSecondary": "Volver al inicio",
      "timeline": {
        "title": "QUÉ SIGUE",
        "received": "Recibida",
        "receivedSub": "Hace un momento",
        "reviewing": "En revisión",
        "reviewingSub": "Un humano mira tu perfil",
        "approval": "Aprobada · email",
        "approvalSub": "Te llega un mail con el link a tu panel",
        "publishing": "Publicás",
        "publishingSub": "Subís tu primer evento"
      },
      "instagramHint": "Mientras tanto: seguinos en <ig>Instagram @lahuelladelcaminante</ig> — ahí avisamos cada vez que aprobamos un creator nuevo."
    }
  },
  "account": {
    "pending": {
      "eyebrow": "CUENTA EN REVISIÓN",
      "title": "Tu solicitud está prendida y se está horneando.",
      "body": "Aplicaste como creator el <strong>{date}</strong>. La revisamos en orden de llegada — solemos tardar 1-2 días hábiles. Te avisamos por mail apenas se apruebe.",
      "ctaPrimary": "Ver agenda pública",
      "ctaSecondary": "Cerrar sesión",
      "escapeHatch": "¿Pasaron más de 3 días y no tuviste respuesta? Algo se rompió. Escribinos a <email>info@lahuelladelcaminante.de</email> y lo resolvemos."
    },
    "blocked": {
      "eyebrow": "ACCESO SUSPENDIDO",
      "title": "Tu cuenta no puede acceder al panel.",
      "body": "Esto puede pasar por varias razones — incumplimiento de las normas de la comunidad, contenido reportado, o un error nuestro. Si creés que es un error, hablamos.",
      "stillWorksTitle": "QUÉ SIGUE FUNCIONANDO",
      "stillWorks": [
        "Podés ver todos los eventos públicos del sitio.",
        "Podés seguir consultando perfiles de artistas.",
        "No podés publicar, editar ni acceder al panel creator."
      ],
      "ctaContact": "Escribirnos →",
      "ctaLogout": "Cerrar sesión"
    }
  }
}
```

Los wrappers `<accent>…</accent>`, `<strong>…</strong>`, `<terms>…</terms>`, `<createAccount>…</createAccount>` los resuelve **next-intl rich text** — esto deja envolver palabras clave en color o linkearlas sin partir la oración por idioma.

`{date}` en `account.pending.body` se interpola desde el server con el formato local correspondiente (es: `13 de mayo` / en: `May 13` / de: `13. Mai`).

---

## 6. Notas de implementación

1. **Bombilla en `UserPendingScreen`** — radial gradient + glow del color dorado vía `box-shadow`. Visualmente importante: es lo que diferencia "estás esperando" de "fracasaste". Si después se quiere añadir animación sutil (slight pulse en el glow), está bien — fuera del MVP.
2. **El sello rojo en `UserBlockedScreen`** — `—` (em-dash) dentro de un círculo grande con borde sangre. Intencionalmente austero, sin iconos de alarma ni emoji. Es estado terminal, no error técnico.
3. **`AppSubmittedScreen` no es un "exitoso pequeño con un check verde y un botón".** Es el touchpoint emocional del journey de aplicación. Por eso el h1 ocupa medio viewport y el copy es afectivo. Mantener.
4. **El timeline de "QUÉ SIGUE"** es un componente (`StepTimeline.tsx`). Si después aparece en el dashboard del creator pre-aprobación, reusarlo — no duplicar.
5. **Sin checkbox "Mantener sesión".** La sesión es transparente — Better Auth la persiste por su cuenta. Si en algún momento se quiere exponer "olvidarme en este dispositivo", ese es un setting distinto y va en perfil, no en sign-in.
6. **El copy nunca menciona admins por nombre.** "Un humano", "el equipo", "nosotros" — no "Antonio". Esto es para que la copy sobreviva cambios de equipo y reduzca presión personalizada.

---

## 7. Responsive

| Pantalla | Mobile (< 768) | Desktop |
|---|---|---|
| Sign-in / Sign-up | Single column, panel atmosférico oculto, BrandLockup arriba, form full-bleed con padding `16px` lateral | 7:5 split, ambos paneles visibles |
| Solicitud enviada | h1 a 36px, timeline card debajo en el mismo scroll, CTA primario sticky bottom | 1:1 split: hero a la izquierda, timeline card al costado |
| User pending / blocked | Hero icon arriba, copy + CTA debajo, contenido centrado, max-width 100% con padding `24px` | Misma arquitectura, max-width 560px centrado |

---

## 8. Trabajo restante después de v2

A implementar por el equipo sin diseño dedicado, siguiendo tokens + patrones de v1.1 + v2:

- Formularios de creación/edición de evento y artista (dashboard creator)
- Formulario público de `/apply` (el form mismo — la pantalla de "submitted" sí está diseñada)
- Panel admin completo (gestión de usuarios, vista global de eventos, cola de aplicaciones)
- Forgot password (reusa `AuthShell` + `AuthField` — trivial)
- Páginas legales (cuando esté redactado el contenido)

Con esto cerramos el paquete de diseño. Listos para implementación con Claude Code en PRs incrementales.

— Claude Design · 2026-05-15 · v2 (final)

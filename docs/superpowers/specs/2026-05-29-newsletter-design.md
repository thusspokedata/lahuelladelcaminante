# Newsletter — Diseño e spec

**Fecha:** 2026-05-29
**Estado:** aprobado para implementación

---

## 1. Resumen

Sistema completo de newsletter para La Huella del Caminante:
1. Formulario de suscripción (footer + página `/newsletter`) con doble opt-in
2. Email de confirmación (ES/EN/DE)
3. Digest semanal automático de eventos próximos (lunes 8AM UTC)

---

## 2. Decisiones de diseño

| Decisión | Elección | Razón |
|---|---|---|
| Opt-in | Doble (confirmación por email) | Obligatorio GDPR Alemania |
| Source of truth suscriptores | Resend Audiences | Maneja unsubscribes nativamente; sin migration Prisma |
| Tokens de confirmación | JWT firmados (NEWSLETTER_JWT_SECRET, exp 24h) | Sin tabla extra en DB |
| Idiomas | ES / EN / DE | Idioma del locale activo del visitante |
| Frecuencia digest | Semanal, lunes 8:00AM UTC | ~9-10AM Berlín según DST |
| Skip sin eventos | Sí — si 0 eventos próximos 15 días, no se envía | Evita emails vacíos |
| Máx eventos por digest | 5, ordenados por fecha más próxima | Digestible sin scroll excesivo |
| Scheduler | Trigger.dev scheduled job | Ya configurado en el proyecto |
| Anti-abuse | Honeypot + rate limit IP (mismo patrón que `/api/contact`) | Consistencia con el resto del proyecto |

---

## 3. Variables de entorno nuevas

```env
# Una audiencia por idioma — evita depender de custom fields en Resend
# (la API de Contacts no garantiza campos arbitrarios en todos los planes)
RESEND_AUDIENCE_ID_ES=    # ID audiencia español
RESEND_AUDIENCE_ID_EN=    # ID audiencia inglés
RESEND_AUDIENCE_ID_DE=    # ID audiencia alemán
NEWSLETTER_JWT_SECRET=    # Secret para firmar tokens de confirmación (min 32 chars)
```

Todas deben agregarse a `.env.local`, `.env.local.example`, y a los secrets del VPS.

**Por qué 3 audiencias:** Resend Contacts no expone campos personalizados estables en todos los planes. Audiencias separadas por idioma eliminan esta dependencia y simplifican el fetch del digest (una audiencia = un idioma, sin filtrado post-fetch).

---

## 4. Flujo de suscripción

```
Usuario ingresa email en Footer o /newsletter
  │
  ▼
POST /api/newsletter/subscribe
  ├─ isAllowedOrigin()          — mismo check que /api/contact
  ├─ checkRateLimit(ip)         — mismo lib que /api/contact
  ├─ Zod: { email, language, website (honeypot) }
  ├─ honeypot trip → fakeOk()
  ├─ resend.contacts.create({ audienceId, email, unsubscribed: true,
  │    firstName: "", lastName: "",
  │    fields: { language } })  — unsubscribed=true hasta confirmar
  ├─ JWT firmado: { email, language, iat, exp: +24h }
  └─ sendEmail() → email de confirmación con link
       └─ GET /api/newsletter/confirm?token=xxx
            ├─ jwt.verify(token, NEWSLETTER_JWT_SECRET)
            ├─ resend.contacts.update({ unsubscribed: false })
            └─ redirect /[locale]/newsletter?confirmed=true
```

**Casos edge:**
- Email ya suscripto y confirmado → devuelve 200 sin reenviar (idempotente)
- Token expirado (>24h) → redirect a `/[locale]/newsletter?error=token_expired`, página muestra mensaje i18n
- Email ya existe en Resend pero unconfirmed → reenvía nuevo token (re-subscribe)

---

## 5. Archivos nuevos / modificados

### Nuevos

| Archivo | Descripción |
|---|---|
| `src/app/api/newsletter/subscribe/route.ts` | POST — valida, crea contacto en Resend, envía confirmación |
| `src/app/api/newsletter/confirm/route.ts` | GET — verifica JWT, activa suscripción, redirige |
| `src/app/[locale]/(public)/newsletter/page.tsx` | Página pública con form + estado confirmed |
| `src/components/newsletter/NewsletterForm.tsx` | Client component — form reutilizable (footer + página) |
| `src/lib/validators/newsletter.ts` | Zod schema: `{ email, language, website }` |
| `src/lib/newsletter-jwt.ts` | sign/verify helpers usando NEWSLETTER_JWT_SECRET |
| `src/lib/newsletter-emails.ts` | HTML builders para email de confirmación y digest (ES/EN/DE) |
| `src/trigger/newsletter-digest.ts` | Trigger.dev scheduled job (lunes 8AM UTC) |

### Modificados

| Archivo | Cambio |
|---|---|
| `src/components/layout/Footer.tsx` | Reemplaza FooterLink placeholder por `<NewsletterForm />` inline |
| `src/lib/trigger.ts` | Agrega `sendNewsletterDigest()` helper de envío |
| `.env.local.example` | Agrega `RESEND_AUDIENCE_ID` y `NEWSLETTER_JWT_SECRET` |
| `src/messages/es.json` | Claves `newsletter.*` |
| `src/messages/en.json` | Claves `newsletter.*` |
| `src/messages/de.json` | Claves `newsletter.*` |

---

## 6. NewsletterForm (client component)

Props:
```ts
interface NewsletterFormProps {
  locale: string          // "es" | "en" | "de" — pre-fill hidden field
  variant: "footer" | "page"  // footer: compacto inline; page: con más espacio
}
```

Campos:
- `email` — input visible
- `language` — hidden, valor = `locale` (si locale="en" → "en")
- `website` — honeypot, hidden via CSS (no `display:none` — mismo patrón `/api/contact`)

Estados UI:
- `idle` — form visible
- `loading` — botón disabled + spinner
- `success` — "Revisá tu email para confirmar tu suscripción"
- `error` — mensaje de error genérico

Consentimiento GDPR: en variant `"page"`, checkbox obligatorio antes de submit con texto "Acepto recibir el newsletter semanal de La Huella del Caminante. Puedo darme de baja en cualquier momento." Link a `/datenschutz`. En variant `"footer"` el consentimiento es implícito en el botón (texto del botón incluye la intención).

---

## 7. Emails

Todos los emails siguen el estilo visual del proyecto: fondo `#0e0407`, header con gradiente brand (sangre), tipografía system stack, borde sutil en las tarjetas.

### Email A — Confirmación de suscripción

```
┌─────────────────────────────────────┐
│  [Header gradiente sangre]          │
│  Logo + "La Huella del Caminante"   │
│  "Confirmá tu suscripción"          │
├─────────────────────────────────────┤
│  Hola,                              │
│  Hacé click para confirmar que      │
│  querés recibir el newsletter       │
│  semanal de eventos latinos en      │
│  Berlín.                            │
│                                     │
│  [CTA: Confirmar suscripción →]     │
│                                     │
│  (El link expira en 24 horas)       │
│  Si no pediste esto, ignorá         │
│  este email.                        │
├─────────────────────────────────────┤
│  Footer: lahuelladelcaminante.de    │
└─────────────────────────────────────┘
```

Enviado en el idioma del suscriptor (ES/EN/DE).

### Email B — Digest semanal

```
┌─────────────────────────────────────┐
│  [Header gradiente sangre]          │
│  Logo + "Eventos de la semana"      │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐    │
│  │ [thumbnail 80×80]  Título   │    │
│  │                   Fecha     │    │
│  │                   Venue     │    │
│  │              Ver evento → │    │
│  └─────────────────────────────┘    │
│  (repetido máx 5 veces)             │
│                                     │
│  [Ver todos los eventos →]          │
│  (solo si hay más de 5)             │
├─────────────────────────────────────┤
│  Footer:                            │
│  lahuelladelcaminante.de            │
│  [Cancelar suscripción]             │
│  ← {{{RESEND_UNSUBSCRIBE_URL}}}     │
└─────────────────────────────────────┘
```

Enviado en 3 pasadas (ES/EN/DE) según `language` del contacto en Resend. Si ningún suscriptor tiene un idioma dado, esa pasada se saltea.

---

## 8. Trigger.dev scheduled job

```ts
// src/trigger/newsletter-digest.ts
// schedule: "0 8 * * 1"  (lunes 8AM UTC)

1. Fetch eventos: próximos 15 días, isActive=true, isDeleted=false, ordenados por fecha
2. Si events.length === 0 → log "no_events_skipping" → exit
3. Tomar primeros 5 (o todos si ≤5), preparar hasMore = total > 5
4. Fetch contactos de Resend Audience (paginado si necesario)
5. Filtrar: unsubscribed=false
6. Agrupar por language: { es: [...], en: [...], de: [...] }
7. Por cada grupo con length > 0:
   a. Generar HTML del digest en ese idioma
   b. resend.emails.send({ to: emails[], ... })  — o batch si Resend lo soporta
8. Log resultado: { sent: { es: N, en: N, de: N }, events: M }
```

---

## 9. i18n — claves nuevas

Namespace `newsletter` en los 3 archivos de mensajes. **Solo cubre strings de UI** (formulario, página). El contenido de los emails es HTML hardcodeado en funciones TypeScript separadas (mismo patrón que los emails existentes en `src/lib/trigger.ts`), no se carga desde next-intl porque los jobs de Trigger.dev corren fuera del contexto de request.

```json
{
  "newsletter": {
    "pageTitle": "...",
    "pageDescription": "...",
    "formEmailPlaceholder": "...",
    "formSubmit": "...",
    "formConsent": "...",
    "formConsentLink": "...",
    "successMessage": "...",
    "errorMessage": "...",
    "confirmedBanner": "...",
    "tokenExpiredMessage": "...",
    "footerLabel": "..."
  }
}
```

El contenido de los emails (subject, body, CTA) vive en `src/lib/newsletter-emails.ts` como funciones `buildConfirmationEmail(lang, confirmUrl)` y `buildDigestEmail(lang, events)` con los textos hardcodeados en los 3 idiomas.

---

## 10. Anti-abuse

| Vector | Defensa |
|---|---|
| Bot submission | Honeypot field `website` → fakeOk() |
| Flood desde IP | `checkRateLimit(ip)` — mismo que `/api/contact` |
| Cross-origin | `isAllowedOrigin()` — mismo que `/api/contact` |
| Token replay | JWT exp 24h; Resend update es idempotente |
| Suscribir email ajeno | Doble opt-in — sin confirmación, `unsubscribed: true` |

---

## 11. Fuera de scope (esta iteración)

- Panel de admin para ver suscriptores (se ve desde Resend Dashboard)
- Editar idioma de suscripción post-confirmación
- Historial de digests enviados
- Segmentación por ciudad u otros criterios

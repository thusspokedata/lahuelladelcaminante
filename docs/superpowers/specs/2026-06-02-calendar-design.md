# Calendario de Eventos — Diseño e spec

**Fecha:** 2026-06-02
**Estado:** aprobado para implementación

---

## 1. Resumen

Página pública `/events/calendar` con vista mensual de todos los eventos. Muestra dos tipos de entradas: eventos oficiales de La Huella (del modelo `Event` existente) y entradas de escena cargadas por el admin desde Instagram u otras fuentes. El admin carga las entradas de escena desde el dashboard. Cualquier visitante puede ver el calendario.

---

## 2. Casos de uso

1. **Visitante público** — ve qué pasa en la escena latina de Berlín este mes, puede navegar a meses anteriores/futuros.
2. **Creator planificando un evento** — antes de crear, abre el calendario para ver si la fecha que eligió ya tiene otro evento parecido.
3. **Admin curando la escena** — carga eventos de Instagram/otras fuentes sin crear una página de evento completa.

---

## 3. Decisiones de diseño

| Decisión | Elección | Razón |
|---|---|---|
| Arquitectura | Opción A: Server Component inicial + Client Component para navegación | Carga rápida del mes actual, navegación sin recarga |
| Fetch por mes | `GET /api/calendar?month=YYYY-MM` | Evita traer 12 meses de datos innecesarios |
| Tipos de entrada | `Event` (oficial) + `SceneEvent` (admin) | Reutiliza modelo existente, agrega modelo liviano |
| Visual oficial | Pill rojo `#c0392b` sólido | Consistente con brand del sitio |
| Visual escena | Pill ámbar `#e5a93b` translúcido | Usa color ochre del logo, claramente diferenciado |
| Click oficial desktop | Popup con nombre, fecha, venue → "Ver evento →" | UX más fluida que navegar directo |
| Click escena desktop | Popup con nombre, venue, link externo opcional | Sin página propia — el popup es todo |
| Click mobile | Navega directo (oficial) / abre popup nativo (escena) | Mobile no tiene hover, popup sería torpe |
| Colapso | 3+ eventos en un día → "+N más" | Evita desborde visual en celdas |
| Admin ingreso | Form en `/dashboard/calendar` | Lo más simple — sin cambiar el flujo del calendario |
| Hoy | Número en círculo blanco | Referencia visual rápida |

---

## 4. Modelo de datos nuevo

```prisma
model SceneEvent {
  id          String   @id @default(cuid())
  date        DateTime @db.Date
  title       String
  venue       String?
  externalUrl String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

Sin relación a `User` — cualquier admin puede crear/borrar. Sin soft delete — si se borró, se borró.

---

## 5. API

### `GET /api/calendar?month=YYYY-MM`

Devuelve todos los eventos y entradas de escena del mes dado, incluyendo los días necesarios para completar la grilla (desde el primer lunes visible hasta el último domingo visible — puede incluir hasta 6 días del mes anterior y 6 del siguiente).

**Response shape:**
```ts
{
  data: {
    entries: CalendarEntry[]
  }
}

interface CalendarEntry {
  id: string
  type: "event" | "scene"
  date: string        // "2026-07-11"
  title: string
  venue: string | null
  time: string | null // "21:00" — solo eventos oficiales
  slug: string | null // solo eventos oficiales
  externalUrl: string | null // solo entradas de escena
}
```

El endpoint no requiere auth — es público.

---

## 6. Archivos nuevos / modificados

### Nuevos

| Archivo | Descripción |
|---|---|
| `prisma/migrations/YYYYMMDD_scene_events/` | Migración para el modelo `SceneEvent` |
| `src/services/calendar.ts` | `getCalendarEntries(month: string)` — fetches Event + SceneEvent |
| `src/app/api/calendar/route.ts` | GET handler — valida `month` param, llama al service |
| `src/app/[locale]/(public)/events/calendar/page.tsx` | Server Component — renderiza mes actual |
| `src/components/events/EventsCalendar.tsx` | Client Component — navegación + grilla + popups |
| `src/components/events/CalendarDayCell.tsx` | Celda individual — pills + colapso |
| `src/components/events/CalendarEventPopup.tsx` | Popup desktop para ambos tipos |
| `src/app/[locale]/(protected)/dashboard/calendar/page.tsx` | Form admin para SceneEvents |
| `src/app/api/dashboard/scene-events/route.ts` | POST / DELETE para SceneEvents (solo admin) |

### Modificados

| Archivo | Cambio |
|---|---|
| `prisma/schema.prisma` | Agrega modelo `SceneEvent` |
| `src/messages/es.json` | Claves `calendar.*` |
| `src/messages/en.json` | Claves `calendar.*` |
| `src/messages/de.json` | Claves `calendar.*` |
| `src/components/layout/Header.tsx` / nav | Agrega link "Calendario" en la navegación principal |

---

## 7. Componentes clave

### `EventsCalendar` (Client Component)

Props:
```ts
interface EventsCalendarProps {
  initialEntries: CalendarEntry[]
  initialMonth: string // "2026-07"
  locale: string
}
```

Estado interno:
- `currentMonth: string` — mes visible
- `entries: CalendarEntry[]` — entradas del mes actual
- `loading: boolean` — mientras fetches
- `popup: { entry: CalendarEntry; anchorRect: DOMRect } | null` — popup activo en desktop

Lógica:
- `prevMonth()` / `nextMonth()` — cambia `currentMonth`, fetches `/api/calendar?month=YYYY-MM`, actualiza `entries`
- Click en pill en desktop → abre popup con posición relativa al elemento
- Click en pill en mobile (`window.innerWidth < 768`) → si es evento oficial, navega a `/events/[slug]`; si es escena, abre el mismo `CalendarEventPopup` pero centrado en pantalla con overlay oscuro (no posicionado relativo al elemento)
- Click fuera del popup → cierra

### `CalendarDayCell`

Props: `{ day: number | null; entries: CalendarEntry[]; onEntryClick: (entry, rect) => void }`

Muestra:
- Número del día (blanco en círculo si es hoy)
- Pills ordenados: oficiales primero, escena después
- Si hay más de 2 pills → muestra los 2 primeros + "+N más" colapsado
- Click en "+N más" → expande todos los pills de ese día

### `CalendarEventPopup`

Posicionado con `position: fixed` relativo al `anchorRect`. Dos variantes visuales según `entry.type`:
- `"event"` → header rojo, botón "Ver evento →" que navega a `/events/[slug]`
- `"scene"` → header ámbar, badge "Otra escena", link "Ver en Instagram →" si hay `externalUrl`

Cierra con click fuera o Escape.

---

## 8. Dashboard admin — carga de SceneEvents

Página simple en `/dashboard/calendar`:
- Lista de entradas de escena existentes (tabla con fecha, título, venue, acciones)
- Form de creación: fecha (date picker), título, venue (opcional), URL externa (opcional)
- Botón de borrar por entrada
- Solo accesible para rol `admin`

---

## 9. i18n — claves nuevas

```json
{
  "calendar": {
    "pageTitle": "Calendario",
    "pageDescription": "Todos los eventos de la escena latina en Berlín",
    "navPrev": "Mes anterior",
    "navNext": "Mes siguiente",
    "today": "Hoy",
    "noEvents": "Sin eventos este mes",
    "sceneEventBadge": "Otra escena",
    "viewEvent": "Ver evento →",
    "viewSource": "Ver fuente →",
    "moreEvents": "+{count} más",
    "weekdays": {
      "mon": "Lun",
      "tue": "Mar",
      "wed": "Mié",
      "thu": "Jue",
      "fri": "Vie",
      "sat": "Sáb",
      "sun": "Dom"
    },
    "dashboard": {
      "title": "Entradas de escena",
      "addEntry": "Agregar entrada",
      "date": "Fecha",
      "titleLabel": "Título",
      "venue": "Venue (opcional)",
      "externalUrl": "Link externo (opcional)",
      "delete": "Eliminar",
      "empty": "No hay entradas de escena cargadas"
    }
  }
}
```

---

## 10. Fuera de scope (esta iteración)

- Filtro por género o tipo de evento en el calendario
- Vista semanal o de agenda
- Exportar a Google Calendar / iCal
- Notificaciones de conflicto automáticas al crear un evento desde el dashboard
- Paginación de "+N más" con modal expandido (se expande inline)

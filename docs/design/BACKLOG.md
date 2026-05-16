# Backlog — diseño y rediseño

Items deliberadamente fuera de alcance del último PR mergeado, anotados acá
para no perderlos. Cuando se decida atacarlos, se crea un PR aparte con su
propio prompt.

## Pendientes

### Pantalla de mantenimiento

**Origen:** PR 9 (estados especiales).

Cuando el sitio esté caído por deploy o tareas administrativas, mostrar una
pantalla específica en lugar de la 404 / error genéricos.

- Crear `src/app/[locale]/maintenance/page.tsx` con la pantalla.
- Configurar `middleware.ts` para redirigir todo el tráfico a esa ruta
  cuando una variable de entorno `MAINTENANCE_MODE=true` esté activa.
- i18n del copy en ES/EN/DE.
- Considerar bypass por IP (admin) para que el dev pueda seguir trabajando
  durante el mantenimiento.

### `global-not-found.js` (Next 15.4+ / 16 experimental)

**Origen:** PR 9 (estados especiales). La doc oficial de Next sugiere
`global-not-found.js` cuando hay dynamic segment al top (`[locale]/`),
que es exactamente este caso. Hoy usamos `[locale]/not-found.tsx` que
captura los 404 con locale válido. Migrar cuando salga estable.

### `EmptyStateWithSuggestions`

**Origen:** PR 6 mencionaba el componente como "implementado", pero no
quedó en el repo. PR 9 (que iba a reusarlo) detectó la ausencia.

Componente con visual rico de "no se encontraron resultados" + chips de
sugerencias (géneros próximos, ciudades activas, etc.). Pensado para los
listados `/events` y `/artists` cuando los filtros no devuelven nada.

- `src/components/ui/EmptyStateWithSuggestions.tsx`.
- API: `{ title, body, suggestions: Array<{ label, href }> }`.
- i18n para los strings.
- Consumir desde `/events` y `/artists` cuando el array filtrado quede en 0.

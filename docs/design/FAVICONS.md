# Favicons — generación y mantenimiento

Esta nota cubre cómo se generan, dónde viven y cómo regenerar los
binarios de favicon del sitio.

## Archivos

| Archivo | Tamaño | Formato | Para qué |
|---|---|---|---|
| `src/app/favicon.ico` | multi-resolution (16/32/48) | ICO | Browsers viejos, bookmarks, fallback universal |
| `src/app/icon.png` | 512×512 | PNG RGBA | Icon canónico moderno (retina, PWA install prompts) |
| `src/app/apple-icon.png` | 180×180 | PNG RGBA | iOS Safari "Add to home screen" |

Next.js App Router los recoge automáticamente desde `src/app/` y emite
los `<link rel="icon">` correspondientes en el `<head>` sin necesidad
de editar `metadata.icons` ni el layout root. Si alguna vez aparece
ahí una `metadata.icons` apuntando a otros paths, eliminarla — gana
la inferencia de App Router.

**Importante**: los binarios viven en `src/app/`, **no** en
`src/app/[locale]/`. La inferencia de iconos es por root del segmento
`app`; si se mueven al subsegmento de locale, dejan de emitirse para
la página raíz `/` y para rutas no-localizadas.

## Fuentes (setup híbrido)

Los binarios se generan a partir de **dos fuentes distintas** según el
tamaño de output, deliberadamente:

| Output | Fuente | Por qué |
|---|---|---|
| `icon.png` (512×512) | `public/brand-mark.png` | El logo completo (12 figuras + huella ochre) lee perfecto a 180-512px |
| `apple-icon.png` (180×180) | `public/brand-mark.png` | Mismo — iOS home screen tiene tamaño suficiente |
| `favicon.ico` (16/32/48) | `scripts/favicon-source.svg` | Las 12 figuras del logo completo se hacen blob ilegible a 16px; el SVG simplificado (huella estilizada sobre rect sangre) mantiene la identidad hasta el favicon de pestaña |

Esto **no es un fallback** — es diseño deliberado. Cualquier logo con
más de ~5 elementos visuales necesita una versión simplificada para
los tamaños chicos del browser tab.

### Si la marca cambia

Hay que actualizar **dos cosas**:

1. **El logo grande** — `public/brand-mark.png` (o el archivo que apunte
   `SOURCE_LARGE` en `scripts/generate-favicons.ts`). Lo consume el
   BrandMark del header y los PNGs grandes del favicon.

2. **El símbolo simplificado** — `scripts/favicon-source.svg` (mantiene
   los `<circle>` puros del trazado simplificado de huella, fills
   hardcoded sangre + cream porque favicons son assets estáticos sin
   `currentColor`). Lo consume solo el ICO multi-resolution.

Si ambos están desalineados (logo grande dice una cosa, favicon de
browser dice otra), la coherencia de marca se rompe — re-generá los
dos juntos cuando hagas un cambio mayor.

## Regeneración

```bash
npm run favicons
```

Esto corre `scripts/generate-favicons.ts`, que:

1. Lee `public/brand-mark.png` (logo completo) y
   `scripts/favicon-source.svg` (símbolo simplificado).
2. Genera con `sharp`:
   - `icon.png` 512 y `apple-icon.png` 180 desde el logo completo.
   - PNGs intermedios 16/32/48 desde el SVG simplificado.
3. Combina los 3 chicos en un ICO multi-resolution con `png-to-ico`.
4. Escribe los 3 archivos finales a `src/app/`.

Los binarios resultantes están **versionados al repo** (no se regeneran
en CI/deploy). Cuando regeneres, committeá los cambios para que el sitio
deployado los sirva.

## DevDependencies

El script depende de tres paquetes que viven en `devDependencies` (NO
en `dependencies`):

- `sharp` — resize SVG → PNG con renderer libvips.
- `png-to-ico` — combina PNGs en ICO multi-resolution.
- `tsx` — corre TypeScript directo desde Node (sin tsc previo).

El VPS de producción **nunca corre el script** — el build de Next se
hace local en la MacBook del dev y se rsynca el output (ver
`deploy.sh`). Por eso `sharp` (que pesa por sus binarios nativos
libvips) no afecta el bundle ni el runtime de producción.

## Cuándo regenerar

- La marca cambia (SVG nuevo de Claude Design).
- Cambian los tokens `--color-brand` o `--color-on-brand` en
  `src/app/globals.css` (el SVG fuente los hardcodea; ver comentario
  al tope del SVG).
- Querés ajustar tamaños o redondeos.
- Querés agregar otro formato (ej. `manifest-icon-192.png` para
  Android PWA — hoy no se genera porque el sitio no tiene
  `manifest.webmanifest`; Android Chrome cae al `apple-icon` o al
  `icon.png` 512. Cuando se agregue PWA, regenerar incluyendo 192).

## Especificaciones visuales

- **Fondo**: sangre `#D43029` (= `--color-brand` del sistema). Llena
  todo el cuadrado, NO transparente.
- **Foreground**: huella en `#FFE6E3` (= `--color-on-brand` del
  sistema), centrada con padding cómodo.
- **Esquinas**: rect del SVG fuente tiene `rx="2"` sobre viewBox 16 —
  ~12% del lado, redondeo sutil. iOS aplica su propio redondeo encima
  para el apple-icon (esto es solo seguro para que también se vea bien
  en los demás clientes).
- **Sin transparencias** en el favicon.ico (browsers viejos no las
  respetan).

## Troubleshooting

**El script tira "Cannot find module 'sharp'"**: corré `npm install`
para asegurarte que las devDeps están instaladas. Si seguís en pnpm,
`pnpm install` también funciona, pero recordá que el lockfile canónico
del repo es `package-lock.json`.

**Los binarios cambian de tamaño entre runs**: `sharp` produce output
determinístico para el mismo input, así que tamaño debería ser estable.
Si cambia mucho, probablemente cambió el SVG fuente.

**El favicon nuevo no aparece en el browser**: hard reload (Cmd+Shift+R)
o vaciar caché — los browsers cachean favicons agresivamente. En
producción puede tardar más en propagarse por CDN si hay uno delante.

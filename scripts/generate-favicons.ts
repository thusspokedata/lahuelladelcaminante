/**
 * Genera los binarios de favicon a partir de DOS fuentes distintas
 * (setup híbrido por legibilidad a tamaño chico).
 *
 * Outputs (todos en `src/app/`, donde Next.js App Router los recoge
 * automáticamente y emite los `<link rel="icon">` correspondientes):
 *  - `favicon.ico` — multi-resolution 16/32/48, para browsers viejos.
 *  - `icon.png` — 512×512, ícono canónico moderno.
 *  - `apple-icon.png` — 180×180, iOS "Add to home screen".
 *
 * Fuentes:
 *  - `SOURCE_LARGE` = `public/brand-mark.png` — el logo completo con 12
 *    figuras humanas en ronda + huella ochre. Mismo asset que usa el
 *    BrandMark del header. Lee bien a 180px+ (apple-icon, icon.png).
 *  - `SOURCE_SMALL` = `scripts/favicon-source.svg` — versión SIMPLIFICADA
 *    (huella estilizada con 3 dedos sobre rect sangre redondeado). Las 12
 *    figuras del logo completo se hacen blob ilegible a 16×16; el SVG
 *    simplificado mantiene legibilidad hasta 16px para la pestaña del
 *    browser (donde el favicon más se ve). Solo se usa para el ICO.
 *
 * Esto es deliberado, no un fallback: un favicon a 16px nunca debe
 * mostrar el logo completo si el logo tiene >5 elementos.
 *
 * Uso:
 *   npm run favicons
 *
 * No corre en CI ni en deploy — solo cuando el dev quiere regenerar
 * los binarios. Los outputs se committean al repo.
 *
 * Ver `docs/design/FAVICONS.md` para más detalle.
 */

import sharp from "sharp"
import pngToIco from "png-to-ico"
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

// Paths anclados al archivo del script (NO a `process.cwd()`) — el dev
// puede correr `tsx scripts/generate-favicons.ts` desde cualquier
// directorio (raíz del repo, subdir, IDE con cwd al archivo) y siempre
// encuentra las fuentes + escribe los outputs al lugar correcto.
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(SCRIPT_DIR, "..")
const SOURCE_LARGE = join(REPO_ROOT, "public/brand-mark.png")
const SOURCE_SMALL = join(SCRIPT_DIR, "favicon-source.svg")
const APP_DIR = join(REPO_ROOT, "src/app")

/** Tamaños del multi-resolution ICO. 16/32/48 son los estándar histórico
 * (Win/Linux). 64+ se sirve desde `icon.png` que tiene mejor compresión. */
const ICO_SIZES = [16, 32, 48] as const

async function generate(): Promise<void> {
  const largeBuffer = readFileSync(SOURCE_LARGE)
  const smallBuffer = readFileSync(SOURCE_SMALL)

  // PNG 512 (icon.png) — usado por browsers modernos para favicons de
  // alta resolución (retina, install prompts de PWA, etc.). Logo completo.
  await sharp(largeBuffer)
    .resize(512, 512)
    .png()
    .toFile(join(APP_DIR, "icon.png"))

  // PNG 180 (apple-icon.png) — iOS "Add to home screen". iOS aplica su
  // propio redondeo encima del PNG (mask de la home screen), así que el
  // asset puede llegar plano-cuadrado sin redondeo propio. Logo completo.
  await sharp(largeBuffer)
    .resize(180, 180)
    .png()
    .toFile(join(APP_DIR, "apple-icon.png"))

  // PNGs intermedios para combinar en el ICO. Vienen del SVG simplificado
  // porque a 16/32/48 el logo completo es un blob ilegible. NO se escriben
  // a disco (no necesitamos los archivos sueltos), van directo a `png-to-ico`
  // que los empaqueta en el contenedor multi-resolution.
  const buffers = await Promise.all(
    ICO_SIZES.map((size) =>
      sharp(smallBuffer).resize(size, size).png().toBuffer()
    )
  )

  const icoBuffer = await pngToIco(buffers)
  writeFileSync(join(APP_DIR, "favicon.ico"), icoBuffer)

  console.log("✓ Generated favicon.ico, icon.png, apple-icon.png in src/app/")
}

generate().catch((err) => {
  console.error("✗ Favicon generation failed:", err)
  process.exit(1)
})

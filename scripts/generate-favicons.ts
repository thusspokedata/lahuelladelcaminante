/**
 * Genera los binarios de favicon a partir del SVG fuente.
 *
 * Outputs (todos en `src/app/`, donde Next.js App Router los recoge
 * automáticamente y emite los `<link rel="icon">` correspondientes):
 *  - `favicon.ico` — multi-resolution 16/32/48, para browsers viejos.
 *  - `icon.png` — 512×512, ícono canónico moderno.
 *  - `apple-icon.png` — 180×180, iOS "Add to home screen".
 *
 * Fuente: `scripts/favicon-source.svg` (3 dedos, viewBox 16, con rect
 * sangre + foreground crema hardcoded — no usa `currentColor` porque
 * el favicon es asset estático sin contexto de color heredado).
 *
 * Por qué un SVG fuente distinto al del BrandMark:
 *  - BrandMark renderiza a 24-72px (5 dedos leen bien).
 *  - Favicon renderiza a 16-48px (5 dedos se manchan en un blob).
 *  - Versión simplificada con 3 dedos + circles puros mantiene legible
 *    el "esto es un pie" hasta 16×16. El rect sangre + redondeo viven
 *    en el SVG fuente para que el ICO/PNG nazcan con el branding listo.
 *
 * Uso:
 *   pnpm run favicons
 *
 * No corre en CI ni en deploy — solo cuando el dev quiere regenerar
 * los binarios. Los outputs se committean al repo.
 *
 * Ver `docs/design/FAVICONS.md` para más detalle.
 */

import sharp from "sharp"
import pngToIco from "png-to-ico"
import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const SOURCE_SVG = join(process.cwd(), "scripts/favicon-source.svg")
const APP_DIR = join(process.cwd(), "src/app")

/** Tamaños del multi-resolution ICO. 16/32/48 son los estándar histórico
 * (Win/Linux). 64+ se sirve desde `icon.png` que tiene mejor compresión. */
const ICO_SIZES = [16, 32, 48] as const

async function generate(): Promise<void> {
  const svgBuffer = readFileSync(SOURCE_SVG)

  // PNG 512 (icon.png) — usado por browsers modernos para favicons de
  // alta resolución (retina, install prompts de PWA, etc.).
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(join(APP_DIR, "icon.png"))

  // PNG 180 (apple-icon.png) — iOS "Add to home screen". iOS aplica su
  // propio redondeo, así que el rect del SVG ya redondeado es para los
  // demás clientes (no rompe iOS, solo es redundante allá).
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(join(APP_DIR, "apple-icon.png"))

  // PNGs intermedios para combinar en el ICO. NO se escriben a disco
  // (no necesitamos los archivos sueltos), van directo a `png-to-ico`
  // que los empaqueta en el contenedor multi-resolution.
  const buffers = await Promise.all(
    ICO_SIZES.map((size) =>
      sharp(svgBuffer).resize(size, size).png().toBuffer()
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

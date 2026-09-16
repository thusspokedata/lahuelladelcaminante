/**
 * Construye una URL pública de Cloudinary a partir de un `publicId`. La
 * usamos donde no podemos renderizar `<CldImage>` — por ejemplo, en
 * `generateMetadata` para Open Graph (`og:image`), donde Next.js necesita
 * la URL ya resuelta a la hora de generar el `<meta>` server-side.
 *
 * Aplicamos transformaciones por defecto pensadas para previews sociales:
 *  - `f_auto`  → formato óptimo según el cliente (WebP / AVIF / JPG).
 *  - `q_auto`  → calidad automática.
 *  - `w_1200,h_630,c_fill,g_auto` → ratio 1.91:1 recomendado por OG, con
 *    crop inteligente. Cloudinary intenta no cortar caras o elementos
 *    importantes. Mejor que `c_pad` acá porque las plataformas sociales
 *    sí recortan, y un letterbox previo se ve raro.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

export interface CloudinaryUrlOptions {
  /** Ancho en px. Default 1200 (OG-friendly). */
  width?: number
  /** Alto en px. Default 630 (OG-friendly). */
  height?: number
  /**
   * Crop mode. `fill` rellena el frame respetando el aspect target (default,
   * óptimo para OG). `pad` agrega bandas, mejor para flyers verticales si en
   * el futuro hace falta. */
  crop?: "fill" | "pad"
}

export function getCloudinaryUrl(
  publicId: string,
  options: CloudinaryUrlOptions = {}
): string | null {
  if (!CLOUD_NAME) return null
  const { width = 1200, height = 630, crop = "fill" } = options
  const transformations = [
    "f_auto",
    "q_auto",
    `w_${width}`,
    `h_${height}`,
    `c_${crop}`,
    crop === "fill" ? "g_auto" : null,
  ]
    .filter(Boolean)
    .join(",")
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformations}/${publicId}`
}

/**
 * Host de delivery estándar de Cloudinary.
 */
export const CLOUDINARY_DELIVERY_HOST = "res.cloudinary.com"

/**
 * Guard anti-abuso para el endpoint `/api/events/extract-from-flyer`: valida
 * que una URL de imagen pertenece a NUESTRA cloud de Cloudinary antes de
 * mandarla al extractor de IA (que la descarga y la analiza, con costo por
 * request). Sin esto, cualquiera con rol creator podría mandar URLs
 * arbitrarias y hacernos pagar por analizar imágenes ajenas.
 *
 * Solo acepta el host de delivery estándar (`res.cloudinary.com`) sobre https
 * y cuyo primer segmento de path sea `cloudName` — las URLs de Cloudinary
 * tienen la forma `https://res.cloudinary.com/<cloud_name>/image/upload/...`
 * (ver `getCloudinaryUrl` arriba, que las construye con esa misma estructura).
 *
 * Función pura (recibe `cloudName` en vez de leer el env) para poder
 * unit-testearla sin el handler.
 */
export function isAllowedCloudinaryUrl(
  rawUrl: string,
  cloudName: string | undefined | null
): boolean {
  if (!cloudName) return false

  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    return false
  }

  if (url.protocol !== "https:") return false
  if (url.hostname !== CLOUDINARY_DELIVERY_HOST) return false

  const firstSegment = url.pathname.split("/").filter(Boolean)[0]
  return firstSegment === cloudName
}

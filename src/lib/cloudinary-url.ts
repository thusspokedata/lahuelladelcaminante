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

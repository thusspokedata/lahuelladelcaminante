/**
 * Datos legales fijos compartidos por `/impressum` y `/datenschutz`.
 *
 * La dirección y el email deben coincidir EXACTAMENTE con lo registrado
 * en Online-Impressum.de. Viven acá — no en i18n, no duplicados por
 * página — como única fuente de verdad: una traducción o una copia
 * desincronizada introduciría drift legal.
 */

/** Dirección ladungsfähige asignada por Online-Impressum.de (Clear-Media
 * UG). El dev usa este servicio para no exponer su domicilio particular.
 * Idéntica en los 3 idiomas. */
export const LEGAL_ADDRESS_LINES = [
  "La Huella del Caminante – Antonio Saleme Sastre",
  "c/o Online-Impressum #8380",
  "Europaring 90",
  "53757 Sankt Augustin",
  "Deutschland",
]

/** Email del Impressum — la casilla de reenvío de Online-Impressum.de,
 * pensada para exponerse (no es el email personal del dev). § 5 DDG
 * exige una vía de contacto electrónica directa en el Impressum. */
export const LEGAL_CONTACT_EMAIL =
  "lahuelladelcaminante@mail.online-impressum.de"

/** Clases del link de énfasis dentro del copy legal (Impressum y
 * Datenschutz) — texto de marca, subrayado. */
export const LEGAL_LINK_CLASS =
  "font-semibold text-brand underline underline-offset-2 hover:text-brand-dim transition-colors"

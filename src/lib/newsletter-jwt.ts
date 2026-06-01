/**
 * Helpers para firmar y verificar JWT de confirmación de suscripción al
 * newsletter. Usa `jose` (ya instalado por better-auth) con HS256.
 *
 * El token viaja en el link de confirmación:
 *   GET /api/newsletter/confirm?token=<jwt>
 *
 * Payload: { email, language, contactId }
 * Expira en 24h. Si expira → redirect a /[locale]/newsletter?error=token_expired.
 */

import { SignJWT, jwtVerify, type JWTPayload } from "jose"

export interface NewsletterTokenPayload extends JWTPayload {
  email: string
  language: string
  contactId: string
}

function getSecret(): Uint8Array {
  const secret = process.env.NEWSLETTER_JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error("NEWSLETTER_JWT_SECRET not set or too short (min 32 chars)")
  }
  return new TextEncoder().encode(secret)
}

/**
 * Firma un token JWT de confirmación. Expira en 24h.
 */
export async function signNewsletterToken(payload: {
  email: string
  language: string
  contactId: string
}): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getSecret())
}

/**
 * Verifica un token JWT de confirmación.
 * Lanza si el token es inválido o expiró.
 */
export async function verifyNewsletterToken(
  token: string
): Promise<NewsletterTokenPayload> {
  const { payload } = await jwtVerify(token, getSecret(), {
    algorithms: ["HS256"],
  })
  // Runtime validation — jwtVerify only checks signature/expiry
  if (
    typeof payload.email !== "string" || !payload.email ||
    typeof payload.language !== "string" || !payload.language ||
    typeof payload.contactId !== "string" || !payload.contactId
  ) {
    throw new Error("Invalid token payload")
  }
  return payload as NewsletterTokenPayload
}

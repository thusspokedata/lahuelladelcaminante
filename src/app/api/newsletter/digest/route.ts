/**
 * POST `/api/newsletter/digest`
 *
 * Genera y envía el digest semanal de eventos próximos (15 días).
 * Llamado por cron del VPS: `0 8 * * 1 curl -s -X POST https://... -H "Authorization: Bearer $SECRET"`
 *
 * Flujo:
 *  1. Valida Authorization header
 *  2. Busca eventos próximos 15 días en Prisma
 *  3. Si no hay eventos → exit (log + 200)
 *  4. Por cada idioma (es/en/de) con suscriptores activos → envía digest
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getResend } from "@/lib/email"
import { buildDigestEmail, type DigestEvent } from "@/lib/newsletter-emails"
import { env } from "@/lib/env"
import { startOfTodayBerlin } from "@/lib/date"

const LANGUAGES = ["es", "en", "de"] as const
const MAX_EVENTS = 5

function segmentIdForLang(lang: string): string | null {
  if (lang === "es") return env.RESEND_SEGMENT_ID_ES || null
  if (lang === "en") return env.RESEND_SEGMENT_ID_EN || null
  if (lang === "de") return env.RESEND_SEGMENT_ID_DE || null
  return null
}

export async function POST(request: Request) {
  const auth = request.headers.get("authorization")
  const expected = env.DIGEST_CRON_SECRET
  if (!expected || auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const today = startOfTodayBerlin()
  const in15 = new Date(today)
  in15.setDate(in15.getDate() + 15)

  const events = await prisma.event.findMany({
    where: {
      isDeleted: false,
      isActive: true,
      dates: {
        some: {
          date: { gte: today, lte: in15 },
        },
      },
    },
    include: {
      dates: {
        where: { date: { gte: today, lte: in15 } },
        orderBy: { date: "asc" },
        take: 1,
      },
      images: {
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const sorted = events
    .filter((e) => e.dates.length > 0)
    .sort((a, b) => {
      const da = a.dates[0]!.date.getTime()
      const db = b.dates[0]!.date.getTime()
      return da - db
    })

  if (sorted.length === 0) {
    console.log("newsletter_digest_skipped", { reason: "no_events" })
    return NextResponse.json({ data: { sent: false, reason: "no_events" } })
  }

  const hasMore = sorted.length > MAX_EVENTS
  const toSend = sorted.slice(0, MAX_EVENTS)

  const digestEvents: DigestEvent[] = toSend.map((e) => ({
    title: e.title,
    slug: e.slug,
    nextDate: e.dates[0]!.date.toISOString(),
    location: e.location,
    coverImage: e.images[0]?.url ?? null,
  }))

  const appUrl = env.NEXT_PUBLIC_APP_URL
  const resend = getResend()
  const result: Record<string, number> = {}

  for (const lang of LANGUAGES) {
    const segmentId = segmentIdForLang(lang)
    if (!segmentId) continue

    let subscriberEmails: string[] = []
    try {
      // TODO: implement cursor-based pagination when segments exceed 100 subscribers
      const { data: list } = await resend.contacts.list({ segmentId, limit: 100 })
      subscriberEmails = (list?.data ?? [])
        .filter((c) => !c.unsubscribed)
        .map((c) => c.email)
    } catch (err) {
      console.error("newsletter_digest_list_failed", {
        lang,
        errorName: err instanceof Error ? err.name : typeof err,
      })
      continue
    }

    if (subscriberEmails.length === 0) {
      result[lang] = 0
      continue
    }

    const { subject, html } = buildDigestEmail(lang, digestEvents, hasMore, appUrl)

    const BATCH = 50
    let sent = 0
    for (let i = 0; i < subscriberEmails.length; i += BATCH) {
      const batch = subscriberEmails.slice(i, i + BATCH)
      try {
        await resend.emails.send({
          from: "La Huella del Caminante <noreply@lahuelladelcaminante.de>",
          to: batch,
          subject,
          html,
        })
        sent += batch.length
      } catch (err) {
        console.error("newsletter_digest_send_failed", {
          lang,
          errorName: err instanceof Error ? err.name : typeof err,
          batch: i,
        })
      }
    }
    result[lang] = sent
  }

  console.log("newsletter_digest_sent", { result, events: sorted.length })
  return NextResponse.json({ data: { sent: true, result, events: sorted.length } })
}

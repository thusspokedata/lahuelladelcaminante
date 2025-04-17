import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    webhook_secret: process.env.CLERK_WEBHOOK_SECRET,
    publishable_key: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    secret_key: process.env.CLERK_SECRET_KEY ? "está definido" : "no está definido",
  });
}

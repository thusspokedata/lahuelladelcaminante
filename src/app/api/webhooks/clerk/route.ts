import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// This function verifies the webhook signature to ensure it comes from Clerk
async function validateRequest(request: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local");
  }

  // Get the headers from the request
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If any header is missing, reject the request
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: missing webhook headers", {
      status: 400,
    });
  }

  // Get the request body as text
  const payload = await request.json();
  const body = JSON.stringify(payload);

  // Create a Webhook instance and verify the signature
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error verifying webhook", {
      status: 400,
    });
  }

  return evt;
}

export async function POST(request: Request) {
  try {
    // Validate the request
    const evt = await validateRequest(request);
    if (evt instanceof Response) return evt;

    const eventType = evt.type;

    // Handle events by type
    if (eventType === "user.created") {
      // Create a new user in our database
      const { id, email_addresses, first_name, last_name } = evt.data;

      // Extract the primary email
      const primaryEmail = email_addresses[0]?.email_address;

      if (!primaryEmail) {
        return new Response("Error: email not found", { status: 400 });
      }

      // Create or update the user in our database
      await db.user.create({
        data: {
          clerkId: id,
          email: primaryEmail,
          name: `${first_name || ""} ${last_name || ""}`.trim(),
          status: "PENDING", // By default, users are pending approval
          role: "USER", // By default, users have the USER role
        },
      });

      return NextResponse.json({ message: "Usuario creado exitosamente" }, { status: 201 });
    } else if (eventType === "user.updated") {
      // Update an existing user
      const { id, email_addresses, first_name, last_name } = evt.data;

      // Extract the primary email
      const primaryEmail = email_addresses[0]?.email_address;

      if (!primaryEmail) {
        return new Response("Error: email not found", { status: 400 });
      }

      // Look for the user by their clerkId
      const existingUser = await db.user.findUnique({
        where: { clerkId: id },
      });

      if (existingUser) {
        // Update the existing user
        await db.user.update({
          where: { clerkId: id },
          data: {
            email: primaryEmail,
            name: `${first_name || ""} ${last_name || ""}`.trim(),
          },
        });
        return NextResponse.json({ message: "Usuario actualizado exitosamente" }, { status: 200 });
      } else {
        // If it doesn't exist, create it
        await db.user.create({
          data: {
            clerkId: id,
            email: primaryEmail,
            name: `${first_name || ""} ${last_name || ""}`.trim(),
            status: "PENDING",
            role: "USER",
          },
        });
        return NextResponse.json({ message: "Usuario creado exitosamente" }, { status: 201 });
      }
    } else if (eventType === "user.deleted") {
      // Mark the user as deleted or delete them completely
      const { id } = evt.data;

      // Option 1: Delete the user completely
      await db.user.delete({
        where: { clerkId: id },
      });

      // Option 2: Implement soft delete if preferred
      // await db.user.update({
      //   where: { clerkId: id },
      //   data: { isDeleted: true, deletedAt: new Date() }
      // });

      return NextResponse.json({ message: "Usuario eliminado exitosamente" }, { status: 200 });
    }

    // For any other event type, just respond with success
    return NextResponse.json({ message: `Webhook recibido: ${eventType}` }, { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response("Error processing webhook", { status: 500 });
  }
}

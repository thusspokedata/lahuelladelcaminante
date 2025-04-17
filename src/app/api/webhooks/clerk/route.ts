import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// Esta función verifica la firma del webhook para asegurar que proviene de Clerk
async function validateRequest(request: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local");
  }

  // Obtenemos los encabezados de la solicitud
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // Si falta algún encabezado, rechazamos la solicitud
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error: faltan encabezados de webhook", {
      status: 400,
    });
  }

  // Obtenemos el cuerpo de la solicitud como texto
  const payload = await request.json();
  const body = JSON.stringify(payload);

  // Creamos una instancia de Webhook y verificamos la firma
  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error al verificar webhook:", err);
    return new Response("Error al verificar webhook", {
      status: 400,
    });
  }

  return evt;
}

export async function POST(request: Request) {
  try {
    // Validamos la solicitud
    const evt = await validateRequest(request);
    if (evt instanceof Response) return evt;

    const eventType = evt.type;

    // Manejamos los eventos según su tipo
    if (eventType === "user.created") {
      // Creamos un nuevo usuario en nuestra base de datos
      const { id, email_addresses, first_name, last_name } = evt.data;

      // Extraemos el email principal
      const primaryEmail = email_addresses[0]?.email_address;

      if (!primaryEmail) {
        return new Response("Error: email no encontrado", { status: 400 });
      }

      // Creamos o actualizamos el usuario en nuestra base de datos
      await db.user.create({
        data: {
          clerkId: id,
          email: primaryEmail,
          name: `${first_name || ""} ${last_name || ""}`.trim(),
          status: "PENDING", // Por defecto, los usuarios están pendientes de aprobación
          role: "USER", // Por defecto, los usuarios tienen el rol USER
        },
      });

      return NextResponse.json({ message: "Usuario creado exitosamente" }, { status: 201 });
    } else if (eventType === "user.updated") {
      // Actualizamos un usuario existente
      const { id, email_addresses, first_name, last_name } = evt.data;

      // Extraemos el email principal
      const primaryEmail = email_addresses[0]?.email_address;

      if (!primaryEmail) {
        return new Response("Error: email no encontrado", { status: 400 });
      }

      // Buscamos el usuario por su clerkId
      const existingUser = await db.user.findUnique({
        where: { clerkId: id },
      });

      if (existingUser) {
        // Actualizamos el usuario existente
        await db.user.update({
          where: { clerkId: id },
          data: {
            email: primaryEmail,
            name: `${first_name || ""} ${last_name || ""}`.trim(),
          },
        });
        return NextResponse.json({ message: "Usuario actualizado exitosamente" }, { status: 200 });
      } else {
        // Si no existe, lo creamos
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
      // Marcamos al usuario como eliminado o lo eliminamos completamente
      const { id } = evt.data;

      // Opción 1: Eliminar el usuario completamente
      await db.user.delete({
        where: { clerkId: id },
      });

      // Opción 2: Implementar borrado lógico si se prefiere
      // await db.user.update({
      //   where: { clerkId: id },
      //   data: { isDeleted: true, deletedAt: new Date() }
      // });

      return NextResponse.json({ message: "Usuario eliminado exitosamente" }, { status: 200 });
    }

    // Para cualquier otro tipo de evento, simplemente respondemos con éxito
    return NextResponse.json({ message: `Webhook recibido: ${eventType}` }, { status: 200 });
  } catch (error) {
    console.error("Error al procesar webhook:", error);
    return new Response("Error al procesar webhook", { status: 500 });
  }
}

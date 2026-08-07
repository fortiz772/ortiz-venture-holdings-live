"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function payRent(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "TENANT") redirect("/login");

  const paymentId = String(formData.get("paymentId") || "");
  const payment = await db.rentPayment.findUnique({
    where: { id: paymentId },
    include: { lease: true },
  });

  if (!payment || payment.lease.tenantId !== session.userId) {
    throw new Error("Not found");
  }

  if (payment.status !== "PAID") {
    await db.rentPayment.update({
      where: { id: paymentId },
      data: { status: "PAID", paidAt: new Date(), simulated: true },
    });
  }

  revalidatePath("/tenant");
}

export async function submitMaintenanceRequest(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "TENANT") redirect("/login");

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const unitId = String(formData.get("unitId") || "");

  if (!title || !description || !unitId) {
    throw new Error("Missing required fields");
  }

  const lease = await db.lease.findFirst({
    where: { unitId, tenantId: session.userId },
  });
  if (!lease) {
    throw new Error("Not your unit");
  }

  let photoDataUrl: string | undefined;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > 3 * 1024 * 1024) {
      throw new Error("Photo too large (max 3MB)");
    }
    if (!photo.type.startsWith("image/")) {
      throw new Error("File must be an image");
    }
    const buf = Buffer.from(await photo.arrayBuffer());
    photoDataUrl = `data:${photo.type};base64,${buf.toString("base64")}`;
  }

  await db.maintenanceRequest.create({
    data: {
      unitId,
      tenantId: session.userId,
      title,
      description,
      photoDataUrl,
      status: "OPEN",
    },
  });

  revalidatePath("/tenant");
  revalidatePath("/pm/maintenance");
  revalidatePath("/pm");
}

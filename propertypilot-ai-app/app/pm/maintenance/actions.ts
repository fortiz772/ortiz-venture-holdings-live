"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

const VALID_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED"] as const;

export async function updateMaintenanceStatus(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "PM") redirect("/login");

  const requestId = String(formData.get("requestId") || "");
  const status = String(formData.get("status") || "");

  if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
    throw new Error("Invalid status");
  }

  const request = await db.maintenanceRequest.findUnique({
    where: { id: requestId },
    include: { unit: { include: { property: true } } },
  });

  if (!request || request.unit.property.pmId !== session.userId) {
    throw new Error("Not found");
  }

  await db.maintenanceRequest.update({
    where: { id: requestId },
    data: { status: status as (typeof VALID_STATUSES)[number] },
  });

  revalidatePath("/pm/maintenance");
  revalidatePath("/pm");
}

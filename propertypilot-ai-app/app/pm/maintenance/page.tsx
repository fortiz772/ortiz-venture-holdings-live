import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateMaintenanceStatus } from "./actions";

export default async function MaintenancePage() {
  const session = await getSession();

  const requests = await db.maintenanceRequest.findMany({
    where: { unit: { property: { pmId: session!.userId } } },
    include: { unit: { include: { property: true } }, tenant: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-widest text-brand-dark">
        Maintenance
      </p>
      <h1 className="text-3xl font-extrabold mt-1">Requests</h1>

      <div className="mt-6 space-y-4">
        {requests.map((r) => (
          <div key={r.id} className="rounded-2xl bg-white/70 border border-white p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="font-bold">{r.title}</p>
                <p className="text-sm text-muted">
                  {r.unit.property.name} · {r.unit.label} · {r.tenant.name}
                </p>
                <p className="text-sm mt-2">{r.description}</p>
              </div>
              {r.photoDataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.photoDataUrl}
                  alt="Attached to maintenance request"
                  className="w-28 h-28 object-cover rounded-xl border border-black/10"
                />
              )}
            </div>
            <form action={updateMaintenanceStatus} className="mt-4 flex items-center gap-2">
              <input type="hidden" name="requestId" value={r.id} />
              <select
                name="status"
                defaultValue={r.status}
                className="rounded-lg border border-black/10 px-2 py-1 text-sm"
              >
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
              </select>
              <button
                type="submit"
                className="text-sm font-bold text-white bg-brand-dark rounded-lg px-3 py-1"
              >
                Update
              </button>
            </form>
          </div>
        ))}
        {requests.length === 0 && (
          <p className="text-muted">No maintenance requests yet.</p>
        )}
      </div>
    </div>
  );
}

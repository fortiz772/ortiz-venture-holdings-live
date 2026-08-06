import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { payRent, submitMaintenanceRequest } from "./actions";

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export default async function TenantPortal() {
  const session = await getSession();

  const lease = await db.lease.findFirst({
    where: { tenantId: session!.userId },
    include: {
      unit: { include: { property: true } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  });

  const requests = await db.maintenanceRequest.findMany({
    where: { tenantId: session!.userId },
    orderBy: { createdAt: "desc" },
  });

  const duePayment = lease?.payments.find((p) => p.status === "DUE");

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-widest text-brand-dark">
          Your Home
        </p>
        <h1 className="text-3xl font-extrabold mt-1">
          {lease?.unit.property.name} · {lease?.unit.label}
        </h1>
        <p className="text-muted">{lease?.unit.property.address}</p>
      </div>

      <div className="rounded-2xl bg-white/70 border border-white p-6">
        <p className="text-sm font-bold text-muted">Rent</p>
        {duePayment ? (
          <>
            <p className="text-2xl font-extrabold mt-1">
              {formatCents(duePayment.amount)} due · {duePayment.periodLabel}
            </p>
            <form action={payRent} className="mt-4">
              <input type="hidden" name="paymentId" value={duePayment.id} />
              <button
                type="submit"
                className="rounded-xl bg-brand-dark text-white font-bold px-5 py-2.5"
              >
                Pay Rent
              </button>
              <p className="text-xs text-muted mt-2">
                Demo only — this simulates a payment and does not move real
                money or collect card details.
              </p>
            </form>
          </>
        ) : (
          <p className="text-lg font-bold text-brand-dark mt-1">
            You&apos;re all paid up for this period. ✓
          </p>
        )}

        <div className="mt-5 border-t border-black/5 pt-4">
          <p className="text-xs font-bold uppercase text-muted">Payment history</p>
          <ul className="mt-2 text-sm space-y-1">
            {lease?.payments.map((p) => (
              <li key={p.id} className="flex justify-between">
                <span>{p.periodLabel}</span>
                <span
                  className={
                    p.status === "PAID"
                      ? "text-brand-dark font-semibold"
                      : "text-accent font-semibold"
                  }
                >
                  {p.status === "PAID"
                    ? `Paid ${p.paidAt?.toLocaleDateString("en-US")}`
                    : "Due"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl bg-white/70 border border-white p-6">
        <p className="text-sm font-bold text-muted">Maintenance</p>
        <ul className="mt-3 space-y-3">
          {requests.map((r) => (
            <li key={r.id} className="rounded-xl border border-black/5 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{r.title}</p>
                <span className="text-xs font-bold uppercase text-muted whitespace-nowrap">
                  {r.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-sm text-muted mt-1">{r.description}</p>
            </li>
          ))}
          {requests.length === 0 && (
            <p className="text-sm text-muted">No requests yet.</p>
          )}
        </ul>

        <form
          action={submitMaintenanceRequest}
          className="mt-5 border-t border-black/5 pt-4 space-y-3"
        >
          <input type="hidden" name="unitId" value={lease?.unit.id} />
          <div>
            <label className="text-sm font-semibold" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              name="title"
              required
              placeholder="Leaky faucet"
              className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={3}
              className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="photo">
              Photo (optional, max 3MB)
            </label>
            <input
              id="photo"
              type="file"
              name="photo"
              accept="image/*"
              className="mt-1 w-full text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-brand-dark text-white font-bold px-5 py-2.5 text-sm"
          >
            Submit Request
          </button>
        </form>
      </div>
    </div>
  );
}

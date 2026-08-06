import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

const CURRENT_PERIOD = "August 2026";

function formatCents(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export default async function PMDashboard() {
  const session = await getSession();

  const properties = await db.property.findMany({
    where: { pmId: session!.userId },
    include: {
      units: {
        include: {
          lease: { include: { tenant: true, payments: true } },
          maintenanceRequests: true,
        },
      },
    },
  });

  const units = properties.flatMap((p) => p.units);
  const leasedUnits = units.filter((u) => u.lease);
  const occupancyPct = units.length
    ? Math.round((leasedUnits.length / units.length) * 100)
    : 0;

  const currentPeriodPayments = leasedUnits
    .map((u) => u.lease!.payments.find((p) => p.periodLabel === CURRENT_PERIOD))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const dueTotal = currentPeriodPayments.reduce((sum, p) => sum + p.amount, 0);
  const collectedTotal = currentPeriodPayments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0);
  const collectedPct = dueTotal ? Math.round((collectedTotal / dueTotal) * 100) : 0;

  const openMaintenance = units
    .flatMap((u) => u.maintenanceRequests)
    .filter((m) => m.status !== "RESOLVED").length;

  return (
    <div>
      <p className="text-xs font-extrabold uppercase tracking-widest text-brand-dark">
        Portfolio
      </p>
      <h1 className="text-3xl font-extrabold mt-1">Overview</h1>
      <p className="text-muted mt-1">{CURRENT_PERIOD}</p>

      <div className="grid gap-4 sm:grid-cols-3 mt-8">
        <div className="rounded-2xl bg-white/70 border border-white p-5">
          <p className="text-sm font-bold text-muted">Rent Collected</p>
          <p className="text-2xl font-extrabold mt-1">
            {formatCents(collectedTotal)}{" "}
            <span className="text-base font-semibold text-muted">
              / {formatCents(dueTotal)}
            </span>
          </p>
          <div className="mt-2 h-2 rounded-full bg-black/5 overflow-hidden">
            <div
              className="h-full bg-brand"
              style={{ width: `${collectedPct}%` }}
            />
          </div>
        </div>
        <div className="rounded-2xl bg-white/70 border border-white p-5">
          <p className="text-sm font-bold text-muted">Occupancy</p>
          <p className="text-2xl font-extrabold mt-1">{occupancyPct}%</p>
          <p className="text-xs text-muted mt-1">
            {leasedUnits.length} of {units.length} units leased
          </p>
        </div>
        <div className="rounded-2xl bg-white/70 border border-white p-5">
          <p className="text-sm font-bold text-muted">Open Maintenance</p>
          <p className="text-2xl font-extrabold mt-1">{openMaintenance}</p>
          <a href="/pm/maintenance" className="text-xs font-bold text-brand-dark">
            View all →
          </a>
        </div>
      </div>

      <h2 className="text-xl font-extrabold mt-10">Properties</h2>
      <div className="mt-4 space-y-4">
        {properties.map((p) => (
          <div key={p.id} className="rounded-2xl bg-white/70 border border-white p-5">
            <p className="font-bold">{p.name}</p>
            <p className="text-sm text-muted">{p.address}</p>
            <table className="w-full mt-3 text-sm">
              <thead>
                <tr className="text-left text-muted">
                  <th className="font-semibold py-1">Unit</th>
                  <th className="font-semibold py-1">Rent</th>
                  <th className="font-semibold py-1">Tenant</th>
                  <th className="font-semibold py-1">{CURRENT_PERIOD}</th>
                </tr>
              </thead>
              <tbody>
                {p.units.map((u) => {
                  const payment = u.lease?.payments.find(
                    (pay) => pay.periodLabel === CURRENT_PERIOD
                  );
                  return (
                    <tr key={u.id} className="border-t border-black/5">
                      <td className="py-2">{u.label}</td>
                      <td className="py-2">{formatCents(u.rentAmount)}</td>
                      <td className="py-2">
                        {u.lease ? (
                          u.lease.tenant.name
                        ) : (
                          <span className="text-muted">Vacant</span>
                        )}
                      </td>
                      <td className="py-2">
                        {payment ? (
                          <span
                            className={
                              payment.status === "PAID"
                                ? "text-brand-dark font-semibold"
                                : "text-accent font-semibold"
                            }
                          >
                            {payment.status === "PAID" ? "Paid" : "Due"}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

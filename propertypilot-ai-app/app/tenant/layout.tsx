import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { logout } from "@/app/actions";

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "TENANT") redirect("/login");

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-10 bg-bg/90 backdrop-blur border-b border-black/5 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="font-extrabold">
            Property<span className="text-brand">Pilot</span> AI
          </p>
          <p className="text-xs text-muted">Tenant Portal · {session.name}</p>
        </div>
        <form action={logout}>
          <button type="submit" className="text-sm font-semibold text-muted hover:text-ink">
            Sign out
          </button>
        </form>
      </nav>
      <main className="max-w-2xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}

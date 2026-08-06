import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logout } from "@/app/actions";

export default async function PMLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || session.role !== "PM") redirect("/login");

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-10 bg-bg/90 backdrop-blur border-b border-black/5 px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="font-extrabold">
            Property<span className="text-brand">Pilot</span> AI
          </p>
          <p className="text-xs text-muted">Property Manager · {session.name}</p>
        </div>
        <div className="flex items-center gap-5 text-sm font-semibold">
          <Link href="/pm" className="hover:text-brand-dark">
            Dashboard
          </Link>
          <Link href="/pm/maintenance" className="hover:text-brand-dark">
            Maintenance
          </Link>
          <form action={logout}>
            <button type="submit" className="text-muted hover:text-ink">
              Sign out
            </button>
          </form>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}

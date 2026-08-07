import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-3xl bg-white/80 border border-white p-8 shadow-xl shadow-black/5">
        <p className="text-xs font-extrabold text-brand-dark uppercase tracking-widest">
          PropertyPilot AI
        </p>
        <h1 className="mt-2 text-2xl font-extrabold">Sign in</h1>
        <p className="text-sm text-muted mt-1">Prototype — not a live product.</p>

        {params.error && (
          <p className="mt-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">
            Invalid email or password.
          </p>
        )}

        <form action={login} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-semibold" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-brand-dark text-white font-bold py-2.5"
          >
            Sign in
          </button>
        </form>

        <div className="mt-6 border-t border-black/10 pt-5">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">
            Quick demo logins
          </p>
          <div className="mt-3 grid gap-2">
            <form action={login}>
              <input type="hidden" name="email" value="pm@propertypilot.demo" />
              <input type="hidden" name="password" value="demo1234" />
              <button className="w-full text-left text-sm rounded-xl border border-black/10 px-3 py-2 hover:bg-black/[0.03]">
                Property Manager — Alex Rivera
              </button>
            </form>
            <form action={login}>
              <input type="hidden" name="email" value="tenant.a@propertypilot.demo" />
              <input type="hidden" name="password" value="demo1234" />
              <button className="w-full text-left text-sm rounded-xl border border-black/10 px-3 py-2 hover:bg-black/[0.03]">
                Tenant — Jamie Chen (rent due)
              </button>
            </form>
            <form action={login}>
              <input type="hidden" name="email" value="tenant.b@propertypilot.demo" />
              <input type="hidden" name="password" value="demo1234" />
              <button className="w-full text-left text-sm rounded-xl border border-black/10 px-3 py-2 hover:bg-black/[0.03]">
                Tenant — Morgan Lee (rent paid)
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

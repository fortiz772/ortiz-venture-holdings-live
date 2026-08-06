# PropertyPilot AI — app prototype

A working MVP for the PropertyPilot AI concept described at
[`/propertypilot-ai/`](../propertypilot-ai/index.html) — property management
software for independent landlords and small portfolios, built around the
same differentiators: offline-friendly maintenance/inspection flow, a
transparent billing model, and fast support framing.

This is a **separate app** from that marketing microsite (which is a static
site deployed by Netlify from the repo root) and from the `stockpilot-ai/`
product. It's a real Next.js application with its own database, meant to be
run and deployed independently (e.g. on Vercel) — Netlify is not configured
to build it.

## What's real vs. simulated

- **Real**: authentication, the property/unit/lease/tenant data model,
  role-based dashboards, maintenance request submission with photo upload,
  maintenance status workflow, and all the numbers on the dashboards (they're
  computed from the database, not hardcoded).
- **Simulated**: "Pay Rent" marks the payment as paid in the database. It
  does **not** move real money, integrate a real payment processor, or
  collect card details — doing that for real requires a merchant account and
  a PCI-compliant processor (e.g. Stripe), which is a business decision, not
  something to fake in a prototype.
- **Not built**: real QuickBooks/Xero sync (needs registered developer
  credentials with each platform), live human chat support (needs actual
  staffing), and a native iOS app (needs an Apple Developer account and
  Xcode/macOS to build).

## Stack

Next.js 16 (App Router, Server Actions) · Tailwind CSS v4 · Prisma 7 with the
`better-sqlite3` driver adapter · a small hand-rolled auth layer (bcrypt +
HMAC-signed session cookie — no NextAuth dependency).

## Running locally

```bash
npm install
cp .env.example .env        # then edit SESSION_SECRET to a random string
npm run db:push             # creates prisma/dev.db from the schema
npm run db:seed             # demo data — see accounts below
npm run dev
```

Visit `http://localhost:3000`. The login page has one-click demo logins, or
sign in manually with:

| Role | Email | Password |
|---|---|---|
| Property Manager | `pm@propertypilot.demo` | `demo1234` |
| Tenant (rent due) | `tenant.a@propertypilot.demo` | `demo1234` |
| Tenant (rent paid) | `tenant.b@propertypilot.demo` | `demo1234` |

## Deploying

Not deployed anywhere yet — this repo only contains the code. To actually
put it online you'd point a platform like Vercel at this subfolder (not the
repo root, since the root is the separate static marketing site), set
`DATABASE_URL` and `SESSION_SECRET` as environment variables there, and swap
SQLite for a hosted database (e.g. Postgres via `@prisma/adapter-pg`) since
SQLite's local file isn't a good fit for serverless deployments.

import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  await db.maintenanceRequest.deleteMany();
  await db.rentPayment.deleteMany();
  await db.lease.deleteMany();
  await db.unit.deleteMany();
  await db.property.deleteMany();
  await db.user.deleteMany();

  const passwordHash = bcrypt.hashSync("demo1234", 10);

  const pm = await db.user.create({
    data: {
      email: "pm@propertypilot.demo",
      passwordHash,
      name: "Alex Rivera",
      role: "PM",
    },
  });

  const tenantA = await db.user.create({
    data: {
      email: "tenant.a@propertypilot.demo",
      passwordHash,
      name: "Jamie Chen",
      role: "TENANT",
    },
  });

  const tenantB = await db.user.create({
    data: {
      email: "tenant.b@propertypilot.demo",
      passwordHash,
      name: "Morgan Lee",
      role: "TENANT",
    },
  });

  const mapleCourt = await db.property.create({
    data: {
      name: "Maple Court Duplex",
      address: "123 Maple St, Springfield",
      pmId: pm.id,
    },
  });

  const oakStreet = await db.property.create({
    data: {
      name: "Oak Street Cottage",
      address: "48 Oak St, Springfield",
      pmId: pm.id,
    },
  });

  const unitA = await db.unit.create({
    data: { label: "Unit A", rentAmount: 180000, propertyId: mapleCourt.id },
  });

  const unitB = await db.unit.create({
    data: { label: "Unit B", rentAmount: 160000, propertyId: mapleCourt.id },
  });

  await db.unit.create({
    data: { label: "Cottage", rentAmount: 150000, propertyId: oakStreet.id },
  });

  const leaseA = await db.lease.create({
    data: {
      unitId: unitA.id,
      tenantId: tenantA.id,
      rentAmount: 180000,
      startDate: new Date("2026-01-15"),
    },
  });

  const leaseB = await db.lease.create({
    data: {
      unitId: unitB.id,
      tenantId: tenantB.id,
      rentAmount: 160000,
      startDate: new Date("2026-03-01"),
    },
  });

  await db.rentPayment.create({
    data: {
      leaseId: leaseA.id,
      periodLabel: "July 2026",
      amount: 180000,
      status: "PAID",
      paidAt: new Date("2026-07-03"),
    },
  });
  await db.rentPayment.create({
    data: {
      leaseId: leaseA.id,
      periodLabel: "August 2026",
      amount: 180000,
      status: "DUE",
    },
  });

  await db.rentPayment.create({
    data: {
      leaseId: leaseB.id,
      periodLabel: "July 2026",
      amount: 160000,
      status: "PAID",
      paidAt: new Date("2026-07-01"),
    },
  });
  await db.rentPayment.create({
    data: {
      leaseId: leaseB.id,
      periodLabel: "August 2026",
      amount: 160000,
      status: "PAID",
      paidAt: new Date("2026-08-01"),
    },
  });

  await db.maintenanceRequest.create({
    data: {
      unitId: unitA.id,
      tenantId: tenantA.id,
      title: "Leaky kitchen faucet",
      description: "Steady drip under the kitchen sink, worse at night.",
      status: "OPEN",
    },
  });

  await db.maintenanceRequest.create({
    data: {
      unitId: unitB.id,
      tenantId: tenantB.id,
      title: "AC filter replacement",
      description: "Requested seasonal filter swap.",
      status: "RESOLVED",
    },
  });

  console.log("Seeded demo data.");
  console.log("PM login:      pm@propertypilot.demo / demo1234");
  console.log("Tenant login:  tenant.a@propertypilot.demo / demo1234 (rent due)");
  console.log("Tenant login:  tenant.b@propertypilot.demo / demo1234 (rent paid)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });

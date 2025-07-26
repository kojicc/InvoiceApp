import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function seedBasicData() {
  console.log("🌱 Starting basic data seeding...");

  try {
    // Clear existing data in correct order
    console.log("🧹 Clearing existing data...");
    await prisma.item.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.user.deleteMany();
    await prisma.client.deleteMany();

    // Create Admin Users
    console.log("👤 Creating admin users...");
    const adminPassword = await bcrypt.hash("admin123", 10);
    const admin = await prisma.user.create({
      data: {
        username: "admin",
        email: "admin@example.com",
        password: adminPassword,
        role: "admin",
      },
    });

    // Create Client Users
    console.log("👥 Creating client users...");
    const clientPassword = await bcrypt.hash("client123", 10);
    const clientUser = await prisma.user.create({
      data: {
        username: "acmecorp",
        email: "acmecorp@example.com",
        password: clientPassword,
        role: "client",
      },
    });

    // Create Clients
    console.log("🏢 Creating clients...");
    const client1 = await prisma.client.create({
      data: {
        name: "ACME Corporation",
        contact: "john@acme.com",
        address: "123 Business St, City, State 12345",
      },
    });

    const client2 = await prisma.client.create({
      data: {
        name: "Tech Solutions LLC",
        contact: "info@techsolutions.com",
        address: "456 Innovation Ave, Tech City, TC 67890",
      },
    });

    // Create Invoices
    console.log("📋 Creating invoices...");
    const currentDate = new Date();
    const daysAgo = (days: number) =>
      new Date(currentDate.getTime() - days * 24 * 60 * 60 * 1000);
    const daysFromNow = (days: number) =>
      new Date(currentDate.getTime() + days * 24 * 60 * 60 * 1000);

    const invoice1 = await prisma.invoice.create({
      data: {
        invoiceNo: "INV-2025-001",
        clientId: client1.id,
        issueDate: daysAgo(30),
        dueDate: daysAgo(15),
        total: 2500.0,
        paidAmount: 2500.0,
        status: "paid",
        currency: "USD",
        isRecurring: true,
        recurringType: "monthly",
        recurringDay: 1,
        nextDueDate: daysFromNow(15),
      },
    });

    const invoice2 = await prisma.invoice.create({
      data: {
        invoiceNo: "INV-2025-002",
        clientId: client2.id,
        issueDate: daysAgo(20),
        dueDate: daysAgo(5),
        total: 3200.0,
        paidAmount: 1600.0,
        status: "partially_paid",
        currency: "USD",
      },
    });

    const invoice3 = await prisma.invoice.create({
      data: {
        invoiceNo: "INV-2025-003",
        clientId: client1.id,
        issueDate: daysAgo(35),
        dueDate: daysAgo(7),
        total: 1200.0,
        paidAmount: 0,
        status: "unpaid",
        currency: "USD",
      },
    });

    // Create Items
    console.log("📦 Creating invoice items...");
    await prisma.item.create({
      data: {
        name: "Web Development Service",
        quantity: 1,
        unitPrice: 2500.0,
        invoiceId: invoice1.id,
      },
    });

    await prisma.item.create({
      data: {
        name: "Consulting Hours",
        quantity: 40,
        unitPrice: 80.0,
        invoiceId: invoice2.id,
      },
    });

    await prisma.item.create({
      data: {
        name: "Software License",
        quantity: 1,
        unitPrice: 1200.0,
        invoiceId: invoice3.id,
      },
    });

    console.log("✅ Basic data seeded successfully!");
    console.log("\n📊 Summary:");
    console.log(`👤 Admin Users: 1`);
    console.log(`👥 Client Users: 1`);
    console.log(`🏢 Clients: 2`);
    console.log(`📋 Invoices: 3`);

    console.log("\n🔐 Login Credentials:");
    console.log("Admin: admin@example.com / admin123");
    console.log("Client: acmecorp@example.com / client123");
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
if (require.main === module) {
  seedBasicData().catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
}

export default seedBasicData;

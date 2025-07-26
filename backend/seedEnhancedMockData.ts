import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function seedEnhancedMockData() {
  console.log("🌱 Starting enhanced mock data seeding...");

  try {
    // Clear existing data
    console.log("🧹 Clearing existing data...");
    await prisma.payment.deleteMany();
    await prisma.item.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.user.deleteMany();
    await prisma.client.deleteMany();

    // Create Admin Users
    console.log("👤 Creating admin users...");
    const adminPassword = await bcrypt.hash("admin123", 10);
    const admin1 = await prisma.user.create({
      data: {
        username: "admin",
        email: "admin@example.com",
        password: adminPassword,
        role: "admin",
      },
    });

    const admin2 = await prisma.user.create({
      data: {
        username: "superadmin",
        email: "superadmin@example.com",
        password: adminPassword,
        role: "admin",
      },
    });

    // Create Clients
    console.log("🏢 Creating clients...");
    const clients = await Promise.all([
      prisma.client.create({
        data: {
          name: "ACME Corporation",
          contact: "john@acme.com",
          address: "123 Business St, City, State 12345",
        },
      }),
      prisma.client.create({
        data: {
          name: "Tech Solutions LLC",
          contact: "info@techsolutions.com",
          address: "456 Innovation Ave, Tech City, TC 67890",
        },
      }),
      prisma.client.create({
        data: {
          name: "Global Industries",
          contact: "billing@globalind.com",
          address: "789 Global Plaza, International City, IC 13579",
        },
      }),
      prisma.client.create({
        data: {
          name: "StartupXYZ",
          contact: "finance@startupxyz.com",
          address: "321 Startup Lane, Innovation Hub, IH 24680",
        },
      }),
      prisma.client.create({
        data: {
          name: "Enterprise Corp",
          contact: "accounts@enterprise.com",
          address: "654 Enterprise Blvd, Corporate Center, CC 97531",
        },
      }),
    ]);

    // Create Client Users (without direct client relationship for now)
    console.log("👥 Creating client users...");
    const clientPassword = await bcrypt.hash("client123", 10);
    const clientUsers = await Promise.all([
      prisma.user.create({
        data: {
          username: "acmecorp",
          email: "acmecorp@example.com",
          password: clientPassword,
          role: "client",
        },
      }),
      prisma.user.create({
        data: {
          username: "techsolutions",
          email: "techsolutions@example.com",
          password: clientPassword,
          role: "client",
        },
      }),
      prisma.user.create({
        data: {
          username: "globaluser",
          email: "globaluser@example.com",
          password: clientPassword,
          role: "client",
        },
      }),
    ]);

    // Create Invoices with varying statuses and dates
    console.log("📋 Creating invoices...");
    const currentDate = new Date();
    const invoices = [];

    // Helper function to create dates
    const daysAgo = (days: number) =>
      new Date(currentDate.getTime() - days * 24 * 60 * 60 * 1000);
    const daysFromNow = (days: number) =>
      new Date(currentDate.getTime() + days * 24 * 60 * 60 * 1000);

    // Create various types of invoices
    const invoiceData = [
      // Paid invoices
      {
        invoiceNo: "INV-2025-001",
        clientId: clients[0].id,
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
      {
        invoiceNo: "INV-2025-002",
        clientId: clients[1].id,
        issueDate: daysAgo(25),
        dueDate: daysAgo(10),
        total: 1800.0,
        paidAmount: 1800.0,
        status: "paid",
        currency: "USD",
      },
      // Partially paid invoices
      {
        invoiceNo: "INV-2025-003",
        clientId: clients[2].id,
        issueDate: daysAgo(20),
        dueDate: daysAgo(5),
        total: 3200.0,
        paidAmount: 1600.0,
        status: "partially_paid",
        currency: "USD",
      },
      {
        invoiceNo: "INV-2025-004",
        clientId: clients[3].id,
        issueDate: daysAgo(15),
        dueDate: daysFromNow(5),
        total: 4500.0,
        paidAmount: 2250.0,
        status: "partially_paid",
        currency: "USD",
        isRecurring: true,
        recurringType: "quarterly",
        recurringDay: 15,
        nextDueDate: daysFromNow(90),
      },
      // Overdue invoices
      {
        invoiceNo: "INV-2025-005",
        clientId: clients[0].id,
        issueDate: daysAgo(35),
        dueDate: daysAgo(7),
        total: 1200.0,
        paidAmount: 0,
        status: "unpaid",
        currency: "USD",
      },
      {
        invoiceNo: "INV-2025-006",
        clientId: clients[4].id,
        issueDate: daysAgo(40),
        dueDate: daysAgo(12),
        total: 2800.0,
        paidAmount: 800.0,
        status: "partially_paid",
        currency: "USD",
      },
      // Current unpaid invoices
      {
        invoiceNo: "INV-2025-007",
        clientId: clients[1].id,
        issueDate: daysAgo(10),
        dueDate: daysFromNow(10),
        total: 1900.0,
        paidAmount: 0,
        status: "unpaid",
        currency: "USD",
        isRecurring: true,
        recurringType: "weekly",
        recurringDay: 1, // Monday
        nextDueDate: daysFromNow(7),
      },
      {
        invoiceNo: "INV-2025-008",
        clientId: clients[2].id,
        issueDate: daysAgo(5),
        dueDate: daysFromNow(15),
        total: 3800.0,
        paidAmount: 0,
        status: "unpaid",
        currency: "USD",
      },
      // Future invoices
      {
        invoiceNo: "INV-2025-009",
        clientId: clients[3].id,
        issueDate: currentDate,
        dueDate: daysFromNow(30),
        total: 5200.0,
        paidAmount: 0,
        status: "unpaid",
        currency: "USD",
        isRecurring: true,
        recurringType: "yearly",
        recurringDay: 1,
        nextDueDate: daysFromNow(365),
      },
      {
        invoiceNo: "INV-2025-010",
        clientId: clients[4].id,
        issueDate: daysFromNow(5),
        dueDate: daysFromNow(35),
        total: 2100.0,
        paidAmount: 0,
        status: "unpaid",
        currency: "USD",
      },
    ];

    for (const data of invoiceData) {
      const invoice = await prisma.invoice.create({ data });
      invoices.push(invoice);
    }

    // Create Items for each invoice
    console.log("📦 Creating invoice items...");
    for (const invoice of invoices) {
      const itemCount = Math.floor(Math.random() * 4) + 2; // 2-5 items per invoice

      for (let i = 0; i < itemCount; i++) {
        const items = [
          "Web Development Service",
          "Consulting Hours",
          "Software License",
          "Technical Support",
          "Project Management",
          "Design Service",
          "Database Setup",
          "Security Audit",
          "Performance Optimization",
          "Training Session",
        ];

        const randomItem = items[Math.floor(Math.random() * items.length)];
        const quantity = Math.floor(Math.random() * 10) + 1;
        const unitPrice = Math.floor(Math.random() * 200) + 50;

        await prisma.item.create({
          data: {
            name: `${randomItem} #${i + 1}`,
            quantity,
            unitPrice,
            invoiceId: invoice.id,
          },
        });
      }
    }

    // Create Payments for paid and partially paid invoices
    console.log("💰 Creating payments...");
    const paymentMethods = ["cash", "card", "bank_transfer", "check"];

    for (const invoice of invoices) {
      if (invoice.paidAmount > 0) {
        const paymentCount =
          invoice.status === "paid"
            ? Math.floor(Math.random() * 3) + 1 // 1-3 payments for paid invoices
            : Math.floor(Math.random() * 2) + 1; // 1-2 payments for partial

        let remainingAmount = invoice.paidAmount;

        for (let i = 0; i < paymentCount && remainingAmount > 0; i++) {
          const isLastPayment = i === paymentCount - 1;
          const paymentAmount = isLastPayment
            ? remainingAmount
            : Math.min(
                remainingAmount,
                Math.floor(Math.random() * (remainingAmount * 0.8)) +
                  remainingAmount * 0.2
              );

          const randomMethod =
            paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
          const paymentDate = new Date(
            invoice.issueDate.getTime() +
              Math.random() *
                (currentDate.getTime() - invoice.issueDate.getTime())
          );

          await prisma.payment.create({
            data: {
              amount: paymentAmount,
              method: randomMethod,
              notes: `Payment ${i + 1} via ${randomMethod}`,
              paidDate: paymentDate,
              invoiceId: invoice.id,
            },
          });

          remainingAmount -= paymentAmount;
        }
      }
    }

    // Create Audit Logs
    console.log("📝 Creating audit logs...");
    const actions = ["create", "update", "delete"];
    const entityTypes = ["invoice", "client", "payment"];

    for (let i = 0; i < 50; i++) {
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      const randomEntity =
        entityTypes[Math.floor(Math.random() * entityTypes.length)];
      const randomUser = Math.random() > 0.5 ? admin1.id : admin2.id;

      await prisma.auditLog.create({
        data: {
          action: randomAction,
          entityType: randomEntity,
          entityId: Math.floor(Math.random() * 10) + 1,
          userId: randomUser,
          changes: JSON.stringify({
            field: "status",
            oldValue: "unpaid",
            newValue: "paid",
            timestamp: new Date().toISOString(),
          }),
          timestamp: daysAgo(Math.floor(Math.random() * 30)),
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
    }

    console.log("✅ Enhanced mock data seeded successfully!");
    console.log("\n📊 Summary:");
    console.log(`👤 Admin Users: 2`);
    console.log(`👥 Client Users: 3`);
    console.log(`🏢 Clients: ${clients.length}`);
    console.log(`📋 Invoices: ${invoices.length}`);
    console.log(`💰 Payments: Multiple with various methods`);
    console.log(`📝 Audit Logs: 50 entries`);

    console.log("\n🔐 Login Credentials:");
    console.log("Admin: admin@example.com / admin123");
    console.log("Client: acmecorp@example.com / client123");
    console.log("Client: techsolutions@example.com / client123");
    console.log("Client: globaluser@example.com / client123");
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
if (require.main === module) {
  seedEnhancedMockData().catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });
}

export default seedEnhancedMockData;

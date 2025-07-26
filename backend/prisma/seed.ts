import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting comprehensive database seeding...");

  // Clean existing data first
  await cleanDatabase();

  // Create Users
  const users = await createUsers();
  console.log(`✅ Created ${users.length} users`);

  // Create Clients
  const clients = await createClients(users);
  console.log(`✅ Created ${clients.length} clients`);

  // Create Invoices with various scenarios
  const invoices = await createInvoices(clients);
  console.log(`✅ Created ${invoices.length} invoices`);

  // Create Payments
  const payments = await createPayments(invoices);
  console.log(`✅ Created ${payments.length} payments`);

  // Create Audit Logs
  const auditLogs = await createAuditLogs();
  console.log(`✅ Created ${auditLogs.length} audit logs`);

  console.log("🎉 Database seeding completed successfully!");
}

async function cleanDatabase() {
  console.log("🧹 Cleaning existing data...");

  // Delete in correct order to avoid foreign key constraints
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.item.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.user.deleteMany();
  await prisma.client.deleteMany();

  console.log("✅ Database cleaned");
}

async function createUsers() {
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const hashedClientPassword = await bcrypt.hash("client123", 10);

  const users = await Promise.all([
    // Admin users
    prisma.user.create({
      data: {
        username: "admin",
        email: "admin@invoiceapp.com",
        password: hashedPassword,
        role: "admin",
      },
    }),
    prisma.user.create({
      data: {
        username: "superadmin",
        email: "super@invoiceapp.com",
        password: hashedPassword,
        role: "admin",
      },
    }),

    // Client users (will be linked to clients later)
    prisma.user.create({
      data: {
        username: "acmecorp",
        email: "acmecorp@example.com",
        password: hashedClientPassword,
        role: "client",
      },
    }),
    prisma.user.create({
      data: {
        username: "techsolutions",
        email: "contact@techsolutions.com",
        password: hashedClientPassword,
        role: "client",
      },
    }),
    prisma.user.create({
      data: {
        username: "globalinc",
        email: "billing@globalinc.com",
        password: hashedClientPassword,
        role: "client",
      },
    }),
    prisma.user.create({
      data: {
        username: "startupxyz",
        email: "finance@startupxyz.com",
        password: hashedClientPassword,
        role: "client",
      },
    }),
  ]);

  return users;
}

async function createClients(users: any[]) {
  const clientUsers = users.filter((user) => user.role === "client");

  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: "ACME Corporation",
        contact: "John Smith - CEO",
        address: "123 Business Ave, New York, NY 10001",
      },
    }),
    prisma.client.create({
      data: {
        name: "Tech Solutions Ltd",
        contact: "Sarah Johnson - CTO",
        address: "456 Innovation Dr, San Francisco, CA 94105",
      },
    }),
    prisma.client.create({
      data: {
        name: "Global Industries Inc",
        contact: "Michael Brown - CFO",
        address: "789 Corporate Blvd, Chicago, IL 60601",
      },
    }),
    prisma.client.create({
      data: {
        name: "StartupXYZ",
        contact: "Emily Davis - Founder",
        address: "321 Startup Street, Austin, TX 73301",
      },
    }),
    prisma.client.create({
      data: {
        name: "Retail Chain Co",
        contact: "David Wilson - Operations",
        address: "654 Commerce Way, Miami, FL 33101",
      },
    }),
  ]);

  // Link users to clients
  await Promise.all([
    prisma.user.update({
      where: { email: "acmecorp@example.com" },
      data: { clientId: clients[0].id },
    }),
    prisma.user.update({
      where: { email: "contact@techsolutions.com" },
      data: { clientId: clients[1].id },
    }),
    prisma.user.update({
      where: { email: "billing@globalinc.com" },
      data: { clientId: clients[2].id },
    }),
    prisma.user.update({
      where: { email: "finance@startupxyz.com" },
      data: { clientId: clients[3].id },
    }),
  ]);

  return clients;
}

async function createInvoices(clients: any[]) {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const oneMonthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const invoices = [];

  // Scenario 1: Paid invoices
  const paidInvoice1 = await prisma.invoice.create({
    data: {
      invoiceNo: "INV-2025-001",
      issueDate: oneMonthAgo,
      dueDate: oneWeekAgo,
      status: "paid",
      total: 1500.0,
      paidAmount: 1500.0,
      currency: "USD",
      clientId: clients[0].id,
      items: {
        create: [
          { name: "Website Development", quantity: 1, unitPrice: 1000.0 },
          { name: "SEO Optimization", quantity: 1, unitPrice: 500.0 },
        ],
      },
    },
  });

  const paidInvoice2 = await prisma.invoice.create({
    data: {
      invoiceNo: "INV-2025-002",
      issueDate: twoMonthsAgo,
      dueDate: oneMonthAgo,
      status: "paid",
      total: 2750.0,
      paidAmount: 2750.0,
      currency: "EUR",
      exchangeRate: 1.08,
      clientId: clients[1].id,
      items: {
        create: [
          { name: "Software License", quantity: 5, unitPrice: 450.0 },
          { name: "Technical Support", quantity: 10, unitPrice: 75.0 },
        ],
      },
    },
  });

  // Scenario 2: Partially paid invoices
  const partialInvoice = await prisma.invoice.create({
    data: {
      invoiceNo: "INV-2025-003",
      issueDate: oneWeekAgo,
      dueDate: oneWeekFromNow,
      status: "partially_paid",
      total: 3200.0,
      paidAmount: 1600.0,
      currency: "USD",
      clientId: clients[2].id,
      items: {
        create: [
          { name: "Mobile App Development", quantity: 1, unitPrice: 2500.0 },
          { name: "UI/UX Design", quantity: 1, unitPrice: 700.0 },
        ],
      },
    },
  });

  // Scenario 3: Unpaid invoices (current)
  const unpaidInvoice1 = await prisma.invoice.create({
    data: {
      invoiceNo: "INV-2025-004",
      issueDate: now,
      dueDate: oneMonthFromNow,
      status: "unpaid",
      total: 850.0,
      paidAmount: 0,
      currency: "USD",
      clientId: clients[3].id,
      items: {
        create: [
          { name: "Logo Design", quantity: 1, unitPrice: 350.0 },
          { name: "Brand Guidelines", quantity: 1, unitPrice: 500.0 },
        ],
      },
    },
  });

  // Scenario 4: Overdue invoices
  const overdueInvoice1 = await prisma.invoice.create({
    data: {
      invoiceNo: "INV-2025-005",
      issueDate: twoMonthsAgo,
      dueDate: oneMonthAgo,
      status: "overdue",
      total: 4500.0,
      paidAmount: 0,
      currency: "USD",
      clientId: clients[4].id,
      items: {
        create: [
          { name: "E-commerce Platform", quantity: 1, unitPrice: 3500.0 },
          { name: "Payment Integration", quantity: 1, unitPrice: 1000.0 },
        ],
      },
    },
  });

  const overdueInvoice2 = await prisma.invoice.create({
    data: {
      invoiceNo: "INV-2025-006",
      issueDate: oneMonthAgo,
      dueDate: oneWeekAgo,
      status: "overdue",
      total: 1250.0,
      paidAmount: 0,
      currency: "GBP",
      exchangeRate: 1.27,
      clientId: clients[0].id,
      items: {
        create: [
          { name: "Content Management System", quantity: 1, unitPrice: 800.0 },
          { name: "Training Session", quantity: 3, unitPrice: 150.0 },
        ],
      },
    },
  });

  // Scenario 5: Recurring invoices
  const recurringInvoice = await prisma.invoice.create({
    data: {
      invoiceNo: "INV-2025-007-R",
      issueDate: oneMonthAgo,
      dueDate: now,
      status: "paid",
      total: 500.0,
      paidAmount: 500.0,
      currency: "USD",
      isRecurring: true,
      recurringType: "monthly",
      recurringDay: 1,
      recurringEndDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      nextDueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // next month
      clientId: clients[1].id,
      items: {
        create: [
          { name: "Monthly Hosting", quantity: 1, unitPrice: 300.0 },
          { name: "Monthly Maintenance", quantity: 1, unitPrice: 200.0 },
        ],
      },
    },
  });

  // Scenario 6: High-value invoices
  const highValueInvoice = await prisma.invoice.create({
    data: {
      invoiceNo: "INV-2025-008",
      issueDate: oneWeekAgo,
      dueDate: oneMonthFromNow,
      status: "unpaid",
      total: 15000.0,
      paidAmount: 0,
      currency: "USD",
      clientId: clients[2].id,
      items: {
        create: [
          {
            name: "Enterprise Software Development",
            quantity: 1,
            unitPrice: 12000.0,
          },
          { name: "Database Design", quantity: 1, unitPrice: 2000.0 },
          { name: "System Integration", quantity: 1, unitPrice: 1000.0 },
        ],
      },
    },
  });

  // Scenario 7: Multi-currency invoices
  const jpyInvoice = await prisma.invoice.create({
    data: {
      invoiceNo: "INV-2025-009",
      issueDate: oneWeekAgo,
      dueDate: oneWeekFromNow,
      status: "unpaid",
      total: 120000.0, // 120,000 JPY
      paidAmount: 0,
      currency: "JPY",
      exchangeRate: 0.0067,
      clientId: clients[3].id,
      items: {
        create: [
          {
            name: "Japanese Website Localization",
            quantity: 1,
            unitPrice: 80000.0,
          },
          { name: "Cultural Consultation", quantity: 1, unitPrice: 40000.0 },
        ],
      },
    },
  });

  invoices.push(
    paidInvoice1,
    paidInvoice2,
    partialInvoice,
    unpaidInvoice1,
    overdueInvoice1,
    overdueInvoice2,
    recurringInvoice,
    highValueInvoice,
    jpyInvoice
  );

  return invoices;
}

async function createPayments(invoices: any[]) {
  const payments = [];

  // Payments for paid invoices
  const payment1 = await prisma.payment.create({
    data: {
      amount: 1500.0,
      method: "card",
      notes: "Full payment via credit card",
      paidDate: new Date(new Date().getTime() - 20 * 24 * 60 * 60 * 1000),
      invoiceId: invoices[0].id,
    },
  });

  const payment2 = await prisma.payment.create({
    data: {
      amount: 2750.0,
      method: "bank_transfer",
      notes: "Wire transfer payment",
      paidDate: new Date(new Date().getTime() - 50 * 24 * 60 * 60 * 1000),
      invoiceId: invoices[1].id,
    },
  });

  // Partial payments
  const partialPayment1 = await prisma.payment.create({
    data: {
      amount: 800.0,
      method: "check",
      notes: "Partial payment - check #1234",
      paidDate: new Date(new Date().getTime() - 5 * 24 * 60 * 60 * 1000),
      invoiceId: invoices[2].id,
    },
  });

  const partialPayment2 = await prisma.payment.create({
    data: {
      amount: 800.0,
      method: "cash",
      notes: "Second partial payment - cash",
      paidDate: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000),
      invoiceId: invoices[2].id,
    },
  });

  // Recurring invoice payment
  const recurringPayment = await prisma.payment.create({
    data: {
      amount: 500.0,
      method: "card",
      notes: "Automatic monthly payment",
      paidDate: new Date(new Date().getTime() - 25 * 24 * 60 * 60 * 1000),
      invoiceId: invoices[6].id, // recurring invoice
    },
  });

  payments.push(
    payment1,
    payment2,
    partialPayment1,
    partialPayment2,
    recurringPayment
  );

  return payments;
}

async function createAuditLogs() {
  const auditLogs = [];

  // Sample audit logs for various actions
  const logs = [
    {
      action: "create",
      entityType: "invoice",
      entityId: 1,
      userId: 1,
      changes: JSON.stringify({ total: 1500.0, status: "unpaid" }),
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    {
      action: "update",
      entityType: "invoice",
      entityId: 1,
      userId: 1,
      changes: JSON.stringify({ status: { from: "unpaid", to: "paid" } }),
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    {
      action: "create",
      entityType: "payment",
      entityId: 1,
      userId: 1,
      changes: JSON.stringify({ amount: 1500.0, method: "card" }),
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    {
      action: "create",
      entityType: "client",
      entityId: 1,
      userId: 1,
      changes: JSON.stringify({
        name: "ACME Corporation",
        contact: "John Smith",
      }),
      ipAddress: "192.168.1.101",
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
    {
      action: "update",
      entityType: "client",
      entityId: 1,
      userId: 1,
      changes: JSON.stringify({
        address: {
          from: "123 Old St",
          to: "123 Business Ave, New York, NY 10001",
        },
      }),
      ipAddress: "192.168.1.101",
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    },
  ];

  for (const log of logs) {
    const auditLog = await prisma.auditLog.create({
      data: {
        ...log,
        timestamp: new Date(
          new Date().getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000
        ),
      },
    });
    auditLogs.push(auditLog);
  }

  return auditLogs;
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log("🧹 Starting database cleanup...");

  try {
    // Delete in correct order to avoid foreign key constraints
    console.log("Deleting audit logs...");
    const auditLogs = await prisma.auditLog.deleteMany();
    console.log(`✅ Deleted ${auditLogs.count} audit logs`);

    console.log("Deleting payments...");
    const payments = await prisma.payment.deleteMany();
    console.log(`✅ Deleted ${payments.count} payments`);

    console.log("Deleting items...");
    const items = await prisma.item.deleteMany();
    console.log(`✅ Deleted ${items.count} items`);

    console.log("Deleting invoices...");
    const invoices = await prisma.invoice.deleteMany();
    console.log(`✅ Deleted ${invoices.count} invoices`);

    console.log("Deleting users...");
    const users = await prisma.user.deleteMany();
    console.log(`✅ Deleted ${users.count} users`);

    console.log("Deleting clients...");
    const clients = await prisma.client.deleteMany();
    console.log(`✅ Deleted ${clients.count} clients`);

    console.log("🎉 Database cleanup completed successfully!");

    // Reset auto-increment sequences (PostgreSQL specific)
    console.log("Resetting auto-increment sequences...");
    await prisma.$executeRaw`ALTER SEQUENCE "User_id_seq" RESTART WITH 1`;
    await prisma.$executeRaw`ALTER SEQUENCE "Client_id_seq" RESTART WITH 1`;
    await prisma.$executeRaw`ALTER SEQUENCE "Invoice_id_seq" RESTART WITH 1`;
    await prisma.$executeRaw`ALTER SEQUENCE "Item_id_seq" RESTART WITH 1`;
    await prisma.$executeRaw`ALTER SEQUENCE "Payment_id_seq" RESTART WITH 1`;
    await prisma.$executeRaw`ALTER SEQUENCE "AuditLog_id_seq" RESTART WITH 1`;
    console.log("✅ Auto-increment sequences reset");
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    process.exit(1);
  }
}

cleanDatabase()
  .catch((e) => {
    console.error("❌ Database cleanup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("Database connection closed.");
  });

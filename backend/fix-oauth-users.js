const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function fixOAuthUsers() {
  try {
    console.log("🔍 Checking for OAuth users without client records...");

    // Find users with client role but no clientId
    const clientUsersWithoutClient = await prisma.user.findMany({
      where: {
        role: "client",
        clientId: null,
      },
    });

    console.log(
      `Found ${clientUsersWithoutClient.length} users that need client records`
    );

    for (const user of clientUsersWithoutClient) {
      console.log(`\n📝 Processing user: ${user.email} (ID: ${user.id})`);

      // Create a client record for this user
      const newClient = await prisma.client.create({
        data: {
          name: user.username || user.email?.split("@")[0] || "Client",
          contact: user.email || "",
          address: "",
        },
      });

      // Update the user to link to the client
      await prisma.user.update({
        where: { id: user.id },
        data: { clientId: newClient.id },
      });

      console.log(
        `✅ Created client record (ID: ${newClient.id}) for user ${user.email}`
      );
    }

    console.log("\n🎉 All OAuth users now have associated client records!");
  } catch (error) {
    console.error("❌ Error fixing OAuth users:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixOAuthUsers();

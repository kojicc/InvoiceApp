import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Test if the new fields are available
async function testNewFields() {
  try {
    const user = await prisma.user.findFirst({
      select: {
        id: true,
        isEmailVerified: true,
        emailVerificationToken: true,
        googleId: true,
        lastLogin: true,
        passwordResetToken: true,
        passwordResetExpires: true,
      },
    });

    console.log("New fields are available:", user);
  } catch (error) {
    console.error("Error:", error);
  }
}

// Don't run, just check TypeScript compilation
export { testNewFields };

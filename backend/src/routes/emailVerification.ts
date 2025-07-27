import { Router, Request, Response } from "express";
import {
  verifyEmailToken,
  completeEmailVerification,
} from "../services/emailVerification";
import { generateToken } from "../utils/auth";

const router = Router();

// Verify email token (GET request from email link)
router.get("/verify-email", async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        message: "Verification token is required",
      });
    }

    // Verify the token exists and user is not already verified
    const user = await verifyEmailToken(token);

    res.json({
      message: "Email verification token is valid",
      email: user.email,
      username: user.username,
      tokenValid: true,
    });
  } catch (error: any) {
    console.error("Email verification error:", error);
    res.status(400).json({
      message: error.message || "Invalid or expired verification token",
      tokenValid: false,
    });
  }
});

// Complete email verification and set password (POST request)
router.post("/verify-email", async (req: Request, res: Response) => {
  try {
    const { token, password, username } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: "Token and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    // Complete verification and set password
    const { user, message } = await completeEmailVerification(token, password);

    // Update username if provided
    if (username && username !== user.username) {
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();

      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { username },
        });
        user.username = username;
      } catch (usernameError) {
        // Username might already exist, continue with default
        console.warn("Could not update username:", usernameError);
      }
    }

    // Generate JWT token for automatic login
    const authToken = generateToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    res.json({
      message,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      token: authToken,
    });
  } catch (error: any) {
    console.error("Email verification completion error:", error);
    res.status(400).json({
      message: error.message || "Failed to complete email verification",
    });
  }
});

// Resend verification email
router.post("/resend-verification", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient();

    // Find user with unverified email
    const user = await prisma.user.findFirst({
      where: {
        email,
        isEmailVerified: false,
      },
      include: {
        client: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found or email already verified",
      });
    }

    // Generate new verification token
    const { generateVerificationToken, sendClientVerificationEmail } =
      await import("../services/emailVerification");
    const verificationToken = generateVerificationToken();

    // Update user with new token
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken: verificationToken },
    });

    // Send verification email
    await sendClientVerificationEmail(
      user.email,
      user.client?.name || user.username,
      verificationToken
    );

    res.json({
      message: "Verification email sent successfully",
    });
  } catch (error: any) {
    console.error("Resend verification error:", error);
    res.status(500).json({
      message: "Failed to resend verification email",
    });
  }
});

export default router;

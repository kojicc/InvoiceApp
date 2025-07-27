import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// Google OAuth login
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  async (req, res) => {
    try {
      const user = req.user as any;

      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET!;
      console.log(
        "🔑 OAuth: Using JWT_SECRET for token generation:",
        jwtSecret.substring(0, 10) + "..."
      );

      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          clientId: user.clientId,
        },
        jwtSecret,
        { expiresIn: "7d" }
      );

      console.log("✅ OAuth token generated successfully for user:", user.id);

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      res.redirect(`${frontendUrl}/auth/oauth-callback?token=${token}`);
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.redirect("/login?error=oauth_error");
    }
  }
);

// OAuth logout
router.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Logout failed" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

export default router;

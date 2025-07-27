import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { hashPassword, comparePassword, generateToken } from "../utils/auth";

const router = Router();
const prisma = new PrismaClient();

// Register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Only allow "client" and "admin" roles
    const validRole = role === "admin" ? "admin" : "client";

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: { username, email, password: hashedPassword, role: validRole },
    });

    const token = generateToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    res.json({
      message: "User registered successfully",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: "User not found" });

    // Check if user has a password (not OAuth-only user)
    if (!user.password) {
      return res.status(400).json({
        message:
          "This account was created with OAuth. Please log in using Google or set up a password.",
      });
    }

    // Check if email is verified for new users
    if (!user.isEmailVerified) {
      return res.status(400).json({
        message: "Please verify your email before logging in.",
      });
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
});

export default router;

import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { hashPassword, comparePassword, generateToken } from "../utils/auth";

const router = Router();
const prisma = new PrismaClient();

// Register
router.post("/register", async (req, res) => {
  const { username, email, password, role } = req.body;
  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: { username, email, password: hashedPassword, role: role || "user" },
  });

  res.json({
    message: "User registered",
    user: { id: user.id, username: user.username },
  });
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ message: "User not found" });

  const isValid = await comparePassword(password, user.password);
  if (!isValid) return res.status(401).json({ message: "Invalid credentials" });

  const token = generateToken({ id: user.id, role: user.role });
  res.json({ token, role: user.role, username: user.username });
});

export default router;

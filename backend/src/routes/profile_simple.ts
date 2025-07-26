import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/auth";
import { hashPassword, comparePassword } from "../utils/auth";

const router = Router();
const prisma = new PrismaClient();

// Get user profile
router.get("/profile", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;

    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(userData);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Error fetching profile" });
  }
});

// Update user profile
router.put("/profile", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { username, email, currentPassword, newPassword } = req.body;

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: user.userId },
    });

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prepare update data
    const updateData: any = {};

    if (username && username !== currentUser.username) {
      updateData.username = username;
    }

    if (email && email !== currentUser.email) {
      // Check if email is already taken
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== user.userId) {
        return res.status(400).json({ message: "Email already in use" });
      }

      updateData.email = email;
    }

    // Handle password change
    if (currentPassword && newPassword) {
      const isValidPassword = await comparePassword(
        currentPassword,
        currentUser.password
      );
      if (!isValidPassword) {
        return res
          .status(400)
          .json({ message: "Current password is incorrect" });
      }

      updateData.password = await hashPassword(newPassword);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Error updating profile" });
  }
});

export default router;

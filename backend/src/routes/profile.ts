import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/auth";
import { hashPassword, comparePassword } from "../utils/auth";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();
const prisma = new PrismaClient();

// Configure multer for avatar uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads/avatars");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const user = (req as any).user;
    const extension = path.extname(file.originalname);
    cb(null, `avatar-${user.userId}-${Date.now()}${extension}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Get user profile
router.get("/", authenticate, async (req, res) => {
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

    // Check if avatar file exists
    const avatarDir = path.join(__dirname, "../../uploads/avatars");
    const avatarFiles = fs.existsSync(avatarDir)
      ? fs
          .readdirSync(avatarDir)
          .filter((file) => file.startsWith(`avatar-${user.userId}-`))
      : [];

    const avatarUrl =
      avatarFiles.length > 0
        ? `/uploads/avatars/${avatarFiles[avatarFiles.length - 1]}`
        : null;

    res.json({
      ...userData,
      avatarUrl,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Error fetching profile" });
  }
});

// Update user profile
router.put("/", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { username, email, newPassword } = req.body;

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

    // Handle password change (no current password required)
    if (newPassword) {
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

// Upload avatar
router.post(
  "/avatar",
  authenticate,
  upload.single("avatar"),
  async (req, res) => {
    try {
      const user = (req as any).user;

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Delete old avatar files
      const avatarDir = path.join(__dirname, "../../uploads/avatars");
      if (fs.existsSync(avatarDir)) {
        const oldFiles = fs
          .readdirSync(avatarDir)
          .filter((file) => file.startsWith(`avatar-${user.userId}-`));

        oldFiles.forEach((file) => {
          if (file !== req.file!.filename) {
            fs.unlinkSync(path.join(avatarDir, file));
          }
        });
      }

      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      res.json({
        message: "Avatar uploaded successfully",
        avatarUrl,
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
      res.status(500).json({ message: "Error uploading avatar" });
    }
  }
);

// Serve avatar files
router.get("/uploads/avatars/:filename", (req, res) => {
  const filename = req.params.filename;
  const filepath = path.join(__dirname, "../../uploads/avatars", filename);

  if (fs.existsSync(filepath)) {
    res.sendFile(filepath);
  } else {
    res.status(404).json({ message: "Avatar not found" });
  }
});

export default router;

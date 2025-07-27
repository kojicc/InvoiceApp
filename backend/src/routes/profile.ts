import { Router, Request, Response, NextFunction } from "express";
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
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
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
        client: {
          select: {
            id: true,
            name: true,
            contact: true,
            address: true,
          },
        },
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
        ? `/uploads/avatars/${
            avatarFiles[avatarFiles.length - 1]
          }?v=${Date.now()}`
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
    const { username, email, newPassword, address } = req.body;

    // Get current user data
    const currentUser = await prisma.user.findUnique({
      where: { id: user.userId },
      include: { client: true },
    });

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prepare update data for user
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

    // Handle address update for client users
    if (
      address !== undefined &&
      currentUser.role === "client" &&
      currentUser.clientId
    ) {
      await prisma.client.update({
        where: { id: currentUser.clientId },
        data: { address },
      });
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
        client: {
          select: {
            id: true,
            name: true,
            contact: true,
            address: true,
          },
        },
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

// Multer error handling middleware
const handleMulterError = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "File too large. Maximum file size is 5MB.",
        error: "FILE_TOO_LARGE",
        maxSize: "5MB",
      });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        message: "Too many files. Only one file is allowed.",
        error: "TOO_MANY_FILES",
      });
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return res.status(400).json({
        message: "Unexpected field name. Use 'avatar' as field name.",
        error: "UNEXPECTED_FIELD",
      });
    }
    return res.status(400).json({
      message: "File upload error: " + err.message,
      error: "UPLOAD_ERROR",
    });
  }
  next(err);
};

// Upload avatar
router.post(
  "/avatar",
  authenticate,
  upload.single("avatar"),
  handleMulterError,
  async (req: Request, res: Response) => {
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

      const avatarUrl = `/uploads/avatars/${req.file.filename}?v=${Date.now()}`;

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

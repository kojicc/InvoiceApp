import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate, authorize } from "../middleware/auth";
import { generateVerificationToken, sendClientVerificationEmail } from "../services/emailVerification";

const router = Router();
const prisma = new PrismaClient();

// Create client (admin only)
router.post("/", authenticate, authorize(["admin"]), async (req, res) => {
  try {
    const { name, contact, address, email } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ 
        message: "Name and email are required" 
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: "A user with this email already exists" 
      });
    }

    // Create client first
    const client = await prisma.client.create({ 
      data: { name, contact, address } 
    });

    // Generate verification token
    const verificationToken = generateVerificationToken();

    // Create user account for the client
    const user = await prisma.user.create({
      data: {
        username: email.split('@')[0], // Use email prefix as initial username
        email,
        role: "client",
        clientId: client.id,
        isEmailVerified: false,
        emailVerificationToken: verificationToken,
      },
    });

    // Send verification email
    try {
      await sendClientVerificationEmail(email, name, verificationToken);
      
      res.status(201).json({
        client,
        message: "Client created successfully. Verification email sent.",
        emailSent: true,
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      
      // Client and user were created, but email failed
      res.status(201).json({
        client,
        message: "Client created successfully, but verification email failed to send.",
        emailSent: false,
        warning: "Please manually send verification instructions to the client.",
      });
    }

  } catch (error) {
    console.error("Error creating client:", error);
    res.status(500).json({ 
      message: "Error creating client",
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// Get all clients (admin only)
router.get("/", authenticate, authorize(["admin"]), async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      include: {
        invoices: {
          select: {
            id: true,
            status: true,
            total: true,
            dueDate: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ message: "Error fetching clients" });
  }
});

// Update client
router.put("/:id", authenticate, authorize(["admin"]), async (req, res) => {
  const client = await prisma.client.update({
    where: { id: Number(req.params.id) },
    data: req.body,
  });
  res.json(client);
});

// Delete client
router.delete("/:id", authenticate, authorize(["admin"]), async (req, res) => {
  await prisma.client.delete({ where: { id: Number(req.params.id) } });
  res.json({ message: "Client deleted" });
});

export default router;

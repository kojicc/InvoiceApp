import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate, authorize } from "../middleware/auth";
import {
  generateVerificationToken,
  sendClientVerificationEmail,
} from "../services/emailVerification";

const router = Router();
const prisma = new PrismaClient();

// Create client (admin only)
router.post("/", authenticate, authorize(["admin"]), async (req, res) => {
  try {
    const { name, contact, address, email } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        message: "Name and email are required",
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "A user with this email already exists",
      });
    }

    // Create client first
    const client = await prisma.client.create({
      data: { name, contact, address },
    });

    // Generate verification token
    const verificationToken = generateVerificationToken();

    // Create user account for the client
    const user = await prisma.user.create({
      data: {
        username: email.split("@")[0], // Use email prefix as initial username
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
        message:
          "Client created successfully, but verification email failed to send.",
        emailSent: false,
        warning:
          "Please manually send verification instructions to the client.",
      });
    }
  } catch (error) {
    console.error("Error creating client:", error);
    res.status(500).json({
      message: "Error creating client",
      error: process.env.NODE_ENV === "development" ? error : undefined,
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

// Get client invoices
router.get(
  "/:id/invoices",
  authenticate,
  authorize(["admin"]),
  async (req, res) => {
    try {
      const clientId = Number(req.params.id);

      const invoices = await prisma.invoice.findMany({
        where: { clientId },
        include: {
          items: true,
          payments: true,
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(invoices);
    } catch (error) {
      console.error("Error fetching client invoices:", error);
      res.status(500).json({ message: "Error fetching client invoices" });
    }
  }
);

// Delete client
router.delete("/:id", authenticate, authorize(["admin"]), async (req, res) => {
  try {
    const clientId = Number(req.params.id);

    // Check if client has any unpaid invoices
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        clientId: clientId,
        status: {
          in: ["unpaid", "overdue", "pending"],
        },
      },
      select: {
        id: true,
        invoiceNo: true,
        status: true,
        total: true,
      },
    });

    if (unpaidInvoices.length > 0) {
      return res.status(400).json({
        message: "Cannot delete client with unpaid invoices",
        error: "UNPAID_INVOICES_EXIST",
        unpaidInvoices: unpaidInvoices,
        details: `Client has ${unpaidInvoices.length} unpaid invoice(s). Please settle all invoices before deletion.`,
      });
    }

    // Check if client has any associated data that would be affected
    const clientData = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        invoices: {
          include: {
            items: true,
            payments: true,
          },
        },
        users: true,
      },
    });

    if (!clientData) {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    // Check total data that will be deleted
    const totalInvoices = clientData.invoices.length;
    const totalItems = clientData.invoices.reduce(
      (sum, invoice) => sum + invoice.items.length,
      0
    );
    const totalPayments = clientData.invoices.reduce(
      (sum, invoice) => sum + invoice.payments.length,
      0
    );
    const totalUsers = clientData.users.length;

    // Use transaction to delete all related data
    await prisma.$transaction(async (tx) => {
      // Delete all items for client's invoices
      for (const invoice of clientData.invoices) {
        await tx.item.deleteMany({
          where: { invoiceId: invoice.id },
        });
      }

      // Delete all payments for client's invoices
      for (const invoice of clientData.invoices) {
        await tx.payment.deleteMany({
          where: { invoiceId: invoice.id },
        });
      }

      // Delete all invoices
      await tx.invoice.deleteMany({
        where: { clientId: clientId },
      });

      // Delete all users associated with this client
      await tx.user.deleteMany({
        where: { clientId: clientId },
      });

      // Finally delete the client
      await tx.client.delete({
        where: { id: clientId },
      });
    });

    res.json({
      message: "Client and all associated data deleted successfully",
      deletedData: {
        client: clientData.name,
        invoices: totalInvoices,
        items: totalItems,
        payments: totalPayments,
        users: totalUsers,
      },
    });
  } catch (error: any) {
    console.error("Error deleting client:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        message: "Client not found",
      });
    }

    if (error.code === "P2003") {
      return res.status(400).json({
        message: "Cannot delete client due to existing references",
        error: "FOREIGN_KEY_CONSTRAINT",
        details:
          "This client has associated data that prevents deletion. Please contact support.",
      });
    }

    res.status(500).json({
      message: "Error deleting client",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export default router;

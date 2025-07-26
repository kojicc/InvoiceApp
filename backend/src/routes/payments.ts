import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// Add payment to invoice
router.post("/", authenticate, async (req, res) => {
  try {
    const { invoiceId, amount, method, notes } = req.body;

    // Get current invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Calculate current paid amount from existing payments
    const existingPayments = await prisma.payment.findMany({
      where: { invoiceId: invoiceId },
    });
    const currentPaidAmount = existingPayments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const newPaidAmount = currentPaidAmount + amount;

    // Validate payment amount
    if (newPaidAmount > invoice.total) {
      return res.status(400).json({
        message: "Payment amount exceeds remaining balance",
      });
    }

    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        amount,
        method,
        notes,
        invoiceId,
        paidDate: new Date(),
      },
    });

    // Update invoice status and paid amount
    const newStatus =
      newPaidAmount >= invoice.total ? "paid" : "partially_paid";

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: newStatus,
        paidAmount: newPaidAmount,
      },
    });

    res.json(payment);
  } catch (error) {
    console.error("Error adding payment:", error);
    res.status(500).json({ message: "Failed to add payment" });
  }
});

// Get payments for an invoice
router.get("/invoice/:invoiceId", authenticate, async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Get payments from database
    const payments = await prisma.payment.findMany({
      where: { invoiceId: parseInt(invoiceId) },
      orderBy: { paidDate: "desc" },
    });

    res.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ message: "Failed to fetch payments" });
  }
});

// Delete payment
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Find payment in database
    const payment = await prisma.payment.findUnique({
      where: { id: parseInt(id) },
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Delete payment from database
    await prisma.payment.delete({
      where: { id: parseInt(id) },
    });

    // Recalculate invoice status
    const remainingPayments = await prisma.payment.findMany({
      where: { invoiceId: payment.invoiceId },
    });
    const newPaidAmount = remainingPayments.reduce(
      (sum, p) => sum + p.amount,
      0
    );

    // Get invoice to check total
    const invoice = await prisma.invoice.findUnique({
      where: { id: payment.invoiceId },
    });

    if (invoice) {
      const newStatus =
        newPaidAmount <= 0
          ? "unpaid"
          : newPaidAmount >= invoice.total
          ? "paid"
          : "partially_paid";

      await prisma.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          status: newStatus,
          paidAmount: newPaidAmount,
        },
      });
    }

    res.json({ message: "Payment deleted successfully" });
  } catch (error) {
    console.error("Error deleting payment:", error);
    res.status(500).json({ message: "Failed to delete payment" });
  }
});

export default router;

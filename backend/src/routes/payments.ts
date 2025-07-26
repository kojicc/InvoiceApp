import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// Mock payment data store (replace with database once Prisma client is updated)
let mockPayments: any[] = [
  {
    id: 1,
    invoiceId: 1,
    amount: 500.0,
    method: "card",
    notes: "Initial payment",
    paidDate: new Date("2025-01-15"),
    createdAt: new Date("2025-01-15"),
  },
  {
    id: 2,
    invoiceId: 1,
    amount: 300.0,
    method: "cash",
    notes: "Partial payment",
    paidDate: new Date("2025-01-20"),
    createdAt: new Date("2025-01-20"),
  },
];

let nextPaymentId = 3;

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

    // Calculate current paid amount from mock payments
    const existingPayments = mockPayments.filter(
      (p) => p.invoiceId === invoiceId
    );
    const currentPaidAmount = existingPayments.reduce(
      (sum: number, payment: any) => sum + payment.amount,
      0
    );
    const newPaidAmount = currentPaidAmount + amount;

    // Validate payment amount
    if (newPaidAmount > invoice.total) {
      return res.status(400).json({
        message: "Payment amount exceeds remaining balance",
      });
    }

    // Create payment record in mock store
    const payment = {
      id: nextPaymentId++,
      amount,
      method,
      notes,
      invoiceId,
      paidDate: new Date(),
      createdAt: new Date(),
    };

    mockPayments.push(payment);

    // Update invoice status (simplified - not updating paidAmount field until schema is fixed)
    const newStatus =
      newPaidAmount >= invoice.total ? "paid" : "partially_paid";

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: newStatus,
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

    // Get payments from mock store
    const payments = mockPayments
      .filter((p) => p.invoiceId === Number(invoiceId))
      .sort(
        (a, b) =>
          new Date(b.paidDate).getTime() - new Date(a.paidDate).getTime()
      );

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

    // Find payment in mock store
    const paymentIndex = mockPayments.findIndex((p) => p.id === Number(id));

    if (paymentIndex === -1) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const payment = mockPayments[paymentIndex];

    // Remove payment from mock store
    mockPayments.splice(paymentIndex, 1);

    // Recalculate invoice status
    const remainingPayments = mockPayments.filter(
      (p) => p.invoiceId === payment.invoiceId
    );
    const newPaidAmount = remainingPayments.reduce(
      (sum: number, p: any) => sum + p.amount,
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

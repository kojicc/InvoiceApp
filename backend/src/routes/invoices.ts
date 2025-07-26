import dayjs from "dayjs";
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate, authorize } from "../middleware/auth";
import PDFDocument from "pdfkit";
import fs from "fs";

const router = Router();
const prisma = new PrismaClient();

// Get all invoices (role-based access)
router.get("/", authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    let invoices;

    if (user.role === "admin") {
      // Admin can see all invoices
      invoices = await prisma.invoice.findMany({
        include: {
          client: true,
          items: true,
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (user.role === "client") {
      // Client can only see their own invoices
      // Get the user's associated clientId
      const userRecord = await prisma.user.findUnique({
        where: { id: user.userId },
        include: { client: true },
      });

      if (!userRecord || !userRecord.clientId) {
        return res.status(404).json({ message: "No associated client found" });
      }

      invoices = await prisma.invoice.findMany({
        where: { clientId: userRecord.clientId },
        include: {
          client: true,
          items: true,
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    res.json(invoices);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ message: "Error fetching invoices" });
  }
});

// Create Invoice (admin only)
router.post("/", authenticate, authorize(["admin"]), async (req, res) => {
  try {
    const {
      issueDate,
      dueDate,
      clientId,
      items,
      isRecurring,
      recurringType,
      recurringDay,
    } = req.body;
    const invoiceNo = "INV-" + Date.now();

    const total = items.reduce(
      (sum: number, item: any) => sum + item.quantity * item.unitPrice,
      0
    );

    const invoiceData: any = {
      invoiceNo,
      issueDate: new Date(issueDate),
      dueDate: new Date(dueDate),
      clientId,
      total,
      items: { create: items },
    };

    // Add recurring fields if specified
    if (isRecurring) {
      invoiceData.isRecurring = true;
      invoiceData.recurringType = recurringType;
      invoiceData.recurringDay = recurringDay;

      // Calculate next due date based on recurring type
      const nextDue = new Date(dueDate);
      switch (recurringType) {
        case "weekly":
          nextDue.setDate(nextDue.getDate() + 7);
          break;
        case "monthly":
          nextDue.setMonth(nextDue.getMonth() + 1);
          break;
        case "quarterly":
          nextDue.setMonth(nextDue.getMonth() + 3);
          break;
        case "yearly":
          nextDue.setFullYear(nextDue.getFullYear() + 1);
          break;
      }
      invoiceData.nextDueDate = nextDue;
    }

    const invoice = await prisma.invoice.create({
      data: invoiceData,
      include: {
        items: true,
        client: true,
      },
    });

    res.json(invoice);
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).json({ message: "Error creating invoice" });
  }
});

// Update Invoice Status (admin only)
router.patch(
  "/:id/status",
  authenticate,
  authorize(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const invoice = await prisma.invoice.update({
        where: { id: parseInt(id) },
        data: { status },
        include: { client: true, items: true },
      });

      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice status:", error);
      res.status(500).json({ message: "Error updating invoice status" });
    }
  }
);

// Generate PDF
router.get("/:id/pdf", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(id) },
      include: { client: true, items: true },
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Check if client has access to this specific invoice
    if (user.role === "client") {
      // Get the user's associated clientId
      const userRecord = await prisma.user.findUnique({
        where: { id: user.userId },
        include: { client: true },
      });

      if (
        !userRecord ||
        !userRecord.clientId ||
        invoice.clientId !== userRecord.clientId
      ) {
        return res
          .status(403)
          .json({ message: "Access denied to this invoice" });
      }
    }

    // Generate PDF
    const doc = new PDFDocument();
    const fileName = `invoice-${invoice.id}.pdf`;
    const filePath = `./invoices/${fileName}`;

    // Ensure directory exists
    if (!fs.existsSync("./invoices")) {
      fs.mkdirSync("./invoices");
    }

    doc.pipe(fs.createWriteStream(filePath));

    // PDF Content
    doc.fontSize(20).text("INVOICE", { align: "center" });
    doc.moveDown();

    doc.fontSize(14).text(`Invoice No: ${invoice.invoiceNo}`);
    doc.text(`Issue Date: ${dayjs(invoice.issueDate).format("MMM DD, YYYY")}`);
    doc.text(`Due Date: ${dayjs(invoice.dueDate).format("MMM DD, YYYY")}`);
    doc.text(`Status: ${invoice.status.toUpperCase()}`);
    doc.moveDown();

    doc.text(`Client: ${invoice.client.name}`);
    doc.text(`Contact: ${invoice.client.contact}`);
    doc.text(`Address: ${invoice.client.address}`);
    doc.moveDown();

    // Items table
    doc.text("Items:", { underline: true });
    invoice.items.forEach((item: any) => {
      doc.text(
        `${item.name} - Qty: ${item.quantity} x $${item.unitPrice} = $${(
          item.quantity * item.unitPrice
        ).toFixed(2)}`
      );
    });
    doc.moveDown();

    doc
      .fontSize(16)
      .text(`Total: $${invoice.total.toFixed(2)}`, { align: "right" });

    if (invoice.paidAmount > 0) {
      doc.text(`Paid: $${invoice.paidAmount.toFixed(2)}`, { align: "right" });
      doc.text(`Balance: $${(invoice.total - invoice.paidAmount).toFixed(2)}`, {
        align: "right",
      });
    }

    doc.end();

    // Wait a bit for file to be written
    setTimeout(() => {
      res.download(filePath, fileName, (err) => {
        if (err) {
          console.error("Error downloading file:", err);
          res.status(500).json({ message: "Error generating PDF" });
        }
        // Clean up file after download
        setTimeout(() => {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }, 1000);
      });
    }, 500);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ message: "Error generating PDF" });
  }
});

// Add Payment (admin only for now)
router.post(
  "/:id/payments",
  authenticate,
  authorize(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, method, notes } = req.body;

      const invoice = await prisma.invoice.findUnique({
        where: { id: parseInt(id) },
      });

      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Create payment
      const payment = await prisma.payment.create({
        data: {
          amount: parseFloat(amount),
          method,
          notes,
          invoiceId: parseInt(id),
        },
      });

      // Update invoice paid amount
      const newPaidAmount = invoice.paidAmount + parseFloat(amount);
      const newStatus =
        newPaidAmount >= invoice.total ? "paid" : "partially_paid";

      const updatedInvoice = await prisma.invoice.update({
        where: { id: parseInt(id) },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
        },
        include: { client: true, items: true },
      });

      res.json({ payment, invoice: updatedInvoice });
    } catch (error) {
      console.error("Error adding payment:", error);
      res.status(500).json({ message: "Error adding payment" });
    }
  }
);

// Get payments for an invoice
router.get("/:id/payments", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(id) },
      include: { client: true },
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Check access for clients
    if (user.role === "client") {
      const client = await prisma.client.findFirst({
        where: {
          OR: [
            { contact: user.email },
            { contact: { contains: user.email.split("@")[1] } },
          ],
        },
      });

      if (!client || invoice.clientId !== client.id) {
        return res
          .status(403)
          .json({ message: "Access denied to this invoice" });
      }
    }

    const payments = await prisma.payment.findMany({
      where: { invoiceId: parseInt(id) },
      orderBy: { paidDate: "desc" },
    });

    res.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    res.status(500).json({ message: "Error fetching payments" });
  }
});

export default router;

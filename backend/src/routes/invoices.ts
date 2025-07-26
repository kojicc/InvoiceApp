import dayjs from "dayjs";
import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/auth";
import PDFDocument from "pdfkit";
import fs from "fs";

const router = Router();
const prisma = new PrismaClient();

// Create Invoice
router.post("/", authenticate, async (req, res) => {
  const { issueDate, dueDate, clientId, items } = req.body;
  const invoiceNo = "INV-" + Date.now();

  const total = items.reduce(
    (sum: number, item: any) => sum + item.quantity * item.unitPrice,
    0
  );

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNo,
      issueDate: new Date(issueDate),
      dueDate: new Date(dueDate),
      clientId,
      total,
      items: { create: items },
    },
    include: { items: true },
  });

  res.json(invoice);
});

// Get all invoices
router.get("/", authenticate, async (req, res) => {
  const invoices = await prisma.invoice.findMany({ include: { client: true } });
  res.json(invoices);
});

// Mark Paid/Unpaid
router.patch("/:id/status", authenticate, async (req, res) => {
  const { status } = req.body;
  const invoice = await prisma.invoice.update({
    where: { id: Number(req.params.id) },
    data: { status },
  });
  res.json(invoice);
});

// Generate Invoice PDF
router.get("/:id/pdf", authenticate, async (req, res) => {
  const invoiceId = Number(req.params.id);
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { client: true, items: true },
  });

  if (!invoice) {
    return res.status(404).json({ message: "Invoice not found" });
  }

  const doc = new PDFDocument();
  const filePath = `./invoices/invoice-${invoiceId}.pdf`;

  // Create the PDF file
  doc.pipe(fs.createWriteStream(filePath));

  // Add content to the PDF
  doc.fontSize(20).text(`Invoice #${invoice.invoiceNo}`, { align: "center" });
  doc.fontSize(12).text(`Client: ${invoice.client.name}`);
  doc.text(`Date: ${new Date(invoice.issueDate).toLocaleDateString()}`);
  doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`);
  doc.text(`Status: ${invoice.status}`);

  // List of items
  doc.text("\nItems:\n");
  invoice.items.forEach((item) => {
    doc.text(`- ${item.name} x${item.quantity} @ ${item.unitPrice}`);
  });

  doc.text(`\nTotal: $${invoice.total}`);

  // Finalize PDF document
  doc.end();

  // Wait for PDF to be created and then return the file
  doc.on("finish", () => {
    res.download(filePath, (err) => {
      if (err) {
        return res.status(500).json({ message: "Error downloading PDF" });
      }
    });
  });
});

router.get("/overdue", authenticate, async (req, res) => {
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: "unpaid",
      dueDate: {
        lt: dayjs().toDate(), // Check if the due date is in the past
      },
    },
  });

  res.json(overdueInvoices);
});

export default router;

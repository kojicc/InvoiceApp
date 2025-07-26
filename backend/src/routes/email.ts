import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// Mock email service - in a real app, you'd use SendGrid, Nodemailer, etc.
const sendEmailMock = async (
  to: string,
  subject: string,
  body: string,
  attachments?: any[]
) => {
  // Simulate email sending delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log(`Mock Email Sent:
    To: ${to}
    Subject: ${subject}
    Body: ${body}
    Attachments: ${attachments?.length || 0}
  `);

  return {
    success: true,
    messageId: `mock-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
};

// Send invoice via email
router.post("/send-invoice/:invoiceId", authenticate, async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const {
      recipientEmail,
      subject,
      message,
      includeAttachment = true,
    } = req.body;

    // Get invoice details
    const invoice = await prisma.invoice.findUnique({
      where: { id: Number(invoiceId) },
      include: {
        client: true,
        items: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    // Use client email if no recipient specified
    const emailTo = recipientEmail || invoice.client.contact;

    // Generate email content
    const emailSubject =
      subject || `Invoice ${invoice.invoiceNo} from Your Company`;
    const emailBody =
      message ||
      `
Dear ${invoice.client.name},

Please find attached invoice ${invoice.invoiceNo} for your review.

Invoice Details:
- Invoice Number: ${invoice.invoiceNo}
- Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}
- Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}
- Total Amount: $${invoice.total.toFixed(2)}
- Status: ${invoice.status}

Items:
${invoice.items
  .map((item) => `- ${item.name} x${item.quantity} @ $${item.unitPrice}`)
  .join("\n")}

Please process payment by the due date to avoid any late fees.

Best regards,
Your Company Name
    `;

    // Mock sending email
    const emailResult = await sendEmailMock(
      emailTo,
      emailSubject,
      emailBody,
      includeAttachment ? [`invoice-${invoice.id}.pdf`] : []
    );

    res.json({
      success: true,
      message: "Invoice email sent successfully",
      emailResult,
      sentTo: emailTo,
    });
  } catch (error) {
    console.error("Error sending invoice email:", error);
    res.status(500).json({ message: "Failed to send invoice email" });
  }
});

// Preview email content
router.get("/preview-invoice/:invoiceId", authenticate, async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id: Number(invoiceId) },
      include: {
        client: true,
        items: true,
      },
    });

    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const preview = {
      to: invoice.client.contact,
      subject: `Invoice ${invoice.invoiceNo} from Your Company`,
      body: `
Dear ${invoice.client.name},

Please find attached invoice ${invoice.invoiceNo} for your review.

Invoice Details:
- Invoice Number: ${invoice.invoiceNo}
- Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}
- Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}
- Total Amount: $${invoice.total.toFixed(2)}
- Status: ${invoice.status}

Items:
${invoice.items
  .map((item) => `- ${item.name} x${item.quantity} @ $${item.unitPrice}`)
  .join("\n")}

Please process payment by the due date to avoid any late fees.

Best regards,
Your Company Name
      `,
    };

    res.json(preview);
  } catch (error) {
    console.error("Error generating email preview:", error);
    res.status(500).json({ message: "Failed to generate email preview" });
  }
});

// Get email history for an invoice (mock)
router.get("/history/:invoiceId", authenticate, async (req, res) => {
  try {
    const { invoiceId } = req.params;

    // Mock email history - in a real app, you'd store this in the database
    const mockHistory = [
      {
        id: 1,
        sentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        recipient: "client@example.com",
        subject: `Invoice INV-${invoiceId} from Your Company`,
        status: "delivered",
      },
      {
        id: 2,
        sentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        recipient: "client@example.com",
        subject: `Reminder: Invoice INV-${invoiceId}`,
        status: "opened",
      },
    ];

    res.json(mockHistory);
  } catch (error) {
    console.error("Error fetching email history:", error);
    res.status(500).json({ message: "Failed to fetch email history" });
  }
});

export default router;

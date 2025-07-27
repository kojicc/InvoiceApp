import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/auth";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const router = Router();
const prisma = new PrismaClient();

// Create nodemailer transporter with Gmail SMTP
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_HOST_USER,
      pass: process.env.EMAIL_HOST_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

// Real email service using nodemailer
const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string,
  attachments?: any[]
) => {
  try {
    const transporter = createEmailTransporter();

    const mailOptions = {
      from: `"Invoice System" <${process.env.EMAIL_HOST_USER}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML for text version
      html,
      attachments: attachments || [],
    };

    const result = await transporter.sendMail(mailOptions);

    console.log(`Email sent successfully:
      To: ${to}
      Subject: ${subject}
      Message ID: ${result.messageId}
    `);

    return {
      success: true,
      messageId: result.messageId,
      timestamp: new Date().toISOString(),
      response: result.response,
    };
  } catch (error) {
    console.error("Email sending failed:", error);
    throw error;
  }
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
      subject || `Invoice ${invoice.invoiceNo} from Invoice Management System`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoice.invoiceNo}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .invoice-details { background-color: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .items-table th, .items-table td { border: 1px solid #dee2e6; padding: 8px; text-align: left; }
        .items-table th { background-color: #f8f9fa; }
        .total { font-size: 1.2em; font-weight: bold; color: #28a745; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 0.9em; color: #6c757d; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Invoice ${invoice.invoiceNo}</h2>
            <p>Dear ${invoice.client.name},</p>
            <p>Please find below the details for invoice ${
              invoice.invoiceNo
            }.</p>
        </div>

        <div class="invoice-details">
            <h3>Invoice Information</h3>
            <table style="width: 100%;">
                <tr><td><strong>Invoice Number:</strong></td><td>${
                  invoice.invoiceNo
                }</td></tr>
                <tr><td><strong>Issue Date:</strong></td><td>${new Date(
                  invoice.issueDate
                ).toLocaleDateString()}</td></tr>
                <tr><td><strong>Due Date:</strong></td><td>${new Date(
                  invoice.dueDate
                ).toLocaleDateString()}</td></tr>
                <tr><td><strong>Status:</strong></td><td><span style="padding: 4px 8px; border-radius: 4px; background-color: ${
                  invoice.status === "paid"
                    ? "#d4edda"
                    : invoice.status === "overdue"
                    ? "#f8d7da"
                    : "#fff3cd"
                }; color: ${
      invoice.status === "paid"
        ? "#155724"
        : invoice.status === "overdue"
        ? "#721c24"
        : "#856404"
    };">${invoice.status.toUpperCase()}</span></td></tr>
            </table>
        </div>

        <div class="invoice-details">
            <h3>Items</h3>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoice.items
                      .map(
                        (item) => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.quantity}</td>
                            <td>$${item.unitPrice.toFixed(2)}</td>
                            <td>$${(item.quantity * item.unitPrice).toFixed(
                              2
                            )}</td>
                        </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>
            <div style="text-align: right; margin-top: 15px;">
                <span class="total">Total Amount: $${invoice.total.toFixed(
                  2
                )}</span>
            </div>
        </div>

        ${
          message
            ? `<div class="invoice-details"><h3>Additional Message</h3><p>${message}</p></div>`
            : ""
        }

        <div class="footer">
            <p>Please process payment by the due date to avoid any late fees.</p>
            <p>If you have any questions about this invoice, please contact us.</p>
            <br>
            <p><strong>Best regards,</strong><br>Invoice Management System</p>
        </div>
    </div>
</body>
</html>
    `;

    // Send email using real SMTP
    const emailResult = await sendEmail(
      emailTo,
      emailSubject,
      emailHtml,
      undefined, // text version will be auto-generated
      includeAttachment ? [] : [] // TODO: Add PDF attachment support later
    );

    res.json({
      success: true,
      message: "Invoice email sent successfully",
      emailResult,
      sentTo: emailTo,
    });
  } catch (error: any) {
    console.error("Error sending invoice email:", error);
    res.status(500).json({
      message: "Failed to send invoice email",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Test email configuration
router.post("/test", authenticate, async (req, res) => {
  try {
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({ message: "Recipient email is required" });
    }

    const testHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Email Test</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #28a745; color: white; padding: 20px; border-radius: 8px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>✅ Email Configuration Test</h2>
            <p>Your email system is working correctly!</p>
        </div>
        <p>This is a test email to verify that your Gmail SMTP configuration is working properly.</p>
        <p><strong>Test Details:</strong></p>
        <ul>
            <li>SMTP Host: ${process.env.EMAIL_HOST}</li>
            <li>SMTP Port: ${process.env.EMAIL_PORT}</li>
            <li>From: ${process.env.EMAIL_HOST_USER}</li>
            <li>Timestamp: ${new Date().toISOString()}</li>
        </ul>
        <p>Best regards,<br>Invoice Management System</p>
    </div>
</body>
</html>
    `;

    const emailResult = await sendEmail(
      to,
      "Email Configuration Test - Invoice Management System",
      testHtml
    );

    res.json({
      success: true,
      message: "Test email sent successfully",
      emailResult,
      sentTo: to,
    });
  } catch (error: any) {
    console.error("Error sending test email:", error);
    res.status(500).json({
      message: "Failed to send test email",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
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

export default router;

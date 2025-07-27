import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/auth";
import PDFDocument from "pdfkit";

const router = Router();
const prisma = new PrismaClient();

// Export routes that match frontend calls
router.get("/invoices/export", authenticate, async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        client: true,
        items: true,
      },
    });

    // CSV headers
    const headers = [
      "Invoice Number",
      "Client Name",
      "Client Contact",
      "Issue Date",
      "Due Date",
      "Status",
      "Currency",
      "Total Amount",
      "Paid Amount",
      "Item Names",
      "Item Quantities",
      "Item Prices",
    ];

    // Convert data to CSV format
    const csvData = invoices.map((invoice) => [
      invoice.invoiceNo,
      invoice.client.name,
      invoice.client.contact,
      invoice.issueDate.toISOString().split("T")[0],
      invoice.dueDate.toISOString().split("T")[0],
      invoice.status,
      "USD", // Default currency until schema update
      invoice.total.toString(),
      "0", // Default paid amount until schema update
      invoice.items.map((item) => item.name).join("; "),
      invoice.items.map((item) => item.quantity).join("; "),
      invoice.items.map((item) => item.unitPrice).join("; "),
    ]);

    // Combine headers and data
    const csv = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="invoices.csv"');
    res.send(csv);
  } catch (error) {
    console.error("Error exporting invoices:", error);
    res.status(500).json({ message: "Failed to export invoices" });
  }
});

router.get("/clients/export", authenticate, async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      include: {
        invoices: true,
      },
    });

    // CSV headers
    const headers = [
      "Client ID",
      "Name",
      "Contact",
      "Address",
      "Total Invoices",
      "Total Amount",
      "Created Date",
    ];

    // Convert data to CSV format
    const csvData = clients.map((client) => [
      client.id.toString(),
      client.name,
      client.contact || "",
      client.address || "",
      client.invoices.length.toString(),
      client.invoices.reduce((sum, inv) => sum + inv.total, 0).toString(),
      client.createdAt.toISOString().split("T")[0],
    ]);

    // Combine headers and data
    const csv = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="clients.csv"');
    res.send(csv);
  } catch (error) {
    console.error("Error exporting clients:", error);
    res.status(500).json({ message: "Failed to export clients" });
  }
});

// Bulk PDF export for invoices
router.get("/invoices/bulk-pdf", authenticate, async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        client: true,
        items: true,
      },
    });

    if (invoices.length === 0) {
      return res.status(404).json({ message: "No invoices found" });
    }

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="invoices-bulk-${new Date().toISOString().split("T")[0]}.pdf"`
    );

    // Create a new PDF document
    const doc = new PDFDocument();
    doc.pipe(res);

    // Add title page
    doc.fontSize(20).text("Invoice Export Package", 50, 50);
    doc.fontSize(14).text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 80);
    doc.fontSize(12).text(`Total Invoices: ${invoices.length}`, 50, 100);
    doc.addPage();

    // Generate a page for each invoice
    invoices.forEach((invoice, index) => {
      if (index > 0) doc.addPage();

      // Invoice header
      doc.fontSize(18).text(`Invoice #${invoice.invoiceNo}`, 50, 50);
      doc.fontSize(12);
      
      // Client information
      doc.text(`Client: ${invoice.client.name}`, 50, 100);
      doc.text(`Contact: ${invoice.client.contact}`, 50, 120);
      
      // Invoice details
      doc.text(`Issue Date: ${invoice.issueDate.toLocaleDateString()}`, 50, 160);
      doc.text(`Due Date: ${invoice.dueDate.toLocaleDateString()}`, 50, 180);
      doc.text(`Status: ${invoice.status}`, 50, 200);
      
      // Items table header
      doc.text("Items:", 50, 240);
      doc.text("Name", 50, 260);
      doc.text("Qty", 200, 260);
      doc.text("Unit Price", 250, 260);
      doc.text("Total", 350, 260);
      
      // Draw line under header
      doc.moveTo(50, 275).lineTo(450, 275).stroke();
      
      // Items
      let yPos = 290;
      invoice.items.forEach((item) => {
        doc.text(item.name, 50, yPos);
        doc.text(item.quantity.toString(), 200, yPos);
        doc.text(`$${item.unitPrice.toFixed(2)}`, 250, yPos);
        doc.text(`$${(item.quantity * item.unitPrice).toFixed(2)}`, 350, yPos);
        yPos += 20;
      });
      
      // Total
      doc.moveTo(50, yPos + 10).lineTo(450, yPos + 10).stroke();
      doc.fontSize(14).text(`Total: $${invoice.total.toFixed(2)}`, 350, yPos + 20);
    });

    doc.end();
  } catch (error) {
    console.error("Error generating bulk PDF:", error);
    res.status(500).json({ message: "Failed to generate PDF export" });
  }
});

// Export invoices to CSV
router.get("/invoices/csv", authenticate, async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        client: true,
        items: true,
      },
    });

    // CSV headers
    const headers = [
      "Invoice Number",
      "Client Name",
      "Client Contact",
      "Issue Date",
      "Due Date",
      "Status",
      "Currency",
      "Total Amount",
      "Paid Amount",
      "Item Names",
      "Item Quantities",
      "Item Prices",
    ];

    // Convert data to CSV format
    const csvData = invoices.map((invoice) => [
      invoice.invoiceNo,
      invoice.client.name,
      invoice.client.contact,
      invoice.issueDate.toISOString().split("T")[0],
      invoice.dueDate.toISOString().split("T")[0],
      invoice.status,
      "USD", // Default currency until schema update
      invoice.total.toString(),
      "0", // Default paid amount until schema update
      invoice.items.map((item) => item.name).join("; "),
      invoice.items.map((item) => item.quantity).join("; "),
      invoice.items.map((item) => item.unitPrice).join("; "),
    ]);

    // Combine headers and data
    const csv = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="invoices.csv"');
    res.send(csv);
  } catch (error) {
    console.error("Error exporting invoices:", error);
    res.status(500).json({ message: "Failed to export invoices" });
  }
});

// Export clients to CSV
router.get("/clients/csv", authenticate, async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      include: {
        invoices: true,
      },
    });

    // CSV headers
    const headers = [
      "Client ID",
      "Name",
      "Contact",
      "Address",
      "Total Invoices",
      "Total Amount",
      "Created Date",
    ];

    // Convert data to CSV format
    const csvData = clients.map((client) => [
      client.id.toString(),
      client.name,
      client.contact || "",
      client.address || "",
      client.invoices.length.toString(),
      client.invoices.reduce((sum, inv) => sum + inv.total, 0).toString(),
      client.createdAt.toISOString().split("T")[0],
    ]);

    // Combine headers and data
    const csv = [headers, ...csvData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="clients.csv"');
    res.send(csv);
  } catch (error) {
    console.error("Error exporting clients:", error);
    res.status(500).json({ message: "Failed to export clients" });
  }
});

// Import clients from CSV (mock - in real app you'd parse actual CSV)
router.post("/clients/import", authenticate, async (req, res) => {
  try {
    const { csvData } = req.body;

    // Mock CSV parsing - in real app, use csv-parser or similar
    const lines = csvData.split("\n");
    const headers = lines[0].split(",").map((h: string) => h.replace(/"/g, ""));

    const importedClients = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const values = line.split(",").map((v: string) => v.replace(/"/g, ""));
        const clientData = {
          name: values[1] || `Client ${i}`,
          contact: values[2] || `contact${i}@example.com`,
          address: values[3] || "",
        };

        const client = await prisma.client.create({
          data: clientData,
        });

        importedClients.push(client);
      } catch (error) {
        errors.push(`Line ${i + 1}: ${error}`);
      }
    }

    res.json({
      success: true,
      imported: importedClients.length,
      errors: errors.length,
      details: {
        clients: importedClients,
        errors,
      },
    });
  } catch (error) {
    console.error("Error importing clients:", error);
    res.status(500).json({ message: "Failed to import clients" });
  }
});

// Generate sample CSV templates
router.get("/template/:type", authenticate, async (req, res) => {
  try {
    const { type } = req.params;

    let headers: string[] = [];
    let sampleData: string[][] = [];

    if (type === "clients") {
      headers = ["ID (leave empty)", "Name", "Contact", "Address"];
      sampleData = [
        ["", "John Doe", "john@example.com", "123 Main St"],
        ["", "Jane Smith", "jane@example.com", "456 Oak Ave"],
        ["", "Bob Johnson", "bob@example.com", "789 Pine Rd"],
      ];
    } else if (type === "invoices") {
      headers = [
        "Invoice Number (auto-generated)",
        "Client Name",
        "Issue Date (YYYY-MM-DD)",
        "Due Date (YYYY-MM-DD)",
        "Item Name",
        "Quantity",
        "Unit Price",
        "Currency",
      ];
      sampleData = [
        [
          "",
          "John Doe",
          "2025-01-01",
          "2025-01-31",
          "Consulting",
          "10",
          "100.00",
          "USD",
        ],
        [
          "",
          "Jane Smith",
          "2025-01-02",
          "2025-02-01",
          "Design Work",
          "1",
          "500.00",
          "USD",
        ],
        [
          "",
          "Bob Johnson",
          "2025-01-03",
          "2025-02-02",
          "Development",
          "20",
          "75.00",
          "EUR",
        ],
      ];
    } else {
      return res.status(400).json({ message: "Invalid template type" });
    }

    const csv = [headers, ...sampleData]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${type}-template.csv"`
    );
    res.send(csv);
  } catch (error) {
    console.error("Error generating template:", error);
    res.status(500).json({ message: "Failed to generate template" });
  }
});

export default router;

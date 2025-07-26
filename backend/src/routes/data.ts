import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticate } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

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

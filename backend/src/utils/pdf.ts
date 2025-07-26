import PDFDocument from "pdfkit";
import { Response } from "express";

export const generateInvoicePDF = (invoice: any, res: Response) => {
  const doc = new PDFDocument();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=invoice-${invoice.invoiceNo}.pdf`
  );

  doc
    .fontSize(18)
    .text(`Invoice No: ${invoice.invoiceNo}`, { align: "center" });
  doc.fontSize(12).text(`Client: ${invoice.client.name}`);
  doc.text(`Date Issued: ${invoice.issueDate}`);
  doc.text(`Due Date: ${invoice.dueDate}`);
  doc.text(`Status: ${invoice.status}`);

  doc.moveDown();
  doc.text("Items:");
  invoice.items.forEach((item: any) => {
    doc.text(
      `${item.name} - ${item.quantity} @ ${item.unitPrice} = ${
        item.quantity * item.unitPrice
      }`
    );
  });

  doc.moveDown();
  doc.text(`Total: ${invoice.total}`);

  doc.end();
  doc.pipe(res);
};

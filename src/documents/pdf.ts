import PDFDocument from "pdfkit";

export interface InvoiceData {
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPriceCents: number;
    discountCents: number;
    totalCents: number;
  }>;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  paidCents: number;
  balanceCents: number;
  notes: string;
  terms: string;
}

export interface ReceiptData {
  receiptNumber: string;
  paymentDate: Date;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  invoiceNumber?: string;
  amountCents: number;
  method: string;
  reference: string;
  description: string;
  notes: string;
}

export interface QuotationData {
  quotationNumber: string;
  issueDate: Date;
  validUntil?: Date;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPriceCents: number;
    discountCents: number;
    totalCents: number;
  }>;
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  notes: string;
  terms: string;
}

export interface BusinessData {
  businessName: string;
  address: string;
  phone: string;
  email: string;
  registrationNumber?: string;
  taxNumber?: string;
  bankingDetails?: string;
  footerMessage?: string;
}

function fmt(cents: number): string {
  return `N$${(cents / 100).toFixed(2)}`;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-NA", { year: "numeric", month: "long", day: "numeric" });
}

function addBusinessHeader(doc: PDFKit.PDFDocument, business: BusinessData) {
  doc.fontSize(20).font("Helvetica-Bold").fillColor("#333").text(business.businessName, { continued: false });
  doc.fontSize(10).font("Helvetica").fillColor("#666");
  doc.text(business.address);
  doc.text(business.phone);
  doc.text(business.email);
  if (business.registrationNumber) {
    doc.text(`Registration: ${business.registrationNumber}`);
  }
  if (business.taxNumber) {
    doc.text(`Tax: ${business.taxNumber}`);
  }
  doc.moveDown(1);
}

function collectPdf(doc: PDFKit.PDFDocument, chunks: Buffer[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

function addLineItemTable(doc: PDFKit.PDFDocument, items: InvoiceData["lineItems"]) {
  const tableTop = doc.y;
  const leftMargin = 50;
  const colWidths = [200, 50, 100, 100, 100];
  const colStarts: number[] = [];
  let x = leftMargin;
  for (const w of colWidths) {
    colStarts.push(x);
    x += w;
  }

  const headers = ["Description", "Qty", "Unit Price", "Discount", "Total"];

  doc.rect(leftMargin - 4, tableTop - 4, colWidths.reduce((a, b) => a + b, 0) + 8, 22).fill("#e6e6e6");
  doc.font("Helvetica-Bold").fontSize(9).fillColor("#333");
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], colStarts[i] + 4, tableTop + 4, { width: colWidths[i] - 8, align: i === 0 ? "left" : "right" });
  }

  doc.fillColor("#ccc").rect(leftMargin - 4, tableTop + 18, colWidths.reduce((a, b) => a + b, 0) + 8, 0.5).fill();

  let rowY = tableTop + 24;
  doc.font("Helvetica").fontSize(9).fillColor("#333");
  for (const item of items) {
    const row = [
      item.description,
      String(item.quantity),
      fmt(item.unitPriceCents),
      item.discountCents > 0 ? fmt(item.discountCents) : "\u2014",
      fmt(item.totalCents),
    ];
    for (let i = 0; i < row.length; i++) {
      doc.text(row[i], colStarts[i] + 4, rowY, {
        width: colWidths[i] - 8,
        align: i === 0 ? "left" : "right",
        lineBreak: false,
      });
    }
    rowY += 18;
  }

  doc.y = rowY + 8;
}

export async function generateInvoicePdf(invoice: InvoiceData, business: BusinessData): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = collectPdf(doc, chunks);

  addBusinessHeader(doc, business);

  doc.font("Helvetica-Bold").fontSize(16).fillColor("#333").text("INVOICE", { align: "right" });
  doc.font("Helvetica").fontSize(10).fillColor("#666").text(invoice.invoiceNumber, { align: "right" });
  doc.moveDown(0.5);

  const hr = doc.y;
  doc.fillColor("#ccc").rect(50, hr, doc.page.width - 100, 1).fill();
  doc.y = hr + 12;

  doc.font("Helvetica-Bold").fontSize(10).fillColor("#333");
  doc.text(`Issue Date:  `, { continued: true });
  doc.font("Helvetica").text(fmtDate(invoice.issueDate), { continued: false });
  doc.font("Helvetica-Bold").text(`Due Date:    `, { continued: true });
  doc.font("Helvetica").text(fmtDate(invoice.dueDate), { continued: false });
  doc.moveDown(1);

  doc.font("Helvetica-Bold").fontSize(10).fillColor("#333").text("Bill To:");
  doc.font("Helvetica").fontSize(10).fillColor("#333").text(invoice.clientName);
  if (invoice.clientPhone) doc.font("Helvetica").fontSize(10).fillColor("#666").text(invoice.clientPhone);
  if (invoice.clientEmail) doc.font("Helvetica").fontSize(10).fillColor("#666").text(invoice.clientEmail);
  doc.moveDown(1.5);

  addLineItemTable(doc, invoice.lineItems);

  const totalsX = doc.page.width - 200;
  const totalStartY = doc.y;

  doc.font("Helvetica").fontSize(10).fillColor("#666");
  doc.text("Subtotal", totalsX, totalStartY, { width: 150, align: "left" });
  doc.text(fmt(invoice.subtotalCents), totalsX + 100, totalStartY, { width: 100, align: "right" });

  let y = totalStartY + 16;

  if (invoice.discountCents > 0) {
    doc.fillColor("#666").text("Discount", totalsX, y, { width: 150, align: "left" });
    doc.fillColor("#d32f2f").text(`-${fmt(invoice.discountCents)}`, totalsX + 100, y, { width: 100, align: "right" });
    y += 16;
  }

  if (invoice.taxCents > 0) {
    doc.fillColor("#666").text("Tax", totalsX, y, { width: 150, align: "left" });
    doc.fillColor("#333").text(fmt(invoice.taxCents), totalsX + 100, y, { width: 100, align: "right" });
    y += 16;
  }

  doc.fillColor("#ccc").rect(totalsX, y, 200, 1).fill();
  y += 8;

  doc.font("Helvetica-Bold").fontSize(11).fillColor("#333");
  doc.text("Total", totalsX, y, { width: 150, align: "left" });
  doc.text(fmt(invoice.totalCents), totalsX + 100, y, { width: 100, align: "right" });
  y += 18;

  if (invoice.paidCents > 0) {
    doc.font("Helvetica").fontSize(10).fillColor("#2e7d32");
    doc.text("Amount Paid", totalsX, y, { width: 150, align: "left" });
    doc.text(`-${fmt(invoice.paidCents)}`, totalsX + 100, y, { width: 100, align: "right" });
    y += 16;
  }

  if (invoice.balanceCents > 0) {
    doc.fillColor("#ccc").rect(totalsX, y, 200, 1).fill();
    y += 8;
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#333");
    doc.text("Balance Due", totalsX, y, { width: 150, align: "left" });
    doc.text(fmt(invoice.balanceCents), totalsX + 100, y, { width: 100, align: "right" });
    y += 18;
  }

  doc.y = y + 8;

  if (invoice.notes || invoice.terms || business.bankingDetails) {
    const sectionY = doc.y;
    doc.fillColor("#ccc").rect(50, sectionY, doc.page.width - 100, 1).fill();
    doc.y = sectionY + 16;
  }

  if (invoice.notes) {
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#333").text("Notes");
    doc.font("Helvetica").fontSize(9).fillColor("#666").text(invoice.notes);
    doc.moveDown(1);
  }

  if (invoice.terms) {
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#333").text("Terms");
    doc.font("Helvetica").fontSize(9).fillColor("#666").text(invoice.terms);
    doc.moveDown(1);
  }

  if (business.bankingDetails) {
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#333").text("Banking Details");
    doc.font("Helvetica").fontSize(9).fillColor("#666").text(business.bankingDetails);
    doc.moveDown(1);
  }

  if (business.footerMessage) {
    const footerY = doc.page.height - 80;
    doc.font("Helvetica").fontSize(8).fillColor("#999").text(business.footerMessage, 50, footerY, { align: "center", width: doc.page.width - 100 });
  }

  doc.end();

  return done;
}

export async function generateReceiptPdf(receipt: ReceiptData, business: BusinessData): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = collectPdf(doc, chunks);

  addBusinessHeader(doc, business);

  doc.font("Helvetica-Bold").fontSize(16).fillColor("#333").text("RECEIPT", { align: "right" });
  doc.font("Helvetica").fontSize(10).fillColor("#666").text(receipt.receiptNumber, { align: "right" });
  doc.moveDown(0.5);

  const hr = doc.y;
  doc.fillColor("#ccc").rect(50, hr, doc.page.width - 100, 1).fill();
  doc.y = hr + 16;

  doc.font("Helvetica-Bold").fontSize(10).fillColor("#333");
  doc.text("Payment Date:  ", { continued: true });
  doc.font("Helvetica").fillColor("#333").text(fmtDate(receipt.paymentDate));
  doc.moveDown(1.5);

  doc.font("Helvetica-Bold").fontSize(10).fillColor("#333").text("Received From:");
  doc.font("Helvetica").fontSize(10).fillColor("#333").text(receipt.clientName);
  if (receipt.clientPhone) doc.font("Helvetica").fontSize(10).fillColor("#666").text(receipt.clientPhone);
  if (receipt.clientEmail) doc.font("Helvetica").fontSize(10).fillColor("#666").text(receipt.clientEmail);
  doc.moveDown(1.5);

  if (receipt.invoiceNumber) {
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#333").text("Invoice:  ", { continued: true });
    doc.font("Helvetica").fillColor("#333").text(receipt.invoiceNumber);
    doc.moveDown(0.5);
  }

  const detailsLeft = 50;
  const labelW = 130;
  const valueX = detailsLeft + labelW;

  const detailRows: [string, string][] = [
    ["Amount:", fmt(receipt.amountCents)],
    ["Payment Method:", receipt.method.charAt(0).toUpperCase() + receipt.method.slice(1).replaceAll("_", " ")],
  ];
  if (receipt.reference) detailRows.push(["Reference:", receipt.reference]);

  doc.font("Helvetica").fontSize(10);
  for (const [label, value] of detailRows) {
    doc.fillColor("#666").text(label, detailsLeft, doc.y, { width: labelW });
    doc.fillColor("#333").text(value, valueX, doc.y - doc.currentLineHeight(), { width: doc.page.width - valueX - 50 });
  }
  doc.moveDown(1);

  if (receipt.description) {
    const descY = doc.y;
    doc.fillColor("#ccc").rect(50, descY, doc.page.width - 100, 1).fill();
    doc.y = descY + 16;
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#333").text("Description");
    doc.font("Helvetica").fontSize(9).fillColor("#666").text(receipt.description);
    doc.moveDown(1);
  }

  if (receipt.notes) {
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#333").text("Notes");
    doc.font("Helvetica").fontSize(9).fillColor("#666").text(receipt.notes);
    doc.moveDown(1);
  }

  if (business.footerMessage) {
    const footerY = doc.page.height - 80;
    doc.font("Helvetica").fontSize(8).fillColor("#999").text(business.footerMessage, 50, footerY, { align: "center", width: doc.page.width - 100 });
  }

  doc.end();

  return done;
}

export async function generateQuotationPdf(quotation: QuotationData, business: BusinessData): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = collectPdf(doc, chunks);

  addBusinessHeader(doc, business);

  doc.font("Helvetica-Bold").fontSize(16).fillColor("#333").text("QUOTATION", { align: "right" });
  doc.font("Helvetica").fontSize(10).fillColor("#666").text(quotation.quotationNumber, { align: "right" });
  doc.moveDown(0.5);

  const hr = doc.y;
  doc.fillColor("#ccc").rect(50, hr, doc.page.width - 100, 1).fill();
  doc.y = hr + 12;

  doc.font("Helvetica-Bold").fontSize(10).fillColor("#333");
  doc.text(`Issue Date:  `, { continued: true });
  doc.font("Helvetica").text(fmtDate(quotation.issueDate), { continued: false });
  if (quotation.validUntil) {
    doc.font("Helvetica-Bold").text(`Valid Until: `, { continued: true });
    doc.font("Helvetica").text(fmtDate(quotation.validUntil), { continued: false });
  }
  doc.moveDown(1);

  doc.font("Helvetica-Bold").fontSize(10).fillColor("#333").text("Bill To:");
  doc.font("Helvetica").fontSize(10).fillColor("#333").text(quotation.clientName);
  if (quotation.clientPhone) doc.font("Helvetica").fontSize(10).fillColor("#666").text(quotation.clientPhone);
  if (quotation.clientEmail) doc.font("Helvetica").fontSize(10).fillColor("#666").text(quotation.clientEmail);
  doc.moveDown(1.5);

  addLineItemTable(doc, quotation.lineItems);

  const totalsX = doc.page.width - 200;
  const totalStartY = doc.y;

  doc.font("Helvetica").fontSize(10).fillColor("#666");
  doc.text("Subtotal", totalsX, totalStartY, { width: 150, align: "left" });
  doc.text(fmt(quotation.subtotalCents), totalsX + 100, totalStartY, { width: 100, align: "right" });

  let y = totalStartY + 16;

  if (quotation.discountCents > 0) {
    doc.fillColor("#666").text("Discount", totalsX, y, { width: 150, align: "left" });
    doc.fillColor("#d32f2f").text(`-${fmt(quotation.discountCents)}`, totalsX + 100, y, { width: 100, align: "right" });
    y += 16;
  }

  doc.fillColor("#ccc").rect(totalsX, y, 200, 1).fill();
  y += 8;

  doc.font("Helvetica-Bold").fontSize(11).fillColor("#333");
  doc.text("Total", totalsX, y, { width: 150, align: "left" });
  doc.text(fmt(quotation.totalCents), totalsX + 100, y, { width: 100, align: "right" });
  y += 24;

  doc.y = y;

  if (quotation.notes || quotation.terms || business.bankingDetails) {
    const sectionY = doc.y;
    doc.fillColor("#ccc").rect(50, sectionY, doc.page.width - 100, 1).fill();
    doc.y = sectionY + 16;
  }

  if (quotation.notes) {
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#333").text("Notes");
    doc.font("Helvetica").fontSize(9).fillColor("#666").text(quotation.notes);
    doc.moveDown(1);
  }

  if (quotation.terms) {
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#333").text("Terms & Conditions");
    doc.font("Helvetica").fontSize(9).fillColor("#666").text(quotation.terms);
    doc.moveDown(1);
  }

  if (business.bankingDetails) {
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#333").text("Banking Details");
    doc.font("Helvetica").fontSize(9).fillColor("#666").text(business.bankingDetails);
    doc.moveDown(1);
  }

  if (business.footerMessage) {
    const footerY = doc.page.height - 80;
    doc.font("Helvetica").fontSize(8).fillColor("#999").text(business.footerMessage, 50, footerY, { align: "center", width: doc.page.width - 100 });
  }

  doc.end();

  return done;
}

import { existsSync } from "node:fs";
import { join } from "node:path";
import fs from "node:fs";
import PDFDocument from "pdfkit";

// Turbopack sets __dirname inside the pdfkit module to /ROOT/... (a virtual path
// that doesn't exist on the real filesystem). PDFKit uses __dirname to locate its
// bundled standard-font AFM files. We patch the fs.readFileSync that pdfkit shares
// so that /ROOT/ paths are redirected to the real filesystem.
const ROOT_PREFIX = "/ROOT/";
if (process.env.NODE_ENV === "development") {
  const ROOT_REPLACEMENT = process.cwd();
  const origReadFile = fs.readFileSync;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fs.readFileSync = function (this: unknown, path: fs.PathOrFileDescriptor, ...args: any[]) {
    if (typeof path === "string" && path.startsWith(ROOT_PREFIX)) {
      return origReadFile.call(this, path.replace(ROOT_PREFIX, ROOT_REPLACEMENT + "/"), ...args);
    }
    return origReadFile.call(this, path, ...args);
  } as typeof fs.readFileSync;
}

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
  lineItems?: Array<{
    description: string;
    quantity: number;
    unitPriceCents: number;
    discountCents: number;
    totalCents: number;
  }>;
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
  signatureName?: string;
  signatureRole?: string;
}

const MARGIN = 45;
const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const USABLE_WIDTH = PAGE_WIDTH - 2 * MARGIN;
const FOOTER_TOP_Y = PAGE_HEIGHT - MARGIN - 58;
const BRAND_GREEN = "#01641f";
const DEEP_GREEN = "#1c3024";
const MUTED_GREEN = "#5b6c61";
const SOFT_GREEN = "#edf1ed";
const BORDER_GREEN = "#c8d7cd";
const PALE_SURFACE = "#fafbfa";

function fmt(cents: number): string {
  return `N$${(cents / 100).toFixed(2)}`;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-NA", { year: "numeric", month: "long", day: "numeric" });
}

const documentLogoPath = join(process.cwd(), "public", "brand", "logo-document.png");
const DOCUMENT_LOGO_WIDTH = 112;
const DOCUMENT_LOGO_ASPECT_RATIO = 500 / 768;
const DOCUMENT_LOGO_HEIGHT = DOCUMENT_LOGO_WIDTH * DOCUMENT_LOGO_ASPECT_RATIO;
const DOCUMENT_HEADER_LOGO_GAP = 5;

function createDocument(): PDFKit.PDFDocument {
  const doc = new PDFDocument({ margin: MARGIN, size: "A4" });

  const onestRegular = join(process.cwd(), "public", "fonts", "Onest-Regular.ttf");
  const onestBold = join(process.cwd(), "public", "fonts", "Onest-Bold.ttf");
  const alluraRegular = join(process.cwd(), "public", "fonts", "Allura-Regular.ttf");

  if (existsSync(onestRegular)) {
    doc.registerFont("Onest", onestRegular);
  } else {
    doc.registerFont("Onest", "Helvetica");
  }

  if (existsSync(onestBold)) {
    doc.registerFont("Onest-Bold", onestBold);
  } else {
    doc.registerFont("Onest-Bold", "Helvetica-Bold");
  }

  if (existsSync(alluraRegular)) {
    doc.registerFont("Allura", alluraRegular);
  } else {
    doc.registerFont("Allura", "Times-Italic");
  }

  return doc;
}

const SVG_ICONS = {
  mapPin: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5",
  phone: "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z",
  mail: "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z",
  document: "M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z",
  calendar: "M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z",
  user: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
  bank: "M4 10h3v7H4zm6 0h3v7h-3zm6 0h3v7h-3zM2 22h19v-2H2zm10-20L1 6v2h21V6z",
  shieldCheck: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zm-2-9l2 2 4-4",
};

const BRAND_LEAF_PATHS = [
  "M158.5,89.78c2.06-3.84,6.09-5.75,10.19-4.62l5.01,1.38c3.07.85,6.53.8,6.69-1.39s-.09-4.08-.68-6.05c-1.9-6.31,3.9-8.62-.43-12.33l-2.19-1.88c-.78-.67-.71-2.07-.04-2.8l2.67-2.89c.7-.76.46-1.8-.3-2.4-4.48-3.53-9.34-5.69-14.72-7.71l4.9-.51c-.56-1.93-1.31-3.86-2.38-5.67l-3.87-6.57-6.37-14.34c2,2.08,3.21,4.45,4.48,6.96,2.27,4.49,4.65,8.69,7.3,12.97,1.58,2.54,2.75,5.23,4.64,7.55,3.3,4.03,8.29,5.68,8.78,7.65.18.73-.09,1.92-.61,2.43l-2.53,2.51c-.3.3-.91,1.12-.76,1.51s.66,1.02,1.01,1.45c3.06,1.39,4.17,4.53,2.78,7.51-2.33,4.68,1.2,7.13.8,13.26-.37,5.55-8.26,3.73-13.67,2.4-3.35-.82-6.52.23-8.31,3.23-2.9,4.85-2.81,10.58-.43,15.66-1.22-1.09-1.95-2.23-2.7-3.48-1.76-4.49-1.6-9.46.75-13.83Z",
  "M140.18,57.04c-1.89,4.05.21,7.01,3.58,9.65-3.99-.95-6.52-4.62-6.26-8.71.23-3.58,2.15-6.7,5.1-8.64l5.43-3.56c8.28-5.43,9.33-13.72,6.71-23.4,3.26,5.73,3.49,12.73.68,18.85-1.27,2.78-2.79,5.22-5.26,7l-5.88,4.25c-1.7,1.23-3.22,2.67-4.1,4.55Z",
  "M147.73,71.49c-7.2,1.16-13.1-1.76-16.55-8.49-2.53-4.93-3.03-10.51-1.44-15.81.06,10.45,4.3,20.31,14.53,23.26l3.47,1.03Z",
];

const FOOTER_LEAF_PATH =
  "M178.02,137.03l-.73-.16-1.9-.57c1.29-4.09.89-9.46-2.7-10.09-1.25-.22-2.66.31-3.4,1.43-2.27,3.43.35,7.24,4.35,9.24-2.35,7.82-6.95,14.64-13.94,19.58l3.87-18.86,1.78-9.4c-.6-.25-1.5.02-2.05.69l-7.89,9.52-10.34,14.29,4.21-12.63c.96-2.88,1.14-6.02.47-8.9-.84-3.59-3.93-5.56-7.52-5.14-8.99,1.06-14.06,13.65-9.46,22.86.92,1.85,2.04,3.71,4.31,4.2-3.02-3.55-4.61-7.14-4.46-11.6.15-4.21,1.25-8.21,4.17-11.26,1.52-1.57,3.2-2.78,5.48-2.94,2.02-.14,3.78.98,4.11,3.12.38,2.43.2,5.07-.37,7.6-1.64,7.14-3.94,13.81-6.87,20.61l3.15.02,9.14-12.08c3.5-4.63,6.43-9.36,10.35-14.03l-2.87,11.72-3.01,15.14h1.96c4.71-2.99,8.69-6.66,12.15-11.02,2.58-3.24,4.31-6.73,5.13-10.92l2.47.35c.21.03.64-.72.41-.76ZM173.88,135.53c-2.31-1.27-3.82-3.6-3.49-6.22.09-.75.77-1.65,1.32-1.78,2.62-.6,3.12,4.05,2.17,7.99Z";

function drawIcon(
  doc: PDFKit.PDFDocument,
  path: string,
  x: number,
  y: number,
  size: number = 10,
  color: string = BRAND_GREEN,
) {
  doc.save();
  const scale = size / 24;
  doc.translate(x, y);
  doc.scale(scale);
  doc.fillColor(color);
  doc.fillOpacity(1);
  doc.path(path).fill();
  doc.restore();
}

function drawFadedLeaf(doc: PDFKit.PDFDocument) {
  doc.save();
  const scale = 3;
  const dx = 58;
  const dy = -34;
  doc.translate(dx, dy);
  doc.scale(scale);
  doc.fillColor(BRAND_GREEN);
  doc.fillOpacity(0.08);
  for (const pathData of BRAND_LEAF_PATHS) {
    doc.path(pathData).fill();
  }
  doc.restore();
}

function drawFooterLeaf(doc: PDFKit.PDFDocument, x: number, y: number) {
  doc.save();
  const scale = 0.35;
  const dx = x - 150 * scale;
  const dy = y - 137 * scale;
  doc.translate(dx, dy);
  doc.scale(scale);
  doc.fillColor(BRAND_GREEN);
  doc.fillOpacity(1);
  doc.path(FOOTER_LEAF_PATH).fill();
  doc.restore();
}

function collectPdf(
  doc: PDFKit.PDFDocument,
  chunks: Buffer[],
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
}

// ─── Header ───────────────────────────────────────────────────────────

function addHeaderAndBusinessInfo(
  doc: PDFKit.PDFDocument,
  business: BusinessData,
  docType: string,
  docNumber: string,
) {
  drawFadedLeaf(doc);

  const startY = MARGIN;
  let detailsY = startY;

  if (existsSync(documentLogoPath)) {
    try {
      doc.image(documentLogoPath, MARGIN, startY, { width: DOCUMENT_LOGO_WIDTH });
      detailsY = startY + DOCUMENT_LOGO_HEIGHT + DOCUMENT_HEADER_LOGO_GAP;
    } catch {
      doc
        .font("Onest-Bold")
        .fontSize(15)
        .fillColor(DEEP_GREEN)
        .text(business.businessName, MARGIN, startY);
      detailsY = doc.y + 4;
    }
  } else {
    doc
      .font("Onest-Bold")
      .fontSize(15)
      .fillColor(DEEP_GREEN)
      .text(business.businessName, MARGIN, startY);
    detailsY = doc.y + 4;
  }

  let currentY = detailsY;
  const drawHeaderLine = (iconPath: string, text: string) => {
    drawIcon(doc, iconPath, MARGIN, currentY + 1.5, 7, BRAND_GREEN);
    doc
      .font("Onest")
      .fontSize(7.2)
      .fillColor(MUTED_GREEN)
      .text(text, MARGIN + 13, currentY, { width: 250 });
    currentY += Math.max(doc.heightOfString(text, { width: 250 }), 7.5) + 1.5;
  };

  drawHeaderLine(SVG_ICONS.mapPin, business.address);
  drawHeaderLine(SVG_ICONS.phone, business.phone);
  drawHeaderLine(SVG_ICONS.mail, business.email);
  if (business.registrationNumber) {
    drawHeaderLine(
      SVG_ICONS.document,
      `Registration: ${business.registrationNumber}`,
    );
  }
  if (business.taxNumber) {
    drawHeaderLine(SVG_ICONS.document, `Tax: ${business.taxNumber}`);
  }

  const titleY = startY + 36;
  doc
    .font("Onest-Bold")
    .fontSize(21)
    .fillColor(BRAND_GREEN)
    .text(docType, 320, titleY, { align: "right", width: 230 });
  const numY = doc.y + 2;
  doc
    .font("Onest")
    .fontSize(9.5)
    .fillColor(MUTED_GREEN)
    .text(docNumber, 320, numY, { align: "right", width: 230 });

  const numLineY = doc.y + 2;

  doc.y = Math.max(currentY, numLineY + 6);

  const dividerY = doc.y + 4;
  doc.save();
  doc.strokeColor(BRAND_GREEN);
  doc.lineWidth(0.6);
  doc.opacity(0.7);
  doc.moveTo(MARGIN, dividerY).lineTo(PAGE_WIDTH - MARGIN, dividerY).stroke();
  doc.restore();

  doc.y = dividerY + 8;
}

// ─── Dates & Client ──────────────────────────────────────────────────

function addDatesAndClientSection(
  doc: PDFKit.PDFDocument,
  dates: Array<{ label: string; value: Date | string }>,
  clientName: string,
  clientPhone?: string,
  clientEmail?: string,
) {
  const startY = doc.y;
  const leftColX = MARGIN;
  const rightColX = 318;
  const rightW = PAGE_WIDTH - MARGIN - rightColX;

  const leftPanelW = 250;
  let leftY = startY + 8;
  doc.save();
  doc.fillColor(PALE_SURFACE);
  doc.strokeColor("#e5ece7");
  doc.lineWidth(0.6);
  doc.roundedRect(leftColX, startY, leftPanelW, 42 + dates.length * 4, 5).fillAndStroke();
  doc.restore();

  dates.forEach((d) => {
    drawIcon(doc, SVG_ICONS.calendar, leftColX + 10, leftY + 1.5, 7, BRAND_GREEN);
    doc
      .font("Onest-Bold")
      .fontSize(7.8)
      .fillColor(DEEP_GREEN)
      .text(`${d.label}:`, leftColX + 23, leftY, { width: 86 });

    let dateStr = "";
    if (d.value instanceof Date) {
      dateStr = fmtDate(d.value);
    } else {
      dateStr = d.value;
    }
    doc
      .font("Onest")
      .fontSize(7.8)
      .fillColor("#2c3e35")
      .text(dateStr, leftColX + 108, leftY, { width: leftPanelW - 118 });
    leftY += Math.max(doc.heightOfString(dateStr, { width: leftPanelW - 118 }), 8) + 2;
  });

  const clientLines = [clientName, clientPhone, clientEmail].filter(Boolean) as string[];
  const clientBodyHeight = clientLines.reduce((height, line) => {
    doc.font(line === clientName ? "Onest-Bold" : "Onest").fontSize(line === clientName ? 8.5 : 7.8);
    return height + Math.max(doc.heightOfString(line, { width: rightW - 34 }), 8) + 2;
  }, 0);
  const cardH = Math.max(50, 24 + clientBodyHeight);
  doc.save();
  doc.fillColor("#ffffff");
  doc.strokeColor(BORDER_GREEN);
  doc.lineWidth(0.7);
  doc.roundedRect(rightColX, startY, rightW, cardH, 6).fillAndStroke();
  doc.restore();

  let rightY = startY + 8;
  drawIcon(doc, SVG_ICONS.user, rightColX + 10, rightY + 1.5, 7, BRAND_GREEN);
  doc
    .font("Onest-Bold")
    .fontSize(7.8)
    .fillColor(DEEP_GREEN)
    .text("Bill To", rightColX + 22, rightY);
  rightY += doc.currentLineHeight() + 3;

  doc
    .font("Onest-Bold")
    .fontSize(8.5)
    .fillColor(DEEP_GREEN)
    .text(clientName, rightColX + 22, rightY, { width: rightW - 34 });
  rightY += Math.max(doc.heightOfString(clientName, { width: rightW - 34 }), 8) + 2;

  if (clientPhone) {
    drawIcon(doc, SVG_ICONS.phone, rightColX + 10, rightY + 2, 6.5, MUTED_GREEN);
    doc
      .font("Onest")
      .fontSize(7.8)
      .fillColor(MUTED_GREEN)
      .text(clientPhone, rightColX + 22, rightY, { width: rightW - 34 });
    rightY += Math.max(doc.heightOfString(clientPhone, { width: rightW - 34 }), 8);
  }
  if (clientEmail) {
    drawIcon(doc, SVG_ICONS.mail, rightColX + 10, rightY + 2, 6.5, MUTED_GREEN);
    doc
      .font("Onest")
      .fontSize(7.8)
      .fillColor(MUTED_GREEN)
      .text(clientEmail, rightColX + 22, rightY, { width: rightW - 34 });
    rightY += Math.max(doc.heightOfString(clientEmail, { width: rightW - 34 }), 8);
  }

  doc.y = Math.max(leftY, startY + cardH) + 9;
}

// ─── Line Items Table ────────────────────────────────────────────────

function addLineItemTable(
  doc: PDFKit.PDFDocument,
  items: Array<{
    description: string;
    quantity: number;
    unitPriceCents: number;
    discountCents: number;
    totalCents: number;
  }>,
  isReceipt?: boolean,
) {
  const tableTop = doc.y;
  const leftMargin = MARGIN;
  const tableWidth = USABLE_WIDTH;
  const colWidths = isReceipt
    ? [tableWidth - 40 - 80 - 85, 40, 80, 85]
    : [tableWidth - 40 - 80 - 85 - 85, 40, 80, 85, 85];
  const colStarts: number[] = [];
  let x = leftMargin;
  for (const w of colWidths) {
    colStarts.push(x);
    x += w;
  }

  const headers = isReceipt
    ? ["Description", "Qty", "Price", "Total"]
    : ["Description", "Qty", "Unit Price", "Discount", "Total"];

  const drawHeader = (y: number) => {
    doc.save();
    doc.fillColor(BRAND_GREEN);
    doc.roundedRect(leftMargin, y - 3, tableWidth, 18, 4).fill();
    doc.restore();

    doc.font("Onest-Bold").fontSize(7.8).fillColor("#ffffff");
    for (let i = 0; i < headers.length; i++) {
      doc.text(headers[i], colStarts[i] + 5, y + 1, {
        width: colWidths[i] - 10,
        align: i === 0 ? "left" : "right",
      });
    }
    return y + 17;
  };

  let rowY = drawHeader(tableTop) + 3;

  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    const row = isReceipt
      ? [
          item.description,
          String(item.quantity),
          fmt(item.unitPriceCents),
          fmt(item.totalCents),
        ]
      : [
          item.description,
          String(item.quantity),
          fmt(item.unitPriceCents),
          item.discountCents > 0 ? fmt(item.discountCents) : "\u2014",
          fmt(item.totalCents),
        ];

    doc.font("Onest").fontSize(7.8);
    const descriptionHeight = doc.heightOfString(row[0], { width: colWidths[0] - 10 });
    const rowHeight = Math.max(14, descriptionHeight + 6);

    if (rowY + rowHeight > FOOTER_TOP_Y - 48) {
      doc.addPage();
      drawFadedLeaf(doc);
      rowY = drawHeader(MARGIN) + 3;
    }

    if (index % 2 === 1) {
      doc.save();
      doc.fillColor("#fbfcfb");
      doc.rect(leftMargin, rowY - 2, tableWidth, rowHeight).fill();
      doc.restore();
    }

    doc.font("Onest").fontSize(7.8).fillColor("#2c3e35");
    for (let i = 0; i < row.length; i++) {
      doc.text(row[i], colStarts[i] + 5, rowY + 2, {
        width: colWidths[i] - 10,
        align: i === 0 ? "left" : "right",
      });
    }

    doc.save();
    doc.strokeColor("#e4ece6");
    doc.lineWidth(0.5);
    doc
      .moveTo(leftMargin, rowY + rowHeight - 1)
      .lineTo(leftMargin + tableWidth, rowY + rowHeight)
      .stroke();
    doc.restore();

    rowY += rowHeight;
  }

  doc.y = rowY + 6;
}

// ─── Totals Section ──────────────────────────────────────────────────

function addTotalsSection(
  doc: PDFKit.PDFDocument,
  subtotalCents: number,
  discountCents: number,
  taxCents: number,
  totalCents: number,
  paidCents: number,
  balanceCents: number,
) {
  const totalsX = PAGE_WIDTH - MARGIN - 220;
  const totalsW = 220;
  let y = doc.y;

  if (y > FOOTER_TOP_Y - 84) {
    doc.addPage();
    drawFadedLeaf(doc);
    y = MARGIN;
  }

  doc.save();
  doc.strokeColor(BORDER_GREEN);
  doc.lineWidth(0.6);
  doc.moveTo(totalsX, y).lineTo(totalsX + totalsW, y).stroke();
  doc.restore();
  y += 6;

  const drawRow = (
    label: string,
    val: string,
    bold: boolean = false,
    color: string = DEEP_GREEN,
    size: number = 8.5,
  ) => {
    doc
      .font(bold ? "Onest-Bold" : "Onest")
      .fontSize(size)
      .fillColor(color);
    doc.text(label, totalsX, y, { width: 110, align: "left" });
    doc.text(val, totalsX + 110, y, { width: 110, align: "right" });
    y += bold ? 14 : 10;
  };

  drawRow("Subtotal", fmt(subtotalCents));

  if (discountCents > 0) {
    drawRow("Discount", `-${fmt(discountCents)}`, false, "#b91c1c");
  }

  if (taxCents > 0) {
    drawRow("Tax", fmt(taxCents));
  }

  doc.save();
  doc.strokeColor(BORDER_GREEN);
  doc.lineWidth(0.5);
  doc.moveTo(totalsX, y).lineTo(totalsX + totalsW, y).stroke();
  doc.restore();
  y += 4;

  doc.save();
  doc.fillColor(SOFT_GREEN);
  doc.roundedRect(totalsX - 4, y - 3, totalsW + 8, 18, 4).fill();
  doc.restore();

  drawRow("Total", fmt(totalCents), true, BRAND_GREEN, 9.3);

  if (paidCents > 0) {
    drawRow("Amount Paid", `-${fmt(paidCents)}`, false, BRAND_GREEN);
  }

  if (balanceCents > 0) {
    doc.save();
    doc.strokeColor(BORDER_GREEN);
    doc.lineWidth(0.5);
    doc.moveTo(totalsX, y).lineTo(totalsX + totalsW, y).stroke();
    doc.restore();
    y += 4;

    doc.save();
    doc.fillColor("#f4f7f4");
    doc.roundedRect(totalsX - 4, y - 3, totalsW + 8, 18, 4).fill();
    doc.restore();

    doc
      .font("Onest-Bold")
      .fontSize(9)
      .fillColor(DEEP_GREEN);
    doc.text("Balance Due", totalsX, y, { width: 110, align: "left" });
    doc.text(fmt(balanceCents), totalsX + 110, y, {
      width: 110,
      align: "right",
    });
    y += 18;
  }

  doc.y = y + 6;
}

// ─── Block Card for Notes / Terms / Banking ──────────────────────────

function drawBlockCard(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  iconPath: string,
  title: string,
  content: string,
) {
  doc.save();
  doc.fillColor(PALE_SURFACE);
  doc.strokeColor(BORDER_GREEN);
  doc.lineWidth(0.7);
  doc.roundedRect(x, y, w, h, 6).fillAndStroke();
  doc.restore();

  drawIcon(doc, iconPath, x + 9, y + 9, 7, BRAND_GREEN);
  doc
    .font("Onest-Bold")
    .fontSize(7.7)
    .fillColor(DEEP_GREEN)
    .text(title, x + 21, y + 8, { width: w - 30 });

  doc
    .font("Onest")
    .fontSize(7.2)
    .fillColor(MUTED_GREEN)
    .text(content, x + 10, y + 22, {
      width: w - 20,
      lineBreak: true,
    });
}

// ─── Notes / Terms / Banking Section ─────────────────────────────────

function addNotesTermsBankingSection(
  doc: PDFKit.PDFDocument,
  notesText: string,
  termsText: string,
  bankingText: string,
) {
  const cleanNotes = (notesText || "").trim();
  const cleanTerms = (termsText || "").trim();
  const cleanBanking = (bankingText || "").trim();

  const hasNotes = cleanNotes.length > 0;
  const hasTerms = cleanTerms.length > 0;
  const hasBanking = cleanBanking.length > 0;

  if (!hasNotes && !hasTerms && !hasBanking) return;

  let maxContentH = 0;
  let w1 = 0, w2 = 0, w3 = 0;
  let x1 = MARGIN, x2 = MARGIN, x3 = MARGIN;

  // Compute layout
  if (hasNotes && hasTerms && hasBanking) {
    w1 = 110;
    w2 = 110;
    w3 = 285;
    x1 = MARGIN;
    x2 = MARGIN + 120;
    x3 = MARGIN + 240;
    maxContentH = Math.max(
      doc.heightOfString(cleanNotes, { width: w1 - 14 }),
      doc.heightOfString(cleanTerms, { width: w2 - 14 }),
      doc.heightOfString(cleanBanking, { width: w3 - 14 }),
    );
  } else if (hasNotes && hasBanking) {
    w1 = 200;
    w3 = 300;
    x1 = MARGIN;
    x3 = MARGIN + 210;
    maxContentH = Math.max(
      doc.heightOfString(cleanNotes, { width: w1 - 14 }),
      doc.heightOfString(cleanBanking, { width: w3 - 14 }),
    );
  } else if (hasTerms && hasBanking) {
    w2 = 200;
    w3 = 300;
    x2 = MARGIN;
    x3 = MARGIN + 210;
    maxContentH = Math.max(
      doc.heightOfString(cleanTerms, { width: w2 - 14 }),
      doc.heightOfString(cleanBanking, { width: w3 - 14 }),
    );
  } else if (hasNotes && hasTerms) {
    w1 = 250;
    w2 = 255;
    x1 = MARGIN;
    x2 = MARGIN + 260;
    maxContentH = Math.max(
      doc.heightOfString(cleanNotes, { width: w1 - 14 }),
      doc.heightOfString(cleanTerms, { width: w2 - 14 }),
    );
  } else if (hasBanking) {
    w3 = USABLE_WIDTH;
    x3 = MARGIN;
    maxContentH = doc.heightOfString(cleanBanking, { width: w3 - 14 });
  } else if (hasNotes) {
    w1 = USABLE_WIDTH;
    x1 = MARGIN;
    maxContentH = doc.heightOfString(cleanNotes, { width: w1 - 14 });
  } else if (hasTerms) {
    w2 = USABLE_WIDTH;
    x2 = MARGIN;
    maxContentH = doc.heightOfString(cleanTerms, { width: w2 - 14 });
  }

  const cardH = 30 + maxContentH;

  // Check if we can fit on current page
  const footerThreshold = FOOTER_TOP_Y - 8;
  if (doc.y + cardH > footerThreshold) {
    doc.addPage();
    drawFadedLeaf(doc);
  }

  const cardY = doc.y;

  if (hasNotes) {
    drawBlockCard(doc, x1, cardY, w1, cardH, SVG_ICONS.document, "Notes", cleanNotes);
  }
  if (hasTerms) {
    drawBlockCard(doc, x2, cardY, w2, cardH, SVG_ICONS.shieldCheck, "Terms", cleanTerms);
  }
  if (hasBanking) {
    drawBlockCard(doc, x3, cardY, w3, cardH, SVG_ICONS.bank, "Banking Details", cleanBanking);
  }

  doc.y = cardY + cardH + 8;
}

// ─── Signature ────────────────────────────────────────────────────────

function addDocumentSignature(doc: PDFKit.PDFDocument, business: BusinessData) {
  const signatureName = (business.signatureName ?? "").trim();
  const signatureRole = (business.signatureRole ?? "").trim();

  if (!signatureName) return;

  const signatureW = 240;
  const signatureX = PAGE_WIDTH - MARGIN - signatureW;
  const signatureY = FOOTER_TOP_Y - 96;
  const signatureH = signatureRole ? 66 : 52;

  if (doc.y > signatureY - 8) {
    doc.addPage();
    drawFadedLeaf(doc);
    doc.y = MARGIN;
  }

  doc.save();
  doc.rotate(-6, { origin: [signatureX + signatureW / 2, signatureY + 22] });
  doc
    .font("Allura")
    .fontSize(30)
    .fillColor(BRAND_GREEN)
    .fillOpacity(1)
    .text(signatureName, signatureX, signatureY, {
      align: "center",
      width: signatureW,
      lineBreak: false,
    });
  doc.restore();

  doc
    .font("Onest-Bold")
    .fontSize(9.5)
    .fillColor(DEEP_GREEN)
    .text(signatureName, signatureX, signatureY + 32, {
      align: "center",
      width: signatureW,
    });

  if (signatureRole) {
    doc
      .font("Onest")
      .fontSize(7.5)
      .fillColor(MUTED_GREEN)
      .text(signatureRole, signatureX, signatureY + 45, {
        align: "center",
        width: signatureW,
      });
  }

  doc.y = Math.max(doc.y, signatureY + signatureH);
}

// ─── Footer ──────────────────────────────────────────────────────────

function addDocumentFooter(doc: PDFKit.PDFDocument) {
  if (doc.y > FOOTER_TOP_Y + 10) {
    doc.addPage();
    drawFadedLeaf(doc);
    doc.y = MARGIN;
  }

  const finalY = PAGE_HEIGHT - MARGIN - 50;
  const centerX = PAGE_WIDTH / 2;
  const leafY = finalY;

  doc.save();
  doc.strokeColor(BRAND_GREEN);
  doc.lineWidth(0.5);
  doc.opacity(0.28);
  doc.moveTo(MARGIN, leafY).lineTo(centerX - 25, leafY).stroke();
  doc.moveTo(centerX + 25, leafY).lineTo(PAGE_WIDTH - MARGIN, leafY).stroke();
  doc.restore();

  drawFooterLeaf(doc, centerX, leafY);

  doc
    .font("Allura")
    .fontSize(13)
    .fillColor(BRAND_GREEN)
    .fillOpacity(1);
  doc.text("Thank you for choosing Swakop Wellness Centre.", MARGIN, leafY + 12, {
    align: "center",
    width: USABLE_WIDTH,
  });

  doc
    .font("Onest")
    .fontSize(7.2)
    .fillColor(MUTED_GREEN);
  doc.text("Your wellness. Our priority.", MARGIN, leafY + 27, {
    align: "center",
    width: USABLE_WIDTH,
  });
}

// ─── Public generators ────────────────────────────────────────────────

export async function generateInvoicePdf(
  invoice: InvoiceData,
  business: BusinessData,
): Promise<Buffer> {
  const doc = createDocument();
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = collectPdf(doc, chunks);

  addHeaderAndBusinessInfo(doc, business, "INVOICE", invoice.invoiceNumber);

  addDatesAndClientSection(
    doc,
    [
      { label: "Issue Date", value: invoice.issueDate },
      { label: "Due Date", value: invoice.dueDate },
    ],
    invoice.clientName,
    invoice.clientPhone,
    invoice.clientEmail,
  );

  addLineItemTable(doc, invoice.lineItems);

  addTotalsSection(
    doc,
    invoice.subtotalCents,
    invoice.discountCents,
    invoice.taxCents,
    invoice.totalCents,
    invoice.paidCents,
    invoice.balanceCents,
  );

  addNotesTermsBankingSection(doc, invoice.notes, invoice.terms, business.bankingDetails ?? "");

  addDocumentSignature(doc, business);

  addDocumentFooter(doc);

  doc.end();
  return done;
}

export async function generateReceiptPdf(
  receipt: ReceiptData,
  business: BusinessData,
): Promise<Buffer> {
  const doc = createDocument();
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = collectPdf(doc, chunks);

  addHeaderAndBusinessInfo(doc, business, "RECEIPT", receipt.receiptNumber);

  const dates: Array<{ label: string; value: Date | string }> = [
    {
      label: "Payment Date",
      value: receipt.paymentDate,
    },
    {
      label: "Payment Method",
      value:
        receipt.method.charAt(0).toUpperCase() +
        receipt.method.slice(1).replaceAll("_", " "),
    },
  ];
  if (receipt.reference) {
    dates.push({ label: "Reference", value: receipt.reference });
  }
  if (receipt.invoiceNumber) {
    dates.push({ label: "Invoice", value: receipt.invoiceNumber });
  }
  addDatesAndClientSection(doc, dates, receipt.clientName, receipt.clientPhone, receipt.clientEmail);

  const receiptItems =
    receipt.lineItems && receipt.lineItems.length > 0
      ? receipt.lineItems
      : [
          {
            description: receipt.description || "Wellness services",
            quantity: 1,
            unitPriceCents: receipt.amountCents,
            discountCents: 0,
            totalCents: receipt.amountCents,
          },
        ];
  addLineItemTable(doc, receiptItems, true);

  addTotalsSection(doc, receipt.amountCents, 0, 0, receipt.amountCents, 0, 0);

  addNotesTermsBankingSection(doc, receipt.notes, "", "");

  addDocumentSignature(doc, business);

  addDocumentFooter(doc);

  doc.end();
  return done;
}

export async function generateQuotationPdf(
  quotation: QuotationData,
  business: BusinessData,
): Promise<Buffer> {
  const doc = createDocument();
  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = collectPdf(doc, chunks);

  addHeaderAndBusinessInfo(doc, business, "QUOTATION", quotation.quotationNumber);

  const dates: Array<{ label: string; value: Date | string }> = [
    { label: "Issue Date", value: quotation.issueDate },
  ];
  if (quotation.validUntil) {
    dates.push({ label: "Valid Until", value: quotation.validUntil });
  }
  addDatesAndClientSection(doc, dates, quotation.clientName, quotation.clientPhone, quotation.clientEmail);

  addLineItemTable(doc, quotation.lineItems);

  addTotalsSection(doc, quotation.subtotalCents, quotation.discountCents, 0, quotation.totalCents, 0, 0);

  addNotesTermsBankingSection(doc, quotation.notes, quotation.terms, business.bankingDetails ?? "");

  addDocumentSignature(doc, business);

  addDocumentFooter(doc);

  doc.end();
  return done;
}

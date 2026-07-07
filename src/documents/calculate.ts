/**
 * Shared document calculation helpers used across invoice, quotation, and receipt forms,
 * previews, and PDF generation. Single source of truth for all document math.
 */

export interface LineItemInput {
  serviceId?: string | null;
  description: string;
  quantity: number;
  unitPriceCents: number;
  discountCents: number;
}

export interface DocumentTotals {
  lineItems: LineItemWithTotals[];
  subtotalCents: number;
  totalDiscountCents: number;
  totalCents: number;
}

export interface LineItemWithTotals extends LineItemInput {
  lineSubtotalCents: number;
  lineTotalCents: number;
}

/**
 * Calculate a single line item's subtotal (quantity × unit price) and total (subtotal − discount).
 */
export function calculateLineItem(input: LineItemInput): LineItemWithTotals {
  const lineSubtotalCents = input.quantity * input.unitPriceCents;
  const discountCents = input.discountCents;
  // Prevent discount from exceeding line subtotal
  const safeDiscount = Math.min(discountCents, lineSubtotalCents);
  const lineTotalCents = lineSubtotalCents - safeDiscount;
  return {
    ...input,
    discountCents: safeDiscount,
    lineSubtotalCents,
    lineTotalCents,
  };
}

/**
 * Calculate all document totals from an array of line item inputs.
 */
export function calculateDocumentTotals(items: LineItemInput[]): DocumentTotals {
  const lineItems = items.map(calculateLineItem);
  const subtotalCents = lineItems.reduce((sum, item) => sum + item.lineSubtotalCents, 0);
  const totalDiscountCents = lineItems.reduce((sum, item) => sum + item.discountCents, 0);
  const totalCents = subtotalCents - totalDiscountCents;
  return { lineItems, subtotalCents, totalDiscountCents, totalCents };
}

/**
 * Calculate document-level discount (percentage or fixed) on top of line item totals.
 */
export function calculateDocumentLevelDiscount(
  subtotalCents: number,
  discountType: "percentage" | "fixed" | null | undefined,
  discountValue: number | null | undefined,
): number {
  if (!discountType || !discountValue) return 0;
  if (discountType === "percentage") return Math.round(subtotalCents * (discountValue / 100));
  if (discountType === "fixed") return discountValue;
  return 0;
}

/**
 * Format cents to N$ currency string.
 */
export function fmtCents(cents: number): string {
  return `N$${(cents / 100).toFixed(2)}`;
}

/**
 * Parse a dollar input string to cents.
 */
export function dollarsToCents(value: string | number): number {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return Math.round((isNaN(num) ? 0 : num) * 100);
}

/**
 * Parse a form field to a line item input from indexed form fields.
 */
export function parseLineItemFormData(
  formData: FormData,
  index: number,
): LineItemInput | null {
  const description = formData.get(`description_${index}`) as string | null;
  const quantityStr = formData.get(`quantity_${index}`) as string | null;
  const unitPriceStr = formData.get(`unit_price_${index}`) as string | null;
  const discountStr = formData.get(`discount_${index}`) as string | null;
  const serviceId = (formData.get(`service_id_${index}`) as string) || null;
  const itemType = (formData.get(`item_type_${index}`) as string) || "CUSTOM";

  if (!description || !quantityStr || !unitPriceStr) return null;

  const quantity = parseInt(quantityStr) || 1;
  const unitPriceCents = dollarsToCents(unitPriceStr);
  const discountCents = dollarsToCents(discountStr || "0");

  return {
    serviceId: serviceId || null,
    description,
    quantity,
    unitPriceCents,
    discountCents: Math.min(discountCents, quantity * unitPriceCents),
    itemType,
  } as LineItemInput & { itemType: string };
}

UPDATE "payments" AS "payment"
SET "invoice_id" = NULL
FROM "invoices" AS "invoice"
WHERE
  "payment"."invoice_id" = "invoice"."id"
  AND "payment"."booking_id" IS NOT NULL
  AND "invoice"."booking_id" IS NOT NULL
  AND "payment"."booking_id" <> "invoice"."booking_id";

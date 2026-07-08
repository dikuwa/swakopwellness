CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_number" text NOT NULL,
	"type" text NOT NULL,
	"client_id" uuid NOT NULL,
	"booking_id" uuid,
	"source_invoice_id" uuid,
	"source_quotation_id" uuid,
	"source_receipt_id" uuid,
	"issue_date" timestamp with time zone NOT NULL,
	"valid_until" timestamp with time zone,
	"due_date" timestamp with time zone,
	"subtotal_cents" integer DEFAULT 0 NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"tax_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer DEFAULT 0 NOT NULL,
	"amount_paid_cents" integer DEFAULT 0 NOT NULL,
	"balance_cents" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"manual_entry" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "documents_document_number_unique" UNIQUE("document_number")
);
--> statement-breakpoint
CREATE TABLE "document_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"service_id" uuid,
	"description" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_source_invoice_id_invoices_id_fk" FOREIGN KEY ("source_invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_source_quotation_id_quotations_id_fk" FOREIGN KEY ("source_quotation_id") REFERENCES "public"."quotations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_source_receipt_id_receipts_id_fk" FOREIGN KEY ("source_receipt_id") REFERENCES "public"."receipts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_line_items" ADD CONSTRAINT "document_line_items_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_line_items" ADD CONSTRAINT "document_line_items_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "documents_type_idx" ON "documents" USING btree ("type");--> statement-breakpoint
CREATE INDEX "documents_status_idx" ON "documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "documents_client_idx" ON "documents" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "documents_booking_idx" ON "documents" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "documents_issue_date_idx" ON "documents" USING btree ("issue_date");--> statement-breakpoint
CREATE INDEX "document_line_items_document_idx" ON "document_line_items" USING btree ("document_id");--> statement-breakpoint
INSERT INTO "documents" (
	"document_number", "type", "client_id", "booking_id", "source_invoice_id", "issue_date",
	"due_date", "subtotal_cents", "discount_cents", "tax_cents", "total_cents",
	"amount_paid_cents", "balance_cents", "status", "created_by_user_id", "created_at", "updated_at"
)
SELECT
	i."invoice_number", 'invoice', i."client_id", i."booking_id", i."id", i."issue_date",
	i."due_date", i."subtotal_cents", i."discount_cents", i."tax_cents", i."total_cents",
	i."amount_paid_cents", i."balance_cents", i."status", i."created_by_user_id", i."created_at", i."updated_at"
FROM "invoices" i
ON CONFLICT ("document_number") DO NOTHING;
--> statement-breakpoint
INSERT INTO "documents" (
	"document_number", "type", "client_id", "booking_id", "source_quotation_id", "issue_date",
	"valid_until", "subtotal_cents", "discount_cents", "total_cents",
	"status", "created_by_user_id", "created_at", "updated_at"
)
SELECT
	q."quotation_number", 'quotation', q."client_id", q."booking_id", q."id", q."issue_date",
	q."valid_until", q."subtotal_cents", q."discount_cents", q."total_cents",
	q."status", q."created_by_user_id", q."created_at", q."updated_at"
FROM "quotations" q
ON CONFLICT ("document_number") DO NOTHING;
--> statement-breakpoint
INSERT INTO "documents" (
	"document_number", "type", "client_id", "booking_id", "source_receipt_id", "source_invoice_id",
	"issue_date", "subtotal_cents", "total_cents", "amount_paid_cents", "status",
	"created_by_user_id", "created_at", "updated_at"
)
SELECT
	r."receipt_number", 'receipt', r."client_id", r."booking_id", r."id", r."invoice_id",
	r."payment_date", r."amount_cents", r."amount_cents", r."amount_cents",
	CASE WHEN r."voided_at" IS NULL THEN 'active' ELSE 'voided' END,
	r."received_by_user_id", r."created_at", r."created_at"
FROM "receipts" r
ON CONFLICT ("document_number") DO NOTHING;
--> statement-breakpoint
INSERT INTO "document_line_items" ("document_id", "service_id", "description", "quantity", "unit_price_cents", "discount_cents", "sort_order", "created_at")
SELECT d."id", ili."service_id", ili."description", ili."quantity", ili."unit_price_cents", ili."discount_cents", ili."sort_order", ili."created_at"
FROM "invoice_line_items" ili
INNER JOIN "documents" d ON d."source_invoice_id" = ili."invoice_id" AND d."type" = 'invoice';
--> statement-breakpoint
INSERT INTO "document_line_items" ("document_id", "service_id", "description", "quantity", "unit_price_cents", "discount_cents", "sort_order", "created_at")
SELECT d."id", qli."service_id", qli."description", qli."quantity", qli."unit_price_cents", qli."discount_cents", qli."sort_order", qli."created_at"
FROM "quotation_line_items" qli
INNER JOIN "documents" d ON d."source_quotation_id" = qli."quotation_id" AND d."type" = 'quotation';
--> statement-breakpoint
INSERT INTO "document_line_items" ("document_id", "service_id", "description", "quantity", "unit_price_cents", "discount_cents", "sort_order", "created_at")
SELECT d."id", rli."service_id", rli."description", rli."quantity", rli."unit_price_cents", rli."discount_cents", rli."sort_order", rli."created_at"
FROM "receipt_line_items" rli
INNER JOIN "documents" d ON d."source_receipt_id" = rli."receipt_id" AND d."type" = 'receipt';

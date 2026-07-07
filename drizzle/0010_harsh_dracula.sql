CREATE TABLE "receipt_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"receipt_id" uuid NOT NULL,
	"service_id" uuid,
	"description" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "receipt_line_items" ADD CONSTRAINT "receipt_line_items_receipt_id_receipts_id_fk" FOREIGN KEY ("receipt_id") REFERENCES "public"."receipts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipt_line_items" ADD CONSTRAINT "receipt_line_items_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "line_items_receipt_idx" ON "receipt_line_items" USING btree ("receipt_id");
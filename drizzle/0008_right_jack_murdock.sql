CREATE TABLE "quotation_line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_id" uuid NOT NULL,
	"service_id" uuid,
	"description" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quotations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quotation_number" text NOT NULL,
	"client_id" uuid NOT NULL,
	"booking_id" uuid,
	"issue_date" timestamp with time zone NOT NULL,
	"valid_until" timestamp with time zone,
	"subtotal_cents" integer NOT NULL,
	"discount_type" text,
	"discount_value" integer,
	"discount_cents" integer DEFAULT 0 NOT NULL,
	"total_cents" integer NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"converted_to_invoice_id" uuid,
	"notes" text,
	"terms" text,
	"created_by_user_id" uuid,
	"issued_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"rejected_at" timestamp with time zone,
	"rejected_reason" text,
	"voided_at" timestamp with time zone,
	"void_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quotations_quotation_number_unique" UNIQUE("quotation_number")
);
--> statement-breakpoint
ALTER TABLE "quotation_line_items" ADD CONSTRAINT "quotation_line_items_quotation_id_quotations_id_fk" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotation_line_items" ADD CONSTRAINT "quotation_line_items_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_converted_to_invoice_id_invoices_id_fk" FOREIGN KEY ("converted_to_invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "line_items_quotation_idx" ON "quotation_line_items" USING btree ("quotation_id");--> statement-breakpoint
CREATE INDEX "quotations_client_idx" ON "quotations" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "quotations_status_idx" ON "quotations" USING btree ("status");
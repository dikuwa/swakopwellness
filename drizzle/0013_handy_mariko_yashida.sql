CREATE TABLE "document_predefined_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"description" text NOT NULL,
	"item_type" text DEFAULT 'other' NOT NULL,
	"unit_price_cents" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "document_predefined_items_active_idx" ON "document_predefined_items" USING btree ("active","sort_order");
CREATE TABLE "cleanup_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"cutoff_at" timestamp with time zone NOT NULL,
	"exported_counts" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"deleted_counts" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cleanup_runs" ADD CONSTRAINT "cleanup_runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cleanup_runs_user_idx" ON "cleanup_runs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cleanup_runs_status_idx" ON "cleanup_runs" USING btree ("status");
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"action" varchar(255) NOT NULL,
	"user_id" varchar(255),
	"company_id" varchar(255),
	"resource_id" varchar(255),
	"resource_type" varchar(100),
	"ip_address" varchar(45),
	"user_agent" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"name" text NOT NULL,
	"hd_path_index" integer NOT NULL,
	"visible_fields" text[],
	"commit_event_types" text[],
	"wallet_address" text NOT NULL,
	"balance" real DEFAULT 0,
	"auto_fund_enabled" boolean DEFAULT true,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "companies_company_id_unique" UNIQUE("company_id")
);
--> statement-breakpoint
CREATE TABLE "compliance_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_type" varchar(100) NOT NULL,
	"company_id" varchar(255),
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"metrics" jsonb NOT NULL,
	"recommendations" jsonb DEFAULT '[]'::jsonb,
	"generated_by" varchar(255),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "data_retention_policies" (
	"id" serial PRIMARY KEY NOT NULL,
	"data_type" varchar(100) NOT NULL,
	"retention_period_days" integer NOT NULL,
	"auto_delete" boolean DEFAULT true,
	"company_id" varchar(255),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "dead_letter_queue" (
	"id" serial PRIMARY KEY NOT NULL,
	"operation_id" varchar(255) NOT NULL,
	"operation_name" varchar(255) NOT NULL,
	"payload" jsonb NOT NULL,
	"context" jsonb NOT NULL,
	"attempts" integer DEFAULT 1,
	"last_error" text NOT NULL,
	"next_retry_at" timestamp NOT NULL,
	"max_retries" integer DEFAULT 5,
	"status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "dead_letter_queue_operation_id_unique" UNIQUE("operation_id")
);
--> statement-breakpoint
CREATE TABLE "error_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"operation_name" varchar(255) NOT NULL,
	"error_type" varchar(50) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"error_message" text NOT NULL,
	"stack_trace" text,
	"context" jsonb,
	"company_id" varchar(255),
	"user_id" varchar(255),
	"event_id" varchar(255),
	"tag_id" varchar(255),
	"endpoint" varchar(255),
	"attempts" integer DEFAULT 1,
	"resolved" boolean DEFAULT false,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"company_id" text NOT NULL,
	"tag_id" text NOT NULL,
	"event_type" text NOT NULL,
	"ts" timestamp NOT NULL,
	"blob_cid" text,
	"leaf_hash" text NOT NULL,
	"merkle_root" text NOT NULL,
	"txid" text,
	"status" text DEFAULT 'pending',
	"fee" real DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"read" boolean DEFAULT false,
	"user_id" integer,
	"company_id" text,
	"action_url" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "policy_audits" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" text NOT NULL,
	"action_type" text NOT NULL,
	"field_name" text,
	"old_value" text,
	"new_value" text,
	"admin_user_id" text,
	"reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"tag_id" text NOT NULL,
	"product_name" text NOT NULL,
	"product_id" text NOT NULL,
	"batch_id" text,
	"farm_id" text,
	"harvest_date" timestamp,
	"expiry_date" timestamp,
	"product_type" text,
	"origin" text,
	"certifications" text,
	"description" text,
	"qr_code" text,
	"nfc_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "product_tags_tag_id_unique" UNIQUE("tag_id")
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_id" text NOT NULL,
	"user_id" text NOT NULL,
	"event_id" text NOT NULL,
	"stamp_txid" text,
	"tag_id" text NOT NULL,
	"product_name" text,
	"purchase_date" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "purchases_purchase_id_unique" UNIQUE("purchase_id")
);
--> statement-breakpoint
CREATE TABLE "security_incidents" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(100) NOT NULL,
	"severity" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"user_id" varchar(255),
	"company_id" varchar(255),
	"ip_address" varchar(45),
	"user_agent" text,
	"resolved" boolean DEFAULT false,
	"resolved_at" timestamp,
	"resolved_by" varchar(255),
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "system_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"alert_type" text NOT NULL,
	"severity" text NOT NULL,
	"message" text NOT NULL,
	"company_id" text,
	"acknowledged" boolean DEFAULT false,
	"acknowledged_by" text,
	"acknowledged_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "system_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"metric_type" varchar(50) NOT NULL,
	"metric_name" varchar(100) NOT NULL,
	"value" numeric NOT NULL,
	"unit" varchar(20),
	"tags" jsonb,
	"timestamp" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "wallet_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"master_wallet_balance" real DEFAULT 0,
	"total_fees_spent" real DEFAULT 0,
	"total_fees_spent_usd" real DEFAULT 0,
	"active_companies" integer DEFAULT 0,
	"events_today" integer DEFAULT 0,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_audit_logs_timestamp" ON "audit_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_user_id" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_company_id" ON "audit_logs" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_action" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_compliance_reports_company_id" ON "compliance_reports" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_compliance_reports_start_date" ON "compliance_reports" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "idx_data_retention_policies_data_type" ON "data_retention_policies" USING btree ("data_type");--> statement-breakpoint
CREATE INDEX "idx_data_retention_policies_company_id" ON "data_retention_policies" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "idx_security_incidents_type" ON "security_incidents" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_security_incidents_severity" ON "security_incidents" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "idx_security_incidents_resolved" ON "security_incidents" USING btree ("resolved");--> statement-breakpoint
CREATE INDEX "idx_security_incidents_created_at" ON "security_incidents" USING btree ("created_at");
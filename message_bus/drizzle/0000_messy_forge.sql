CREATE TABLE "api_keys" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" text NOT NULL,
	"company_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"scopes" jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "blockchain_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_hash" text NOT NULL,
	"from_address" text NOT NULL,
	"to_address" text NOT NULL,
	"amount" bigint NOT NULL,
	"fee" bigint NOT NULL,
	"block_height" bigint,
	"block_hash" text,
	"transaction_index" integer,
	"confirmation_count" integer DEFAULT 0 NOT NULL,
	"required_confirmations" integer DEFAULT 1 NOT NULL,
	"last_checked_at" timestamp,
	"network_fee" bigint,
	"company_id" integer NOT NULL,
	"initiated_by_user_id" integer,
	"event_id" integer,
	"transaction_type" text NOT NULL,
	"payload_size" integer,
	"payload_hash" text,
	"status" text DEFAULT 'submitted' NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"confirmed_at" timestamp,
	"error_message" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "blockchain_transactions_transaction_hash_unique" UNIQUE("transaction_hash")
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"wallet_address" text NOT NULL,
	"mnemonic" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "companies_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
CREATE TABLE "company_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payload_storage" (
	"id" serial PRIMARY KEY NOT NULL,
	"content_hash" text NOT NULL,
	"original_size" integer NOT NULL,
	"compressed_size" integer,
	"storage_type" text NOT NULL,
	"storage_uri" text NOT NULL,
	"company_id" integer NOT NULL,
	"created_by_user_id" integer,
	"is_verified" boolean DEFAULT false NOT NULL,
	"last_verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_accessed_at" timestamp,
	"retention_policy" text DEFAULT '1year' NOT NULL,
	"expires_at" timestamp,
	CONSTRAINT "payload_storage_content_hash_unique" UNIQUE("content_hash")
);
--> statement-breakpoint
CREATE TABLE "supply_chain_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"batch_id" text,
	"location" text NOT NULL,
	"event_type" text NOT NULL,
	"company_id" integer NOT NULL,
	"created_by_user_id" integer,
	"transaction_hash" text,
	"block_height" bigint,
	"payload_size" integer NOT NULL,
	"is_off_chain" boolean DEFAULT false NOT NULL,
	"content_hash" text,
	"metadata" jsonb NOT NULL,
	"event_timestamp" timestamp NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"confirmed_at" timestamp,
	"status" text DEFAULT 'pending' NOT NULL,
	CONSTRAINT "supply_chain_events_transaction_hash_unique" UNIQUE("transaction_hash")
);
--> statement-breakpoint
CREATE TABLE "user_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"token_hash" text NOT NULL,
	"user_agent" text,
	"ip_address" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp,
	CONSTRAINT "user_sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blockchain_transactions" ADD CONSTRAINT "blockchain_transactions_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blockchain_transactions" ADD CONSTRAINT "blockchain_transactions_initiated_by_user_id_users_id_fk" FOREIGN KEY ("initiated_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blockchain_transactions" ADD CONSTRAINT "blockchain_transactions_event_id_supply_chain_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."supply_chain_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_users" ADD CONSTRAINT "company_users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_users" ADD CONSTRAINT "company_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payload_storage" ADD CONSTRAINT "payload_storage_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payload_storage" ADD CONSTRAINT "payload_storage_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supply_chain_events" ADD CONSTRAINT "supply_chain_events_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supply_chain_events" ADD CONSTRAINT "supply_chain_events_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
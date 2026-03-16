DO $$ BEGIN
 CREATE TYPE "public"."activity_direction" AS ENUM('inbox', 'outbox');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."activity_status" AS ENUM('pending', 'processed', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."api_key_scope" AS ENUM('read', 'write', 'admin', 'provider', 'webhook');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."booking_status" AS ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."day_of_week" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."federation_peer_status" AS ENUM('active', 'inactive', 'blocked', 'pending');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."provider_status" AS ENUM('active', 'inactive', 'suspended', 'pending');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."service_status" AS ENUM('active', 'inactive', 'draft');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."slot_status" AS ENUM('available', 'held', 'booked', 'blocked', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."webhook_status" AS ENUM('active', 'inactive');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "api_keys" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"provider_id" varchar(26),
	"name" varchar(255) NOT NULL,
	"key_hash" varchar(255) NOT NULL,
	"key_prefix" varchar(16) NOT NULL,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_used_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bookings" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"provider_id" varchar(26) NOT NULL,
	"service_id" varchar(26) NOT NULL,
	"slot_id" varchar(26) NOT NULL,
	"resource_id" varchar(26),
	"customer_name" varchar(255) NOT NULL,
	"customer_email" varchar(255) NOT NULL,
	"customer_phone" varchar(50),
	"status" "booking_status" DEFAULT 'pending' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"federated_from" varchar(2048),
	"federated_booking_id" varchar(26),
	"confirmed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"cancellation_reason" text,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "federation_activities" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"direction" "activity_direction" NOT NULL,
	"activity_type" varchar(100) NOT NULL,
	"peer_id" varchar(26),
	"actor_url" varchar(2048),
	"object_id" varchar(2048),
	"payload" jsonb NOT NULL,
	"status" "activity_status" DEFAULT 'pending' NOT NULL,
	"error" text,
	"processed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "federation_peers" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"server_url" varchar(2048) NOT NULL,
	"server_name" varchar(255),
	"public_key" text NOT NULL,
	"public_key_id" varchar(2048) NOT NULL,
	"status" "federation_peer_status" DEFAULT 'pending' NOT NULL,
	"trust_level" smallint DEFAULT 1 NOT NULL,
	"last_seen_at" timestamp with time zone,
	"last_sync_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "oauth2_auth_codes" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"client_id" varchar(26) NOT NULL,
	"provider_id" varchar(26),
	"code" varchar(255) NOT NULL,
	"code_challenge" varchar(255),
	"code_challenge_method" varchar(10),
	"redirect_uri" varchar(2048),
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "oauth2_clients" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"provider_id" varchar(26),
	"name" varchar(255) NOT NULL,
	"client_id" varchar(100) NOT NULL,
	"client_secret_hash" varchar(255),
	"redirect_uris" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "oauth2_tokens" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"client_id" varchar(26) NOT NULL,
	"provider_id" varchar(26),
	"access_token" varchar(512) NOT NULL,
	"refresh_token" varchar(512),
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"access_token_expires_at" timestamp with time zone NOT NULL,
	"refresh_token_expires_at" timestamp with time zone,
	"revoked" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "providers" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"email" varchar(255) NOT NULL,
	"phone" varchar(50),
	"website" varchar(2048),
	"logo_url" varchar(2048),
	"timezone" varchar(100) DEFAULT 'UTC' NOT NULL,
	"locale" varchar(10) DEFAULT 'en' NOT NULL,
	"currency" varchar(3) DEFAULT 'EUR' NOT NULL,
	"address" jsonb,
	"categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "provider_status" DEFAULT 'active' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resource_services" (
	"resource_id" varchar(26) NOT NULL,
	"service_id" varchar(26) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resources" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"provider_id" varchar(26) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" varchar(100) NOT NULL,
	"capacity" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "schedules" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"provider_id" varchar(26) NOT NULL,
	"service_id" varchar(26),
	"resource_id" varchar(26),
	"name" varchar(255) DEFAULT 'Default' NOT NULL,
	"timezone" varchar(100) DEFAULT 'UTC' NOT NULL,
	"weekly_rules" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"exceptions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"effective_from" timestamp with time zone,
	"effective_to" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "services" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"provider_id" varchar(26) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(100) NOT NULL,
	"duration_minutes" integer NOT NULL,
	"buffer_before_minutes" integer DEFAULT 0 NOT NULL,
	"buffer_after_minutes" integer DEFAULT 0 NOT NULL,
	"price" numeric(10, 2),
	"currency" varchar(3),
	"max_capacity" integer DEFAULT 1 NOT NULL,
	"requires_confirmation" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"status" "service_status" DEFAULT 'active' NOT NULL,
	"image_url" varchar(2048),
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "slots" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"provider_id" varchar(26) NOT NULL,
	"service_id" varchar(26) NOT NULL,
	"resource_id" varchar(26),
	"schedule_id" varchar(26),
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"status" "slot_status" DEFAULT 'available' NOT NULL,
	"capacity" integer DEFAULT 1 NOT NULL,
	"booked_count" integer DEFAULT 0 NOT NULL,
	"held_until" timestamp with time zone,
	"held_by" varchar(255),
	"booking_id" varchar(26),
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "webhook_deliveries" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"webhook_id" varchar(26) NOT NULL,
	"event" varchar(100) NOT NULL,
	"payload" jsonb NOT NULL,
	"response_status" smallint,
	"response_body" text,
	"attempt" integer DEFAULT 1 NOT NULL,
	"success" boolean DEFAULT false NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "webhooks" (
	"id" varchar(26) PRIMARY KEY NOT NULL,
	"provider_id" varchar(26) NOT NULL,
	"url" varchar(2048) NOT NULL,
	"secret" varchar(255) NOT NULL,
	"events" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "webhook_status" DEFAULT 'active' NOT NULL,
	"description" text,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"last_triggered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_slot_id_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."slots"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bookings" ADD CONSTRAINT "bookings_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "oauth2_auth_codes" ADD CONSTRAINT "oauth2_auth_codes_client_id_oauth2_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."oauth2_clients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "oauth2_auth_codes" ADD CONSTRAINT "oauth2_auth_codes_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "oauth2_clients" ADD CONSTRAINT "oauth2_clients_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "oauth2_tokens" ADD CONSTRAINT "oauth2_tokens_client_id_oauth2_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."oauth2_clients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "oauth2_tokens" ADD CONSTRAINT "oauth2_tokens_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resource_services" ADD CONSTRAINT "resource_services_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resource_services" ADD CONSTRAINT "resource_services_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resources" ADD CONSTRAINT "resources_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedules" ADD CONSTRAINT "schedules_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedules" ADD CONSTRAINT "schedules_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedules" ADD CONSTRAINT "schedules_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "services" ADD CONSTRAINT "services_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "slots" ADD CONSTRAINT "slots_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "slots" ADD CONSTRAINT "slots_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "slots" ADD CONSTRAINT "slots_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "slots" ADD CONSTRAINT "slots_schedule_id_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_webhook_id_webhooks_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."webhooks"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_provider_id_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "api_keys_hash_idx" ON "api_keys" ("key_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_keys_provider_idx" ON "api_keys" ("provider_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_keys_prefix_idx" ON "api_keys" ("key_prefix");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookings_provider_idx" ON "bookings" ("provider_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookings_service_idx" ON "bookings" ("service_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookings_slot_idx" ON "bookings" ("slot_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookings_status_idx" ON "bookings" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookings_customer_email_idx" ON "bookings" ("customer_email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bookings_created_at_idx" ON "bookings" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "federation_activities_direction_idx" ON "federation_activities" ("direction");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "federation_activities_peer_idx" ON "federation_activities" ("peer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "federation_activities_created_at_idx" ON "federation_activities" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "federation_activities_status_idx" ON "federation_activities" ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "federation_peers_url_idx" ON "federation_peers" ("server_url");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "federation_peers_status_idx" ON "federation_peers" ("status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "oauth2_auth_codes_code_idx" ON "oauth2_auth_codes" ("code");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "oauth2_clients_client_id_idx" ON "oauth2_clients" ("client_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "oauth2_tokens_access_idx" ON "oauth2_tokens" ("access_token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "oauth2_tokens_refresh_idx" ON "oauth2_tokens" ("refresh_token");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "providers_slug_idx" ON "providers" ("slug");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "providers_status_idx" ON "providers" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "providers_email_idx" ON "providers" ("email");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "resource_services_pk" ON "resource_services" ("resource_id","service_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "resources_provider_idx" ON "resources" ("provider_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedules_provider_idx" ON "schedules" ("provider_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "schedules_service_idx" ON "schedules" ("service_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "services_provider_idx" ON "services" ("provider_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "services_category_idx" ON "services" ("category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "services_status_idx" ON "services" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "services_provider_status_idx" ON "services" ("provider_id","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "slots_provider_time_idx" ON "slots" ("provider_id","start_time");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "slots_service_time_idx" ON "slots" ("service_id","start_time");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "slots_status_idx" ON "slots" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "slots_start_time_idx" ON "slots" ("start_time");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "slots_availability_idx" ON "slots" ("service_id","status","start_time");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_deliveries_webhook_idx" ON "webhook_deliveries" ("webhook_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhook_deliveries_created_at_idx" ON "webhook_deliveries" ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhooks_provider_idx" ON "webhooks" ("provider_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "webhooks_status_idx" ON "webhooks" ("status");
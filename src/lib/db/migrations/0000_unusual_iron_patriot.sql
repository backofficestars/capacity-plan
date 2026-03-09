CREATE TYPE "public"."accounting_software" AS ENUM('qbo', 'xero', 'other');--> statement-breakpoint
CREATE TYPE "public"."assignment_role" AS ENUM('lead', 'supporting', 'oversight', 'payroll');--> statement-breakpoint
CREATE TYPE "public"."client_status" AS ENUM('active', 'not_active', 'onboarding', 'prospect');--> statement-breakpoint
CREATE TYPE "public"."complexity_level" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."employment_type" AS ENUM('full_time', 'part_time', 'contractor');--> statement-breakpoint
CREATE TYPE "public"."internal_category" AS ENUM('meetings', 'admin', 'pd', 'helping_teammates', 'billing', 'other');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('not_started', 'in_progress', 'waiting_on_client', 'review', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."recurrence" AS ENUM('weekly', 'bi_weekly', 'monthly', 'quarterly', 'yearly', 'not_recurring');--> statement-breakpoint
CREATE TYPE "public"."scenario_status" AS ENUM('draft', 'saved', 'applied');--> statement-breakpoint
CREATE TYPE "public"."scenario_type" AS ENUM('new_client', 'hiring', 'rebalance', 'pipeline_forecast');--> statement-breakpoint
CREATE TYPE "public"."service_type" AS ENUM('monthly_bookkeeping', 'catch_up', 'year_end', 'payroll', 'startup', 'sales_tax', 'bill_payment', 'out_of_scope', 'internal', 'oversight', 'controller', 'cpa_review');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('started', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."team_role" AS ENUM('bookkeeper', 'admin', 'accountant', 'cpa', 'team_leader');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('team_leader', 'owner');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "app_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"config_key" text NOT NULL,
	"config_value" jsonb NOT NULL,
	"description" text,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "app_config_config_key_unique" UNIQUE("config_key")
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_member_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"role" "assignment_role" NOT NULL,
	"allocated_hrs" numeric(4, 1),
	"effective_from" date DEFAULT now() NOT NULL,
	"effective_until" date,
	"is_active" boolean DEFAULT true,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "capacity_overrides" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_member_id" uuid NOT NULL,
	"week_start" date NOT NULL,
	"available_hrs" numeric(4, 1) NOT NULL,
	"reason" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fc_id" text,
	"client_name" text NOT NULL,
	"client_group" text[],
	"industry" text,
	"accounting_software" "accounting_software" DEFAULT 'qbo',
	"is_demanding" boolean DEFAULT false,
	"complexity_level" "complexity_level" DEFAULT 'medium',
	"payroll_employees" integer DEFAULT 0,
	"status" "client_status" DEFAULT 'active',
	"priority" text DEFAULT 'B',
	"dext_hubdoc" text,
	"payroll_software" text,
	"year_end" text,
	"catch_up_hrs" numeric(6, 1) DEFAULT '0',
	"monthly_budget_hrs" numeric(5, 1),
	"monthly_budget_amt" numeric(8, 2),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "clients_fc_id_unique" UNIQUE("fc_id")
);
--> statement-breakpoint
CREATE TABLE "edit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"table_name" text NOT NULL,
	"row_id" text NOT NULL,
	"operation" text NOT NULL,
	"previous_values" jsonb,
	"new_values" jsonb,
	"description" text NOT NULL,
	"undone" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "internal_hours_allocation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_member_id" uuid NOT NULL,
	"category" "internal_category" NOT NULL,
	"weekly_hours" numeric(3, 1) NOT NULL,
	"effective_from" date NOT NULL,
	"effective_until" date,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "project_assignees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"team_member_id" uuid NOT NULL,
	"role" "assignment_role" DEFAULT 'lead'
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fc_id" text,
	"client_id" uuid,
	"title" text NOT NULL,
	"service_type" "service_type",
	"accounting_period" text,
	"tags" text[],
	"budgeted_hours" numeric(6, 1),
	"actual_hours" numeric(6, 1) DEFAULT '0',
	"dollar_budget" numeric(8, 2),
	"start_date" date,
	"due_date" date,
	"internal_due_date" date,
	"next_task_due" date,
	"closed_date" date,
	"status" "project_status" DEFAULT 'not_started',
	"recurrence" "recurrence" DEFAULT 'not_recurring',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "projects_fc_id_unique" UNIQUE("fc_id")
);
--> statement-breakpoint
CREATE TABLE "scenarios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_by" uuid,
	"scenario_type" "scenario_type" NOT NULL,
	"name" text NOT NULL,
	"parameters" jsonb NOT NULL,
	"results" jsonb NOT NULL,
	"status" "scenario_status" DEFAULT 'draft',
	"applied_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_token" text NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "sync_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"sync_type" text NOT NULL,
	"status" "sync_status" NOT NULL,
	"records_synced" integer DEFAULT 0,
	"error_message" text,
	"started_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "team_member_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_member_id" uuid NOT NULL,
	"skill_key" text NOT NULL,
	"skill_value" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fc_id" text,
	"email" text,
	"full_name" text NOT NULL,
	"role" "team_role" DEFAULT 'bookkeeper' NOT NULL,
	"assignable" boolean DEFAULT true,
	"employment_type" "employment_type" DEFAULT 'contractor',
	"weekly_capacity_hrs" numeric(4, 1) DEFAULT '40.0' NOT NULL,
	"daytime_available" boolean DEFAULT true,
	"probation_until" date,
	"years_experience" numeric(3, 1),
	"industry_experience" text,
	"hire_date" date,
	"is_active" boolean DEFAULT true,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "team_members_fc_id_unique" UNIQUE("fc_id"),
	CONSTRAINT "team_members_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "time_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fc_id" text,
	"project_id" uuid,
	"team_member_id" uuid NOT NULL,
	"date" date NOT NULL,
	"hours" numeric(4, 2) NOT NULL,
	"is_billable" boolean DEFAULT true,
	"category" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "time_entries_fc_id_unique" UNIQUE("fc_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"role" "user_role" NOT NULL,
	"image" text,
	"email_verified" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_config" ADD CONSTRAINT "app_config_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_team_member_id_team_members_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capacity_overrides" ADD CONSTRAINT "capacity_overrides_team_member_id_team_members_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_hours_allocation" ADD CONSTRAINT "internal_hours_allocation_team_member_id_team_members_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_assignees" ADD CONSTRAINT "project_assignees_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_assignees" ADD CONSTRAINT "project_assignees_team_member_id_team_members_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_member_skills" ADD CONSTRAINT "team_member_skills_team_member_id_team_members_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_team_member_id_team_members_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "assignment_unique" ON "assignments" USING btree ("team_member_id","client_id","role","effective_from");--> statement-breakpoint
CREATE UNIQUE INDEX "capacity_override_unique" ON "capacity_overrides" USING btree ("team_member_id","week_start");--> statement-breakpoint
CREATE UNIQUE INDEX "internal_hours_unique" ON "internal_hours_allocation" USING btree ("team_member_id","category","effective_from");--> statement-breakpoint
CREATE UNIQUE INDEX "project_assignee_unique" ON "project_assignees" USING btree ("project_id","team_member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_member_skill_unique" ON "team_member_skills" USING btree ("team_member_id","skill_key");
import {
  pgTable,
  uuid,
  text,
  boolean,
  decimal,
  date,
  timestamp,
  integer,
  jsonb,
  uniqueIndex,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const teamRoleEnum = pgEnum("team_role", [
  "bookkeeper",
  "admin",
  "accountant",
  "cpa",
  "team_leader",
]);

export const employmentTypeEnum = pgEnum("employment_type", [
  "full_time",
  "part_time",
  "contractor",
]);

export const userRoleEnum = pgEnum("user_role", ["team_leader", "owner"]);

export const clientStatusEnum = pgEnum("client_status", [
  "active",
  "not_active",
  "onboarding",
  "prospect",
]);

export const accountingSoftwareEnum = pgEnum("accounting_software", [
  "qbo",
  "xero",
  "other",
]);

export const complexityLevelEnum = pgEnum("complexity_level", [
  "low",
  "medium",
  "high",
]);

export const assignmentRoleEnum = pgEnum("assignment_role", [
  "lead",
  "supporting",
  "oversight",
  "payroll",
]);

export const serviceTypeEnum = pgEnum("service_type", [
  "monthly_bookkeeping",
  "catch_up",
  "year_end",
  "payroll",
  "startup",
  "sales_tax",
  "bill_payment",
  "out_of_scope",
  "internal",
  "oversight",
  "controller",
  "cpa_review",
]);

export const projectStatusEnum = pgEnum("project_status", [
  "not_started",
  "in_progress",
  "waiting_on_client",
  "review",
  "completed",
  "cancelled",
]);

export const recurrenceEnum = pgEnum("recurrence", [
  "weekly",
  "bi_weekly",
  "monthly",
  "quarterly",
  "yearly",
  "not_recurring",
]);

export const internalCategoryEnum = pgEnum("internal_category", [
  "meetings",
  "admin",
  "pd",
  "helping_teammates",
  "billing",
  "other",
]);

export const scenarioTypeEnum = pgEnum("scenario_type", [
  "new_client",
  "hiring",
  "rebalance",
  "pipeline_forecast",
]);

export const scenarioStatusEnum = pgEnum("scenario_status", [
  "draft",
  "saved",
  "applied",
]);

export const syncStatusEnum = pgEnum("sync_status", [
  "started",
  "completed",
  "failed",
]);

// ─── Auth Tables (NextAuth.js) ──────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").unique().notNull(),
  name: text("name"),
  role: userRoleEnum("role").notNull(),
  image: text("image"),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: text("token_type"),
  scope: text("scope"),
  idToken: text("id_token"),
  sessionState: text("session_state"),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionToken: text("session_token").unique().notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

// ─── Team Members ────────────────────────────────────────────────────────────

export const teamMembers = pgTable("team_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  fcId: text("fc_id").unique(),
  email: text("email").unique(),
  fullName: text("full_name").notNull(),
  role: teamRoleEnum("role").notNull().default("bookkeeper"),
  assignable: boolean("assignable").default(true),
  employmentType: employmentTypeEnum("employment_type").default("contractor"),
  weeklyCapacityHrs: decimal("weekly_capacity_hrs", {
    precision: 4,
    scale: 1,
  })
    .notNull()
    .default("40.0"),
  daytimeAvailable: boolean("daytime_available").default(true),
  probationUntil: date("probation_until"),
  yearsExperience: decimal("years_experience", { precision: 3, scale: 1 }),
  industryExperience: text("industry_experience"),
  hireDate: date("hire_date"),
  isActive: boolean("is_active").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const teamMemberSkills = pgTable(
  "team_member_skills",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamMemberId: uuid("team_member_id")
      .notNull()
      .references(() => teamMembers.id, { onDelete: "cascade" }),
    skillKey: text("skill_key").notNull(),
    skillValue: integer("skill_value").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("team_member_skill_unique").on(
      table.teamMemberId,
      table.skillKey
    ),
  ]
);

// ─── Clients ─────────────────────────────────────────────────────────────────

export const clients = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  fcId: text("fc_id").unique(),
  clientName: text("client_name").notNull(),
  clientGroup: text("client_group").array(),
  industry: text("industry"),
  accountingSoftware: accountingSoftwareEnum("accounting_software").default(
    "qbo"
  ),
  isDemanding: boolean("is_demanding").default(false),
  complexityLevel: complexityLevelEnum("complexity_level").default("medium"),
  payrollEmployees: integer("payroll_employees").default(0),
  status: clientStatusEnum("status").default("active"),
  priority: text("priority").default("B"),
  dextHubdoc: text("dext_hubdoc"),
  payrollSoftware: text("payroll_software"),
  yearEnd: text("year_end"),
  catchUpHrs: decimal("catch_up_hrs", { precision: 6, scale: 1 }).default("0"),
  monthlyBudgetHrs: decimal("monthly_budget_hrs", { precision: 5, scale: 1 }),
  monthlyBudgetAmt: decimal("monthly_budget_amt", { precision: 8, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── Assignments ─────────────────────────────────────────────────────────────

export const assignments = pgTable(
  "assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamMemberId: uuid("team_member_id")
      .notNull()
      .references(() => teamMembers.id),
    clientId: uuid("client_id")
      .notNull()
      .references(() => clients.id),
    role: assignmentRoleEnum("role").notNull(),
    allocatedHrs: decimal("allocated_hrs", { precision: 4, scale: 1 }),
    effectiveFrom: date("effective_from").notNull().defaultNow(),
    effectiveUntil: date("effective_until"),
    isActive: boolean("is_active").default(true),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("assignment_unique").on(
      table.teamMemberId,
      table.clientId,
      table.role,
      table.effectiveFrom
    ),
  ]
);

// ─── Projects ────────────────────────────────────────────────────────────────

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  fcId: text("fc_id").unique(),
  clientId: uuid("client_id").references(() => clients.id),
  title: text("title").notNull(),
  serviceType: serviceTypeEnum("service_type"),
  accountingPeriod: text("accounting_period"),
  tags: text("tags").array(),
  budgetedHours: decimal("budgeted_hours", { precision: 6, scale: 1 }),
  actualHours: decimal("actual_hours", { precision: 6, scale: 1 }).default(
    "0"
  ),
  dollarBudget: decimal("dollar_budget", { precision: 8, scale: 2 }),
  startDate: date("start_date"),
  dueDate: date("due_date"),
  internalDueDate: date("internal_due_date"),
  nextTaskDue: date("next_task_due"),
  closedDate: date("closed_date"),
  status: projectStatusEnum("status").default("not_started"),
  recurrence: recurrenceEnum("recurrence").default("not_recurring"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const projectAssignees = pgTable(
  "project_assignees",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    teamMemberId: uuid("team_member_id")
      .notNull()
      .references(() => teamMembers.id),
    role: assignmentRoleEnum("role").default("lead"),
  },
  (table) => [
    uniqueIndex("project_assignee_unique").on(
      table.projectId,
      table.teamMemberId
    ),
  ]
);

// ─── Time Entries ────────────────────────────────────────────────────────────

export const timeEntries = pgTable("time_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  fcId: text("fc_id").unique(),
  projectId: uuid("project_id").references(() => projects.id),
  teamMemberId: uuid("team_member_id")
    .notNull()
    .references(() => teamMembers.id),
  date: date("date").notNull(),
  hours: decimal("hours", { precision: 4, scale: 2 }).notNull(),
  isBillable: boolean("is_billable").default(true),
  category: text("category"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Capacity ────────────────────────────────────────────────────────────────

export const capacityOverrides = pgTable(
  "capacity_overrides",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamMemberId: uuid("team_member_id")
      .notNull()
      .references(() => teamMembers.id, { onDelete: "cascade" }),
    weekStart: date("week_start").notNull(),
    availableHrs: decimal("available_hrs", { precision: 4, scale: 1 }).notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("capacity_override_unique").on(
      table.teamMemberId,
      table.weekStart
    ),
  ]
);

export const internalHoursAllocation = pgTable(
  "internal_hours_allocation",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamMemberId: uuid("team_member_id")
      .notNull()
      .references(() => teamMembers.id, { onDelete: "cascade" }),
    category: internalCategoryEnum("category").notNull(),
    weeklyHours: decimal("weekly_hours", { precision: 3, scale: 1 }).notNull(),
    effectiveFrom: date("effective_from").notNull(),
    effectiveUntil: date("effective_until"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex("internal_hours_unique").on(
      table.teamMemberId,
      table.category,
      table.effectiveFrom
    ),
  ]
);

// ─── Scenarios ───────────────────────────────────────────────────────────────

export const scenarios = pgTable("scenarios", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdBy: uuid("created_by").references(() => users.id),
  scenarioType: scenarioTypeEnum("scenario_type").notNull(),
  name: text("name").notNull(),
  parameters: jsonb("parameters").notNull(),
  results: jsonb("results").notNull(),
  status: scenarioStatusEnum("status").default("draft"),
  appliedAt: timestamp("applied_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── App Config ──────────────────────────────────────────────────────────────

export const appConfig = pgTable("app_config", {
  id: uuid("id").defaultRandom().primaryKey(),
  configKey: text("config_key").unique().notNull(),
  configValue: jsonb("config_value").notNull(),
  description: text("description"),
  updatedBy: uuid("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── Sync Log ────────────────────────────────────────────────────────────────

export const syncLog = pgTable("sync_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  source: text("source").notNull(),
  syncType: text("sync_type").notNull(),
  status: syncStatusEnum("status").notNull(),
  recordsSynced: integer("records_synced").default(0),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at", { withTimezone: true }).defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

// ─── Edit Log (Undo Support) ────────────────────────────────────────────────

export const editLog = pgTable("edit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id"),
  tableName: text("table_name").notNull(),
  rowId: text("row_id").notNull(),
  operation: text("operation").notNull(),
  previousValues: jsonb("previous_values"),
  newValues: jsonb("new_values"),
  description: text("description").notNull(),
  undone: boolean("undone").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Relations ───────────────────────────────────────────────────────────────

export const teamMembersRelations = relations(teamMembers, ({ many }) => ({
  skills: many(teamMemberSkills),
  assignments: many(assignments),
  projectAssignees: many(projectAssignees),
  timeEntries: many(timeEntries),
  capacityOverrides: many(capacityOverrides),
  internalHours: many(internalHoursAllocation),
}));

export const teamMemberSkillsRelations = relations(
  teamMemberSkills,
  ({ one }) => ({
    teamMember: one(teamMembers, {
      fields: [teamMemberSkills.teamMemberId],
      references: [teamMembers.id],
    }),
  })
);

export const clientsRelations = relations(clients, ({ many }) => ({
  assignments: many(assignments),
  projects: many(projects),
}));

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  teamMember: one(teamMembers, {
    fields: [assignments.teamMemberId],
    references: [teamMembers.id],
  }),
  client: one(clients, {
    fields: [assignments.clientId],
    references: [clients.id],
  }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  assignees: many(projectAssignees),
  timeEntries: many(timeEntries),
}));

export const projectAssigneesRelations = relations(
  projectAssignees,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectAssignees.projectId],
      references: [projects.id],
    }),
    teamMember: one(teamMembers, {
      fields: [projectAssignees.teamMemberId],
      references: [teamMembers.id],
    }),
  })
);

export const timeEntriesRelations = relations(timeEntries, ({ one }) => ({
  project: one(projects, {
    fields: [timeEntries.projectId],
    references: [projects.id],
  }),
  teamMember: one(teamMembers, {
    fields: [timeEntries.teamMemberId],
    references: [teamMembers.id],
  }),
}));

export const scenariosRelations = relations(scenarios, ({ one }) => ({
  createdByUser: one(users, {
    fields: [scenarios.createdBy],
    references: [users.id],
  }),
}));

// ─── Type Exports ────────────────────────────────────────────────────────────

export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type TeamMemberSkill = typeof teamMemberSkills.$inferSelect;
export type NewTeamMemberSkill = typeof teamMemberSkills.$inferInsert;
export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;
export type Assignment = typeof assignments.$inferSelect;
export type NewAssignment = typeof assignments.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type Scenario = typeof scenarios.$inferSelect;
export type NewScenario = typeof scenarios.$inferInsert;
export type AppConfig = typeof appConfig.$inferSelect;
export type SyncLogEntry = typeof syncLog.$inferSelect;
export type EditLogEntry = typeof editLog.$inferSelect;
export type NewEditLogEntry = typeof editLog.$inferInsert;
export type User = typeof users.$inferSelect;

// Skill keys as a const for type safety
export const SKILL_KEYS = [
  "demanding_clients",
  "complex_bookkeeping",
  "tech_ability",
  "payroll",
  "construction",
  "non_profit",
  "ecommerce",
  "a2x_dext",
  "xero",
  "qbo",
] as const;

export type SkillKey = (typeof SKILL_KEYS)[number];

export const SKILL_LABELS: Record<SkillKey, string> = {
  demanding_clients: "Demanding Clients",
  complex_bookkeeping: "Complex Bookkeeping",
  tech_ability: "Tech Ability",
  payroll: "Payroll",
  construction: "Construction",
  non_profit: "Non-Profit",
  ecommerce: "E-Commerce",
  a2x_dext: "A2X / Dext Commerce",
  xero: "Xero",
  qbo: "QuickBooks Online",
};

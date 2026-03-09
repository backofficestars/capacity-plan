/**
 * Seed script — populates the Postgres database from placeholder-data.ts
 *
 * Usage:
 *   DATABASE_URL="postgresql://..." npx tsx src/lib/db/seed.ts
 *   # or via npm script:
 *   DATABASE_URL="postgresql://..." npm run db:seed
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import * as schema from "./schema";
import {
  teamMembers as teamData,
  clients as clientData,
  internalHoursBreakdown,
  defaultPtoOverrides,
} from "../placeholder-data";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const client = postgres(DATABASE_URL, { max: 1 });
const db = drizzle(client, { schema });

// ─── Mapping helpers ──────────────────────────────────────────────────────────

function mapStatus(s: string): "active" | "not_active" | "onboarding" | "prospect" {
  switch (s) {
    case "A": return "active";
    case "N": return "not_active";
    case "P": return "onboarding";
    default: return "active";
  }
}

function mapSoftware(s: string | null): "qbo" | "xero" | "other" | null {
  if (!s) return null;
  switch (s.toLowerCase()) {
    case "qbo": return "qbo";
    case "xero": return "xero";
    default: return "other";
  }
}

function mapComplexity(s: string | null): "low" | "medium" | "high" | null {
  if (!s) return null;
  switch (s.toLowerCase()) {
    case "low": return "low";
    case "medium": return "medium";
    case "high": return "high";
    default: return "medium";
  }
}

function mapTeamRole(role: string): "bookkeeper" | "admin" | "accountant" | "cpa" | "team_leader" {
  switch (role.toLowerCase()) {
    case "oversight": return "team_leader";
    case "admin": return "admin";
    case "accountant": return "accountant";
    case "cpa": return "cpa";
    default: return "bookkeeper";
  }
}

function mapAssignmentRole(role: string): "lead" | "supporting" | "oversight" | "payroll" {
  switch (role) {
    case "lead": return "lead";
    case "supporting": return "supporting";
    case "oversight": return "oversight";
    case "payroll": return "payroll";
    default: return "lead";
  }
}

// Map internal category IDs from placeholder to DB enum values
function mapInternalCategory(cat: string): "meetings" | "admin" | "pd" | "helping_teammates" | "billing" | "other" {
  switch (cat) {
    case "meetings": return "meetings";
    case "planning": return "admin";
    case "pd": return "pd";
    case "learning": return "helping_teammates";
    case "correspondence": return "other";
    case "marketing": return "other";
    default: return "other";
  }
}

async function seed() {
  console.log("Seeding database...\n");

  // ─── 1. Team Members ────────────────────────────────────────────────────────

  console.log(`Inserting ${teamData.length} team members...`);

  // Map fcId → UUID for later assignment lookups
  const teamIdMap = new Map<string, string>();

  for (const tm of teamData) {
    const rows = await db
      .insert(schema.teamMembers)
      .values({
        fcId: tm.id,
        fullName: tm.name,
        role: mapTeamRole(tm.role),
        assignable: tm.assignable,
        employmentType: "contractor",
        weeklyCapacityHrs: String(tm.weeklyCapacity),
        isActive: true,
      })
      .onConflictDoUpdate({
        target: schema.teamMembers.fcId,
        set: {
          fullName: tm.name,
          role: mapTeamRole(tm.role),
          assignable: tm.assignable,
          weeklyCapacityHrs: String(tm.weeklyCapacity),
        },
      })
      .returning({ id: schema.teamMembers.id, fcId: schema.teamMembers.fcId });

    if (rows[0]) {
      teamIdMap.set(rows[0].fcId!, rows[0].id);
    }
  }

  console.log(`  ✓ ${teamIdMap.size} team members upserted\n`);

  // ─── 2. Internal Hours ──────────────────────────────────────────────────────

  console.log("Inserting internal hours allocations...");
  let internalCount = 0;

  for (const [memberId, categories] of Object.entries(internalHoursBreakdown)) {
    const teamUuid = teamIdMap.get(memberId);
    if (!teamUuid) continue;

    for (const [cat, hours] of Object.entries(categories)) {
      if (hours <= 0) continue;
      // Convert monthly hours to weekly (÷ 4)
      const weeklyHrs = (hours / 4).toFixed(1);
      const dbCat = mapInternalCategory(cat);

      await db
        .insert(schema.internalHoursAllocation)
        .values({
          teamMemberId: teamUuid,
          category: dbCat,
          weeklyHours: weeklyHrs,
          effectiveFrom: "2025-01-01",
        })
        .onConflictDoNothing();

      internalCount++;
    }
  }

  console.log(`  ✓ ${internalCount} internal hours rows inserted\n`);

  // ─── 3. PTO / Capacity Overrides ────────────────────────────────────────────

  console.log("Inserting PTO overrides...");

  for (const pto of defaultPtoOverrides) {
    const teamUuid = teamIdMap.get(pto.memberId);
    if (!teamUuid) continue;

    await db
      .insert(schema.capacityOverrides)
      .values({
        teamMemberId: teamUuid,
        weekStart: pto.weekStart,
        availableHrs: String(pto.availableHrs),
        reason: pto.reason,
      })
      .onConflictDoNothing();
  }

  console.log(`  ✓ ${defaultPtoOverrides.length} PTO overrides inserted\n`);

  // ─── 4. Clients ─────────────────────────────────────────────────────────────

  console.log(`Inserting ${clientData.length} clients...`);

  const clientIdMap = new Map<string, string>();

  for (const c of clientData) {
    const rows = await db
      .insert(schema.clients)
      .values({
        fcId: c.id,
        clientName: c.name,
        status: mapStatus(c.status),
        priority: c.priority,
        accountingSoftware: mapSoftware(c.software),
        complexityLevel: mapComplexity(c.complexity),
        dextHubdoc: c.dextHubdoc,
        payrollSoftware: c.payrollSoftware,
        yearEnd: c.yearEnd,
        catchUpHrs: String(c.catchUpHrs),
        monthlyBudgetHrs: String(c.totalMonthlyHrs),
        notes: c.notes,
      })
      .onConflictDoUpdate({
        target: schema.clients.fcId,
        set: {
          clientName: c.name,
          status: mapStatus(c.status),
          priority: c.priority,
          accountingSoftware: mapSoftware(c.software),
          complexityLevel: mapComplexity(c.complexity),
          dextHubdoc: c.dextHubdoc,
          payrollSoftware: c.payrollSoftware,
          yearEnd: c.yearEnd,
          catchUpHrs: String(c.catchUpHrs),
          monthlyBudgetHrs: String(c.totalMonthlyHrs),
          notes: c.notes,
        },
      })
      .returning({ id: schema.clients.id, fcId: schema.clients.fcId });

    if (rows[0]) {
      clientIdMap.set(rows[0].fcId!, rows[0].id);
    }
  }

  console.log(`  ✓ ${clientIdMap.size} clients upserted\n`);

  // ─── 5. Assignments ─────────────────────────────────────────────────────────

  console.log("Inserting assignments...");
  let assignmentCount = 0;

  for (const c of clientData) {
    const clientUuid = clientIdMap.get(c.id);
    if (!clientUuid) continue;

    for (const a of c.assignments) {
      const memberUuid = teamIdMap.get(a.memberId);
      if (!memberUuid) {
        // Some members in assignments (e.g. "eryn") may not be in teamMembers list
        console.warn(`  ⚠ Skipping assignment: member "${a.memberId}" not found in team`);
        continue;
      }

      await db
        .insert(schema.assignments)
        .values({
          teamMemberId: memberUuid,
          clientId: clientUuid,
          role: mapAssignmentRole(a.roleId),
          allocatedHrs: String(a.hours),
          effectiveFrom: "2025-01-01",
          isActive: true,
        })
        .onConflictDoNothing();

      assignmentCount++;
    }
  }

  console.log(`  ✓ ${assignmentCount} assignments inserted\n`);

  // ─── Done ───────────────────────────────────────────────────────────────────

  // Verify counts
  const [teamCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.teamMembers);
  const [clientCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.clients);
  const [aCount] = await db.select({ count: sql<number>`count(*)` }).from(schema.assignments);

  console.log("─── Verification ───");
  console.log(`  Team members: ${teamCount.count}`);
  console.log(`  Clients:      ${clientCount.count}`);
  console.log(`  Assignments:  ${aCount.count}`);
  console.log("\n✅ Seed complete!");

  await client.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

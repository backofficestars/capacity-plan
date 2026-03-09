"use server";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and, isNull, or } from "drizzle-orm";
import { mapDbClientToUi, mapDbTeamMemberToUi } from "@/lib/data-mappers";
import type { Client, TeamMember } from "@/lib/placeholder-data";

/**
 * Load all clients with their active assignments from the database.
 * Returns data in the same shape as placeholder-data Client type.
 */
export async function loadClients(): Promise<Client[]> {
  const dbClients = await db.query.clients.findMany({
    orderBy: (c, { asc }) => [asc(c.clientName)],
  });

  const dbAssignments = await db.query.assignments.findMany({
    where: eq(schema.assignments.isActive, true),
  });

  // Need team member fcId mapping for UI
  const dbTeam = await db.query.teamMembers.findMany();
  const uuidToFcId = new Map<string, string>();
  for (const t of dbTeam) {
    if (t.fcId) uuidToFcId.set(t.id, t.fcId);
  }

  return dbClients.map((c) => {
    const clientAssignments = dbAssignments.filter((a) => a.clientId === c.id);
    return mapDbClientToUi(c, clientAssignments, uuidToFcId);
  });
}

/**
 * Load all team members from the database.
 * Returns data in the same shape as placeholder-data TeamMember type.
 */
export async function loadTeamMembers(): Promise<TeamMember[]> {
  const dbTeam = await db.query.teamMembers.findMany({
    where: eq(schema.teamMembers.isActive, true),
    orderBy: (t, { asc }) => [asc(t.fullName)],
  });

  // Load all active assignments to compute monthlyOngoingHrs per team member
  const dbAssignments = await db.query.assignments.findMany({
    where: eq(schema.assignments.isActive, true),
  });

  // Load internal hours
  const dbInternalHours = await db.query.internalHoursAllocation.findMany({
    where: or(
      isNull(schema.internalHoursAllocation.effectiveUntil),
      // Active allocations only (no end date)
    ),
  });

  // Load skills
  const dbSkills = await db.query.teamMemberSkills.findMany();

  return dbTeam.map((t) => {
    const memberAssignments = dbAssignments.filter((a) => a.teamMemberId === t.id);
    const memberInternal = dbInternalHours.filter((ih) => ih.teamMemberId === t.id);
    const memberSkills = dbSkills.filter((s) => s.teamMemberId === t.id);
    return mapDbTeamMemberToUi(t, memberAssignments, memberInternal, memberSkills);
  });
}

/**
 * Load internal hours breakdown from the database.
 * Returns data in the same shape as placeholder-data internalHoursBreakdown.
 */
export async function loadInternalHoursBreakdown(): Promise<
  Record<string, Record<string, number>>
> {
  const dbTeam = await db.query.teamMembers.findMany();
  const dbInternalHours = await db.query.internalHoursAllocation.findMany();

  const result: Record<string, Record<string, number>> = {};

  for (const t of dbTeam) {
    if (!t.fcId) continue;
    const memberHours = dbInternalHours.filter((ih) => ih.teamMemberId === t.id);
    const categories: Record<string, number> = {};
    for (const ih of memberHours) {
      // Convert weekly hours back to monthly (* 4)
      const monthlyHrs = Number(ih.weeklyHours) * 4;
      // Reverse-map DB category to UI category
      const uiCat = reverseMapCategory(ih.category);
      categories[uiCat] = (categories[uiCat] ?? 0) + monthlyHrs;
    }
    result[t.fcId] = categories;
  }

  return result;
}

/**
 * Load PTO overrides from the database.
 */
export async function loadPtoOverrides() {
  const dbTeam = await db.query.teamMembers.findMany();
  const uuidToFcId = new Map<string, string>();
  for (const t of dbTeam) {
    if (t.fcId) uuidToFcId.set(t.id, t.fcId);
  }

  const dbOverrides = await db.query.capacityOverrides.findMany({
    orderBy: (o, { asc }) => [asc(o.weekStart)],
  });

  return dbOverrides.map((o, i) => ({
    id: o.id,
    memberId: uuidToFcId.get(o.teamMemberId) ?? o.teamMemberId,
    weekStart: o.weekStart,
    availableHrs: Number(o.availableHrs),
    reason: o.reason ?? "",
  }));
}

// Reverse-map DB internal category to the UI category keys
function reverseMapCategory(dbCat: string): string {
  switch (dbCat) {
    case "meetings": return "meetings";
    case "admin": return "planning";
    case "pd": return "pd";
    case "helping_teammates": return "learning";
    case "other": return "correspondence";
    default: return dbCat;
  }
}

/**
 * Transforms database rows (Drizzle schema types) into the UI types
 * defined in placeholder-data.ts, so existing components work unchanged.
 */

import type {
  Client as DbClient,
  Assignment as DbAssignment,
  TeamMember as DbTeamMember,
} from "@/lib/db/schema";
import type {
  Client as UiClient,
  TeamMember as UiTeamMember,
  ClientAssignment,
  SkillRatings,
} from "@/lib/placeholder-data";
import type { TeamMemberSkill } from "@/lib/db/schema";

// ─── Status mapping (DB enum → UI single char) ─────────────────────────────

function mapStatusToUi(s: string | null): string {
  switch (s) {
    case "active": return "A";
    case "not_active": return "N";
    case "onboarding": return "P";
    case "prospect": return "P";
    default: return "A";
  }
}

function mapSoftwareToUi(s: string | null): string | null {
  switch (s) {
    case "qbo": return "QBO";
    case "xero": return "Xero";
    case "other": return "Other";
    default: return null;
  }
}

function mapComplexityToUi(s: string | null): string | null {
  if (!s) return null;
  return s.charAt(0).toUpperCase() + s.slice(1); // low → Low, medium → Medium, high → High
}

// ─── Client mapper ──────────────────────────────────────────────────────────

export function mapDbClientToUi(
  c: DbClient,
  dbAssignments: DbAssignment[],
  uuidToFcId: Map<string, string>
): UiClient {
  // Build UI assignments
  const assignments: ClientAssignment[] = dbAssignments.map((a) => ({
    roleId: a.role,
    memberId: uuidToFcId.get(a.teamMemberId) ?? a.teamMemberId,
    hours: Number(a.allocatedHrs ?? 0),
  }));

  // Derive flat fields from assignments
  const lead = assignments.find((a) => a.roleId === "lead");
  const supporting = assignments.find((a) => a.roleId === "supporting");
  const oversight = assignments.find((a) => a.roleId === "oversight");
  const payroll = assignments.find((a) => a.roleId === "payroll");

  const totalMonthlyHrs = Math.round(assignments.reduce((sum, a) => sum + a.hours, 0) * 10) / 10;

  return {
    id: c.fcId ?? c.id,
    name: c.clientName,
    priority: c.priority ?? "B",
    status: mapStatusToUi(c.status),
    leadBookkeeper: lead?.memberId ?? null,
    secondBookkeeper: supporting?.memberId ?? null,
    oversight: oversight?.memberId ?? null,
    totalMonthlyHrs,
    primaryHrs: lead?.hours ?? 0,
    secondHrs: supporting?.hours ?? 0,
    oversightHrs: oversight?.hours ?? 0,
    complexity: mapComplexityToUi(c.complexityLevel),
    software: mapSoftwareToUi(c.accountingSoftware),
    dextHubdoc: c.dextHubdoc,
    payrollSoftware: c.payrollSoftware,
    payrollBookkeeper: payroll?.memberId ?? null,
    payrollHrs: payroll?.hours ?? 0,
    yearEnd: c.yearEnd,
    catchUpHrs: Number(c.catchUpHrs ?? 0),
    notes: c.notes,
    assignments,
  };
}

// ─── Team Member mapper ─────────────────────────────────────────────────────

export function mapDbTeamMemberToUi(
  t: DbTeamMember,
  memberAssignments: DbAssignment[],
  memberInternalHours: { weeklyHours: string }[],
  memberSkills?: TeamMemberSkill[]
): UiTeamMember {
  const monthlyOngoingHrs = Math.round(
    memberAssignments.reduce((sum, a) => sum + Number(a.allocatedHrs ?? 0), 0) * 10
  ) / 10;

  // Sum internal hours (stored as weekly, convert to monthly)
  const internalHrs = Math.round(
    memberInternalHours.reduce((sum, ih) => sum + Number(ih.weeklyHours) * 4, 0) * 10
  ) / 10;

  const weeklyCapacity = Number(t.weeklyCapacityHrs);

  // Build skills map from DB rows
  let skills: SkillRatings | undefined;
  if (memberSkills && memberSkills.length > 0) {
    skills = {
      demanding_clients: 0, complex_bookkeeping: 0, tech_ability: 0,
      payroll: 0, construction: 0, non_profit: 0,
      ecommerce: 0, a2x_dext: 0, xero: 0, qbo: 0,
    };
    for (const s of memberSkills) {
      if (s.skillKey in skills) {
        skills[s.skillKey as keyof SkillRatings] = s.skillValue;
      }
    }
  }

  return {
    id: t.fcId ?? t.id,
    name: t.fullName,
    role: mapRoleToUi(t.role),
    weeklyCapacity,
    monthlyCapacity: weeklyCapacity * 4,
    monthlyOngoingHrs,
    internalHrs,
    assignable: t.assignable ?? false,
    skills,
  };
}

function mapRoleToUi(role: string): string {
  switch (role) {
    case "bookkeeper": return "Bookkeeper";
    case "admin": return "Admin";
    case "accountant": return "Accountant";
    case "cpa": return "CPA";
    case "team_leader": return "Oversight";
    default: return role;
  }
}

// ─── Reverse mappers (UI values → DB values for writes) ────────────────────

export function mapStatusToDb(s: string): "active" | "not_active" | "onboarding" | "prospect" {
  switch (s) {
    case "A": return "active";
    case "N": return "not_active";
    case "P": return "onboarding";
    default: return "active";
  }
}

export function mapSoftwareToDb(s: string | null): "qbo" | "xero" | "other" | null {
  if (!s) return null;
  switch (s.toUpperCase()) {
    case "QBO": return "qbo";
    case "XERO": return "xero";
    default: return "other";
  }
}

export function mapComplexityToDb(s: string | null): "low" | "medium" | "high" | null {
  if (!s) return null;
  return s.toLowerCase() as "low" | "medium" | "high";
}

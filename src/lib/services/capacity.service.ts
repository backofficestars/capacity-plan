import { db } from "@/lib/db";
import {
  teamMembers,
  assignments,
  internalHoursAllocation,
  capacityOverrides,
  timeEntries,
} from "@/lib/db/schema";
import { eq, and, lte, gte, or, isNull, sql } from "drizzle-orm";
import type { CapacitySnapshot } from "@/lib/scoring/engine";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TeamCapacity {
  teamMemberId: string;
  teamMemberName: string;
  role: string;
  weeklyCapacityHrs: number;
  committedHrs: number;
  internalHrs: number;
  availableHrs: number;
  utilizationPct: number;
  status: "underloaded" | "optimal" | "high" | "overloaded";
  clientCount: number;
}

export interface CapacityThresholds {
  underloaded: number;
  optimalMin: number;
  optimalMax: number;
  overloaded: number;
}

const DEFAULT_THRESHOLDS: CapacityThresholds = {
  underloaded: 60,
  optimalMin: 70,
  optimalMax: 85,
  overloaded: 90,
};

// ─── Get Weekly Capacity for Date ────────────────────────────────────────────

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

// ─── Main Capacity Calculation ───────────────────────────────────────────────

export async function getTeamCapacity(
  targetDate?: Date,
  thresholds: CapacityThresholds = DEFAULT_THRESHOLDS
): Promise<TeamCapacity[]> {
  const date = targetDate ?? new Date();
  const weekStart = getWeekStart(date);
  const today = date.toISOString().split("T")[0];

  // 1. Get all active team members
  const members = await db.query.teamMembers.findMany({
    where: eq(teamMembers.isActive, true),
    orderBy: (tm, { asc }) => [asc(tm.fullName)],
  });

  const results: TeamCapacity[] = [];

  for (const member of members) {
    const baseCapacity = Number(member.weeklyCapacityHrs);

    // 2. Check for capacity override this week
    const override = await db.query.capacityOverrides.findFirst({
      where: and(
        eq(capacityOverrides.teamMemberId, member.id),
        eq(capacityOverrides.weekStart, weekStart)
      ),
    });
    const effectiveCapacity = override
      ? Number(override.availableHrs)
      : baseCapacity;

    // 3. Sum allocated hours from active assignments
    const activeAssignments = await db
      .select({
        totalHrs: sql<number>`coalesce(sum(${assignments.allocatedHrs}::numeric), 0)`,
        clientCount: sql<number>`count(distinct ${assignments.clientId})`,
      })
      .from(assignments)
      .where(
        and(
          eq(assignments.teamMemberId, member.id),
          eq(assignments.isActive, true),
          lte(assignments.effectiveFrom, today),
          or(
            isNull(assignments.effectiveUntil),
            gte(assignments.effectiveUntil, today)
          )
        )
      );

    const committedHrs = Number(activeAssignments[0]?.totalHrs ?? 0);
    const clientCount = Number(activeAssignments[0]?.clientCount ?? 0);

    // 4. Sum internal hours allocation
    const internalAllocs = await db
      .select({
        totalHrs: sql<number>`coalesce(sum(${internalHoursAllocation.weeklyHours}::numeric), 0)`,
      })
      .from(internalHoursAllocation)
      .where(
        and(
          eq(internalHoursAllocation.teamMemberId, member.id),
          lte(internalHoursAllocation.effectiveFrom, today),
          or(
            isNull(internalHoursAllocation.effectiveUntil),
            gte(internalHoursAllocation.effectiveUntil, today)
          )
        )
      );

    const internalHrs = Number(internalAllocs[0]?.totalHrs ?? 0);

    // 5. Calculate
    const availableHrs = Math.max(
      0,
      effectiveCapacity - committedHrs - internalHrs
    );
    const utilizationPct =
      effectiveCapacity > 0
        ? ((committedHrs + internalHrs) / effectiveCapacity) * 100
        : 0;

    let status: TeamCapacity["status"];
    if (utilizationPct >= thresholds.overloaded) {
      status = "overloaded";
    } else if (utilizationPct >= thresholds.optimalMax) {
      status = "high";
    } else if (utilizationPct >= thresholds.optimalMin) {
      status = "optimal";
    } else {
      status = "underloaded";
    }

    results.push({
      teamMemberId: member.id,
      teamMemberName: member.fullName,
      role: member.role,
      weeklyCapacityHrs: effectiveCapacity,
      committedHrs,
      internalHrs,
      availableHrs,
      utilizationPct: Math.round(utilizationPct * 10) / 10,
      status,
      clientCount,
    });
  }

  return results;
}

// ─── Convert TeamCapacity to CapacitySnapshot ────────────────────────────────

export function toCapacitySnapshot(tc: TeamCapacity): CapacitySnapshot {
  return {
    totalCapacityHrs: tc.weeklyCapacityHrs,
    committedHrs: tc.committedHrs,
    internalHrs: tc.internalHrs,
    availableHrs: tc.availableHrs,
    utilizationPct: tc.utilizationPct,
  };
}

// ─── Get Recent Actual Hours (for trend analysis) ────────────────────────────

export async function getActualHoursForPeriod(
  teamMemberId: string,
  startDate: string,
  endDate: string
): Promise<number> {
  const result = await db
    .select({
      totalHrs: sql<number>`coalesce(sum(${timeEntries.hours}::numeric), 0)`,
    })
    .from(timeEntries)
    .where(
      and(
        eq(timeEntries.teamMemberId, teamMemberId),
        gte(timeEntries.date, startDate),
        lte(timeEntries.date, endDate)
      )
    );

  return Number(result[0]?.totalHrs ?? 0);
}

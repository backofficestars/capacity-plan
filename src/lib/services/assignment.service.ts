import { db } from "@/lib/db";
import { assignments, type NewAssignment } from "@/lib/db/schema";
import { eq, and, isNull, or, gte } from "drizzle-orm";

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getActiveAssignments() {
  const today = new Date().toISOString().split("T")[0];
  return db.query.assignments.findMany({
    where: and(
      eq(assignments.isActive, true),
      or(isNull(assignments.effectiveUntil), gte(assignments.effectiveUntil, today))
    ),
    with: {
      teamMember: true,
      client: true,
    },
    orderBy: (a, { asc }) => [asc(a.teamMemberId)],
  });
}

export async function getAssignmentsForTeamMember(teamMemberId: string) {
  return db.query.assignments.findMany({
    where: and(
      eq(assignments.teamMemberId, teamMemberId),
      eq(assignments.isActive, true)
    ),
    with: { client: true },
    orderBy: (a, { asc }) => [asc(a.effectiveFrom)],
  });
}

export async function getAssignmentsForClient(clientId: string) {
  return db.query.assignments.findMany({
    where: and(
      eq(assignments.clientId, clientId),
      eq(assignments.isActive, true)
    ),
    with: { teamMember: true },
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createAssignment(data: NewAssignment) {
  const [assignment] = await db.insert(assignments).values(data).returning();
  return assignment;
}

export async function updateAssignment(
  id: string,
  data: Partial<NewAssignment>
) {
  const [updated] = await db
    .update(assignments)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(assignments.id, id))
    .returning();
  return updated;
}

export async function deactivateAssignment(id: string) {
  return updateAssignment(id, {
    isActive: false,
    effectiveUntil: new Date().toISOString().split("T")[0],
  });
}

export async function reassignClient(
  clientId: string,
  fromMemberId: string,
  toMemberId: string,
  role: "lead" | "supporting" | "oversight" | "payroll",
  allocatedHrs?: string
) {
  const today = new Date().toISOString().split("T")[0];

  // Deactivate old assignment
  await db
    .update(assignments)
    .set({ isActive: false, effectiveUntil: today, updatedAt: new Date() })
    .where(
      and(
        eq(assignments.clientId, clientId),
        eq(assignments.teamMemberId, fromMemberId),
        eq(assignments.role, role),
        eq(assignments.isActive, true)
      )
    );

  // Create new assignment
  const [newAssignment] = await db
    .insert(assignments)
    .values({
      clientId,
      teamMemberId: toMemberId,
      role,
      allocatedHrs: allocatedHrs ?? null,
      effectiveFrom: today,
      isActive: true,
    })
    .returning();

  return newAssignment;
}

// ─── Assignment Matrix Data ──────────────────────────────────────────────────

export interface MatrixCell {
  assignmentId: string;
  role: "lead" | "supporting" | "oversight" | "payroll";
  allocatedHrs: number;
}

export interface AssignmentMatrix {
  teamMembers: { id: string; name: string; totalHrs: number }[];
  clients: { id: string; name: string; tier: string | null }[];
  cells: Record<string, Record<string, MatrixCell>>;
}

export async function getAssignmentMatrix(): Promise<AssignmentMatrix> {
  const activeAssignments = await getActiveAssignments();

  const memberMap = new Map<string, { id: string; name: string; totalHrs: number }>();
  const clientMap = new Map<string, { id: string; name: string; tier: string | null }>();
  const cells: Record<string, Record<string, MatrixCell>> = {};

  for (const a of activeAssignments) {
    if (!a.teamMember || !a.client) continue;

    const memberId = a.teamMember.id;
    const clientId = a.client.id;
    const hrs = Number(a.allocatedHrs ?? 0);

    if (!memberMap.has(memberId)) {
      memberMap.set(memberId, {
        id: memberId,
        name: a.teamMember.fullName,
        totalHrs: 0,
      });
    }
    memberMap.get(memberId)!.totalHrs += hrs;

    if (!clientMap.has(clientId)) {
      const tierGroup = a.client.clientGroup?.find((g) => g.includes("Tier"));
      clientMap.set(clientId, {
        id: clientId,
        name: a.client.clientName,
        tier: tierGroup ?? null,
      });
    }

    if (!cells[memberId]) cells[memberId] = {};
    cells[memberId][clientId] = {
      assignmentId: a.id,
      role: a.role,
      allocatedHrs: hrs,
    };
  }

  return {
    teamMembers: Array.from(memberMap.values()),
    clients: Array.from(clientMap.values()),
    cells,
  };
}

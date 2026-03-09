"use server";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { mapStatusToDb, mapSoftwareToDb, mapComplexityToDb } from "@/lib/data-mappers";
import { auth } from "@/lib/auth";

// ─── Helpers ────────────────────────────────────────────────────────────────

const MAX_EDIT_LOG = 20;

/** Get the user's email from the session */
async function getUserId(): Promise<string> {
  const session = await auth();
  return session?.user?.email ?? "anonymous";
}

/** Resolve a client fcId (e.g. "c1") to its UUID */
async function resolveClientUuid(fcId: string): Promise<string | null> {
  const rows = await db
    .select({ id: schema.clients.id })
    .from(schema.clients)
    .where(eq(schema.clients.fcId, fcId))
    .limit(1);
  return rows[0]?.id ?? null;
}

/** Resolve a team member fcId (e.g. "kayla") to its UUID */
async function resolveMemberUuid(fcId: string): Promise<string | null> {
  const rows = await db
    .select({ id: schema.teamMembers.id })
    .from(schema.teamMembers)
    .where(eq(schema.teamMembers.fcId, fcId))
    .limit(1);
  return rows[0]?.id ?? null;
}

/** Record an edit to the log and trim old entries */
async function recordEdit(
  userId: string,
  tableName: string,
  rowId: string,
  operation: string,
  previousValues: Record<string, unknown>,
  newValues: Record<string, unknown>,
  description: string
) {
  await db.insert(schema.editLog).values({
    userId,
    tableName,
    rowId,
    operation,
    previousValues,
    newValues,
    description,
    undone: false,
  });

  // Trim beyond MAX_EDIT_LOG per user
  const entries = await db
    .select({ id: schema.editLog.id })
    .from(schema.editLog)
    .where(eq(schema.editLog.userId, userId))
    .orderBy(desc(schema.editLog.createdAt));

  if (entries.length > MAX_EDIT_LOG) {
    const toDelete = entries.slice(MAX_EDIT_LOG);
    for (const entry of toDelete) {
      await db.delete(schema.editLog).where(eq(schema.editLog.id, entry.id));
    }
  }
}

// ─── Map UI field name to DB column ─────────────────────────────────────────

type ClientFieldMap = {
  column: string;
  transform?: (v: unknown) => unknown;
};

const CLIENT_FIELD_MAP: Record<string, ClientFieldMap> = {
  name: { column: "clientName" },
  priority: { column: "priority" },
  status: { column: "status", transform: (v) => mapStatusToDb(String(v)) },
  complexity: { column: "complexityLevel", transform: (v) => v ? mapComplexityToDb(String(v)) : null },
  software: { column: "accountingSoftware", transform: (v) => v ? mapSoftwareToDb(String(v)) : null },
  dextHubdoc: { column: "dextHubdoc" },
  payrollSoftware: { column: "payrollSoftware" },
  yearEnd: { column: "yearEnd" },
  catchUpHrs: { column: "catchUpHrs", transform: (v) => String(v) },
  notes: { column: "notes" },
};

// ─── Update a client field ──────────────────────────────────────────────────

export async function updateClientFieldAction(
  clientFcId: string,
  field: string,
  value: unknown
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getUserId();
    const clientUuid = await resolveClientUuid(clientFcId);
    if (!clientUuid) return { success: false, error: "Client not found" };

    const fieldMap = CLIENT_FIELD_MAP[field];
    if (!fieldMap) return { success: false, error: `Unknown field: ${field}` };

    // Get current value for undo log
    const [current] = await db
      .select()
      .from(schema.clients)
      .where(eq(schema.clients.id, clientUuid));

    if (!current) return { success: false, error: "Client not found" };

    const dbColumn = fieldMap.column as keyof typeof current;
    const previousValue = current[dbColumn];
    const dbValue = fieldMap.transform ? fieldMap.transform(value) : value;

    // Update
    await db
      .update(schema.clients)
      .set({ [fieldMap.column]: dbValue, updatedAt: new Date() })
      .where(eq(schema.clients.id, clientUuid));

    // Log edit
    await recordEdit(
      userId,
      "clients",
      clientUuid,
      "update",
      { [fieldMap.column]: previousValue },
      { [fieldMap.column]: dbValue },
      `Updated ${field} on ${current.clientName}`
    );

    return { success: true };
  } catch (err) {
    console.error("updateClientFieldAction error:", err);
    return { success: false, error: String(err) };
  }
}

// ─── Add assignment ─────────────────────────────────────────────────────────

export async function addAssignmentAction(
  clientFcId: string,
  roleId: string,
  memberFcId: string,
  hours: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getUserId();
    const clientUuid = await resolveClientUuid(clientFcId);
    if (!clientUuid) return { success: false, error: "Client not found" };

    const memberUuid = await resolveMemberUuid(memberFcId);
    if (!memberUuid) return { success: false, error: "Team member not found" };

    const [inserted] = await db
      .insert(schema.assignments)
      .values({
        teamMemberId: memberUuid,
        clientId: clientUuid,
        role: roleId as "lead" | "supporting" | "oversight" | "payroll",
        allocatedHrs: String(hours),
        effectiveFrom: new Date().toISOString().split("T")[0],
        isActive: true,
      })
      .returning();

    // Get client name for log
    const [client] = await db
      .select({ name: schema.clients.clientName })
      .from(schema.clients)
      .where(eq(schema.clients.id, clientUuid));

    const [member] = await db
      .select({ name: schema.teamMembers.fullName })
      .from(schema.teamMembers)
      .where(eq(schema.teamMembers.id, memberUuid));

    await recordEdit(
      userId,
      "assignments",
      inserted.id,
      "insert",
      {},
      { teamMemberId: memberUuid, clientId: clientUuid, role: roleId, allocatedHrs: hours },
      `Added ${member?.name ?? memberFcId} as ${roleId} on ${client?.name ?? clientFcId}`
    );

    return { success: true };
  } catch (err) {
    console.error("addAssignmentAction error:", err);
    return { success: false, error: String(err) };
  }
}

// ─── Update assignment ──────────────────────────────────────────────────────

export async function updateAssignmentAction(
  clientFcId: string,
  oldRoleId: string,
  oldMemberFcId: string,
  newRoleId: string,
  newMemberFcId: string,
  newHours: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getUserId();
    const clientUuid = await resolveClientUuid(clientFcId);
    if (!clientUuid) return { success: false, error: "Client not found" };

    const oldMemberUuid = await resolveMemberUuid(oldMemberFcId);
    if (!oldMemberUuid) return { success: false, error: "Old team member not found" };

    // Find the existing assignment
    const [existing] = await db
      .select()
      .from(schema.assignments)
      .where(
        and(
          eq(schema.assignments.clientId, clientUuid),
          eq(schema.assignments.teamMemberId, oldMemberUuid),
          eq(schema.assignments.role, oldRoleId as "lead" | "supporting" | "oversight" | "payroll"),
          eq(schema.assignments.isActive, true)
        )
      );

    if (!existing) return { success: false, error: "Assignment not found" };

    const newMemberUuid = await resolveMemberUuid(newMemberFcId);
    if (!newMemberUuid) return { success: false, error: "New team member not found" };

    const previousValues = {
      teamMemberId: existing.teamMemberId,
      role: existing.role,
      allocatedHrs: existing.allocatedHrs,
    };

    await db
      .update(schema.assignments)
      .set({
        teamMemberId: newMemberUuid,
        role: newRoleId as "lead" | "supporting" | "oversight" | "payroll",
        allocatedHrs: String(newHours),
        updatedAt: new Date(),
      })
      .where(eq(schema.assignments.id, existing.id));

    await recordEdit(
      userId,
      "assignments",
      existing.id,
      "update",
      previousValues,
      { teamMemberId: newMemberUuid, role: newRoleId, allocatedHrs: newHours },
      `Updated assignment on client ${clientFcId}`
    );

    return { success: true };
  } catch (err) {
    console.error("updateAssignmentAction error:", err);
    return { success: false, error: String(err) };
  }
}

// ─── Remove assignment ──────────────────────────────────────────────────────

export async function removeAssignmentAction(
  clientFcId: string,
  roleId: string,
  memberFcId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const userId = await getUserId();
    const clientUuid = await resolveClientUuid(clientFcId);
    if (!clientUuid) return { success: false, error: "Client not found" };

    const memberUuid = await resolveMemberUuid(memberFcId);
    if (!memberUuid) return { success: false, error: "Team member not found" };

    // Find the assignment
    const [existing] = await db
      .select()
      .from(schema.assignments)
      .where(
        and(
          eq(schema.assignments.clientId, clientUuid),
          eq(schema.assignments.teamMemberId, memberUuid),
          eq(schema.assignments.role, roleId as "lead" | "supporting" | "oversight" | "payroll"),
          eq(schema.assignments.isActive, true)
        )
      );

    if (!existing) return { success: false, error: "Assignment not found" };

    // Soft-delete (mark inactive)
    await db
      .update(schema.assignments)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schema.assignments.id, existing.id));

    // Get names for log
    const [client] = await db
      .select({ name: schema.clients.clientName })
      .from(schema.clients)
      .where(eq(schema.clients.id, clientUuid));

    const [member] = await db
      .select({ name: schema.teamMembers.fullName })
      .from(schema.teamMembers)
      .where(eq(schema.teamMembers.id, memberUuid));

    await recordEdit(
      userId,
      "assignments",
      existing.id,
      "delete",
      {
        teamMemberId: existing.teamMemberId,
        clientId: existing.clientId,
        role: existing.role,
        allocatedHrs: existing.allocatedHrs,
        isActive: true,
      },
      { isActive: false },
      `Removed ${member?.name ?? memberFcId} (${roleId}) from ${client?.name ?? clientFcId}`
    );

    return { success: true };
  } catch (err) {
    console.error("removeAssignmentAction error:", err);
    return { success: false, error: String(err) };
  }
}

// ─── Undo last edit ─────────────────────────────────────────────────────────

export async function undoLastEditAction(): Promise<{
  success: boolean;
  description?: string;
  error?: string;
}> {
  try {
    const userId = await getUserId();

    // Find the most recent non-undone edit
    const [entry] = await db
      .select()
      .from(schema.editLog)
      .where(
        and(
          eq(schema.editLog.userId, userId),
          eq(schema.editLog.undone, false)
        )
      )
      .orderBy(desc(schema.editLog.createdAt))
      .limit(1);

    if (!entry) return { success: false, error: "Nothing to undo" };

    const prev = entry.previousValues as Record<string, unknown> | null;
    const table = entry.tableName;
    const rowId = entry.rowId;

    if (table === "clients" && prev && entry.operation === "update") {
      // Restore previous column values
      await db
        .update(schema.clients)
        .set({ ...prev, updatedAt: new Date() } as Record<string, unknown>)
        .where(eq(schema.clients.id, rowId));
    } else if (table === "assignments") {
      if (entry.operation === "insert") {
        // Undo an insert → soft-delete
        await db
          .update(schema.assignments)
          .set({ isActive: false, updatedAt: new Date() })
          .where(eq(schema.assignments.id, rowId));
      } else if (entry.operation === "delete" && prev) {
        // Undo a delete → re-activate
        await db
          .update(schema.assignments)
          .set({ isActive: true, updatedAt: new Date() })
          .where(eq(schema.assignments.id, rowId));
      } else if (entry.operation === "update" && prev) {
        // Undo an update → restore previous values
        await db
          .update(schema.assignments)
          .set({ ...prev, updatedAt: new Date() } as Record<string, unknown>)
          .where(eq(schema.assignments.id, rowId));
      }
    }

    // Mark as undone
    await db
      .update(schema.editLog)
      .set({ undone: true })
      .where(eq(schema.editLog.id, entry.id));

    return { success: true, description: entry.description };
  } catch (err) {
    console.error("undoLastEditAction error:", err);
    return { success: false, error: String(err) };
  }
}

// ─── Check if undo is available ─────────────────────────────────────────────

export async function canUndoAction(): Promise<boolean> {
  try {
    const userId = await getUserId();
    const [entry] = await db
      .select({ id: schema.editLog.id })
      .from(schema.editLog)
      .where(
        and(
          eq(schema.editLog.userId, userId),
          eq(schema.editLog.undone, false)
        )
      )
      .limit(1);
    return !!entry;
  } catch {
    return false;
  }
}

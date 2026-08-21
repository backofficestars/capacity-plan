"use server";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  createTeamMember,
  deactivateTeamMember,
  reactivateTeamMember,
} from "@/lib/services/team.service";
import type { SkillKey } from "@/lib/db/schema";

async function getUserId(): Promise<string> {
  const session = await auth();
  return session?.user?.email ?? "anonymous";
}

/** Turn a full name into the lowercase-first-name id used throughout the app (e.g. "Teina Goffe" -> "teina") */
function nameToFcId(name: string): string {
  return name.trim().toLowerCase().split(" ")[0].replace(/[^a-z0-9]/g, "");
}

async function fcIdExists(fcId: string): Promise<boolean> {
  const rows = await db
    .select({ id: schema.teamMembers.id })
    .from(schema.teamMembers)
    .where(eq(schema.teamMembers.fcId, fcId))
    .limit(1);
  return rows.length > 0;
}

// ─── Add a team member ───────────────────────────────────────────────────────

export async function addTeamMemberAction(input: {
  fullName: string;
  role: "bookkeeper" | "admin" | "accountant" | "cpa" | "team_leader";
  employmentType: "full_time" | "part_time" | "contractor";
  weeklyCapacityHrs: number;
  assignable: boolean;
  notes?: string;
  skills?: Partial<Record<SkillKey, number>>;
}): Promise<{ success: boolean; error?: string; fcId?: string }> {
  try {
    const fullName = input.fullName.trim();
    if (!fullName) return { success: false, error: "Name is required" };

    let fcId = nameToFcId(fullName);
    if (!fcId) return { success: false, error: "Could not derive an ID from that name" };

    // Avoid clobbering an existing member with the same first name
    if (await fcIdExists(fcId)) {
      fcId = `${fcId}-${Date.now().toString(36)}`;
    }

    const member = await createTeamMember(
      {
        fcId,
        fullName,
        role: input.role,
        employmentType: input.employmentType,
        weeklyCapacityHrs: String(input.weeklyCapacityHrs),
        assignable: input.assignable,
        isActive: true,
        notes: input.notes || null,
      },
      input.skills
    );

    if (!member) return { success: false, error: "Failed to create team member" };

    revalidatePath("/team");
    return { success: true, fcId: member.fcId ?? fcId };
  } catch (err) {
    console.error("addTeamMemberAction error:", err);
    return { success: false, error: String(err) };
  }
}

// ─── Deactivate / reactivate ─────────────────────────────────────────────────

async function resolveMemberUuidByFcId(fcId: string): Promise<string | null> {
  const rows = await db
    .select({ id: schema.teamMembers.id })
    .from(schema.teamMembers)
    .where(eq(schema.teamMembers.fcId, fcId))
    .limit(1);
  return rows[0]?.id ?? null;
}

export async function deactivateTeamMemberAction(
  memberFcId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const uuid = await resolveMemberUuidByFcId(memberFcId);
    if (!uuid) return { success: false, error: "Team member not found" };

    const [before] = await db
      .select({ fullName: schema.teamMembers.fullName })
      .from(schema.teamMembers)
      .where(eq(schema.teamMembers.id, uuid));

    await deactivateTeamMember(uuid);

    const userId = await getUserId();
    await db.insert(schema.editLog).values({
      userId,
      tableName: "team_members",
      rowId: uuid,
      operation: "update",
      previousValues: { isActive: true },
      newValues: { isActive: false, assignable: false },
      description: `Deactivated ${before?.fullName ?? memberFcId}`,
      undone: false,
    });

    revalidatePath("/team");
    return { success: true };
  } catch (err) {
    console.error("deactivateTeamMemberAction error:", err);
    return { success: false, error: String(err) };
  }
}

export async function reactivateTeamMemberAction(
  memberFcId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const uuid = await resolveMemberUuidByFcId(memberFcId);
    if (!uuid) return { success: false, error: "Team member not found" };

    await reactivateTeamMember(uuid);
    revalidatePath("/team");
    return { success: true };
  } catch (err) {
    console.error("reactivateTeamMemberAction error:", err);
    return { success: false, error: String(err) };
  }
}

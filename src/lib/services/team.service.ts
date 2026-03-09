import { db } from "@/lib/db";
import {
  teamMembers,
  teamMemberSkills,
  type NewTeamMember,
  type SkillKey,
  SKILL_KEYS,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getAllTeamMembers() {
  return db.query.teamMembers.findMany({
    with: { skills: true },
    orderBy: (tm, { asc }) => [asc(tm.fullName)],
  });
}

export async function getAssignableTeamMembers() {
  return db.query.teamMembers.findMany({
    where: (tm, { eq, and }) =>
      and(eq(tm.assignable, true), eq(tm.isActive, true)),
    with: { skills: true },
    orderBy: (tm, { asc }) => [asc(tm.fullName)],
  });
}

export async function getTeamMemberById(id: string) {
  return db.query.teamMembers.findFirst({
    where: eq(teamMembers.id, id),
    with: {
      skills: true,
      assignments: {
        with: { client: true },
        where: (a, { eq }) => eq(a.isActive, true),
      },
    },
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createTeamMember(
  data: NewTeamMember,
  skills?: Partial<Record<SkillKey, number>>
) {
  const [member] = await db.insert(teamMembers).values(data).returning();

  if (skills && member) {
    const skillEntries = Object.entries(skills).map(([key, value]) => ({
      teamMemberId: member.id,
      skillKey: key,
      skillValue: value ?? 0,
    }));
    if (skillEntries.length > 0) {
      await db.insert(teamMemberSkills).values(skillEntries);
    }
  }

  return member;
}

export async function updateTeamMember(
  id: string,
  data: Partial<NewTeamMember>
) {
  const [updated] = await db
    .update(teamMembers)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(teamMembers.id, id))
    .returning();
  return updated;
}

export async function updateTeamMemberSkills(
  teamMemberId: string,
  skills: Partial<Record<SkillKey, number>>
) {
  for (const [key, value] of Object.entries(skills)) {
    if (value === undefined) continue;
    await db
      .insert(teamMemberSkills)
      .values({
        teamMemberId,
        skillKey: key,
        skillValue: value,
      })
      .onConflictDoUpdate({
        target: [teamMemberSkills.teamMemberId, teamMemberSkills.skillKey],
        set: { skillValue: value, updatedAt: new Date() },
      });
  }
}

export async function getSkillsMap(
  teamMemberId: string
): Promise<Record<SkillKey, number>> {
  const skills = await db.query.teamMemberSkills.findMany({
    where: eq(teamMemberSkills.teamMemberId, teamMemberId),
  });

  const map: Record<string, number> = {};
  for (const key of SKILL_KEYS) {
    map[key] = 0;
  }
  for (const skill of skills) {
    map[skill.skillKey] = skill.skillValue;
  }
  return map as Record<SkillKey, number>;
}

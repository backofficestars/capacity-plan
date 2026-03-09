import { db } from "@/lib/db";
import { clients, type NewClient } from "@/lib/db/schema";
import { eq, ilike, or, sql } from "drizzle-orm";

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getAllClients() {
  return db.query.clients.findMany({
    with: {
      assignments: {
        where: (a, { eq }) => eq(a.isActive, true),
        with: { teamMember: true },
      },
    },
    orderBy: (c, { asc }) => [asc(c.clientName)],
  });
}

export async function getClientById(id: string) {
  return db.query.clients.findFirst({
    where: eq(clients.id, id),
    with: {
      assignments: {
        with: { teamMember: true },
      },
      projects: {
        orderBy: (p, { desc }) => [desc(p.dueDate)],
      },
    },
  });
}

export async function searchClients(query: string) {
  return db.query.clients.findMany({
    where: or(
      ilike(clients.clientName, `%${query}%`),
      ilike(clients.industry, `%${query}%`)
    ),
    orderBy: (c, { asc }) => [asc(c.clientName)],
    limit: 20,
  });
}

export async function getClientsByStatus(status: string) {
  return db.query.clients.findMany({
    where: eq(clients.status, status as "active" | "not_active" | "onboarding" | "prospect"),
    with: {
      assignments: {
        where: (a, { eq }) => eq(a.isActive, true),
        with: { teamMember: true },
      },
    },
    orderBy: (c, { asc }) => [asc(c.clientName)],
  });
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createClient(data: NewClient) {
  const [client] = await db.insert(clients).values(data).returning();
  return client;
}

export async function updateClient(id: string, data: Partial<NewClient>) {
  const [updated] = await db
    .update(clients)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(clients.id, id))
    .returning();
  return updated;
}

export async function getClientStats() {
  const result = await db
    .select({
      total: sql<number>`count(*)`,
      active: sql<number>`count(*) filter (where ${clients.status} = 'active')`,
      prospect: sql<number>`count(*) filter (where ${clients.status} = 'prospect')`,
      onboarding: sql<number>`count(*) filter (where ${clients.status} = 'onboarding')`,
    })
    .from(clients);

  return result[0];
}

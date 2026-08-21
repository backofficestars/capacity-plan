/**
 * GET /api/fc/check
 *
 * Server-side version of the FC Check page's comparison: diffs the live
 * Financial Cents client list against the clients currently in the database
 * (kept in sync from the Google Sheet). Meant to be called by a nightly job
 * with `Authorization: Bearer $CRON_SECRET` so it can run unattended.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fetchActiveFcClients, normalizeClientName } from "@/lib/financial-cents";

export async function GET() {
  try {
    const { clients: fcClients } = await fetchActiveFcClients();

    const dbClients = await db.query.clients.findMany({
      where: (c, { eq }) => eq(c.status, "active"),
      with: { fcAliases: true },
    });

    // Map every normalized name a client is known by — its own name plus any
    // Financial Cents aliases — back to that client's name, so a naming
    // difference between the Sheet and FC doesn't show up as a false mismatch.
    const sheetNames = new Map<string, string>();
    for (const c of dbClients) {
      sheetNames.set(normalizeClientName(c.clientName), c.clientName);
      for (const alias of c.fcAliases) {
        sheetNames.set(normalizeClientName(alias.fcName), c.clientName);
      }
    }
    const fcMap = new Map(fcClients.map((c) => [normalizeClientName(c.name), c.name]));

    const fcOnly = fcClients
      .filter((c) => !sheetNames.has(normalizeClientName(c.name)))
      .map((c) => c.name);
    const sheetOnly = dbClients
      .filter(
        (c) =>
          !fcMap.has(normalizeClientName(c.clientName)) &&
          !c.fcAliases.some((alias) => fcMap.has(normalizeClientName(alias.fcName)))
      )
      .map((c) => c.clientName);

    return NextResponse.json({
      success: true,
      checkedAt: new Date().toISOString(),
      fcOnly,
      sheetOnly,
      fcOnlyCount: fcOnly.length,
      sheetOnlyCount: sheetOnly.length,
      matchedCount: dbClients.length - sheetOnly.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * GET /api/fc/clients
 *
 * Fetches all active clients from Financial Cents.
 * Auth: session (browser) or `Authorization: Bearer $CRON_SECRET` (server-to-server).
 */

import { NextResponse } from "next/server";
import { fetchActiveFcClients } from "@/lib/financial-cents";

export async function GET() {
  try {
    const { clients, totalFromApi, skippedArchived } = await fetchActiveFcClients();

    return NextResponse.json({
      success: true,
      clients,
      total: clients.length,
      totalFromApi,
      skippedArchived,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * GET /api/fc/clients
 *
 * Fetches all clients from Financial Cents API.
 * Handles pagination (100 per page) automatically.
 * Auth: Bearer token via FINANCIAL_CENTS_API_KEY env var.
 *
 * FC API uses `is_archived` (boolean) to indicate active/inactive:
 *   is_archived: false  → active client
 *   is_archived: true   → inactive/archived client
 */

import { NextResponse } from "next/server";

const FC_BASE = "https://app.financial-cents.com/api/v1";

type FcApiClient = {
  id: string;
  company_name?: string;
  display_name?: string;
  name?: string;
  is_archived?: boolean;
  archived_at?: string | null;
  [key: string]: unknown;
};

export async function GET() {
  const apiKey = process.env.FINANCIAL_CENTS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "FINANCIAL_CENTS_API_KEY is not set" },
      { status: 500 }
    );
  }

  try {
    const allClients: { name: string; status: string }[] = [];
    let page = 1;
    let hasMore = true;
    let totalFromApi = 0;
    let skippedArchived = 0;

    // Paginate through all results (100 per page)
    while (hasMore) {
      const res = await fetch(`${FC_BASE}/clients?page=${page}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json(
          { success: false, error: `FC API error ${res.status}: ${text}` },
          { status: 502 }
        );
      }

      const json = await res.json();

      // FC API returns { data: [...], ... } or just an array
      const clients: FcApiClient[] = Array.isArray(json)
        ? json
        : json.data ?? [];

      if (clients.length === 0) {
        hasMore = false;
        break;
      }

      totalFromApi += clients.length;

      for (const c of clients) {
        const name = c.company_name || c.display_name || c.name || "";
        if (!name) continue;

        // Skip archived/inactive clients
        if (c.is_archived === true || c.archived_at != null) {
          skippedArchived++;
          continue;
        }

        allClients.push({ name, status: "Active" });
      }

      // If we got fewer than 100, we've reached the last page
      if (clients.length < 100) {
        hasMore = false;
      } else {
        page++;
      }
    }

    return NextResponse.json({
      success: true,
      clients: allClients,
      total: allClients.length,
      totalFromApi,
      skippedArchived,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

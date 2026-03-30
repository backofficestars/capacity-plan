/**
 * GET /api/fc/clients
 *
 * Fetches all clients from Financial Cents API.
 * Handles pagination (100 per page) automatically.
 * Auth: Bearer token via FINANCIAL_CENTS_API_KEY env var.
 */

import { NextResponse } from "next/server";

const FC_BASE = "https://app.financial-cents.com/api/v1";

type FcApiClient = {
  id: string;
  company_name?: string;
  name?: string;
  status?: string;
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

      for (const c of clients) {
        const name = c.company_name || c.name || "";
        if (!name) continue;

        // Normalise status to Active / Inactive / Archived
        const rawStatus = (c.status ?? "").toString().toLowerCase();
        let status = "Active";
        if (rawStatus.includes("inactive") || rawStatus === "0") status = "Inactive";
        if (rawStatus.includes("archiv")) status = "Archived";

        // Only include active clients in the comparison
        if (status !== "Active") continue;

        allClients.push({ name, status });
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
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

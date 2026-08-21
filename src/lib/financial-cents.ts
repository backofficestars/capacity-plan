/**
 * Shared helper for talking to the Financial Cents API.
 * See docs/financial-cents-api.md for the API reference.
 */

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

export type FcClient = { name: string; status: string };

export class FcApiError extends Error {}

/** Fetch every active (non-archived) client from Financial Cents, paginating as needed. */
export async function fetchActiveFcClients(): Promise<{
  clients: FcClient[];
  totalFromApi: number;
  skippedArchived: number;
}> {
  const apiKey = process.env.FINANCIAL_CENTS_API_KEY;
  if (!apiKey) {
    throw new FcApiError("FINANCIAL_CENTS_API_KEY is not set");
  }

  const clients: FcClient[] = [];
  let page = 1;
  let hasMore = true;
  let totalFromApi = 0;
  let skippedArchived = 0;

  while (hasMore) {
    const res = await fetch(`${FC_BASE}/clients?page=${page}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new FcApiError(`FC API error ${res.status}: ${text}`);
    }

    const json = await res.json();
    const pageClients: FcApiClient[] = Array.isArray(json) ? json : json.data ?? [];

    if (pageClients.length === 0) {
      hasMore = false;
      break;
    }

    totalFromApi += pageClients.length;

    for (const c of pageClients) {
      const name = c.company_name || c.display_name || c.name || "";
      if (!name) continue;

      if (c.is_archived === true || c.archived_at != null) {
        skippedArchived++;
        continue;
      }

      clients.push({ name, status: "Active" });
    }

    if (pageClients.length < 100) {
      hasMore = false;
    } else {
      page++;
    }
  }

  return { clients, totalFromApi, skippedArchived };
}

/** Normalise a client name for fuzzy matching (lowercase, trim, collapse whitespace). */
export function normalizeClientName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

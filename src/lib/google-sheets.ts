/**
 * Google Sheets API helper — authenticates with a service account
 * and reads data from the BOS Client Assignment & Priorities sheet.
 *
 * Required env vars:
 *   GOOGLE_SERVICE_ACCOUNT_JSON — the full JSON key (as a string)
 *   GOOGLE_SHEET_ID — the spreadsheet ID (from the URL)
 */

import { google } from "googleapis";

// Cache the auth client so we don't re-create it on every request
let cachedAuth: ReturnType<typeof google.auth.GoogleAuth.prototype.getClient> | null = null;

function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON environment variable is not set");
  }

  const credentials = JSON.parse(raw);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
}

/**
 * Read a range from the configured Google Sheet.
 * Returns a 2D array of strings (rows × columns).
 */
export async function readSheetRange(range: string): Promise<string[][]> {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    throw new Error("GOOGLE_SHEET_ID environment variable is not set");
  }

  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });

  // Return empty array if no data
  return (response.data.values as string[][]) ?? [];
}

/**
 * Read multiple ranges in a single API call (more efficient).
 * Returns a map of range → 2D string array.
 */
export async function readSheetRanges(
  ranges: string[]
): Promise<Map<string, string[][]>> {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) {
    throw new Error("GOOGLE_SHEET_ID environment variable is not set");
  }

  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  const response = await sheets.spreadsheets.values.batchGet({
    spreadsheetId: sheetId,
    ranges,
  });

  const result = new Map<string, string[][]>();
  for (const vr of response.data.valueRanges ?? []) {
    if (vr.range) {
      result.set(vr.range, (vr.values as string[][]) ?? []);
    }
  }

  return result;
}

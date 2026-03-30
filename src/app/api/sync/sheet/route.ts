/**
 * POST /api/sync/sheet
 *
 * Reads the BOS Client Assignment & Priorities Google Sheet
 * and upserts all client, team member, and assignment data into the database.
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { readSheetRange } from "@/lib/google-sheets";
import { sql } from "drizzle-orm";

// ─── Column indices for the main data area (row 2 = headers, row 3+ = data) ──
// A=0  Priority
// B=1  Active?
// C=2  Client
// D=3  Lead Bookkeeper
// E=4  Notes
// F=5  Total Hours/Mo
// G=6  Primary Hours
// H=7  Complexity
// I=8  Second (bookkeeper)
// J=9  2nd Hours
// K=10 Oversight
// L=11 Oversight Hours
// M=12 Oversight Frequency
// N=13 Payroll Software
// O=14 Payroll Bookkeeper
// P=15 Payroll hours
// Q=16 Payroll Frequency
// R=17 Next Payroll
// S=18 Meeting time (Q or M) in monthly hours
// T=19 Meeting Frequency
// U=20 Year End Total Hours
// V=21 Year End BK hours
// W=22 Year End Oversight hours
// X=23 Year End
// Y=24 Catch up/Setup hours
// Z=25 Software
// AA=26 Dext/Hubdoc

// ─── Summary section column indices (D82:S95) ──────────────────────────────
// Relative to col D (index 0 in the summary range):
// 0=Bookkeeper, 1=Target, 3=Total Hours, 5=Primary, 7=Second
// 8=Oversight, 9=Payroll, 10=Meetings, 11=Internal, 12=Catchup/Setup, 14=% capacity

// ─── Helpers ────────────────────────────────────────────────────────────────

function cell(row: string[], idx: number): string {
  return (row[idx] ?? "").trim();
}

function numCell(row: string[], idx: number): number {
  const raw = cell(row, idx).replace(/[^0-9.\-]/g, "");
  const n = parseFloat(raw);
  return isNaN(n) ? 0 : n;
}

/** Map sheet status letter to DB enum */
function mapStatus(s: string): "active" | "not_active" | "onboarding" | "prospect" {
  switch (s.toUpperCase()) {
    case "A": return "active";
    case "N": return "not_active";
    case "P": return "onboarding";
    default: return "active";
  }
}

/** Map sheet software string to DB enum */
function mapSoftware(s: string): "qbo" | "xero" | "other" | null {
  if (!s) return null;
  const lower = s.toLowerCase();
  if (lower.includes("qbo") || lower.includes("quickbooks")) return "qbo";
  if (lower.includes("xero")) return "xero";
  if (lower) return "other";
  return null;
}

/** Map sheet complexity string to DB enum */
function mapComplexity(s: string): "low" | "medium" | "high" | null {
  if (!s) return null;
  const lower = s.toLowerCase();
  if (lower === "low") return "low";
  if (lower === "medium") return "medium";
  if (lower === "high") return "high";
  return "medium";
}

/** Normalise a bookkeeper name from the sheet to a lowercase first-name ID */
function nameToId(name: string): string {
  if (!name) return "";
  // The sheet uses full names like "Kim", "Kayla", "Ellen"
  // Our IDs are lowercase first names
  return name.trim().toLowerCase().split(" ")[0];
}

export async function POST() {
  const errors: string[] = [];
  let clientsUpdated = 0;
  let teamMembersUpdated = 0;
  let assignmentsUpdated = 0;

  try {
    // ─── 1. Read main data + summary from the Sheet ───────────────────────

    // Read a wide range that covers both client data and the summary section below it
    // Using a generous range so it works even if rows are added/removed
    const allData = await readSheetRange("'Client Assignments'!A3:AA150");

    // Split into client rows (have a value in column C = client name)
    // and find the summary section (starts with a row where col D = "Bookkeeper")
    const mainData: string[][] = [];
    let summaryData: string[][] = [];
    let foundSummary = false;

    for (let i = 0; i < allData.length; i++) {
      const row = allData[i];
      // The summary section header has "Bookkeeper" in column D (index 3)
      // but since summary is read as D:S, we need to check if col D has "Bookkeeper"
      if (!foundSummary && cell(row, 3)?.toLowerCase() === "bookkeeper") {
        // Found the summary header — everything after this is summary data
        foundSummary = true;
        // Grab remaining rows, offset to start at column D (index 3)
        summaryData = allData.slice(i + 1).map((r) => r.slice(3));
        break;
      }
      // Only include rows with a client name in column C
      if (cell(row, 2)) {
        mainData.push(row);
      }
    }

    if (!foundSummary) {
      return NextResponse.json(
        { success: false, error: "Could not find the summary section (row with 'Bookkeeper' in column D) in the sheet" },
        { status: 400 }
      );
    }

    // ─── 2. Build team member ID map (fcId → UUID) ────────────────────────

    const dbTeam = await db.query.teamMembers.findMany();
    const teamIdMap = new Map<string, string>(); // fcId → UUID
    for (const t of dbTeam) {
      if (t.fcId) teamIdMap.set(t.fcId, t.id);
    }

    // ─── 3. Update team members from summary section ──────────────────────

    for (const row of summaryData) {
      const bookkeeper = cell(row, 0); // Column D = Bookkeeper name
      if (!bookkeeper || bookkeeper === "Bookkeeper") continue; // Skip header

      const fcId = nameToId(bookkeeper);
      const teamUuid = teamIdMap.get(fcId);
      if (!teamUuid) {
        errors.push(`Summary: team member "${bookkeeper}" (${fcId}) not found in DB`);
        continue;
      }

      const target = numCell(row, 1);          // Target capacity (monthly)
      const meetingHrs = numCell(row, 10);      // Meetings
      const internalHrs = numCell(row, 11);     // Internal
      const catchupSetup = numCell(row, 12);    // Catchup/Setup

      // Update team member with summary data
      await db
        .update(schema.teamMembers)
        .set({
          weeklyCapacityHrs: String(target / 4),   // Convert monthly to weekly
          meetingHrs: String(meetingHrs),
          catchupMonthlyHrs: String(catchupSetup),
          updatedAt: new Date(),
        })
        .where(sql`${schema.teamMembers.id} = ${teamUuid}`);

      teamMembersUpdated++;
    }

    // ─── 4. Delete existing assignments & clients (full refresh) ──────────

    await db.delete(schema.assignments);
    await db.delete(schema.clients);

    // ─── 5. Insert clients and create assignments from sheet ─────────────

    for (const row of mainData) {
      const clientName = cell(row, 2);
      if (!clientName) continue; // Skip empty rows

      const priority = cell(row, 0) || "B";
      const status = cell(row, 1) || "A";
      const complexity = cell(row, 7);
      const software = cell(row, 25);
      const dextHubdoc = cell(row, 26);
      const payrollSoftware = cell(row, 13);
      const yearEnd = cell(row, 23);
      const catchUpHrs = numCell(row, 24);
      const totalMonthlyHrs = numCell(row, 5);
      const notes = cell(row, 4) || null;

      // Use the client name as a stable ID (normalised)
      const fcId = clientName.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-");

      // Insert client (table was cleared above, so no conflicts)
      const clientRows = await db
        .insert(schema.clients)
        .values({
          fcId,
          clientName,
          status: mapStatus(status),
          priority,
          accountingSoftware: mapSoftware(software),
          complexityLevel: mapComplexity(complexity),
          dextHubdoc: dextHubdoc || null,
          payrollSoftware: payrollSoftware || null,
          yearEnd: yearEnd || null,
          catchUpHrs: String(catchUpHrs),
          monthlyBudgetHrs: String(totalMonthlyHrs),
          notes,
        })
        .returning({ id: schema.clients.id });

      if (!clientRows[0]) continue;
      clientsUpdated++;
      const clientUuid = clientRows[0].id;

      // ─── Create assignments for this client ─────────────────────────

      const assignmentDefs: { role: "lead" | "supporting" | "oversight" | "payroll"; memberId: string; hours: number }[] = [];

      // Lead bookkeeper
      const leadName = nameToId(cell(row, 3));
      const leadHrs = numCell(row, 6);
      if (leadName && teamIdMap.has(leadName)) {
        assignmentDefs.push({ role: "lead", memberId: leadName, hours: leadHrs });
      }

      // Second bookkeeper
      const secondName = nameToId(cell(row, 8));
      const secondHrs = numCell(row, 9);
      if (secondName && teamIdMap.has(secondName)) {
        assignmentDefs.push({ role: "supporting", memberId: secondName, hours: secondHrs });
      }

      // Oversight
      const oversightName = nameToId(cell(row, 10));
      const oversightHrs = numCell(row, 11);
      if (oversightName && teamIdMap.has(oversightName)) {
        assignmentDefs.push({ role: "oversight", memberId: oversightName, hours: oversightHrs });
      }

      // Payroll
      const payrollName = nameToId(cell(row, 14));
      const payrollHrs = numCell(row, 15);
      if (payrollName && teamIdMap.has(payrollName)) {
        assignmentDefs.push({ role: "payroll", memberId: payrollName, hours: payrollHrs });
      }

      for (const a of assignmentDefs) {
        const memberUuid = teamIdMap.get(a.memberId);
        if (!memberUuid) continue;

        await db
          .insert(schema.assignments)
          .values({
            teamMemberId: memberUuid,
            clientId: clientUuid,
            role: a.role,
            allocatedHrs: String(a.hours),
            effectiveFrom: "2025-01-01",
            isActive: true,
          })
          .onConflictDoNothing();

        assignmentsUpdated++;
      }
    }

    // ─── 6. Log the sync ──────────────────────────────────────────────────

    await db.insert(schema.syncLog).values({
      source: "google_sheets",
      syncType: "full_refresh",
      status: "completed",
      recordsSynced: clientsUpdated + teamMembersUpdated + assignmentsUpdated,
      completedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      clientsUpdated,
      teamMembersUpdated,
      assignmentsUpdated,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    // Log the failed sync
    try {
      await db.insert(schema.syncLog).values({
        source: "google_sheets",
        syncType: "full_refresh",
        status: "failed",
        errorMessage: message,
        completedAt: new Date(),
      });
    } catch {
      // If even logging fails, just continue
    }

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

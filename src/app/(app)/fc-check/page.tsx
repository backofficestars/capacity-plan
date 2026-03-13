"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CheckCircle2,
  FileQuestion,
  Info,
  RefreshCw,
} from "lucide-react";
import { useClientData } from "@/lib/client-data-context";
import { fcClients } from "@/lib/fc-placeholder-data";
import { statusLabels } from "@/lib/placeholder-data";

// Normalize client names for fuzzy matching (lowercase, trim whitespace)
function normalize(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

export default function FcCheckPage() {
  const { clients } = useClientData();

  // Compare FC client list against the Google Sheet (app) client list
  const { fcOnly, sheetOnly, matched } = useMemo(() => {
    // Build lookup maps using normalized names
    const sheetMap = new Map(
      clients.map((c) => [normalize(c.name), c])
    );
    const fcMap = new Map(
      fcClients.map((fc) => [normalize(fc.name), fc])
    );

    // Clients in FC but not in the Sheet
    const fcOnly = fcClients.filter(
      (fc) => !sheetMap.has(normalize(fc.name))
    );

    // Clients in the Sheet but not in FC
    const sheetOnly = clients.filter(
      (c) => !fcMap.has(normalize(c.name))
    );

    // Clients found in both
    const matched = clients.filter((c) =>
      fcMap.has(normalize(c.name))
    );

    return { fcOnly, sheetOnly, matched };
  }, [clients]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">FC Check</h1>
          <p className="text-muted-foreground">
            Compare Financial Cents client list against the Google Sheet to catch
            missing clients
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Check FC
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* In FC Only — the important one */}
        <Card className={fcOnly.length > 0 ? "border-amber-300 bg-amber-50/50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In FC Only
            </CardTitle>
            <AlertTriangle
              className={`h-4 w-4 ${
                fcOnly.length > 0 ? "text-amber-500" : "text-muted-foreground"
              }`}
            />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                fcOnly.length > 0 ? "text-amber-700" : ""
              }`}
            >
              {fcOnly.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {fcOnly.length > 0
                ? "Clients in FC missing from your Sheet — review needed"
                : "No missing clients found"}
            </p>
          </CardContent>
        </Card>

        {/* In Sheet Only */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Sheet Only
            </CardTitle>
            <FileQuestion className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sheetOnly.length}</div>
            <p className="text-xs text-muted-foreground">
              Clients in your Sheet but not found in FC
            </p>
          </CardContent>
        </Card>

        {/* Matched */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Matched
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">
              {matched.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Clients found in both sources
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── In FC Only — Needs Review ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <CardTitle>Clients in FC Only — Needs Review</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            These clients exist in Financial Cents but are not in your planning
            spreadsheet. They may be new clients that need to be added.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {fcOnly.length === 0 ? (
            <div className="flex items-center gap-2 px-6 py-8 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              All FC clients are accounted for in the Sheet. Nothing to review.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Client Name (from FC)</TableHead>
                  <TableHead className="w-[120px]">FC Status</TableHead>
                  <TableHead>Action Needed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fcOnly.map((fc, i) => (
                  <TableRow key={fc.name} className="bg-amber-50/30">
                    <TableCell className="text-muted-foreground tabular-nums">
                      {i + 1}
                    </TableCell>
                    <TableCell className="font-medium">{fc.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          fc.status === "Active"
                            ? "border-emerald-200 text-emerald-700"
                            : fc.status === "Inactive"
                              ? "border-zinc-200 text-zinc-500"
                              : "border-red-200 text-red-600"
                        }
                      >
                        {fc.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {fc.status === "Active"
                        ? "Add to Google Sheet with assignments and hours"
                        : "Confirm if this client should be tracked"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── In Sheet Only — Other Discrepancies ────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-500" />
            <CardTitle>Clients in Sheet Only</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            These clients are in your planning spreadsheet but were not found in
            Financial Cents. This is often fine — prospects or internal entries
            may not be in FC yet.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {sheetOnly.length === 0 ? (
            <div className="flex items-center gap-2 px-6 py-8 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Every Sheet client has a match in FC. Nothing to review.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Client Name (from Sheet)</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[80px]">Priority</TableHead>
                  <TableHead>Possible Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sheetOnly.map((c, i) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {i + 1}
                    </TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          c.status === "A"
                            ? "bg-emerald-50 text-emerald-700"
                            : c.status === "P"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-zinc-100 text-zinc-600"
                        }
                      >
                        {statusLabels[c.status] ?? c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{c.priority}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.status === "P"
                        ? "Prospect/onboarding — may not be in FC yet"
                        : "Check if client was removed or renamed in FC"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  RefreshCw,
  Save,
  CheckCircle2,
  XCircle,
  Clock,
  Upload,
} from "lucide-react";

// Default scoring weights from the plan
const defaultWeights = {
  sector_experience: 30,
  availability: 25,
  daytime: 10,
  demanding: 10,
  complexity: 10,
  personality: 5,
  tech: 5,
  software: 5,
};

const WEIGHT_LABELS: Record<string, string> = {
  sector_experience: "Sector Experience",
  availability: "Availability",
  daytime: "Daytime Availability",
  demanding: "Demanding Client Handling",
  complexity: "Complexity Match",
  personality: "Personality Fit",
  tech: "Tech Ability",
  software: "Software Match",
};

// Placeholder sync logs
const syncLogs = [
  {
    id: "1",
    source: "Financial Cents",
    syncType: "full",
    status: "success",
    records: 441,
    startedAt: "2026-03-08 02:00:00",
    completedAt: "2026-03-08 02:03:45",
  },
  {
    id: "2",
    source: "Financial Cents",
    syncType: "full",
    status: "success",
    records: 438,
    startedAt: "2026-03-07 02:00:00",
    completedAt: "2026-03-07 02:04:12",
  },
  {
    id: "3",
    source: "Financial Cents",
    syncType: "on_demand",
    status: "error",
    records: 0,
    startedAt: "2026-03-06 14:30:00",
    completedAt: "2026-03-06 14:30:05",
    error: "API rate limit exceeded",
  },
];

export default function SettingsPage() {
  const [weights, setWeights] = useState(defaultWeights);

  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure scoring weights, sync settings, and data imports
        </p>
      </div>

      {/* Scoring Weights */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Scoring Weights</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Adjust how bookkeeper-client fit scores are calculated.
              Total must equal 100.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={
                totalWeight === 100
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }
            >
              Total: {totalWeight}
            </Badge>
            <Button
              size="sm"
              disabled={totalWeight !== 100}
            >
              <Save className="mr-2 h-3.5 w-3.5" />
              Save Weights
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {(
            Object.keys(defaultWeights) as (keyof typeof defaultWeights)[]
          ).map((key) => (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-sm">{WEIGHT_LABELS[key]}</Label>
                <span className="text-sm font-medium tabular-nums w-8 text-right">
                  {weights[key]}
                </span>
              </div>
              <Slider
                value={weights[key]}
                onValueChange={(v) =>
                  setWeights({
                    ...weights,
                    [key]: Array.isArray(v) ? v[0] : v,
                  })
                }
                min={0}
                max={50}
                step={5}
              />
            </div>
          ))}

          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeights(defaultWeights)}
            >
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Capacity Thresholds */}
      <Card>
        <CardHeader>
          <CardTitle>Capacity Thresholds</CardTitle>
          <p className="text-sm text-muted-foreground">
            Define utilization zones for capacity monitoring
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-blue-600">Underloaded</Label>
              <div className="text-sm">Below 60%</div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-emerald-600">Optimal</Label>
              <div className="text-sm">70% - 85%</div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-amber-600">High</Label>
              <div className="text-sm">85% - 90%</div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-red-600">Overloaded</Label>
              <div className="text-sm">Above 90%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Cents Sync */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Financial Cents Sync</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Automatic nightly sync at 2 AM ET. Last sync: Mar 8, 2026 at 2:03 AM.
            </p>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Sync Now
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {syncLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  {log.status === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium text-sm">
                      {log.source} - {log.syncType}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.startedAt}
                      {log.records > 0 && ` · ${log.records} records`}
                      {log.error && (
                        <span className="text-red-500"> · {log.error}</span>
                      )}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className={
                    log.status === "success"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }
                >
                  {log.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Google Sheets Import */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Google Sheets Import</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              One-time import from the BOS Client Assignment & Priorities
              spreadsheet
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border-2 border-dashed p-8 text-center">
            <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
            <p className="font-medium text-sm">Import from Google Sheets</p>
            <p className="text-xs text-muted-foreground mt-1">
              Connect your Google account to import client assignments, team
              capacity, and internal hours data.
            </p>
            <Button variant="outline" size="sm" className="mt-4">
              Connect Google Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

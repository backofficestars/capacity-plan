"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  Check,
  Save,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Demo: current and proposed utilization
const currentState = [
  { name: "Ellen Kuipers", utilization: 85, clients: 15, hours: 34 },
  { name: "Kayla Puhov", utilization: 92, clients: 18, hours: 37 },
  { name: "Dawn Thompson", utilization: 64, clients: 3, hours: 16 },
  { name: "Shannon Shier", utilization: 83, clients: 5, hours: 25 },
  { name: "Terri McNamara", utilization: 23, clients: 0, hours: 7 },
];

const proposedState = [
  { name: "Ellen Kuipers", utilization: 80, clients: 13, hours: 32 },
  { name: "Kayla Puhov", utilization: 82, clients: 15, hours: 33 },
  { name: "Dawn Thompson", utilization: 76, clients: 5, hours: 19 },
  { name: "Shannon Shier", utilization: 80, clients: 6, hours: 24 },
  { name: "Terri McNamara", utilization: 50, clients: 3, hours: 15 },
];

const proposedChanges = [
  {
    client: "Harbor Marine",
    from: "Kayla Puhov",
    to: "Dawn Thompson",
    role: "lead",
    hours: 4,
    reason: "Reduce Kayla's overload; Dawn has capacity and 4/5 in sector",
  },
  {
    client: "Kingsway Plumbing",
    from: "Kayla Puhov",
    to: "Shannon Shier",
    role: "lead",
    hours: 3.5,
    reason: "Better distribution; Shannon's complexity score can handle it",
  },
  {
    client: "Green Leaf Co-op",
    from: "Ellen Kuipers",
    to: "Terri McNamara",
    role: "lead",
    hours: 2,
    reason: "Terri is underloaded; client is low complexity",
  },
  {
    client: "JetSet Travel",
    from: "Unassigned",
    to: "Terri McNamara",
    role: "lead",
    hours: 1.5,
    reason: "Fill Terri's capacity gap",
  },
  {
    client: "InnoTech Solutions",
    from: "Dawn Thompson",
    to: "Dawn Thompson",
    role: "supporting",
    hours: 2,
    reason: "Add supporting role for new lead client absorption",
  },
];

function getUtilColor(pct: number) {
  if (pct >= 90) return "text-red-600";
  if (pct >= 85) return "text-amber-600";
  if (pct >= 70) return "text-emerald-600";
  return "text-blue-600";
}

function getBarColor(pct: number) {
  if (pct >= 90) return "[&>div]:bg-red-500";
  if (pct >= 85) return "[&>div]:bg-amber-500";
  if (pct >= 70) return "[&>div]:bg-emerald-500";
  return "[&>div]:bg-blue-400";
}

export default function RebalanceScenarioPage() {
  const [optimizationGoal, setOptimizationGoal] = useState("balance");
  const [showResults, setShowResults] = useState(false);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/scenarios"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Workload Rebalancing
          </h1>
          <p className="text-muted-foreground">
            Optimize client assignments across the team
          </p>
        </div>
      </div>

      {!showResults ? (
        <Card>
          <CardHeader>
            <CardTitle>Current Team Utilization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current utilization bars */}
            <div className="space-y-3">
              {currentState.map((m) => (
                <div key={m.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{m.name}</span>
                    <span
                      className={`font-medium tabular-nums ${getUtilColor(m.utilization)}`}
                    >
                      {m.utilization}% ({m.hours}h)
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, m.utilization)}
                    className={`h-2 ${getBarColor(m.utilization)}`}
                  />
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-2">
              <label className="text-sm font-medium">Optimization Goal</label>
              <Select
                value={optimizationGoal}
                onValueChange={(v: string | null) => {
                  if (v) setOptimizationGoal(v);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="balance">
                    Balance utilization (even distribution)
                  </SelectItem>
                  <SelectItem value="fit">
                    Maximize skill fit (best matches)
                  </SelectItem>
                  <SelectItem value="blend">
                    Balanced blend (utilization + fit)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setShowResults(true)}>
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Run Rebalance
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Before/After Comparison */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Current</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {currentState.map((m) => (
                  <div key={m.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span>{m.name}</span>
                      <span
                        className={`font-medium tabular-nums ${getUtilColor(m.utilization)}`}
                      >
                        {m.utilization}%
                      </span>
                    </div>
                    <Progress
                      value={Math.min(100, m.utilization)}
                      className={`h-1.5 ${getBarColor(m.utilization)}`}
                    />
                  </div>
                ))}
                <Separator />
                <div className="text-center text-sm">
                  <span className="text-muted-foreground">Std Dev: </span>
                  <span className="font-medium text-amber-600">25.3%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="ring-2 ring-emerald-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  Proposed
                  <Badge
                    variant="secondary"
                    className="bg-emerald-50 text-emerald-700"
                  >
                    Improved
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {proposedState.map((m) => (
                  <div key={m.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span>{m.name}</span>
                      <span
                        className={`font-medium tabular-nums ${getUtilColor(m.utilization)}`}
                      >
                        {m.utilization}%
                      </span>
                    </div>
                    <Progress
                      value={Math.min(100, m.utilization)}
                      className={`h-1.5 ${getBarColor(m.utilization)}`}
                    />
                  </div>
                ))}
                <Separator />
                <div className="text-center text-sm">
                  <span className="text-muted-foreground">Std Dev: </span>
                  <span className="font-medium text-emerald-600">12.8%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Proposed Changes */}
          <Card>
            <CardHeader>
              <CardTitle>Proposed Changes ({proposedChanges.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {proposedChanges.map((change, i) => (
                  <div
                    key={i}
                    className="rounded-lg border p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {change.client}
                        </span>
                        <Badge
                          variant="secondary"
                          className={
                            change.role === "lead"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-zinc-100 text-zinc-600"
                          }
                        >
                          {change.role}
                        </Badge>
                      </div>
                      <span className="text-sm tabular-nums text-muted-foreground">
                        {change.hours}h/wk
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">
                        {change.from}
                      </span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{change.to}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {change.reason}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setShowResults(false)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Adjust Parameters
            </Button>
            <div className="flex gap-2">
              <Button variant="outline">
                <Save className="mr-2 h-4 w-4" />
                Save as Draft
              </Button>
              <Button>
                <Check className="mr-2 h-4 w-4" />
                Apply Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

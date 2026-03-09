"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  AlertTriangle,
  Star,
  Save,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { defaultAssignmentRoles, getRoleColor, getRoleName } from "@/lib/placeholder-data";
import type {
  ClientRequirements,
  ScoringResult,
  CatchUpFeasibility,
} from "@/lib/scoring/engine";

// Placeholder scoring results for the demo UI
const demoResults: ScoringResult[] = [
  {
    teamMemberId: "2",
    teamMemberName: "Kayla Puhov",
    totalScore: 92,
    breakdown: {
      sector_experience: 100,
      availability: 72,
      daytime: 100,
      demanding: 100,
      complexity: 100,
      personality: 70,
      tech: 100,
      software: 100,
    },
    flags: ["Would push utilization to 88% (high)"],
    capacityBefore: {
      totalCapacityHrs: 40,
      committedHrs: 32,
      internalHrs: 5,
      availableHrs: 3,
      utilizationPct: 92.5,
    },
    capacityAfter: {
      totalCapacityHrs: 40,
      committedHrs: 35,
      internalHrs: 5,
      availableHrs: 0,
      utilizationPct: 100,
    },
    suggestedRole: "lead",
    disqualified: false,
  },
  {
    teamMemberId: "3",
    teamMemberName: "Dawn Thompson",
    totalScore: 78,
    breakdown: {
      sector_experience: 80,
      availability: 90,
      daytime: 100,
      demanding: 80,
      complexity: 80,
      personality: 70,
      tech: 100,
      software: 100,
    },
    flags: [],
    capacityBefore: {
      totalCapacityHrs: 25,
      committedHrs: 12,
      internalHrs: 4,
      availableHrs: 9,
      utilizationPct: 64,
    },
    capacityAfter: {
      totalCapacityHrs: 25,
      committedHrs: 15,
      internalHrs: 4,
      availableHrs: 6,
      utilizationPct: 76,
    },
    suggestedRole: "lead",
    disqualified: false,
  },
  {
    teamMemberId: "4",
    teamMemberName: "Shannon Shier",
    totalScore: 71,
    breakdown: {
      sector_experience: 60,
      availability: 75,
      daytime: 100,
      demanding: 100,
      complexity: 100,
      personality: 70,
      tech: 100,
      software: 100,
    },
    flags: ["Limited construction experience (1/5) - critical sector"],
    capacityBefore: {
      totalCapacityHrs: 30,
      committedHrs: 22,
      internalHrs: 3,
      availableHrs: 5,
      utilizationPct: 83.3,
    },
    capacityAfter: {
      totalCapacityHrs: 30,
      committedHrs: 25,
      internalHrs: 3,
      availableHrs: 2,
      utilizationPct: 93.3,
    },
    suggestedRole: "lead",
    disqualified: false,
  },
];

const FACTOR_LABELS: Record<string, string> = {
  sector_experience: "Sector Experience",
  availability: "Availability",
  daytime: "Daytime",
  demanding: "Demanding Clients",
  complexity: "Complexity",
  personality: "Personality Fit",
  tech: "Tech Ability",
  software: "Software Match",
};

function getScoreColor(score: number) {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

function getUtilizationColor(pct: number) {
  if (pct >= 90) return "text-red-600 [&>div]:bg-red-500";
  if (pct >= 85) return "text-amber-600 [&>div]:bg-amber-500";
  if (pct >= 70) return "text-emerald-600 [&>div]:bg-emerald-500";
  return "text-blue-600 [&>div]:bg-blue-400";
}

export default function NewClientScenarioPage() {
  const [step, setStep] = useState(1);
  const [requirements, setRequirements] = useState<Partial<ClientRequirements>>(
    {
      industry: null,
      accountingSoftware: "qbo",
      isDemanding: false,
      complexityLevel: "medium",
      payrollEmployees: 0,
      estimatedMonthlyHours: 5,
      serviceTypes: [],
      hasCatchUp: false,
      catchUpHours: 0,
      catchUpWeeks: 6,
    }
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/scenarios" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            New Client Assignment
          </h1>
          <p className="text-muted-foreground">
            Find the best bookkeeper for a new client
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                s === step
                  ? "bg-primary text-primary-foreground"
                  : s < step
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {s < step ? <Check className="h-4 w-4" /> : s}
            </div>
            <span
              className={`text-sm ${s === step ? "font-medium" : "text-muted-foreground"}`}
            >
              {s === 1
                ? "Client Profile"
                : s === 2
                  ? "Recommendations"
                  : "Apply"}
            </span>
            {s < 3 && <Separator className="w-8" />}
          </div>
        ))}
      </div>

      {/* Step 1: Client Profile */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Client Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Industry</Label>
                <Select
                  value={requirements.industry ?? ""}
                  onValueChange={(v: string | null) =>
                    setRequirements({ ...requirements, industry: v || null })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="non-profit">Non-Profit</SelectItem>
                    <SelectItem value="ecommerce">E-Commerce</SelectItem>
                    <SelectItem value="financial_services">
                      Financial Services
                    </SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="real_estate">Real Estate</SelectItem>
                    <SelectItem value="professional_services">
                      Professional Services
                    </SelectItem>
                    <SelectItem value="food_beverage">
                      Food & Beverage
                    </SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Accounting Software</Label>
                <Select
                  value={requirements.accountingSoftware}
                  onValueChange={(v: string | null) => {
                    if (v) setRequirements({
                      ...requirements,
                      accountingSoftware: v as "qbo" | "xero" | "other",
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="qbo">QuickBooks Online</SelectItem>
                    <SelectItem value="xero">Xero</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Complexity Level</Label>
                <Select
                  value={requirements.complexityLevel}
                  onValueChange={(v: string | null) => {
                    if (v) setRequirements({
                      ...requirements,
                      complexityLevel: v as "low" | "medium" | "high",
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Payroll Employees</Label>
                <Input
                  type="number"
                  min={0}
                  value={requirements.payrollEmployees ?? 0}
                  onChange={(e) =>
                    setRequirements({
                      ...requirements,
                      payrollEmployees: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Estimated Monthly Hours: {requirements.estimatedMonthlyHours}</Label>
              <Slider
                value={[requirements.estimatedMonthlyHours ?? 5]}
                onValueChange={(v) =>
                  setRequirements({ ...requirements, estimatedMonthlyHours: Array.isArray(v) ? v[0] : v })
                }
                min={1}
                max={50}
                step={0.5}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1h</span>
                <span>25h</span>
                <span>50h</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={requirements.isDemanding ?? false}
                onCheckedChange={(v) =>
                  setRequirements({ ...requirements, isDemanding: v })
                }
              />
              <Label>Demanding client</Label>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={requirements.hasCatchUp ?? false}
                  onCheckedChange={(v) =>
                    setRequirements({ ...requirements, hasCatchUp: v })
                  }
                />
                <Label>Has catch-up work</Label>
              </div>

              {requirements.hasCatchUp && (
                <div className="grid gap-4 md:grid-cols-2 pl-8">
                  <div className="space-y-2">
                    <Label>Catch-up Hours</Label>
                    <Input
                      type="number"
                      min={0}
                      value={requirements.catchUpHours ?? 0}
                      onChange={(e) =>
                        setRequirements({
                          ...requirements,
                          catchUpHours: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Target Weeks</Label>
                    <Select
                      value={String(requirements.catchUpWeeks ?? 6)}
                      onValueChange={(v: string | null) => {
                        if (v) setRequirements({
                          ...requirements,
                          catchUpWeeks: parseInt(v),
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4">4 weeks</SelectItem>
                        <SelectItem value="6">6 weeks</SelectItem>
                        <SelectItem value="8">8 weeks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep(2)}>
                Get Recommendations
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Recommendations */}
      {step === 2 && (
        <div className="space-y-4">
          {demoResults.map((result, index) => (
            <Card
              key={result.teamMemberId}
              className={index === 0 ? "ring-2 ring-primary" : ""}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {index === 0 && (
                      <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                    )}
                    <CardTitle className="text-lg">
                      #{index + 1} {result.teamMemberName}
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className={`border ${getRoleColor(result.suggestedRole, defaultAssignmentRoles)}`}
                    >
                      {getRoleName(result.suggestedRole, defaultAssignmentRoles)}
                    </Badge>
                  </div>
                  <div
                    className={`text-3xl font-bold ${getScoreColor(result.totalScore)}`}
                  >
                    {result.totalScore}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Score Breakdown */}
                <div className="grid grid-cols-4 gap-3">
                  {Object.entries(result.breakdown).map(([key, score]) => (
                    <div key={key} className="text-center">
                      <div className={`text-lg font-semibold ${getScoreColor(score)}`}>
                        {score}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {FACTOR_LABELS[key] ?? key}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Capacity Impact */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <div className="text-xs font-medium text-muted-foreground">
                      Current Utilization
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={result.capacityBefore.utilizationPct}
                        className={`h-2 flex-1 ${getUtilizationColor(result.capacityBefore.utilizationPct)}`}
                      />
                      <span className="text-sm font-medium tabular-nums w-10 text-right">
                        {result.capacityBefore.utilizationPct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-xs font-medium text-muted-foreground">
                      After Assignment
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={Math.min(100, result.capacityAfter.utilizationPct)}
                        className={`h-2 flex-1 ${getUtilizationColor(result.capacityAfter.utilizationPct)}`}
                      />
                      <span className="text-sm font-medium tabular-nums w-10 text-right">
                        {result.capacityAfter.utilizationPct.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Flags */}
                {result.flags.length > 0 && (
                  <div className="space-y-1">
                    {result.flags.map((flag, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-sm text-amber-600"
                      >
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        {flag}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Profile
            </Button>
            <div className="flex gap-2">
              <Button variant="outline">
                <Save className="mr-2 h-4 w-4" />
                Save as Draft
              </Button>
              <Button onClick={() => setStep(3)}>
                Apply Recommendation
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Apply */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-emerald-600" />
              Apply Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              This will create a new assignment for{" "}
              <strong>{demoResults[0].teamMemberName}</strong> as the{" "}
              <strong>{demoResults[0].suggestedRole}</strong> bookkeeper.
            </p>
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bookkeeper</span>
                <span className="font-medium">{demoResults[0].teamMemberName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium">{demoResults[0].suggestedRole}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Fit Score</span>
                <span className="font-medium">{demoResults[0].totalScore}/100</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Monthly Hours</span>
                <span className="font-medium">
                  {requirements.estimatedMonthlyHours}h
                </span>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button>
                <Check className="mr-2 h-4 w-4" />
                Confirm Assignment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

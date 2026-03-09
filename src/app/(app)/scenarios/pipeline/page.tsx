"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  TrendingUp,
  Plus,
  Trash2,
  AlertTriangle,
  Check,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface ProspectClient {
  id: string;
  name: string;
  estimatedHours: number;
  onboardingWeek: string;
  industry: string;
  complexity: string;
}

const weekOptions = [
  { value: "2026-03-16", label: "Mar 16" },
  { value: "2026-03-23", label: "Mar 23" },
  { value: "2026-03-30", label: "Mar 30" },
  { value: "2026-04-06", label: "Apr 6" },
  { value: "2026-04-13", label: "Apr 13" },
  { value: "2026-04-20", label: "Apr 20" },
  { value: "2026-04-27", label: "Apr 27" },
  { value: "2026-05-04", label: "May 4" },
  { value: "2026-05-11", label: "May 11" },
  { value: "2026-05-18", label: "May 18" },
  { value: "2026-05-25", label: "May 25" },
  { value: "2026-06-01", label: "Jun 1" },
];

// Demo forecast data
const forecastWeeks = [
  { week: "Mar 16", committed: 119, projected: 0, available: 91 },
  { week: "Mar 23", committed: 119, projected: 5, available: 86 },
  { week: "Mar 30", committed: 119, projected: 5, available: 86 },
  { week: "Apr 6", committed: 119, projected: 12, available: 79 },
  { week: "Apr 13", committed: 119, projected: 12, available: 79 },
  { week: "Apr 20", committed: 119, projected: 17, available: 74 },
  { week: "Apr 27", committed: 119, projected: 17, available: 74 },
  { week: "May 4", committed: 119, projected: 17, available: 74 },
  { week: "May 11", committed: 115, projected: 17, available: 78 },
  { week: "May 18", committed: 115, projected: 17, available: 78 },
  { week: "May 25", committed: 115, projected: 17, available: 78 },
  { week: "Jun 1", committed: 115, projected: 17, available: 78 },
];

export default function PipelineForecastPage() {
  const [step, setStep] = useState(1);
  const [prospects, setProspects] = useState<ProspectClient[]>([
    {
      id: "1",
      name: "Ortho,MD",
      estimatedHours: 5,
      onboardingWeek: "2026-03-23",
      industry: "healthcare",
      complexity: "medium",
    },
    {
      id: "2",
      name: "Prairie Roots Farm",
      estimatedHours: 7,
      onboardingWeek: "2026-04-06",
      industry: "other",
      complexity: "low",
    },
    {
      id: "3",
      name: "SkyHigh Construction",
      estimatedHours: 5,
      onboardingWeek: "2026-04-20",
      industry: "construction",
      complexity: "high",
    },
  ]);

  const addProspect = () => {
    setProspects([
      ...prospects,
      {
        id: String(Date.now()),
        name: "",
        estimatedHours: 5,
        onboardingWeek: "2026-04-06",
        industry: "other",
        complexity: "medium",
      },
    ]);
  };

  const removeProspect = (id: string) => {
    setProspects(prospects.filter((p) => p.id !== id));
  };

  const updateProspect = (id: string, field: keyof ProspectClient, value: string | number) => {
    setProspects(
      prospects.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const totalProjectedHours = prospects.reduce(
    (sum, p) => sum + p.estimatedHours,
    0
  );
  const totalCapacity = 210; // Sum of all team member weekly capacities

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
            Pipeline Forecast
          </h1>
          <p className="text-muted-foreground">
            Forecast capacity needs 4-12 weeks out based on pipeline prospects
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-4">
        {[1, 2].map((s) => (
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
              {s === 1 ? "Prospects" : "Forecast"}
            </span>
            {s < 2 && <Separator className="w-8" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pipeline Prospects</CardTitle>
            <Button variant="outline" size="sm" onClick={addProspect}>
              <Plus className="mr-2 h-3.5 w-3.5" />
              Add Prospect
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {prospects.map((prospect) => (
              <div
                key={prospect.id}
                className="rounded-lg border p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <Input
                    placeholder="Client name"
                    value={prospect.name}
                    onChange={(e) =>
                      updateProspect(prospect.id, "name", e.target.value)
                    }
                    className="max-w-xs"
                  />
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => removeProspect(prospect.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Monthly Hours</Label>
                    <Input
                      type="number"
                      min={1}
                      value={prospect.estimatedHours}
                      onChange={(e) =>
                        updateProspect(
                          prospect.id,
                          "estimatedHours",
                          parseInt(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Onboarding Week</Label>
                    <Select
                      value={prospect.onboardingWeek}
                      onValueChange={(v: string | null) => {
                        if (v) updateProspect(prospect.id, "onboardingWeek", v);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {weekOptions.map((w) => (
                          <SelectItem key={w.value} value={w.value}>
                            {w.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Industry</Label>
                    <Select
                      value={prospect.industry}
                      onValueChange={(v: string | null) => {
                        if (v) updateProspect(prospect.id, "industry", v);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="construction">Construction</SelectItem>
                        <SelectItem value="non-profit">Non-Profit</SelectItem>
                        <SelectItem value="ecommerce">E-Commerce</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Complexity</Label>
                    <Select
                      value={prospect.complexity}
                      onValueChange={(v: string | null) => {
                        if (v) updateProspect(prospect.id, "complexity", v);
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
                </div>
              </div>
            ))}

            {prospects.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">No prospects added yet.</p>
                <p className="text-xs mt-1">
                  Add pipeline prospects to forecast capacity needs.
                </p>
              </div>
            )}

            <Separator />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Total projected new hours:
              </span>
              <span className="font-medium">{totalProjectedHours}h/mo</span>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={prospects.length === 0}
              >
                Generate Forecast
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Current Committed
                </p>
                <p className="text-2xl font-bold">119h/wk</p>
                <p className="text-xs text-muted-foreground">
                  of {totalCapacity}h capacity
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Pipeline Additions
                </p>
                <p className="text-2xl font-bold text-amber-600">
                  +{totalProjectedHours}h/wk
                </p>
                <p className="text-xs text-muted-foreground">
                  from {prospects.length} prospects
                </p>
              </CardContent>
            </Card>
            <Card className="border-amber-200">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  Bottleneck Week
                </p>
                <p className="text-2xl font-bold text-amber-600">Apr 20</p>
                <p className="text-xs text-amber-600">
                  Available capacity drops to 74h
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Capacity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Capacity Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {forecastWeeks.map((week) => {
                  const total = week.committed + week.projected;
                  const utilPct = (total / totalCapacity) * 100;
                  const isBottleneck = week.available <= 74 && week.projected > 0;

                  return (
                    <div key={week.week} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-14 font-medium">{week.week}</span>
                          {isBottleneck && (
                            <AlertTriangle className="h-3 w-3 text-amber-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <span>
                            Committed: {week.committed}h
                          </span>
                          {week.projected > 0 && (
                            <span className="text-amber-600">
                              +Pipeline: {week.projected}h
                            </span>
                          )}
                          <span className="font-medium text-foreground tabular-nums w-16 text-right">
                            {week.available}h free
                          </span>
                        </div>
                      </div>
                      <div className="flex h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="bg-primary rounded-l-full"
                          style={{
                            width: `${(week.committed / totalCapacity) * 100}%`,
                          }}
                        />
                        {week.projected > 0 && (
                          <div
                            className="bg-amber-400"
                            style={{
                              width: `${(week.projected / totalCapacity) * 100}%`,
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-4 rounded bg-primary" />
                  Committed
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-4 rounded bg-amber-400" />
                  Pipeline (projected)
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-4 rounded bg-muted" />
                  Available
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">
                    Consider hiring before April 20
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    With 3 prospects onboarding over the next 6 weeks, available
                    capacity will drop to 74h/wk. If all prospects convert,
                    team utilization will reach 85%+ across most members.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <Calendar className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">
                    Stagger onboarding to reduce peak load
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Moving SkyHigh Construction onboarding from Apr 20 to May 4
                    would smooth out the capacity curve and keep all members
                    below 85% utilization.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Edit Prospects
            </Button>
            <Button>Save Forecast</Button>
          </div>
        </div>
      )}
    </div>
  );
}

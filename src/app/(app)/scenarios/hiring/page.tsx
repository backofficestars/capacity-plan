"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  ArrowLeft,
  ArrowRight,
  Users,
  TrendingUp,
  AlertTriangle,
  Check,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SKILL_LABELS, type SkillKey } from "@/lib/db/schema";

// Demo data for the hiring scenario result
const idealHireProfile: Record<SkillKey, number> = {
  demanding_clients: 4,
  complex_bookkeeping: 4,
  tech_ability: 4,
  payroll: 3,
  construction: 3,
  non_profit: 2,
  ecommerce: 3,
  a2x_dext: 2,
  xero: 3,
  qbo: 5,
};

const clientsToAbsorb = [
  { name: "Reimer Associates", hours: 3.75, currentLead: "Kayla Puhov" },
  { name: "Saddle Fit 4 Life", hours: 4.4, currentLead: "Kayla Puhov" },
  { name: "PSBX (Tova & Baron Manett)", hours: 5.3, currentLead: "Kayla Puhov" },
];

export default function HiringScenarioPage() {
  const [step, setStep] = useState(1);
  const [newClients, setNewClients] = useState(3);
  const [avgHoursPerClient, setAvgHoursPerClient] = useState(5);
  const [budgetConstraint, setBudgetConstraint] = useState(25); // hours/week

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
            Hiring Decision
          </h1>
          <p className="text-muted-foreground">
            Model whether you need to hire and what profile to look for
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
              {s === 1 ? "Inputs" : "Results"}
            </span>
            {s < 2 && <Separator className="w-8" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Projected Workload Changes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>
                Expected new clients (next 3 months): {newClients}
              </Label>
              <Slider
                value={newClients}
                onValueChange={(v) => setNewClients(Array.isArray(v) ? v[0] : v)}
                min={0}
                max={10}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>
                Average hours per new client: {avgHoursPerClient}h/mo
              </Label>
              <Slider
                value={avgHoursPerClient}
                onValueChange={(v) => setAvgHoursPerClient(Array.isArray(v) ? v[0] : v)}
                min={1}
                max={20}
                step={0.5}
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>
                Budget constraint for new hire: {budgetConstraint}h/wk
              </Label>
              <Slider
                value={budgetConstraint}
                onValueChange={(v) => setBudgetConstraint(Array.isArray(v) ? v[0] : v)}
                min={10}
                max={40}
                step={5}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={() => setStep(2)}>
                Analyze
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {/* Verdict */}
          <Card className="border-amber-200 bg-amber-50/30">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    Hiring Recommended
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    With {newClients} expected new clients averaging{" "}
                    {avgHoursPerClient}h/mo each, the team will exceed optimal
                    capacity within 6 weeks. Current available capacity across
                    the team is approximately 22h/wk, but{" "}
                    {newClients * avgHoursPerClient}h/mo of new work would push
                    3 team members into overloaded status.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ideal Hire Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Ideal Hire Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                {(Object.keys(SKILL_LABELS) as SkillKey[]).map((key) => (
                  <div
                    key={key}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">
                      {SKILL_LABELS[key]}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <div
                            key={i}
                            className={`h-2 w-2 rounded-full ${
                              i < idealHireProfile[key]
                                ? "bg-primary"
                                : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-medium tabular-nums w-6">
                        {idealHireProfile[key]}/5
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="text-sm space-y-1">
                <p>
                  <strong>Recommended capacity:</strong> {budgetConstraint}h/wk
                </p>
                <p>
                  <strong>Software focus:</strong> QBO (primary), Xero (secondary)
                </p>
                <p>
                  <strong>Daytime availability:</strong> Required
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Clients to absorb */}
          <Card>
            <CardHeader>
              <CardTitle>Clients to Reassign</CardTitle>
              <p className="text-sm text-muted-foreground">
                These clients would be reassigned to the new hire to
                rebalance the team
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {clientsToAbsorb.map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Currently: {c.currentLead}
                      </p>
                    </div>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {c.hours}h/wk
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Utilization Impact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Team Utilization Impact
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">
                    Without New Hire
                  </p>
                  <p className="text-3xl font-bold text-red-600">94%</p>
                  <p className="text-xs text-red-600">
                    3 members overloaded
                  </p>
                </div>
                <div className="space-y-2 text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">
                    With New Hire
                  </p>
                  <p className="text-3xl font-bold text-emerald-600">78%</p>
                  <p className="text-xs text-emerald-600">
                    All members in optimal range
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Adjust Inputs
            </Button>
            <Button>Save Scenario</Button>
          </div>
        </div>
      )}
    </div>
  );
}

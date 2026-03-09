"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  UserPlus,
  Users,
  ArrowLeftRight,
  TrendingUp,
  Clock,
} from "lucide-react";
import Link from "next/link";

const scenarioTypes = [
  {
    title: "New Client Assignment",
    description:
      "Find the best bookkeeper for a new client based on skills, availability, and fit. Get ranked recommendations with risk assessments.",
    href: "/scenarios/new-client",
    icon: UserPlus,
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    title: "Hiring Decision",
    description:
      "Model whether you need to hire based on current workload and pipeline. Get an ideal hire profile and financial impact analysis.",
    href: "/scenarios/hiring",
    icon: Users,
    color: "text-blue-600 bg-blue-50",
  },
  {
    title: "Workload Rebalancing",
    description:
      "Optimize client assignments across the team for better utilization and skill fit. See proposed changes before applying.",
    href: "/scenarios/rebalance",
    icon: ArrowLeftRight,
    color: "text-purple-600 bg-purple-50",
  },
  {
    title: "Pipeline Forecast",
    description:
      "Forecast capacity needs 4-12 weeks out based on pipeline prospects. Identify when you'll hit capacity limits.",
    href: "/scenarios/pipeline",
    icon: TrendingUp,
    color: "text-amber-600 bg-amber-50",
  },
];

// Placeholder saved scenarios
const savedScenarios = [
  {
    id: "1",
    name: "Ortho,MD assignment options",
    type: "new_client",
    status: "saved",
    createdAt: "2026-03-07",
  },
  {
    id: "2",
    name: "Q2 2026 capacity check",
    type: "pipeline_forecast",
    status: "draft",
    createdAt: "2026-03-05",
  },
  {
    id: "3",
    name: "March rebalancing",
    type: "rebalance",
    status: "applied",
    createdAt: "2026-03-01",
  },
];

function getTypeBadge(type: string) {
  const labels: Record<string, string> = {
    new_client: "New Client",
    hiring: "Hiring",
    rebalance: "Rebalance",
    pipeline_forecast: "Pipeline",
  };
  return <Badge variant="secondary">{labels[type] ?? type}</Badge>;
}

function getStatusBadge(status: string) {
  const colors: Record<string, string> = {
    draft: "bg-zinc-100 text-zinc-600",
    saved: "bg-blue-50 text-blue-700",
    applied: "bg-emerald-50 text-emerald-700",
  };
  return (
    <Badge variant="secondary" className={colors[status] ?? ""}>
      {status}
    </Badge>
  );
}

export default function ScenariosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Scenarios</h1>
        <p className="text-muted-foreground">
          Model and evaluate capacity planning decisions
        </p>
      </div>

      {/* Scenario Type Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {scenarioTypes.map((scenario) => {
          const Icon = scenario.icon;
          return (
            <Card
              key={scenario.title}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${scenario.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">{scenario.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {scenario.description}
                </p>
                <Link href={scenario.href} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
                  Run Scenario
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Saved Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Scenarios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {savedScenarios.map((scenario) => (
              <Link
                key={scenario.id}
                href={`/scenarios/${scenario.id}`}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium text-sm">{scenario.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {scenario.createdAt}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getTypeBadge(scenario.type)}
                  {getStatusBadge(scenario.status)}
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

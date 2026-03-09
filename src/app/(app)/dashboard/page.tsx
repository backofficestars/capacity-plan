"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Building2,
  AlertTriangle,
  TrendingUp,
  UserPlus,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useClientData } from "@/lib/client-data-context";

function getStatus(utilPct: number): string {
  if (utilPct >= 100) return "overloaded";
  if (utilPct >= 85) return "high";
  if (utilPct >= 60) return "optimal";
  return "underloaded";
}

function getStatusColor(status: string) {
  switch (status) {
    case "overloaded":
      return "text-red-600 bg-red-50";
    case "high":
      return "text-amber-600 bg-amber-50";
    case "optimal":
      return "text-emerald-600 bg-emerald-50";
    case "underloaded":
      return "text-blue-600 bg-blue-50";
    default:
      return "text-muted-foreground bg-muted";
  }
}

function getBarColor(status: string) {
  switch (status) {
    case "overloaded":
      return "[&>div]:bg-red-500";
    case "high":
      return "[&>div]:bg-amber-500";
    case "optimal":
      return "[&>div]:bg-emerald-500";
    case "underloaded":
      return "[&>div]:bg-blue-400";
    default:
      return "";
  }
}

export default function DashboardPage() {
  const { clients, teamMembers } = useClientData();

  // Derive from context data instead of placeholder-data imports
  const assignableMembers = teamMembers.filter((m) => m.assignable);
  const activeClients = clients.filter((c) => c.status === "A" || c.status === "N");

  function getTeamMemberClientHours(memberId: string): number {
    return clients
      .filter((c) => c.status !== "P")
      .reduce((sum, c) => {
        let hrs = 0;
        if (c.leadBookkeeper === memberId) hrs += c.primaryHrs;
        if (c.secondBookkeeper === memberId) hrs += c.secondHrs;
        if (c.oversight === memberId) hrs += c.oversightHrs;
        if (c.payrollBookkeeper === memberId) hrs += c.payrollHrs;
        return sum + hrs;
      }, 0);
  }

  function getTeamMemberClientCount(memberId: string): number {
    return clients
      .filter((c) => c.status !== "P")
      .filter((c) => c.leadBookkeeper === memberId || c.secondBookkeeper === memberId)
      .length;
  }

  const teamData = assignableMembers.map((m) => {
    const clientHrs = getTeamMemberClientHours(m.id);
    const totalUsed = clientHrs + m.internalHrs;
    const utilPct = (totalUsed / m.monthlyCapacity) * 100;
    return {
      ...m,
      clientHrs: Math.round(clientHrs * 10) / 10,
      totalUsed: Math.round(totalUsed * 10) / 10,
      available: Math.round((m.monthlyCapacity - totalUsed) * 10) / 10,
      utilPct,
      status: getStatus(utilPct),
      clientCount: getTeamMemberClientCount(m.id),
    };
  });

  const totalCapacity = teamData.reduce((s, m) => s + m.monthlyCapacity, 0);
  const totalUsed = teamData.reduce((s, m) => s + m.totalUsed, 0);
  const totalAvailable = totalCapacity - totalUsed;
  const totalClients = activeClients.length;
  const overallUtilization = (totalUsed / totalCapacity) * 100;
  const alertCount = teamData.filter(
    (m) => m.status === "overloaded" || m.status === "high"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Team capacity overview (monthly hours)
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/capacity"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Manage PTO
          </Link>
          <Link
            href="/scenarios/new-client"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Assign New Client
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Team Utilization
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallUtilization.toFixed(0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {totalUsed.toFixed(0)}h / {totalCapacity}h monthly
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Hours
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalAvailable.toFixed(0)}h
            </div>
            <p className="text-xs text-muted-foreground">
              Across {teamData.length} assignable members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Clients
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
            <p className="text-xs text-muted-foreground">
              Assigned across the team
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Alerts
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertCount}</div>
            <p className="text-xs text-muted-foreground">
              Team members at high utilization
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Team Capacity Bars */}
      <Card>
        <CardHeader>
          <CardTitle>Team Capacity (Assignable Bookkeepers)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {teamData.map((member) => (
            <div key={member.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{member.name}</span>
                  <Badge
                    variant="secondary"
                    className={getStatusColor(member.status)}
                  >
                    {member.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span>{member.clientCount} clients</span>
                  <span>
                    {member.totalUsed}h / {member.monthlyCapacity}h
                  </span>
                  <span className="w-12 text-right font-medium tabular-nums">
                    {member.utilPct.toFixed(0)}%
                  </span>
                </div>
              </div>
              <div className="flex gap-1 items-center">
                <div className="flex-1">
                  <Progress
                    value={Math.min(100, member.utilPct)}
                    className={`h-2.5 ${getBarColor(member.status)}`}
                  />
                </div>
              </div>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-primary inline-block" />
                  Client: {member.clientHrs}h
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-muted-foreground/30 inline-block" />
                  Internal: {member.internalHrs}h
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-200 inline-block" />
                  Available: {member.available}h
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

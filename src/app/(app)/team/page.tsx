"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SKILL_LABELS, type SkillKey } from "@/lib/db/schema";
import Link from "next/link";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useClientData } from "@/lib/client-data-context";

// Skill ratings per team member (will be stored in DB later)
const skillData: Record<string, Record<SkillKey, number>> = {
  kayla: { demanding_clients: 5, complex_bookkeeping: 5, tech_ability: 5, payroll: 4, construction: 5, non_profit: 5, ecommerce: 4, a2x_dext: 0, xero: 4, qbo: 5 },
  ellen: { demanding_clients: 4, complex_bookkeeping: 2, tech_ability: 3, payroll: 2, construction: 1, non_profit: 2, ecommerce: 0, a2x_dext: 0, xero: 3, qbo: 3 },
  shannon: { demanding_clients: 5, complex_bookkeeping: 5, tech_ability: 5, payroll: 0, construction: 1, non_profit: 3, ecommerce: 1, a2x_dext: 5, xero: 5, qbo: 5 },
  dawn: { demanding_clients: 4, complex_bookkeeping: 4, tech_ability: 5, payroll: 3, construction: 4, non_profit: 0, ecommerce: 0, a2x_dext: 0, xero: 0, qbo: 5 },
  terri: { demanding_clients: 3, complex_bookkeeping: 3, tech_ability: 4, payroll: 5, construction: 0, non_profit: 0, ecommerce: 4, a2x_dext: 0, xero: 1, qbo: 4 },
  lynne: { demanding_clients: 2, complex_bookkeeping: 2, tech_ability: 2, payroll: 1, construction: 0, non_profit: 3, ecommerce: 0, a2x_dext: 0, xero: 0, qbo: 3 },
  gurpreet: { demanding_clients: 2, complex_bookkeeping: 2, tech_ability: 3, payroll: 0, construction: 0, non_profit: 0, ecommerce: 0, a2x_dext: 0, xero: 0, qbo: 3 },
};

function SkillDots({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          className={`h-2 w-2 rounded-full ${
            i < value ? "bg-primary" : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
}

export default function TeamPage() {
  const { teamMembers } = useClientData();

  const teamData = teamMembers
    .filter((m) => skillData[m.id])
    .map((m) => ({
      id: m.id,
      name: m.name,
      role: m.role,
      assignable: m.assignable,
      weeklyCapacity: m.weeklyCapacity,
      monthlyCapacity: m.monthlyCapacity,
      skills: skillData[m.id],
    }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground">
            Manage bookkeeper profiles and skill ratings
          </p>
        </div>
        <Link href="/team/new" className={cn(buttonVariants({ size: "sm" }))}>
          <Plus className="mr-2 h-4 w-4" />
          Add Team Member
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {teamData.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{member.name}</CardTitle>
                <div className="flex gap-1.5">
                  {member.assignable && (
                    <Badge variant="secondary" className="text-emerald-600 bg-emerald-50">
                      Assignable
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{member.role}</span>
                <span>{member.weeklyCapacity}h/wk</span>
                <span>{member.monthlyCapacity}h/mo</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                {(Object.keys(SKILL_LABELS) as SkillKey[]).map((key) => (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground truncate">
                      {SKILL_LABELS[key]}
                    </span>
                    <SkillDots value={member.skills[key]} />
                  </div>
                ))}
              </div>
              <div className="pt-2">
                <Link href={`/team/${member.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}>
                  View Profile
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SKILL_LABELS, type SkillKey } from "@/lib/db/schema";
import { ArrowLeft, Save, Pencil } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Placeholder data - will be fetched from DB
const teamMembersData: Record<
  string,
  {
    name: string;
    role: string;
    email: string;
    assignable: boolean;
    employmentType: string;
    weeklyCapacity: number;
    daytimeAvailable: boolean;
    yearsExperience: number;
    industryExperience: string;
    hireDate: string;
    probationUntil: string | null;
    notes: string;
    skills: Record<SkillKey, number>;
    assignedClients: { name: string; role: string; hours: number }[];
  }
> = {
  "1": {
    name: "Ellen Kuipers",
    role: "bookkeeper",
    email: "ellen@backoffice-stars.com",
    assignable: true,
    employmentType: "contractor",
    weeklyCapacity: 40,
    daytimeAvailable: true,
    yearsExperience: 13,
    industryExperience: "General, some construction exposure",
    hireDate: "2013-04-15",
    probationUntil: null,
    notes: "Very reliable. Strong with QBO.",
    skills: {
      demanding_clients: 4,
      complex_bookkeeping: 2,
      tech_ability: 3,
      payroll: 2,
      construction: 1,
      non_profit: 2,
      ecommerce: 0,
      a2x_dext: 0,
      xero: 3,
      qbo: 3,
    },
    assignedClients: [
      { name: "Aqua-Pure Ventures", role: "lead", hours: 4 },
      { name: "Briar Rose Flowers", role: "lead", hours: 3 },
      { name: "Dr. Willow Dental", role: "lead", hours: 2.5 },
      { name: "Green Leaf Co-op", role: "lead", hours: 2 },
    ],
  },
  "2": {
    name: "Kayla Puhov",
    role: "bookkeeper",
    email: "kayla@backoffice-stars.com",
    assignable: true,
    employmentType: "contractor",
    weeklyCapacity: 40,
    daytimeAvailable: true,
    yearsExperience: 15,
    industryExperience: "Construction, Non-Profit, E-Commerce, General",
    hireDate: "2011-09-01",
    probationUntil: null,
    notes: "Most experienced. Can handle any client type.",
    skills: {
      demanding_clients: 5,
      complex_bookkeeping: 5,
      tech_ability: 5,
      payroll: 4,
      construction: 5,
      non_profit: 5,
      ecommerce: 4,
      a2x_dext: 0,
      xero: 4,
      qbo: 5,
    },
    assignedClients: [
      { name: "BPE Eng.", role: "lead", hours: 5 },
      { name: "Eagle Construction", role: "lead", hours: 6 },
      { name: "Harbor Marine", role: "lead", hours: 4 },
      { name: "Kingsway Plumbing", role: "lead", hours: 3.5 },
      { name: "ClearView Consulting", role: "supporting", hours: 2 },
    ],
  },
};

function SkillSlider({
  label,
  value,
  onChange,
  editing,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  editing: boolean;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <span className="text-xs font-medium tabular-nums">{value}/5</span>
      </div>
      {editing ? (
        <Slider
          value={value}
          onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
          min={0}
          max={5}
          step={1}
        />
      ) : (
        <div className="flex gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full ${
                i < value ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TeamMemberDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const member = teamMembersData[id];
  const [editing, setEditing] = useState(false);
  const [skills, setSkills] = useState(member?.skills ?? ({} as Record<SkillKey, number>));

  if (!member) {
    return (
      <div className="space-y-4">
        <Link
          href="/team"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Team
        </Link>
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            Team member not found. (This is a demo with limited data. Try IDs 1 or 2.)
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalAssigned = member.assignedClients.reduce((s, c) => s + c.hours, 0);
  const utilization = (totalAssigned / member.weeklyCapacity) * 100;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/team"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{member.name}</h1>
            <p className="text-muted-foreground capitalize">
              {member.role} &middot; {member.yearsExperience} years experience
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // Save logic will go here
                  setEditing(false);
                }}
              >
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column - Profile details */}
        <div className="space-y-4 md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{member.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium capitalize">{member.employmentType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Capacity</span>
                <span className="font-medium">{member.weeklyCapacity}h/wk</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Daytime</span>
                <span className="font-medium">
                  {member.daytimeAvailable ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assignable</span>
                <Badge
                  variant="secondary"
                  className={
                    member.assignable
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-zinc-100 text-zinc-600"
                  }
                >
                  {member.assignable ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hired</span>
                <span className="font-medium">{member.hireDate}</span>
              </div>
              {member.probationUntil && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Probation Until</span>
                  <Badge variant="secondary" className="bg-amber-50 text-amber-700">
                    {member.probationUntil}
                  </Badge>
                </div>
              )}
              <Separator />
              <div>
                <span className="text-muted-foreground text-xs">Industry Experience</span>
                <p className="mt-1 text-sm">{member.industryExperience}</p>
              </div>
              {member.notes && (
                <div>
                  <span className="text-muted-foreground text-xs">Notes</span>
                  <p className="mt-1 text-sm">{member.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Utilization */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Load</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Utilization</span>
                <span className="font-medium tabular-nums">
                  {utilization.toFixed(0)}%
                </span>
              </div>
              <Progress value={Math.min(100, utilization)} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {totalAssigned}h committed / {member.weeklyCapacity}h capacity
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Skills + Assignments */}
        <div className="space-y-4 md:col-span-2">
          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Skill Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {(Object.keys(SKILL_LABELS) as SkillKey[]).map((key) => (
                  <SkillSlider
                    key={key}
                    label={SKILL_LABELS[key]}
                    value={skills[key]}
                    editing={editing}
                    onChange={(v) => setSkills({ ...skills, [key]: v })}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Current Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {member.assignedClients.map((client) => (
                  <div
                    key={client.name}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="secondary"
                        className={
                          client.role === "lead"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-zinc-100 text-zinc-600"
                        }
                      >
                        {client.role}
                      </Badge>
                      <span className="font-medium text-sm">{client.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {client.hours}h/wk
                    </span>
                  </div>
                ))}
                {member.assignedClients.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No current assignments
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

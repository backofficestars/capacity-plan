"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SKILL_LABELS, type SkillKey } from "@/lib/db/schema";
import { addTeamMemberAction } from "@/lib/actions/team-actions";

const EMPTY_SKILLS: Record<SkillKey, number> = {
  demanding_clients: 0,
  complex_bookkeeping: 0,
  tech_ability: 0,
  payroll: 0,
  construction: 0,
  non_profit: 0,
  ecommerce: 0,
  a2x_dext: 0,
  xero: 0,
  qbo: 0,
};

export default function NewTeamMemberPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<
    "bookkeeper" | "admin" | "accountant" | "cpa" | "team_leader"
  >("bookkeeper");
  const [employmentType, setEmploymentType] = useState<
    "full_time" | "part_time" | "contractor"
  >("contractor");
  const [weeklyCapacityHrs, setWeeklyCapacityHrs] = useState("40");
  const [assignable, setAssignable] = useState(true);
  const [notes, setNotes] = useState("");
  const [skills, setSkills] = useState<Record<SkillKey, number>>(EMPTY_SKILLS);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!fullName.trim()) {
      toast.error("Name is required");
      return;
    }
    const capacity = Number(weeklyCapacityHrs);
    if (!Number.isFinite(capacity) || capacity < 0) {
      toast.error("Weekly capacity must be a number");
      return;
    }

    setSaving(true);
    const result = await addTeamMemberAction({
      fullName: fullName.trim(),
      role,
      employmentType,
      weeklyCapacityHrs: capacity,
      assignable,
      notes,
      skills,
    });
    setSaving(false);

    if (result.success) {
      toast.success(`${fullName.trim()} added to the team`);
      router.push("/team");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to add team member");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/team" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Team Member</h1>
          <p className="text-muted-foreground">Add a new bookkeeper or team member</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              placeholder="e.g. Teina Goffe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => v && setRole(v as typeof role)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bookkeeper">Bookkeeper</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="accountant">Accountant</SelectItem>
                  <SelectItem value="cpa">CPA</SelectItem>
                  <SelectItem value="team_leader">Team Leader</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Employment Type</Label>
              <Select
                value={employmentType}
                onValueChange={(v) => v && setEmploymentType(v as typeof employmentType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full_time">Full-time</SelectItem>
                  <SelectItem value="part_time">Part-time</SelectItem>
                  <SelectItem value="contractor">Contractor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="capacity">Weekly Capacity (hrs)</Label>
              <Input
                id="capacity"
                type="number"
                min={0}
                value={weeklyCapacityHrs}
                onChange={(e) => setWeeklyCapacityHrs(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Assignable to Clients</Label>
              <Select
                value={assignable ? "yes" : "no"}
                onValueChange={(v) => setAssignable(v === "yes")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Input
              id="notes"
              placeholder="Optional"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Skill Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {(Object.keys(SKILL_LABELS) as SkillKey[]).map((key) => (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{SKILL_LABELS[key]}</Label>
                  <span className="text-xs font-medium tabular-nums">{skills[key]}/5</span>
                </div>
                <Slider
                  value={skills[key]}
                  onValueChange={(v) =>
                    setSkills({ ...skills, [key]: Array.isArray(v) ? v[0] : v })
                  }
                  min={0}
                  max={5}
                  step={1}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Link href="/team" className={cn(buttonVariants({ variant: "outline" }))}>
          Cancel
        </Link>
        <Button disabled={saving} onClick={handleSubmit}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Add Team Member
        </Button>
      </div>
    </div>
  );
}

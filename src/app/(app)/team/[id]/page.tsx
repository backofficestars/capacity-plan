"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { SKILL_LABELS, type SkillKey } from "@/lib/db/schema";
import { ArrowLeft, Save, Pencil, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useClientData } from "@/lib/client-data-context";
import { teamSkillProfiles } from "@/lib/placeholder-data";
import { updateTeamMemberSkillsAction } from "@/lib/actions/client-actions";
import { toast } from "sonner";

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
  const { teamMembers, clients } = useClientData();

  const member = teamMembers.find((m) => m.id === id);

  // Derive assigned clients from the client data
  const assignedClients = useMemo(() => {
    if (!member) return [];
    return clients
      .filter((c) => c.status === "A")
      .flatMap((c) =>
        c.assignments
          .filter((a) => a.memberId === member.id)
          .map((a) => ({
            clientName: c.name,
            role: a.roleId,
            hours: a.hours,
          }))
      )
      .sort((a, b) => b.hours - a.hours);
  }, [member, clients]);

  const initialSkills: Record<SkillKey, number> = useMemo(() => {
    // Use DB skills if available, then placeholder skills, then all zeros
    const src = member?.skills ?? (member ? teamSkillProfiles[member.id] : undefined);
    return {
      demanding_clients: src?.demanding_clients ?? 0,
      complex_bookkeeping: src?.complex_bookkeeping ?? 0,
      tech_ability: src?.tech_ability ?? 0,
      payroll: src?.payroll ?? 0,
      construction: src?.construction ?? 0,
      non_profit: src?.non_profit ?? 0,
      ecommerce: src?.ecommerce ?? 0,
      a2x_dext: src?.a2x_dext ?? 0,
      xero: src?.xero ?? 0,
      qbo: src?.qbo ?? 0,
    };
  }, [member]);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [skills, setSkills] = useState<Record<SkillKey, number>>(initialSkills);

  // Sync skills state when member data loads/changes
  useEffect(() => {
    if (!editing) setSkills(initialSkills);
  }, [initialSkills, editing]);

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
            Team member not found.
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalAssignedMonthly = assignedClients.reduce((s, c) => s + c.hours, 0);
  const utilization =
    member.monthlyCapacity > 0
      ? (totalAssignedMonthly / member.monthlyCapacity) * 100
      : 0;

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
            <p className="text-muted-foreground capitalize">{member.role}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button variant="outline" onClick={() => {
                setSkills(initialSkills);
                setEditing(false);
              }}>
                Cancel
              </Button>
              <Button
                disabled={saving}
                onClick={async () => {
                  if (!member) return;
                  setSaving(true);
                  const result = await updateTeamMemberSkillsAction(member.id, skills);
                  setSaving(false);
                  if (result.success) {
                    toast.success("Skills updated");
                    setEditing(false);
                  } else {
                    toast.error(result.error ?? "Failed to save skills");
                  }
                }}
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
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
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium capitalize">{member.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Capacity</span>
                <span className="font-medium">{member.weeklyCapacity}h/wk</span>
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
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Client Hrs</span>
                <span className="font-medium tabular-nums">
                  {member.monthlyOngoingHrs.toFixed(1)}h
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Internal Hrs</span>
                <span className="font-medium tabular-nums">
                  {member.internalHrs.toFixed(1)}h
                </span>
              </div>
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
                {totalAssignedMonthly.toFixed(1)}h assigned / {member.monthlyCapacity}h capacity (monthly)
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
              <CardTitle className="text-base">
                Current Assignments ({assignedClients.length} clients)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {assignedClients.map((client) => (
                  <div
                    key={`${client.clientName}-${client.role}`}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="secondary"
                        className={
                          client.role === "lead"
                            ? "bg-blue-50 text-blue-700"
                            : client.role === "oversight"
                              ? "bg-purple-50 text-purple-700"
                              : client.role === "payroll"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-zinc-100 text-zinc-600"
                        }
                      >
                        {client.role}
                      </Badge>
                      <span className="font-medium text-sm">{client.clientName}</span>
                    </div>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      {client.hours}h/mo
                    </span>
                  </div>
                ))}
                {assignedClients.length === 0 && (
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

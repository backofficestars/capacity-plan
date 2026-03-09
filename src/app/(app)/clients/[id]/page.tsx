"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Pencil, Trash2, Check, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { EditableField } from "@/components/editable-field";
import { useClientData } from "@/lib/client-data-context";
import {
  statusLabels,
  priorityLabels,
  defaultAssignmentRoles,
  getRoleColor,
  getRoleName,
  type ClientAssignment,
} from "@/lib/placeholder-data";

function getStatusColor(status: string) {
  switch (status) {
    case "A": return "bg-emerald-50 text-emerald-700";
    case "P": return "bg-blue-50 text-blue-700";
    case "N": return "bg-zinc-100 text-zinc-600";
    default: return "bg-zinc-100 text-zinc-600";
  }
}

const tierOptions = [
  { value: "A", label: "A Tier" },
  { value: "B", label: "B Tier" },
  { value: "C", label: "C Tier" },
];

const statusOptions = [
  { value: "A", label: "Active" },
  { value: "N", label: "New" },
  { value: "P", label: "Onboarding" },
];

const softwareOptions = [
  { value: "QBO", label: "QBO" },
  { value: "Xero", label: "Xero" },
  { value: "Excel", label: "Excel" },
  { value: "", label: "—" },
];

const complexityOptions = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
  { value: "", label: "—" },
];

const dextHubdocOptions = [
  { value: "Dext", label: "Dext" },
  { value: "Hubdoc", label: "Hubdoc" },
  { value: "", label: "—" },
];

const roleOptions = defaultAssignmentRoles.map((r) => ({ value: r.id, label: r.name }));

export default function ClientDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { clients, teamMembers, updateClientField, addAssignment, updateAssignment, removeAssignment, getMemberName } = useClientData();

  const memberOptions = teamMembers.map((m) => ({ value: m.id, label: m.name }));
  const client = clients.find((c) => c.id === id);

  const [addingAssignment, setAddingAssignment] = useState(false);
  const [newRole, setNewRole] = useState("lead");
  const [newMember, setNewMember] = useState("");
  const [newHours, setNewHours] = useState("0");
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editRole, setEditRole] = useState("");
  const [editMember, setEditMember] = useState("");
  const [editHours, setEditHours] = useState("");

  if (!client) {
    return (
      <div className="space-y-4">
        <Link href="/clients" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients
        </Link>
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">Client not found.</CardContent>
        </Card>
      </div>
    );
  }

  function handleAddAssignment() {
    if (!newMember) return;
    addAssignment(id, { roleId: newRole, memberId: newMember, hours: parseFloat(newHours) || 0 });
    setAddingAssignment(false);
    setNewRole("lead");
    setNewMember("");
    setNewHours("0");
  }

  function startEdit(idx: number) {
    const a = client!.assignments[idx];
    setEditingIdx(idx);
    setEditRole(a.roleId);
    setEditMember(a.memberId);
    setEditHours(String(a.hours));
  }

  function saveEdit() {
    if (editingIdx === null) return;
    updateAssignment(id, editingIdx, { roleId: editRole, memberId: editMember, hours: parseFloat(editHours) || 0 });
    setEditingIdx(null);
  }

  const tierColor =
    client.priority === "A" ? "bg-amber-50 text-amber-700"
      : client.priority === "B" ? "bg-sky-50 text-sky-700"
        : "bg-zinc-100 text-zinc-600";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/clients" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Link>
        <div>
          <div className="flex items-center gap-3">
            <EditableField
              type="text"
              value={client.name}
              onSave={(v) => updateClientField(id, "name", v)}
              className="text-2xl font-bold tracking-tight"
            />
            <EditableField
              type="select"
              value={client.status}
              options={statusOptions}
              onSave={(v) => updateClientField(id, "status", v)}
            />
          </div>
          <p className="text-muted-foreground text-sm ml-1.5">
            {client.software ?? "No software"} &middot; {client.complexity ?? "—"} complexity
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Details Card */}
        <Card>
          <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tier</span>
              <EditableField
                type="select"
                value={client.priority}
                options={tierOptions}
                onSave={(v) => updateClientField(id, "priority", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Software</span>
              <EditableField
                type="select"
                value={client.software ?? ""}
                options={softwareOptions}
                onSave={(v) => updateClientField(id, "software", v || null)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Complexity</span>
              <EditableField
                type="select"
                value={client.complexity ?? ""}
                options={complexityOptions}
                onSave={(v) => updateClientField(id, "complexity", v || null)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Dext/Hubdoc</span>
              <EditableField
                type="select"
                value={client.dextHubdoc ?? ""}
                options={dextHubdocOptions}
                onSave={(v) => updateClientField(id, "dextHubdoc", v || null)}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Payroll Software</span>
              <EditableField
                type="text"
                value={client.payrollSoftware ?? ""}
                onSave={(v) => updateClientField(id, "payrollSoftware", v || null)}
                placeholder="—"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Year End</span>
              <EditableField
                type="text"
                value={client.yearEnd ?? ""}
                onSave={(v) => updateClientField(id, "yearEnd", v || null)}
                placeholder="—"
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Monthly Hours</span>
              <span className="font-medium tabular-nums">{client.totalMonthlyHrs}h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Catch-Up Hours</span>
              <EditableField
                type="number"
                value={client.catchUpHrs}
                onSave={(v) => updateClientField(id, "catchUpHrs", parseFloat(v) || 0)}
                suffix="h"
              />
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Notes</span>
              <EditableField
                type="textarea"
                value={client.notes ?? ""}
                onSave={(v) => updateClientField(id, "notes", v || null)}
                placeholder="Add notes..."
                className="mt-1 w-full"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4 md:col-span-2">
          {/* Team Assignments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Team Assignments</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddingAssignment(true)}
                disabled={addingAssignment}
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Add Assignment
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {client.assignments.map((a, idx) => (
                  <div
                    key={`${a.roleId}-${a.memberId}-${idx}`}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    {editingIdx === idx ? (
                      <>
                        <div className="flex items-center gap-2 flex-1">
                          <Select value={editRole} onValueChange={(v: string | null) => { if (v) setEditRole(v); }}>
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {roleOptions.map((r) => (
                                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={editMember} onValueChange={(v: string | null) => { if (v) setEditMember(v); }}>
                            <SelectTrigger className="w-40 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {memberOptions.map((m) => (
                                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            step={0.25}
                            value={editHours}
                            onChange={(e) => setEditHours(e.target.value)}
                            className="w-20 h-8 text-xs"
                          />
                          <span className="text-xs text-muted-foreground">h/mo</span>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={saveEdit}>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingIdx(null)}>
                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className={`border ${getRoleColor(a.roleId, defaultAssignmentRoles)}`}>
                            {getRoleName(a.roleId, defaultAssignmentRoles)}
                          </Badge>
                          <span className="font-medium text-sm">{getMemberName(a.memberId)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground tabular-nums">{a.hours}h/mo</span>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => startEdit(idx)}>
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => removeAssignment(id, idx)}>
                            <Trash2 className="h-3 w-3 text-red-400" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {/* Add Assignment inline form */}
                {addingAssignment && (
                  <div className="flex items-center gap-2 rounded-lg border border-dashed p-3">
                    <Select value={newRole} onValueChange={(v: string | null) => { if (v) setNewRole(v); }}>
                      <SelectTrigger className="w-32 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={newMember} onValueChange={(v: string | null) => { if (v) setNewMember(v); }}>
                      <SelectTrigger className="w-40 h-8 text-xs">
                        <SelectValue placeholder="Select member" />
                      </SelectTrigger>
                      <SelectContent>
                        {memberOptions.map((m) => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      step={0.25}
                      value={newHours}
                      onChange={(e) => setNewHours(e.target.value)}
                      className="w-20 h-8 text-xs"
                      placeholder="Hours"
                    />
                    <span className="text-xs text-muted-foreground">h/mo</span>
                    <Button size="sm" className="h-8" onClick={handleAddAssignment} disabled={!newMember}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8" onClick={() => setAddingAssignment(false)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}

                {client.assignments.length === 0 && !addingAssignment && (
                  <p className="text-sm text-muted-foreground text-center py-4">No assignments yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Hours Breakdown — auto-calculated */}
          <Card>
            <CardHeader><CardTitle className="text-base">Hours Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {client.assignments.map((a, idx) => (
                  <div key={`hrs-${idx}`} className="flex justify-between">
                    <span className="text-muted-foreground">{getRoleName(a.roleId, defaultAssignmentRoles)} ({getMemberName(a.memberId)})</span>
                    <span className="font-medium tabular-nums">{a.hours}h</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total Monthly Hours</span>
                  <span className="tabular-nums">{client.totalMonthlyHrs}h</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

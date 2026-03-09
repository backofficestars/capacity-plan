"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, Filter, Download, Trash2 } from "lucide-react";
import { useClientData } from "@/lib/client-data-context";
import {
  defaultAssignmentRoles,
  getRoleColor,
  type Client,
  type TeamMember,
} from "@/lib/placeholder-data";

function getMatrixMembers(clients: Client[], teamMembers: TeamMember[]) {
  const active = clients.filter((c) => c.status === "A" || c.status === "N");
  const ids = new Set<string>();
  active.forEach((c) => {
    if (c.leadBookkeeper) ids.add(c.leadBookkeeper);
    if (c.secondBookkeeper) ids.add(c.secondBookkeeper);
  });
  return teamMembers.filter((m) => ids.has(m.id));
}

function getUtilColor(pct: number) {
  if (pct >= 90) return "text-red-600";
  if (pct >= 85) return "text-amber-600";
  if (pct >= 70) return "text-emerald-600";
  return "text-blue-600";
}

function getMemberHoursForClient(memberId: string, client: Client): { role: string; hours: number } | null {
  if (client.leadBookkeeper === memberId && client.primaryHrs > 0) return { role: "lead", hours: client.primaryHrs };
  if (client.secondBookkeeper === memberId && client.secondHrs > 0) return { role: "supporting", hours: client.secondHrs };
  return null;
}

function getMemberTotalHours(memberId: string, clients: Client[]): number {
  return clients
    .filter((c) => c.status === "A" || c.status === "N")
    .reduce((sum, c) => {
      let hrs = 0;
      if (c.leadBookkeeper === memberId) hrs += c.primaryHrs;
      if (c.secondBookkeeper === memberId) hrs += c.secondHrs;
      return sum + hrs;
    }, 0);
}

type CellEdit = { clientId: string; memberId: string };

export default function AssignmentsPage() {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [editCell, setEditCell] = useState<CellEdit | null>(null);
  const [editHours, setEditHours] = useState("");
  const [editRole, setEditRole] = useState("lead");
  const { clients, teamMembers, updateClientField } = useClientData();

  const activeClients = clients.filter((c) => c.status === "A" || c.status === "N");
  const matrixMembers = getMatrixMembers(clients, teamMembers);

  const filteredClients = activeClients.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesTier = tierFilter === "all" || c.priority === tierFilter;
    return matchesSearch && matchesTier;
  });

  function openCellEdit(clientId: string, memberId: string) {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    const cell = getMemberHoursForClient(memberId, client);
    setEditHours(cell ? String(cell.hours) : "0");
    setEditRole(cell ? cell.role : "lead");
    setEditCell({ clientId, memberId });
  }

  function saveCellEdit() {
    if (!editCell) return;
    const { clientId, memberId } = editCell;
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    const hours = parseFloat(editHours) || 0;
    const existing = getMemberHoursForClient(memberId, client);

    if (existing) {
      if (existing.role === "lead") {
        updateClientField(clientId, "primaryHrs", hours);
        updateClientField(clientId, "totalMonthlyHrs", hours + client.secondHrs + client.oversightHrs + client.payrollHrs);
      } else {
        updateClientField(clientId, "secondHrs", hours);
        updateClientField(clientId, "totalMonthlyHrs", client.primaryHrs + hours + client.oversightHrs + client.payrollHrs);
      }
    } else if (hours > 0) {
      if (editRole === "lead") {
        updateClientField(clientId, "leadBookkeeper", memberId);
        updateClientField(clientId, "primaryHrs", hours);
      } else {
        updateClientField(clientId, "secondBookkeeper", memberId);
        updateClientField(clientId, "secondHrs", hours);
      }
    }
    setEditCell(null);
  }

  function removeCellAssignment() {
    if (!editCell) return;
    const { clientId, memberId } = editCell;
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    if (client.leadBookkeeper === memberId) {
      updateClientField(clientId, "leadBookkeeper", null);
      updateClientField(clientId, "primaryHrs", 0);
    }
    if (client.secondBookkeeper === memberId) {
      updateClientField(clientId, "secondBookkeeper", null);
      updateClientField(clientId, "secondHrs", 0);
    }
    setEditCell(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assignment Matrix</h1>
          <p className="text-muted-foreground">Bookkeeper-to-client assignments with allocated hours/month</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" /> Export
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search clients..." className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={tierFilter} onValueChange={(v: string | null) => { if (v) setTierFilter(v); }}>
          <SelectTrigger className="w-36">
            <Filter className="mr-2 h-3.5 w-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="A">A Tier</SelectItem>
            <SelectItem value="B">B Tier</SelectItem>
            <SelectItem value="C">C Tier</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="sticky left-0 z-10 bg-muted/50 px-3 py-2 text-left font-medium text-muted-foreground min-w-[200px]">Client</th>
                  <th className="px-2 py-2 text-center font-medium text-muted-foreground min-w-[40px]">Tier</th>
                  {matrixMembers.map((member) => {
                    const totalHrs = getMemberTotalHours(member.id, clients);
                    const utilPct = (totalHrs / member.monthlyCapacity) * 100;
                    return (
                      <th key={member.id} className="px-2 py-2 text-center font-medium min-w-[90px]">
                        <div className="text-xs">{member.name.split(" ")[0]}</div>
                        <div className={`text-[10px] font-normal ${getUtilColor(utilPct)}`}>
                          {totalHrs.toFixed(0)}h / {member.monthlyCapacity}h
                        </div>
                      </th>
                    );
                  })}
                  <th className="px-2 py-2 text-center font-medium text-muted-foreground min-w-[70px]">Total</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((client) => (
                  <tr key={client.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="sticky left-0 z-10 bg-background px-3 py-1.5 font-medium text-xs">{client.name}</td>
                    <td className="px-2 py-1.5 text-center">
                      <Badge
                        variant="secondary"
                        className={client.priority === "A" ? "bg-amber-50 text-amber-700" : client.priority === "B" ? "bg-sky-50 text-sky-700" : "bg-zinc-100 text-zinc-600"}
                      >
                        {client.priority}
                      </Badge>
                    </td>
                    {matrixMembers.map((member) => {
                      const cell = getMemberHoursForClient(member.id, client);
                      const isEditing = editCell?.clientId === client.id && editCell?.memberId === member.id;
                      return (
                        <td key={member.id} className="px-1 py-1 text-center">
                          <Popover open={isEditing} onOpenChange={(open) => { if (!open) setEditCell(null); }}>
                            <PopoverTrigger
                              onClick={() => openCellEdit(client.id, member.id)}
                              className={cell
                                ? `inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors hover:opacity-80 ${getRoleColor(cell.role, defaultAssignmentRoles)}`
                                : "inline-flex items-center justify-center w-full h-6 rounded hover:bg-muted/50 transition-colors cursor-pointer"
                              }
                            >
                              {cell ? (
                                <>
                                  <span className="text-[10px] uppercase opacity-70">{cell.role === "lead" ? "L" : "S"}</span>
                                  {cell.hours}h
                                </>
                              ) : (
                                <span className="text-muted-foreground/30">&mdash;</span>
                              )}
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-3" side="bottom" align="center">
                              <div className="space-y-2">
                                <div className="text-xs font-medium text-muted-foreground">
                                  {client.name} &rarr; {member.name.split(" ")[0]}
                                </div>
                                {!cell && (
                                  <Select value={editRole} onValueChange={(v: string | null) => { if (v) setEditRole(v); }}>
                                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="lead">Lead</SelectItem>
                                      <SelectItem value="supporting">Supporting</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    step={0.25}
                                    value={editHours}
                                    onChange={(e) => setEditHours(e.target.value)}
                                    className="h-8 text-xs"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") saveCellEdit();
                                      if (e.key === "Escape") setEditCell(null);
                                    }}
                                  />
                                  <span className="text-xs text-muted-foreground">h/mo</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" className="h-7 flex-1 text-xs" onClick={saveCellEdit}>Save</Button>
                                  {cell && (
                                    <Button variant="outline" size="sm" className="h-7 text-xs text-red-500" onClick={removeCellAssignment}>
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </td>
                      );
                    })}
                    <td className="px-2 py-1.5 text-center font-medium tabular-nums text-xs">{client.totalMonthlyHrs}h</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 bg-muted/50 font-medium">
                  <td className="sticky left-0 z-10 bg-muted/50 px-3 py-2">Totals</td>
                  <td />
                  {matrixMembers.map((member) => {
                    const totalHrs = getMemberTotalHours(member.id, clients);
                    return (
                      <td key={member.id} className="px-2 py-2 text-center tabular-nums text-xs">{totalHrs.toFixed(1)}h</td>
                    );
                  })}
                  <td className="px-2 py-2 text-center tabular-nums text-xs">
                    {activeClients.reduce((sum, c) => sum + c.totalMonthlyHrs, 0).toFixed(1)}h
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-6 rounded border border-blue-200 bg-blue-100" />
          <span>Lead (L)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-6 rounded border border-zinc-200 bg-zinc-100" />
          <span>Supporting (S)</span>
        </div>
        <span className="ml-4">Click a cell to edit allocation</span>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  Settings2,
} from "lucide-react";
import {
  teamMembers,
  activeClients,
  getTeamMemberClientHours,
  internalHoursBreakdown,
  INTERNAL_CATEGORIES,
  defaultPtoOverrides,
  defaultAssignmentRoles,
  type AssignmentRole,
  type PtoOverride,
  type InternalCategoryId,
} from "@/lib/placeholder-data";

// ─── Week Utilities ─────────────────────────────────────────────────────────

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

function formatWeekLabel(monday: Date): string {
  const fri = new Date(monday);
  fri.setDate(fri.getDate() + 4);
  const mMonth = monday.toLocaleDateString("en-US", { month: "short" });
  const fMonth = fri.toLocaleDateString("en-US", { month: "short" });
  if (mMonth === fMonth) {
    return `${mMonth} ${monday.getDate()}-${fri.getDate()}`;
  }
  return `${mMonth} ${monday.getDate()} - ${fMonth} ${fri.getDate()}`;
}

function formatWeekKey(monday: Date): string {
  return monday.toISOString().slice(0, 10);
}

function generateWeeks(count: number): { label: string; key: string; monday: Date }[] {
  const today = new Date();
  const startMonday = getMonday(today);
  return Array.from({ length: count }, (_, i) => {
    const monday = addWeeks(startMonday, i);
    return { label: formatWeekLabel(monday), key: formatWeekKey(monday), monday };
  });
}

// ─── Utilization Helpers ────────────────────────────────────────────────────

function getCellBg(utilPct: number, hasPto: boolean): string {
  if (hasPto) return "bg-purple-50";
  if (utilPct >= 90) return "bg-red-100";
  if (utilPct >= 85) return "bg-amber-100";
  if (utilPct >= 60) return "bg-emerald-50";
  return "bg-blue-50";
}

function getUtilTextColor(utilPct: number): string {
  if (utilPct >= 90) return "text-red-700";
  if (utilPct >= 85) return "text-amber-700";
  if (utilPct >= 60) return "text-emerald-700";
  return "text-blue-600";
}

function getBarColor(pct: number) {
  if (pct >= 90) return "[&>div]:bg-red-500";
  if (pct >= 85) return "[&>div]:bg-amber-500";
  if (pct >= 70) return "[&>div]:bg-emerald-500";
  return "[&>div]:bg-blue-400";
}

function getStatusLabel(pct: number) {
  if (pct >= 90) return { text: "overloaded", cls: "bg-red-50 text-red-600" };
  if (pct >= 85) return { text: "high", cls: "bg-amber-50 text-amber-600" };
  if (pct >= 70) return { text: "optimal", cls: "bg-emerald-50 text-emerald-600" };
  return { text: "underloaded", cls: "bg-blue-50 text-blue-600" };
}

// Only bookkeepers with internal hours or assignable (excluding non-worker roles)
const capacityMembers = teamMembers.filter(
  (m) => m.role === "Bookkeeper" || m.role === "Oversight"
);

// ─── Color palette for custom roles ─────────────────────────────────────────

const ROLE_COLOR_OPTIONS = [
  { id: "teal", label: "Teal", value: "bg-teal-100 text-teal-700 border-teal-200" },
  { id: "rose", label: "Rose", value: "bg-rose-100 text-rose-700 border-rose-200" },
  { id: "indigo", label: "Indigo", value: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { id: "orange", label: "Orange", value: "bg-orange-100 text-orange-700 border-orange-200" },
  { id: "cyan", label: "Cyan", value: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  { id: "lime", label: "Lime", value: "bg-lime-100 text-lime-700 border-lime-200" },
  { id: "fuchsia", label: "Fuchsia", value: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200" },
  { id: "emerald", label: "Emerald", value: "bg-emerald-100 text-emerald-700 border-emerald-200" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// Page Component
// ═══════════════════════════════════════════════════════════════════════════════

export default function CapacityPage() {
  // ─── State ──────────────────────────────────────────────────────────────────

  const [activeTab, setActiveTab] = useState<"forecast" | "weekly">("forecast");
  const [weekCount, setWeekCount] = useState(8);
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(0);

  // Internal hours editable state (monthly values)
  const [internalHours, setInternalHours] = useState<
    Record<string, Record<InternalCategoryId, number>>
  >(() => JSON.parse(JSON.stringify(internalHoursBreakdown)));

  // PTO overrides
  const [ptoOverrides, setPtoOverrides] = useState<PtoOverride[]>(defaultPtoOverrides);
  const [showAddPto, setShowAddPto] = useState(false);
  const [newPto, setNewPto] = useState({ memberId: "", weekStart: "", availableHrs: 0, reason: "" });

  // Custom roles
  const [roles, setRoles] = useState<AssignmentRole[]>(defaultAssignmentRoles);
  const [showAddRole, setShowAddRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleColor, setNewRoleColor] = useState(ROLE_COLOR_OPTIONS[0].value);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editRoleName, setEditRoleName] = useState("");

  // ─── Derived Data ───────────────────────────────────────────────────────────

  const weeks = generateWeeks(weekCount);
  const currentWeek = weeks[selectedWeekIdx] ?? weeks[0];

  function getMemberWeeklyData(memberId: string, weekKey: string) {
    const member = teamMembers.find((m) => m.id === memberId)!;
    const clientHrsMonthly = getTeamMemberClientHours(memberId);
    const clientHrsWeekly = Math.round((clientHrsMonthly / 4.33) * 10) / 10;

    const breakdown = internalHours[memberId];
    const internalTotal = breakdown
      ? Object.values(breakdown).reduce((s, v) => s + v, 0)
      : 0;
    const internalWeekly = Math.round((internalTotal / 4.33) * 10) / 10;

    const pto = ptoOverrides.find(
      (o) => o.memberId === memberId && o.weekStart === weekKey
    );
    const effectiveCapacity = pto ? pto.availableHrs : member.weeklyCapacity;
    const totalUsed = clientHrsWeekly + internalWeekly;
    const utilPct = effectiveCapacity > 0 ? (totalUsed / effectiveCapacity) * 100 : totalUsed > 0 ? 100 : 0;

    return {
      clientHrs: clientHrsWeekly,
      internalHrs: internalWeekly,
      totalUsed,
      effectiveCapacity,
      utilPct,
      hasPto: !!pto,
      ptoReason: pto?.reason,
    };
  }

  // ─── Internal Hours Handlers ────────────────────────────────────────────────

  function updateInternalHour(memberId: string, categoryId: InternalCategoryId, value: number) {
    setInternalHours((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [categoryId]: value,
      },
    }));
  }

  // ─── PTO Handlers ──────────────────────────────────────────────────────────

  function addPtoOverride() {
    if (!newPto.memberId || !newPto.weekStart) return;
    const id = `pto-${Date.now()}`;
    setPtoOverrides((prev) => [...prev, { ...newPto, id }]);
    setNewPto({ memberId: "", weekStart: "", availableHrs: 0, reason: "" });
    setShowAddPto(false);
  }

  function removePtoOverride(id: string) {
    setPtoOverrides((prev) => prev.filter((o) => o.id !== id));
  }

  // ─── Role Handlers ─────────────────────────────────────────────────────────

  function addRole() {
    if (!newRoleName.trim()) return;
    const id = newRoleName.trim().toLowerCase().replace(/\s+/g, "_");
    if (roles.some((r) => r.id === id)) return;
    setRoles((prev) => [...prev, { id, name: newRoleName.trim(), color: newRoleColor, isBuiltIn: false }]);
    setNewRoleName("");
    setNewRoleColor(ROLE_COLOR_OPTIONS[0].value);
    setShowAddRole(false);
  }

  function deleteRole(id: string) {
    setRoles((prev) => prev.filter((r) => r.id !== id));
  }

  function startEditRole(role: AssignmentRole) {
    setEditingRoleId(role.id);
    setEditRoleName(role.name);
  }

  function saveEditRole() {
    if (!editingRoleId || !editRoleName.trim()) return;
    setRoles((prev) =>
      prev.map((r) => (r.id === editingRoleId ? { ...r, name: editRoleName.trim() } : r))
    );
    setEditingRoleId(null);
    setEditRoleName("");
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Capacity Planning</h1>
          <p className="text-muted-foreground">
            Multi-week forecasting, internal hours, and role management
          </p>
        </div>
      </div>

      {/* ── Tab Switcher ───────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setActiveTab("forecast")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "forecast"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Multi-Week Forecast
        </button>
        <button
          onClick={() => setActiveTab("weekly")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "weekly"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Weekly Detail
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
         TAB 1: Multi-Week Forecast
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "forecast" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Capacity Forecast
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label className="text-sm text-muted-foreground">Weeks:</Label>
              <Select
                value={String(weekCount)}
                onValueChange={(v: string | null) => { if (v) setWeekCount(parseInt(v)); }}
              >
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="6">6</SelectItem>
                  <SelectItem value="8">8</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="12">12</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="sticky left-0 z-10 bg-muted/50 px-3 py-2 text-left font-medium text-muted-foreground min-w-[160px]">
                      Team Member
                    </th>
                    {weeks.map((week) => (
                      <th
                        key={week.key}
                        className="px-2 py-2 text-center font-medium text-muted-foreground min-w-[100px] text-xs"
                      >
                        {week.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {capacityMembers.map((member) => (
                    <tr key={member.id} className="border-b">
                      <td className="sticky left-0 z-10 bg-background px-3 py-2 font-medium text-xs whitespace-nowrap">
                        {member.name}
                        <div className="text-[10px] text-muted-foreground font-normal">
                          {member.weeklyCapacity}h/wk
                        </div>
                      </td>
                      {weeks.map((week) => {
                        const data = getMemberWeeklyData(member.id, week.key);
                        return (
                          <td
                            key={week.key}
                            className={`px-1.5 py-1.5 text-center ${getCellBg(data.utilPct, data.hasPto)}`}
                          >
                            <div className={`text-xs font-medium tabular-nums ${getUtilTextColor(data.utilPct)}`}>
                              {data.totalUsed.toFixed(1)}h / {data.effectiveCapacity}h
                            </div>
                            <div className={`text-[10px] font-semibold tabular-nums ${getUtilTextColor(data.utilPct)}`}>
                              {data.effectiveCapacity > 0 ? `${data.utilPct.toFixed(0)}%` : "OOO"}
                            </div>
                            {data.hasPto && (
                              <div className="text-[9px] text-purple-600 truncate">
                                PTO
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-muted/50 font-medium">
                    <td className="sticky left-0 z-10 bg-muted/50 px-3 py-2 text-xs">
                      Team Totals
                    </td>
                    {weeks.map((week) => {
                      let totalUsed = 0;
                      let totalCapacity = 0;
                      capacityMembers.forEach((m) => {
                        const data = getMemberWeeklyData(m.id, week.key);
                        totalUsed += data.totalUsed;
                        totalCapacity += data.effectiveCapacity;
                      });
                      const utilPct = totalCapacity > 0 ? (totalUsed / totalCapacity) * 100 : 0;
                      return (
                        <td key={week.key} className="px-1.5 py-2 text-center text-xs tabular-nums">
                          <div className={getUtilTextColor(utilPct)}>
                            {totalUsed.toFixed(0)}h / {totalCapacity}h
                          </div>
                          <div className={`text-[10px] font-semibold ${getUtilTextColor(utilPct)}`}>
                            {utilPct.toFixed(0)}%
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
         TAB 2: Weekly Detail
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "weekly" && (
        <>
          {/* Week Selector */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedWeekIdx(Math.max(0, selectedWeekIdx - 1))}
              disabled={selectedWeekIdx === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex gap-1 overflow-x-auto">
              {weeks.slice(0, 8).map((week, i) => (
                <button
                  key={week.key}
                  onClick={() => setSelectedWeekIdx(i)}
                  className={`rounded-md px-3 py-1.5 text-sm transition-colors whitespace-nowrap ${
                    i === selectedWeekIdx
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {week.label}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedWeekIdx(Math.min(weeks.length - 1, selectedWeekIdx + 1))}
              disabled={selectedWeekIdx >= weeks.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Week of {currentWeek.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {capacityMembers.map((member) => {
                const data = getMemberWeeklyData(member.id, currentWeek.key);
                const status = getStatusLabel(data.utilPct);

                return (
                  <div key={member.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium w-40">{member.name}</span>
                        <Badge variant="secondary" className={status.cls}>
                          {status.text}
                        </Badge>
                        {data.hasPto && (
                          <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                            PTO: {data.ptoReason}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <span className="tabular-nums">
                          {data.totalUsed.toFixed(1)}h / {data.effectiveCapacity}h
                        </span>
                        <span className="w-12 text-right font-medium tabular-nums">
                          {data.effectiveCapacity > 0 ? `${data.utilPct.toFixed(0)}%` : "OOO"}
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={Math.min(100, data.utilPct)}
                      className={`h-2.5 ${getBarColor(data.utilPct)}`}
                    />
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>Client: {data.clientHrs}h</span>
                      <span>Internal: {data.internalHrs}h</span>
                      <span>Available: {Math.max(0, data.effectiveCapacity - data.totalUsed).toFixed(1)}h</span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </>
      )}

      {/* Color legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-6 rounded bg-red-100 border border-red-200" />
          <span>Overloaded (&ge;90%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-6 rounded bg-amber-100 border border-amber-200" />
          <span>High (85-89%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-6 rounded bg-emerald-50 border border-emerald-200" />
          <span>Optimal (60-84%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-6 rounded bg-blue-50 border border-blue-200" />
          <span>Underloaded (&lt;60%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-6 rounded bg-purple-50 border border-purple-200" />
          <span>PTO</span>
        </div>
      </div>

      <Separator />

      {/* ══════════════════════════════════════════════════════════════════════
         Internal Hours Matrix
         ══════════════════════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Internal Hours (Monthly Budget)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="sticky left-0 z-10 bg-muted/50 min-w-[140px]">
                    Team Member
                  </TableHead>
                  {INTERNAL_CATEGORIES.map((cat) => (
                    <TableHead key={cat.id} className="text-center min-w-[90px] text-xs">
                      <div className="leading-tight">{cat.label}</div>
                    </TableHead>
                  ))}
                  <TableHead className="text-center min-w-[70px] font-semibold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {capacityMembers.map((member) => {
                  const breakdown = internalHours[member.id];
                  if (!breakdown) return null;
                  const total = Object.values(breakdown).reduce((s, v) => s + v, 0);
                  return (
                    <TableRow key={member.id}>
                      <TableCell className="sticky left-0 z-10 bg-background font-medium text-xs whitespace-nowrap">
                        {member.name}
                      </TableCell>
                      {INTERNAL_CATEGORIES.map((cat) => (
                        <TableCell key={cat.id} className="text-center p-1">
                          <Input
                            type="number"
                            min={0}
                            max={40}
                            step={0.25}
                            value={breakdown[cat.id]}
                            onChange={(e) =>
                              updateInternalHour(member.id, cat.id, parseFloat(e.target.value) || 0)
                            }
                            className="h-7 w-16 mx-auto text-center text-xs tabular-nums"
                          />
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-semibold text-xs tabular-nums">
                        {total.toFixed(1)}h
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <tfoot>
                <tr className="border-t-2 bg-muted/50 font-medium">
                  <td className="sticky left-0 z-10 bg-muted/50 px-4 py-2 text-xs">
                    Column Totals
                  </td>
                  {INTERNAL_CATEGORIES.map((cat) => {
                    const colTotal = capacityMembers.reduce((sum, m) => {
                      const b = internalHours[m.id];
                      return sum + (b ? b[cat.id] : 0);
                    }, 0);
                    return (
                      <td key={cat.id} className="px-1 py-2 text-center text-xs tabular-nums font-semibold">
                        {colTotal.toFixed(1)}h
                      </td>
                    );
                  })}
                  <td className="px-1 py-2 text-center text-xs tabular-nums font-bold">
                    {capacityMembers
                      .reduce((sum, m) => {
                        const b = internalHours[m.id];
                        return sum + (b ? Object.values(b).reduce((s, v) => s + v, 0) : 0);
                      }, 0)
                      .toFixed(1)}
                    h
                  </td>
                </tr>
              </tfoot>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════════════════
         PTO & Capacity Overrides + Role Management
         ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* PTO & Capacity Overrides */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">PTO & Capacity Overrides</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowAddPto(!showAddPto)}>
              <Plus className="mr-2 h-3.5 w-3.5" />
              Add Override
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {showAddPto && (
              <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Team Member</Label>
                    <Select value={newPto.memberId} onValueChange={(v: string | null) => { if (v) setNewPto({ ...newPto, memberId: v }); }}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {teamMembers.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Week Start (Monday)</Label>
                    <Input
                      type="date"
                      value={newPto.weekStart}
                      onChange={(e) => setNewPto({ ...newPto, weekStart: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Available Hours</Label>
                    <Input
                      type="number"
                      min={0}
                      value={newPto.availableHrs}
                      onChange={(e) => setNewPto({ ...newPto, availableHrs: parseFloat(e.target.value) || 0 })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Reason</Label>
                    <Input
                      value={newPto.reason}
                      onChange={(e) => setNewPto({ ...newPto, reason: e.target.value })}
                      placeholder="e.g., Vacation"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => setShowAddPto(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={addPtoOverride}>
                    Add
                  </Button>
                </div>
              </div>
            )}

            {ptoOverrides.map((o) => {
              const memberName = teamMembers.find((m) => m.id === o.memberId)?.name ?? o.memberId;
              return (
                <div
                  key={o.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium text-sm">{memberName}</p>
                    <p className="text-xs text-muted-foreground">
                      Week of {o.weekStart} &middot; {o.availableHrs}h available
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                      {o.reason}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => removePtoOverride(o.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {ptoOverrides.length === 0 && !showAddPto && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No overrides set
              </p>
            )}
          </CardContent>
        </Card>

        {/* Role Management */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Assignment Roles
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setShowAddRole(!showAddRole)}>
              <Plus className="mr-2 h-3.5 w-3.5" />
              Add Role
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {showAddRole && (
              <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
                <div className="space-y-1">
                  <Label className="text-xs">Role Name</Label>
                  <Input
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="e.g., Controller"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Color</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {ROLE_COLOR_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setNewRoleColor(opt.value)}
                        className={`rounded-md border px-2.5 py-1 text-xs font-medium ${opt.value} ${
                          newRoleColor === opt.value ? "ring-2 ring-primary ring-offset-1" : ""
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" onClick={() => setShowAddRole(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={addRole}>
                    Add Role
                  </Button>
                </div>
              </div>
            )}

            {roles.map((role) => (
              <div
                key={role.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className={`border ${role.color}`}>
                    {editingRoleId === role.id ? (
                      <Input
                        value={editRoleName}
                        onChange={(e) => setEditRoleName(e.target.value)}
                        className="h-5 w-24 text-xs border-0 p-0 bg-transparent focus-visible:ring-0"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") saveEditRole(); if (e.key === "Escape") setEditingRoleId(null); }}
                      />
                    ) : (
                      role.name
                    )}
                  </Badge>
                  {role.isBuiltIn && (
                    <span className="text-[10px] text-muted-foreground">Built-in</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {editingRoleId === role.id ? (
                    <>
                      <Button variant="ghost" size="sm" onClick={saveEditRole}>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setEditingRoleId(null)}>
                        <X className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </>
                  ) : (
                    <>
                      {!role.isBuiltIn && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => startEditRole(role)}>
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => deleteRole(role.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

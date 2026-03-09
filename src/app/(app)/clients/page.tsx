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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Filter } from "lucide-react";
import Link from "next/link";
import { EditableField } from "@/components/editable-field";
import { useClientData } from "@/lib/client-data-context";
import { statusLabels } from "@/lib/placeholder-data";

function getPriorityBadge(priority: string) {
  const color =
    priority === "A"
      ? "bg-amber-50 text-amber-700"
      : priority === "B"
        ? "bg-sky-50 text-sky-700"
        : "bg-zinc-100 text-zinc-600";
  return (
    <Badge variant="secondary" className={color}>
      {priority}
    </Badge>
  );
}

function getStatusBadge(status: string) {
  const colors: Record<string, string> = {
    A: "bg-emerald-50 text-emerald-700",
    N: "bg-zinc-100 text-zinc-600",
    P: "bg-blue-50 text-blue-700",
  };
  return (
    <Badge variant="secondary" className={colors[status] ?? ""}>
      {statusLabels[status] ?? status}
    </Badge>
  );
}

const tierOptions = [
  { value: "A", label: "A" },
  { value: "B", label: "B" },
  { value: "C", label: "C" },
];

const statusOptions = [
  { value: "A", label: "Active" },
  { value: "N", label: "Not Active" },
  { value: "P", label: "Onboarding" },
];

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { clients, teamMembers, updateClientField, getMemberName } = useClientData();

  const memberOptions = [
    { value: "", label: "—" },
    ...teamMembers.map((m) => ({ value: m.id, label: m.name })),
  ];

  const filtered = clients.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
    const matchesTier = tierFilter === "all" || c.priority === tierFilter;
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesTier && matchesStatus;
  });

  const activeCount = clients.filter((c) => c.status === "A").length;
  const onboardingCount = clients.filter((c) => c.status === "P").length;
  const aTierCount = clients.filter((c) => c.priority === "A").length;
  const totalHrs = clients.reduce((s, c) => s + c.totalMonthlyHrs, 0);

  function updateLead(clientId: string, memberId: string) {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    const idx = client.assignments.findIndex((a) => a.roleId === "lead");
    if (memberId && idx >= 0) {
      // There's no direct way to just update member on assignment via context,
      // so we use updateClientField for the flat field and let it work
      updateClientField(clientId, "leadBookkeeper", memberId || null);
    } else if (memberId) {
      updateClientField(clientId, "leadBookkeeper", memberId);
    } else {
      updateClientField(clientId, "leadBookkeeper", null);
    }
  }

  function updateSecond(clientId: string, memberId: string) {
    updateClientField(clientId, "secondBookkeeper", memberId || null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            {clients.length} total clients from BOS spreadsheet
          </p>
        </div>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-sm text-muted-foreground">Active clients</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{onboardingCount}</div>
            <p className="text-sm text-muted-foreground">Onboarding</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{aTierCount}</div>
            <p className="text-sm text-muted-foreground">A Tier</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{totalHrs.toFixed(0)}h</div>
            <p className="text-sm text-muted-foreground">Total monthly hours</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={tierFilter} onValueChange={(v: string | null) => { if (v) setTierFilter(v); }}>
          <SelectTrigger className="w-32">
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
        <Select value={statusFilter} onValueChange={(v: string | null) => { if (v) setStatusFilter(v); }}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="A">Active</SelectItem>
            <SelectItem value="N">Not Active</SelectItem>
            <SelectItem value="P">Onboarding</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Client Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Software</TableHead>
                <TableHead>Complexity</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Second</TableHead>
                <TableHead className="text-right">Hrs/Mo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((client) => (
                <TableRow key={client.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Link
                      href={`/clients/${client.id}`}
                      className="font-medium hover:underline text-sm"
                    >
                      {client.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <EditableField
                      type="select"
                      value={client.priority}
                      options={tierOptions}
                      onSave={(v) => updateClientField(client.id, "priority", v)}
                    />
                  </TableCell>
                  <TableCell>
                    {client.software ? (
                      <Badge variant="outline">{client.software}</Badge>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        client.complexity === "High"
                          ? "border-red-200 text-red-700"
                          : client.complexity === "Medium"
                            ? "border-amber-200 text-amber-700"
                            : ""
                      }
                    >
                      {client.complexity || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    <EditableField
                      type="select"
                      value={client.leadBookkeeper ?? ""}
                      options={memberOptions}
                      onSave={(v) => updateLead(client.id, v)}
                    />
                  </TableCell>
                  <TableCell className="text-sm">
                    <EditableField
                      type="select"
                      value={client.secondBookkeeper ?? ""}
                      options={memberOptions}
                      onSave={(v) => updateSecond(client.id, v)}
                    />
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-sm">
                    {client.totalMonthlyHrs}
                  </TableCell>
                  <TableCell>
                    <EditableField
                      type="select"
                      value={client.status}
                      options={statusOptions}
                      onSave={(v) => updateClientField(client.id, "status", v)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

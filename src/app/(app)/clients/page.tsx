"use client";

import { useState, useMemo } from "react";
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
import { Plus, Search, X } from "lucide-react";
import Link from "next/link";
import { EditableField } from "@/components/editable-field";
import { useClientData } from "@/lib/client-data-context";
import { statusLabels } from "@/lib/placeholder-data";

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
  { value: "N", label: "New" },
  { value: "P", label: "Onboarding" },
];

/* ------------------------------------------------------------------ */
/*  Tiny inline filter Select that sits below the column header text  */
/* ------------------------------------------------------------------ */
function ColumnFilter({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <div className="flex items-center gap-0.5 mt-1">
      <Select
        value={value}
        onValueChange={(v: string | null) => {
          if (v) onChange(v);
        }}
      >
        <SelectTrigger className="h-6 w-full min-w-[60px] text-[11px] px-1.5 py-0 font-normal border-dashed">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{placeholder}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value !== "all" && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onChange("all");
          }}
          className="shrink-0 rounded p-0.5 hover:bg-muted"
          title="Clear filter"
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [softwareFilter, setSoftwareFilter] = useState("all");
  const [complexityFilter, setComplexityFilter] = useState("all");
  const [leadFilter, setLeadFilter] = useState("all");
  const [secondFilter, setSecondFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const { clients, teamMembers, updateClientField, getMemberName } = useClientData();

  const memberOptions = [
    { value: "", label: "—" },
    ...teamMembers.map((m) => ({ value: m.id, label: m.name })),
  ];

  // Build dynamic filter options from actual data
  const softwareOptions = useMemo(() => {
    const unique = [...new Set(clients.map((c) => c.software).filter(Boolean))] as string[];
    return unique.sort().map((s) => ({ value: s, label: s }));
  }, [clients]);

  const complexityOptions = useMemo(() => {
    const unique = [...new Set(clients.map((c) => c.complexity).filter(Boolean))] as string[];
    const order = ["Low", "Medium", "High"];
    return unique.sort((a, b) => order.indexOf(a) - order.indexOf(b)).map((s) => ({ value: s, label: s }));
  }, [clients]);

  const leadOptions = useMemo(() => {
    const unique = [...new Set(clients.map((c) => c.leadBookkeeper).filter(Boolean))] as string[];
    return unique
      .map((id) => ({ value: id, label: getMemberName(id) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [clients, getMemberName]);

  const secondOptions = useMemo(() => {
    const unique = [...new Set(clients.map((c) => c.secondBookkeeper).filter(Boolean))] as string[];
    return unique
      .map((id) => ({ value: id, label: getMemberName(id) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [clients, getMemberName]);

  const hasActiveFilters = tierFilter !== "all" || softwareFilter !== "all" || complexityFilter !== "all" || leadFilter !== "all" || secondFilter !== "all" || statusFilter !== "all" || search !== "";

  const filtered = clients.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (tierFilter !== "all" && c.priority !== tierFilter) return false;
    if (softwareFilter !== "all" && c.software !== softwareFilter) return false;
    if (complexityFilter !== "all" && c.complexity !== complexityFilter) return false;
    if (leadFilter !== "all" && c.leadBookkeeper !== leadFilter) return false;
    if (secondFilter !== "all" && c.secondBookkeeper !== secondFilter) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    return true;
  });

  const activeCount = clients.filter((c) => c.status === "A").length;
  const onboardingCount = clients.filter((c) => c.status === "P").length;
  const aTierCount = clients.filter((c) => c.priority === "A").length;
  const totalHrs = clients.reduce((s, c) => s + c.totalMonthlyHrs, 0);

  function clearAllFilters() {
    setSearch("");
    setTierFilter("all");
    setSoftwareFilter("all");
    setComplexityFilter("all");
    setLeadFilter("all");
    setSecondFilter("all");
    setStatusFilter("all");
  }

  function updateLead(clientId: string, memberId: string) {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    const idx = client.assignments.findIndex((a) => a.roleId === "lead");
    if (memberId && idx >= 0) {
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

      {/* Search + Clear */}
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
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-xs text-muted-foreground">
            <X className="mr-1 h-3 w-3" />
            Clear filters
          </Button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} of {clients.length} clients
        </span>
      </div>

      {/* Client Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">Client</TableHead>
                <TableHead className="w-[90px]">
                  <span>Tier</span>
                  <ColumnFilter value={tierFilter} onChange={setTierFilter} options={tierOptions} placeholder="All" />
                </TableHead>
                <TableHead className="w-[100px]">
                  <span>Software</span>
                  <ColumnFilter value={softwareFilter} onChange={setSoftwareFilter} options={softwareOptions} placeholder="All" />
                </TableHead>
                <TableHead className="w-[110px]">
                  <span>Complexity</span>
                  <ColumnFilter value={complexityFilter} onChange={setComplexityFilter} options={complexityOptions} placeholder="All" />
                </TableHead>
                <TableHead className="w-[120px]">
                  <span>Lead</span>
                  <ColumnFilter value={leadFilter} onChange={setLeadFilter} options={leadOptions} placeholder="All" />
                </TableHead>
                <TableHead className="w-[120px]">
                  <span>Second</span>
                  <ColumnFilter value={secondFilter} onChange={setSecondFilter} options={secondOptions} placeholder="All" />
                </TableHead>
                <TableHead className="text-right w-[80px]">Hrs/Mo</TableHead>
                <TableHead className="w-[110px]">
                  <span>Status</span>
                  <ColumnFilter value={statusFilter} onChange={setStatusFilter} options={statusOptions} placeholder="All" />
                </TableHead>
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
                    {client.totalMonthlyHrs.toFixed(1)}
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

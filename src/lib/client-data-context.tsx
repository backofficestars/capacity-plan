"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import {
  clients as initialClients,
  teamMembers,
  syncFlatFieldsFromAssignments,
  type Client,
  type ClientAssignment,
} from "@/lib/placeholder-data";

type ClientDataContextValue = {
  clients: Client[];
  updateClientField: (clientId: string, field: keyof Client, value: unknown) => void;
  addAssignment: (clientId: string, assignment: ClientAssignment) => void;
  updateAssignment: (clientId: string, index: number, assignment: ClientAssignment) => void;
  removeAssignment: (clientId: string, index: number) => void;
  getMemberName: (id: string | null) => string;
};

const ClientDataContext = createContext<ClientDataContextValue | null>(null);

export function ClientDataProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(() =>
    initialClients.map((c) => ({ ...c, assignments: [...c.assignments] }))
  );

  const updateClientField = useCallback(
    (clientId: string, field: keyof Client, value: unknown) => {
      setClients((prev) =>
        prev.map((c) => {
          if (c.id !== clientId) return c;
          return { ...c, [field]: value };
        })
      );
    },
    []
  );

  const addAssignment = useCallback(
    (clientId: string, assignment: ClientAssignment) => {
      setClients((prev) =>
        prev.map((c) => {
          if (c.id !== clientId) return c;
          const updated = { ...c, assignments: [...c.assignments, assignment] };
          syncFlatFieldsFromAssignments(updated);
          return updated;
        })
      );
    },
    []
  );

  const updateAssignment = useCallback(
    (clientId: string, index: number, assignment: ClientAssignment) => {
      setClients((prev) =>
        prev.map((c) => {
          if (c.id !== clientId) return c;
          const newAssignments = [...c.assignments];
          newAssignments[index] = assignment;
          const updated = { ...c, assignments: newAssignments };
          syncFlatFieldsFromAssignments(updated);
          return updated;
        })
      );
    },
    []
  );

  const removeAssignment = useCallback(
    (clientId: string, index: number) => {
      setClients((prev) =>
        prev.map((c) => {
          if (c.id !== clientId) return c;
          const newAssignments = c.assignments.filter((_, i) => i !== index);
          const updated = { ...c, assignments: newAssignments };
          syncFlatFieldsFromAssignments(updated);
          return updated;
        })
      );
    },
    []
  );

  const getMemberName = useCallback((id: string | null): string => {
    if (!id) return "—";
    const m = teamMembers.find((t) => t.id === id);
    return m ? m.name : id;
  }, []);

  return (
    <ClientDataContext.Provider
      value={{ clients, updateClientField, addAssignment, updateAssignment, removeAssignment, getMemberName }}
    >
      {children}
    </ClientDataContext.Provider>
  );
}

export function useClientData() {
  const ctx = useContext(ClientDataContext);
  if (!ctx) throw new Error("useClientData must be used within ClientDataProvider");
  return ctx;
}

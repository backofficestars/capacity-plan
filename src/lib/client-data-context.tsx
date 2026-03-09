"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useTransition,
  type ReactNode,
} from "react";
import {
  syncFlatFieldsFromAssignments,
  type Client,
  type ClientAssignment,
  type TeamMember,
} from "@/lib/placeholder-data";
import {
  updateClientFieldAction,
  addAssignmentAction,
  updateAssignmentAction,
  removeAssignmentAction,
  undoLastEditAction,
  canUndoAction,
} from "@/lib/actions/client-actions";
import { toast } from "sonner";

type ClientDataContextValue = {
  clients: Client[];
  teamMembers: TeamMember[];
  updateClientField: (clientId: string, field: keyof Client, value: unknown) => void;
  addAssignment: (clientId: string, assignment: ClientAssignment) => void;
  updateAssignment: (clientId: string, index: number, assignment: ClientAssignment) => void;
  removeAssignment: (clientId: string, index: number) => void;
  getMemberName: (id: string | null) => string;
  undo: () => Promise<void>;
  canUndo: boolean;
  isPending: boolean;
};

const ClientDataContext = createContext<ClientDataContextValue | null>(null);

type ClientDataProviderProps = {
  children: ReactNode;
  initialClients: Client[];
  initialTeamMembers: TeamMember[];
};

export function ClientDataProvider({
  children,
  initialClients,
  initialTeamMembers,
}: ClientDataProviderProps) {
  const [clients, setClients] = useState<Client[]>(() =>
    initialClients.map((c) => ({ ...c, assignments: [...c.assignments] }))
  );
  const [teamMembers] = useState<TeamMember[]>(initialTeamMembers);
  const [canUndoState, setCanUndoState] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Refresh canUndo state after mutations
  const refreshCanUndo = useCallback(async () => {
    const result = await canUndoAction();
    setCanUndoState(result);
  }, []);

  const updateClientField = useCallback(
    (clientId: string, field: keyof Client, value: unknown) => {
      // Optimistic update
      setClients((prev) =>
        prev.map((c) => {
          if (c.id !== clientId) return c;
          return { ...c, [field]: value };
        })
      );

      // Persist via Server Action
      startTransition(async () => {
        const result = await updateClientFieldAction(clientId, field, value);
        if (!result.success) {
          toast.error(`Failed to save: ${result.error}`);
        }
        await refreshCanUndo();
      });
    },
    [refreshCanUndo]
  );

  const addAssignment = useCallback(
    (clientId: string, assignment: ClientAssignment) => {
      // Optimistic update
      setClients((prev) =>
        prev.map((c) => {
          if (c.id !== clientId) return c;
          const updated = { ...c, assignments: [...c.assignments, assignment] };
          syncFlatFieldsFromAssignments(updated);
          return updated;
        })
      );

      // Persist
      startTransition(async () => {
        const result = await addAssignmentAction(
          clientId,
          assignment.roleId,
          assignment.memberId,
          assignment.hours
        );
        if (!result.success) {
          toast.error(`Failed to save assignment: ${result.error}`);
        }
        await refreshCanUndo();
      });
    },
    [refreshCanUndo]
  );

  const updateAssignment = useCallback(
    (clientId: string, index: number, assignment: ClientAssignment) => {
      // Capture old assignment for the server action
      const client = clients.find((c) => c.id === clientId);
      const oldAssignment = client?.assignments[index];

      // Optimistic update
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

      // Persist
      if (oldAssignment) {
        startTransition(async () => {
          const result = await updateAssignmentAction(
            clientId,
            oldAssignment.roleId,
            oldAssignment.memberId,
            assignment.roleId,
            assignment.memberId,
            assignment.hours
          );
          if (!result.success) {
            toast.error(`Failed to update assignment: ${result.error}`);
          }
          await refreshCanUndo();
        });
      }
    },
    [clients, refreshCanUndo]
  );

  const removeAssignment = useCallback(
    (clientId: string, index: number) => {
      // Capture for server action
      const client = clients.find((c) => c.id === clientId);
      const oldAssignment = client?.assignments[index];

      // Optimistic update
      setClients((prev) =>
        prev.map((c) => {
          if (c.id !== clientId) return c;
          const newAssignments = c.assignments.filter((_, i) => i !== index);
          const updated = { ...c, assignments: newAssignments };
          syncFlatFieldsFromAssignments(updated);
          return updated;
        })
      );

      // Persist
      if (oldAssignment) {
        startTransition(async () => {
          const result = await removeAssignmentAction(
            clientId,
            oldAssignment.roleId,
            oldAssignment.memberId
          );
          if (!result.success) {
            toast.error(`Failed to remove assignment: ${result.error}`);
          }
          await refreshCanUndo();
        });
      }
    },
    [clients, refreshCanUndo]
  );

  const getMemberName = useCallback(
    (id: string | null): string => {
      if (!id) return "—";
      const m = teamMembers.find((t) => t.id === id);
      return m ? m.name : id;
    },
    [teamMembers]
  );

  const undo = useCallback(async () => {
    const result = await undoLastEditAction();
    if (result.success) {
      toast.success(`Undone: ${result.description}`);
      // Reload to reflect undo changes from the server
      window.location.reload();
    } else {
      toast.error(result.error ?? "Nothing to undo");
    }
    await refreshCanUndo();
  }, [refreshCanUndo]);

  return (
    <ClientDataContext.Provider
      value={{
        clients,
        teamMembers,
        updateClientField,
        addAssignment,
        updateAssignment,
        removeAssignment,
        getMemberName,
        undo,
        canUndo: canUndoState,
        isPending,
      }}
    >
      {children}
    </ClientDataContext.Provider>
  );
}

export function useClientData() {
  const ctx = useContext(ClientDataContext);
  if (!ctx)
    throw new Error("useClientData must be used within ClientDataProvider");
  return ctx;
}

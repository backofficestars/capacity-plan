"use client";

import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClientDataProvider } from "@/lib/client-data-context";
import type { ReactNode } from "react";
import type { Client, TeamMember } from "@/lib/placeholder-data";

type ProvidersProps = {
  children: ReactNode;
  initialClients: Client[];
  initialTeamMembers: TeamMember[];
};

export function Providers({
  children,
  initialClients,
  initialTeamMembers,
}: ProvidersProps) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <ClientDataProvider
        initialClients={initialClients}
        initialTeamMembers={initialTeamMembers}
      >
        <TooltipProvider delay={0}>{children}</TooltipProvider>
      </ClientDataProvider>
    </SessionProvider>
  );
}

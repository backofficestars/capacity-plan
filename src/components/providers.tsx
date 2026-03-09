"use client";

import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClientDataProvider } from "@/lib/client-data-context";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider
      // Don't block rendering when auth session fetch fails (e.g. no DB configured)
      refetchOnWindowFocus={false}
    >
      <ClientDataProvider>
        <TooltipProvider delay={0}>{children}</TooltipProvider>
      </ClientDataProvider>
    </SessionProvider>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { loadClients, loadTeamMembers } from "@/lib/actions/data-loaders";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BOS Capacity Planner",
  description:
    "Bookkeeping capacity forecasting and management for Back Office Stars",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let initialClients: Awaited<ReturnType<typeof loadClients>> = [];
  let initialTeamMembers: Awaited<ReturnType<typeof loadTeamMembers>> = [];

  try {
    [initialClients, initialTeamMembers] = await Promise.all([
      loadClients(),
      loadTeamMembers(),
    ]);
  } catch {
    // DB not available (e.g. login page, build time) — fall back to empty
  }

  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        <Providers
          initialClients={initialClients}
          initialTeamMembers={initialTeamMembers}
        >
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}

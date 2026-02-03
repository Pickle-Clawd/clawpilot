"use client";

import { DashboardShell } from "./dashboard-shell";

export function AppShell({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}

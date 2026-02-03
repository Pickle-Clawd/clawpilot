/**
 * Layout persistence — file-based via API route.
 *
 * Reads/writes layout to data/helm-config.json via /api/config.
 * Export/Import JSON kept as convenience features.
 */

import type { WidgetLayoutItem } from "./widget-registry";

/* ------------------------------------------------------------------ */
/*  File-based persistence via API                                     */
/* ------------------------------------------------------------------ */

export async function saveLayoutToFile(layout: WidgetLayoutItem[]): Promise<void> {
  try {
    await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ layout }),
    });
  } catch (err) {
    console.warn("[layout-sync] Failed to save layout:", err);
  }
}

export async function loadLayoutFromFile(): Promise<WidgetLayoutItem[] | null> {
  try {
    const res = await fetch("/api/config");
    const data = await res.json();
    if (Array.isArray(data.layout)) {
      return data.layout;
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveEditModeToFile(editMode: boolean): Promise<void> {
  try {
    await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editMode }),
    });
  } catch {
    // silent
  }
}

export async function loadEditModeFromFile(): Promise<boolean> {
  try {
    const res = await fetch("/api/config");
    const data = await res.json();
    return data.editMode ?? false;
  } catch {
    return false;
  }
}

export async function resetConfigFile(): Promise<void> {
  await fetch("/api/config", { method: "DELETE" });
}

/* ------------------------------------------------------------------ */
/*  Export / Import                                                     */
/* ------------------------------------------------------------------ */

export function exportLayout(layout: unknown[]): string {
  return JSON.stringify({ version: 1, layout }, null, 2);
}

export function importLayout(json: string): unknown[] | null {
  try {
    const data = JSON.parse(json);
    if (data.version === 1 && Array.isArray(data.layout)) {
      return data.layout;
    }
    // Also accept raw arrays
    if (Array.isArray(data)) return data;
    return null;
  } catch {
    return null;
  }
}

export function downloadLayout(layout: unknown[]) {
  const json = exportLayout(layout);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "helm-layout.json";
  a.click();
  URL.revokeObjectURL(url);
}

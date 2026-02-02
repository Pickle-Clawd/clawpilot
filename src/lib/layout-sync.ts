/**
 * Layout persistence — tied to gateway identity.
 *
 * Storage layers:
 *   1. localStorage (keyed by gateway URL hash) — fast primary cache
 *   2. Gateway config (helm.layout key) — cross-browser persistence
 *   3. Export/Import JSON — manual fallback
 *
 * The gateway config write triggers a restart, so it's only done
 * on explicit "Save to Gateway" action, not on every drag.
 */

import { createHash } from "./hash";

const LAYOUT_PREFIX = "the-helm-layout-";

/* ------------------------------------------------------------------ */
/*  Local storage (keyed by gateway URL)                               */
/* ------------------------------------------------------------------ */

function storageKey(gatewayUrl: string): string {
  return LAYOUT_PREFIX + createHash(gatewayUrl);
}

export function saveLocalLayout(gatewayUrl: string, layout: unknown[]) {
  localStorage.setItem(storageKey(gatewayUrl), JSON.stringify(layout));
}

export function loadLocalLayout(gatewayUrl: string): unknown[] | null {
  try {
    const raw = localStorage.getItem(storageKey(gatewayUrl));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearLocalLayout(gatewayUrl: string) {
  localStorage.removeItem(storageKey(gatewayUrl));
}

/* ------------------------------------------------------------------ */
/*  Gateway config storage                                             */
/* ------------------------------------------------------------------ */

/**
 * Save layout to the gateway config under `helm.layout`.
 * This triggers a gateway restart! Only call on explicit user action.
 */
export async function saveToGateway(
  send: (method: string, params?: Record<string, unknown>) => Promise<unknown>,
  layout: unknown[]
): Promise<boolean> {
  try {
    await send("config.patch", {
      patch: { helm: { layout } },
    });
    return true;
  } catch (err) {
    console.warn("[layout-sync] Failed to save to gateway:", err);
    return false;
  }
}

/**
 * Load layout from the gateway config.
 * Returns the layout array or null if not found.
 */
export async function loadFromGateway(
  send: (method: string, params?: Record<string, unknown>) => Promise<unknown>
): Promise<unknown[] | null> {
  try {
    const config = (await send("config.get", {})) as Record<string, unknown>;
    const helm = config?.helm as Record<string, unknown> | undefined;
    if (helm?.layout && Array.isArray(helm.layout)) {
      return helm.layout;
    }
    return null;
  } catch {
    return null;
  }
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

/**
 * Layout sync — persists widget layouts to helm-sync service
 * for cross-browser/cross-device access.
 *
 * Flow:
 *   1. localStorage is the primary fast cache (always read/written)
 *   2. On layout change (debounced), push to helm-sync service
 *   3. On first load with empty localStorage, pull from helm-sync
 */

const SYNC_URL_KEY = "the-helm-sync-url";
const SYNC_KEY_KEY = "the-helm-sync-key";
const DEFAULT_SYNC_URL = "https://helm-sync.thepickle.dev";

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

export function getSyncConfig(): { url: string; key: string | null } {
  if (typeof window === "undefined") return { url: DEFAULT_SYNC_URL, key: null };
  return {
    url: localStorage.getItem(SYNC_URL_KEY) || DEFAULT_SYNC_URL,
    key: localStorage.getItem(SYNC_KEY_KEY),
  };
}

export function setSyncKey(key: string) {
  localStorage.setItem(SYNC_KEY_KEY, key);
}

export function setSyncUrl(url: string) {
  localStorage.setItem(SYNC_URL_KEY, url);
}

export function clearSyncConfig() {
  localStorage.removeItem(SYNC_KEY_KEY);
  localStorage.removeItem(SYNC_URL_KEY);
}

export function isSyncEnabled(): boolean {
  return !!getSyncConfig().key;
}

/* ------------------------------------------------------------------ */
/*  Key generation                                                     */
/* ------------------------------------------------------------------ */

export async function generateSyncKey(gatewayUrl: string): Promise<string> {
  const { url } = getSyncConfig();
  const res = await fetch(`${url}/api/key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gatewayUrl }),
  });
  if (!res.ok) throw new Error("Failed to generate sync key");
  const data = await res.json();
  return data.key;
}

/* ------------------------------------------------------------------ */
/*  Push / Pull                                                        */
/* ------------------------------------------------------------------ */

export async function pushLayout(layout: unknown[]): Promise<boolean> {
  const { url, key } = getSyncConfig();
  if (!key) return false;

  try {
    const res = await fetch(`${url}/api/layout/${key}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ layout }),
    });
    return res.ok;
  } catch {
    console.warn("[helm-sync] push failed silently");
    return false;
  }
}

export async function pullLayout(): Promise<unknown[] | null> {
  const { url, key } = getSyncConfig();
  if (!key) return null;

  try {
    const res = await fetch(`${url}/api/layout/${key}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.layout ?? null;
  } catch {
    console.warn("[helm-sync] pull failed silently");
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Debounced push (call on every layout change)                       */
/* ------------------------------------------------------------------ */

export function debouncedPush(layout: unknown[], delayMs = 3000) {
  if (!isSyncEnabled()) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => pushLayout(layout), delayMs);
}

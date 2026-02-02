# MODULE.md — Widget Module System

This document explains how to create custom widgets (modules) for The Helm dashboard. It's designed so an AI coding agent (like Claude Code) or a human developer can create a new widget from scratch in under 5 minutes.

---

## Architecture Overview

```
src/
├── lib/
│   ├── widget-registry.ts    ← Widget type definitions + registry
│   ├── register-widgets.ts   ← All widget registrations (add yours here)
│   └── gateway-context.tsx   ← Gateway data hook (useGateway)
├── components/
│   ├── widgets/              ← Widget components live here
│   │   ├── stats-grid.tsx
│   │   ├── cron-summary.tsx
│   │   ├── active-sessions.tsx
│   │   ├── system-health.tsx
│   │   └── welcome.tsx
│   ├── widget-wrapper.tsx    ← Chrome/frame around each widget
│   ├── widget-grid.tsx       ← Main grid layout engine
│   └── widget-catalog.tsx    ← "Add Widget" picker dialog
```

The homepage (`src/app/page.tsx`) imports `register-widgets.ts` then renders `<WidgetGrid />`. That's it.

---

## Quick Start: Create a Widget in 3 Steps

### Step 1: Create the Component

Create a new file in `src/components/widgets/`. Your component receives no special props — just render your UI. Use `useGateway()` to access live gateway data.

```tsx
// src/components/widgets/my-widget.tsx
"use client";

import { useGateway } from "@/lib/gateway-context";

export function MyWidget() {
  const { sessions, cronJobs, stats, status } = useGateway();

  return (
    <div className="p-4 h-full">
      <p className="text-sm text-muted-foreground">
        {sessions.length} sessions running
      </p>
    </div>
  );
}
```

### Step 2: Register It

Add your widget to `src/lib/register-widgets.ts`:

```tsx
import { registerWidget } from "./widget-registry";
import { Zap } from "lucide-react";  // pick any lucide icon
import { MyWidget } from "@/components/widgets/my-widget";

registerWidget({
  id: "my-widget",                    // unique ID (kebab-case)
  name: "My Widget",                  // display name in catalog
  description: "Does something cool", // shown in the widget picker
  icon: Zap,                          // lucide-react icon component
  category: "monitoring",             // "monitoring" | "data" | "utility" | "custom"
  defaultSize: { w: 12, h: 8 },      // grid units (24 columns, ~30px rows)
  minSize: { w: 6, h: 4 },           // minimum resize dimensions
  component: MyWidget,                // your component
});
```

### Step 3: Done

That's it. Your widget appears in the "Add Widget" catalog, ready to be dragged onto the dashboard.

---

## Widget Component Contract

### Props

Your component receives these props (via `WidgetComponentProps`), but you can ignore them if you don't need them:

```tsx
interface WidgetComponentProps {
  instanceId: string;  // Unique ID for this placed instance
  editMode: boolean;   // Whether the dashboard is in edit mode
}
```

### Layout Rules

- Your component fills the **entire widget body** (below the header bar)
- The header bar (icon, title, drag handle, remove button) is added automatically by `WidgetWrapper`
- Use `h-full` on your root element to fill the available space
- Use `overflow-hidden` or `ScrollArea` for scrollable content
- The widget can be **any size** — design responsively

### Styling

- Use Tailwind CSS classes with **theme tokens** (not hardcoded colors):
  - `bg-card`, `bg-muted`, `text-foreground`, `text-muted-foreground`
  - `border-border`, `bg-primary`, `text-primary`
- Existing card pattern: `border-border/50 bg-card/80 backdrop-blur-sm`
- Item rows: `p-2.5 rounded-lg bg-muted/50`
- The widget wrapper already provides the card frame — don't add another Card inside

### Available UI Components

From `src/components/ui/` (shadcn/ui):

- `Badge` — status labels
- `Button` — actions
- `Card` — sub-cards (if needed)
- `ScrollArea` — scrollable regions
- `Tabs` — tabbed views
- `Tooltip` — hover info
- `Dialog` — modals
- `Progress` — progress bars
- `Select` — dropdowns

---

## Accessing Gateway Data

Use the `useGateway()` hook to access all live data:

```tsx
import { useGateway } from "@/lib/gateway-context";

const {
  status,       // "connected" | "disconnected" | "connecting" | "error"
  stats,        // { activeSessions, totalCronJobs, uptime, connected }
  cronJobs,     // CronJob[] — all cron jobs with schedule, status, last run
  sessions,     // Session[] — active sessions with model, tokens, channel
  rawConfig,    // string — raw gateway config JSON
  config,       // { url, token } — gateway connection info
  send,         // (method, params?) => Promise — send RPC to gateway
  refreshCronJobs,   // () => void — force refresh
  refreshSessions,   // () => void
  refreshStats,      // () => void
  refreshConfig,     // () => void
} = useGateway();
```

### Key Types

```tsx
interface CronJob {
  id: string;
  name: string;
  enabled: boolean;
  schedule: CronSchedule;     // { kind: "cron", expr } | { kind: "every", everyMs } | { kind: "at", atMs }
  sessionTarget: "main" | "isolated";
  payload: CronPayload;       // { kind: "systemEvent", text } | { kind: "agentTurn", message, ... }
  state: {
    lastRunAtMs?: number;
    lastRunStatus?: string;
    nextRunAtMs?: number;
  };
}

interface Session {
  key: string;
  kind?: string;
  channel?: string;
  label?: string;
  model?: string;
  totalTokens?: number;
  contextTokens?: number;
  updatedAt?: number;
}

interface GatewayStats {
  activeSessions: number;
  totalCronJobs: number;
  uptime: number;
  connected: boolean;
}
```

### Sending RPC Commands

Use `send()` to call gateway methods:

```tsx
// List cron jobs
const jobs = await send("cron.list", {});

// Get session history
const history = await send("sessions.history", { sessionKey: "main", limit: 10 });

// Run a cron job
await send("cron.run", { jobId: "some-job-id" });
```

---

## Grid System

The dashboard uses a **24-column grid** with ~30px row height:

| Size | Columns | Rough Width | Good For |
|------|---------|-------------|----------|
| Small | 6 | ¼ page | Single stat, icon |
| Medium | 12 | ½ page | Lists, charts |
| Large | 18 | ¾ page | Wide tables |
| Full | 24 | Full width | Dashboards, timelines |

Row heights:
- `h: 4` ≈ 120px — compact stat
- `h: 6` ≈ 180px — card with a few items
- `h: 8` ≈ 240px — medium content
- `h: 10` ≈ 300px — scrollable list
- `h: 14` ≈ 420px — large panel

### Size Tips

- `defaultSize` — what the widget starts at when added
- `minSize` — smallest it can be resized to
- `maxSize` — (optional) largest it can grow
- Design for the `minSize` first, then make it look better at larger sizes

---

## Widget Categories

| Category | Description | Examples |
|----------|-------------|---------|
| `"monitoring"` | Real-time status & metrics | Health, stats, connection |
| `"data"` | Lists & data views | Cron jobs, sessions, logs |
| `"utility"` | Tools & helpers | Welcome, notes, clock |
| `"custom"` | User-created widgets | Anything else |

---

## Example: Full Widget

Here's a complete example — a "Token Usage" widget showing per-session token consumption:

```tsx
// src/components/widgets/token-usage.tsx
"use client";

import { useGateway } from "@/lib/gateway-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export function TokenUsageWidget() {
  const { sessions } = useGateway();

  const sorted = [...sessions]
    .filter((s) => s.totalTokens && s.totalTokens > 0)
    .sort((a, b) => (b.totalTokens ?? 0) - (a.totalTokens ?? 0));

  const total = sorted.reduce((sum, s) => sum + (s.totalTokens ?? 0), 0);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-1 pb-2 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {total.toLocaleString()} total tokens
        </p>
      </div>
      <ScrollArea className="flex-1 px-4 pb-4">
        <div className="space-y-2">
          {sorted.map((session) => {
            const pct = total > 0 ? ((session.totalTokens ?? 0) / total) * 100 : 0;
            return (
              <div
                key={session.key}
                className="p-2.5 rounded-lg bg-muted/50 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">
                    {session.label || session.key.split(":").pop()}
                  </p>
                  <Badge variant="outline" className="text-xs font-mono">
                    {(session.totalTokens ?? 0).toLocaleString()}
                  </Badge>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
```

Register it:

```tsx
// In src/lib/register-widgets.ts
import { Coins } from "lucide-react";
import { TokenUsageWidget } from "@/components/widgets/token-usage";

registerWidget({
  id: "token-usage",
  name: "Token Usage",
  description: "Token consumption breakdown by session",
  icon: Coins,
  category: "monitoring",
  defaultSize: { w: 12, h: 10 },
  minSize: { w: 6, h: 6 },
  component: TokenUsageWidget,
});
```

---

## Tech Stack Reference

- **Framework**: Next.js 16 (App Router)
- **React**: 19
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix primitives)
- **Icons**: lucide-react
- **Grid**: react-grid-layout v2
- **Charts**: recharts (already installed)
- **Theme**: CSS variables — see `src/app/globals.css` and `public/themes/`

---

## Checklist for New Widgets

- [ ] Create component in `src/components/widgets/`
- [ ] Add `"use client"` directive at top
- [ ] Use `useGateway()` for data (if needed)
- [ ] Use theme tokens for colors (no hardcoded values)
- [ ] Root element has `h-full` for proper sizing
- [ ] Scrollable content uses `ScrollArea`
- [ ] Register in `src/lib/register-widgets.ts`
- [ ] Pick a unique `id` (kebab-case)
- [ ] Set sensible `defaultSize` and `minSize`
- [ ] Pick an appropriate `category`
- [ ] Test at minimum size to ensure it doesn't break

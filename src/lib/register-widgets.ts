import { registerWidget } from "./widget-registry";
import {
  Activity,
  Clock,
  Heart,
  LayoutGrid,
  MessageSquare,
  Wifi,
} from "lucide-react";

import { ActiveSessionsStatWidget } from "@/components/widgets/active-sessions-stat";
import { CronJobsStatWidget } from "@/components/widgets/cron-jobs-stat";
import { UptimeStatWidget } from "@/components/widgets/uptime-stat";
import { ConnectionStatWidget } from "@/components/widgets/connection-stat";
import { CronSummaryWidget } from "@/components/widgets/cron-summary";
import { ActiveSessionsWidget } from "@/components/widgets/active-sessions";
import { SystemHealthWidget } from "@/components/widgets/system-health";
import { WelcomeWidget } from "@/components/widgets/welcome";

/* ------------------------------------------------------------------ */
/*  Built-in widgets                                                   */
/* ------------------------------------------------------------------ */

registerWidget({
  id: "active-sessions-stat",
  name: "Active Sessions",
  description: "Live count of active sessions",
  icon: MessageSquare,
  category: "monitoring",
  defaultSize: { w: 6, h: 4 },
  minSize: { w: 4, h: 3 },
  component: ActiveSessionsStatWidget,
});

registerWidget({
  id: "cron-jobs-stat",
  name: "Cron Jobs Count",
  description: "Total and enabled cron job count",
  icon: Clock,
  category: "monitoring",
  defaultSize: { w: 6, h: 4 },
  minSize: { w: 4, h: 3 },
  component: CronJobsStatWidget,
});

registerWidget({
  id: "uptime-stat",
  name: "Uptime",
  description: "Gateway uptime since last restart",
  icon: Activity,
  category: "monitoring",
  defaultSize: { w: 6, h: 4 },
  minSize: { w: 4, h: 3 },
  component: UptimeStatWidget,
});

registerWidget({
  id: "connection-stat",
  name: "Connection",
  description: "Gateway connection status indicator",
  icon: Wifi,
  category: "monitoring",
  defaultSize: { w: 6, h: 4 },
  minSize: { w: 4, h: 3 },
  component: ConnectionStatWidget,
});

registerWidget({
  id: "cron-summary",
  name: "Cron Jobs",
  description: "Scrollable list of all scheduled tasks with status",
  icon: Clock,
  category: "data",
  defaultSize: { w: 12, h: 10 },
  minSize: { w: 6, h: 6 },
  component: CronSummaryWidget,
});

registerWidget({
  id: "active-sessions",
  name: "Active Sessions",
  description: "Live view of running conversations and their models",
  icon: MessageSquare,
  category: "data",
  defaultSize: { w: 12, h: 10 },
  minSize: { w: 6, h: 6 },
  component: ActiveSessionsWidget,
});

registerWidget({
  id: "system-health",
  name: "System Health",
  description: "Gateway status, session count, cron health, uptime",
  icon: Heart,
  category: "monitoring",
  defaultSize: { w: 12, h: 5 },
  minSize: { w: 6, h: 4 },
  component: SystemHealthWidget,
});

registerWidget({
  id: "welcome",
  name: "Welcome",
  description: "Getting started guide for your dashboard",
  icon: LayoutGrid,
  category: "utility",
  defaultSize: { w: 12, h: 8 },
  minSize: { w: 8, h: 6 },
  component: WelcomeWidget,
});

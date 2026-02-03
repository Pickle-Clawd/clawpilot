"use client";

import { useGateway } from "@/lib/gateway-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

function formatMs(ms?: number): string {
  if (!ms) return "—";
  try {
    return new Date(ms).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export function CronSummaryWidget() {
  const { cronJobs } = useGateway();

  return (
    <div className="flex flex-col h-full">
      <div className="px-[clamp(0.75rem,2cqw,1rem)] pt-1 pb-[clamp(0.25rem,0.8cqw,0.5rem)]">
        <p className="text-[clamp(0.6rem,1.4cqw,0.75rem)] text-muted-foreground">
          {cronJobs.filter((j) => j.enabled).length}/{cronJobs.length} enabled
        </p>
      </div>
      <ScrollArea className="flex-1 px-[clamp(0.75rem,2cqw,1rem)] pb-[clamp(0.75rem,2cqw,1rem)]">
        {cronJobs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-[clamp(0.7rem,1.8cqw,0.875rem)]">
            No cron jobs configured
          </div>
        ) : (
          <div className="space-y-[clamp(0.375rem,1cqw,0.5rem)]">
            {cronJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between p-[clamp(0.375rem,1.2cqw,0.625rem)] rounded-lg bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[clamp(0.7rem,1.8cqw,0.875rem)] truncate">
                    {job.name || job.id}
                  </p>
                  <p className="text-[clamp(0.6rem,1.4cqw,0.75rem)] text-muted-foreground mt-0.5">
                    {job.schedule?.kind === "cron"
                      ? job.schedule.expr
                      : job.schedule?.kind === "every"
                        ? `every ${Math.round(job.schedule.everyMs / 60000)}m`
                        : (job.schedule?.kind ?? "—")}
                  </p>
                </div>
                <div className="flex items-center gap-[clamp(0.25rem,0.8cqw,0.5rem)] shrink-0 ml-[clamp(0.375rem,1cqw,0.75rem)]">
                  <Badge
                    variant={job.enabled ? "default" : "secondary"}
                    className="text-[clamp(0.55rem,1.2cqw,0.75rem)]"
                  >
                    {job.enabled ? "on" : "off"}
                  </Badge>
                  {job.state?.lastRunAtMs && (
                    <span className="text-[clamp(0.55rem,1.2cqw,0.75rem)] text-muted-foreground whitespace-nowrap">
                      {formatMs(job.state.lastRunAtMs)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

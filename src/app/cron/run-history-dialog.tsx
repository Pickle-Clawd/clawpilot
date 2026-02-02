"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGateway } from "@/lib/gateway-context";
import { formatTimestamp } from "@/lib/cron-utils";
import { Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface RunHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  jobName: string;
}

interface CronRun {
  id?: string;
  startedAtMs?: number;
  finishedAtMs?: number;
  status?: string;
  error?: string;
  durationMs?: number;
}

export function RunHistoryDialog({ open, onOpenChange, jobId, jobName }: RunHistoryDialogProps) {
  const { send } = useGateway();
  const [runs, setRuns] = useState<CronRun[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !jobId) return;
    setLoading(true);
    send("cron.runs", { jobId })
      .then((result) => {
        if (Array.isArray(result)) {
          setRuns(result);
        } else if (result && typeof result === "object" && "runs" in (result as Record<string, unknown>)) {
          setRuns((result as { runs: CronRun[] }).runs);
        } else {
          setRuns([]);
        }
      })
      .catch(() => {
        setRuns([]);
      })
      .finally(() => setLoading(false));
  }, [open, jobId, send]);

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "success":
      case "ok":
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "error":
      case "failed":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "—";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.round(ms / 60_000)}m ${Math.round((ms % 60_000) / 1000)}s`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Run History</DialogTitle>
          <DialogDescription>{jobName}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : runs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No run history available
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {runs.map((run, i) => (
                <div
                  key={run.id || i}
                  className="flex items-center gap-3 rounded-lg border p-3 text-sm"
                >
                  {getStatusIcon(run.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {formatTimestamp(run.startedAtMs)}
                      </span>
                      <Badge
                        variant="outline"
                        className={
                          run.status === "success" || run.status === "ok"
                            ? "bg-success/15 text-success border-success/25"
                            : run.status === "error" || run.status === "failed"
                              ? "bg-destructive/15 text-destructive border-destructive/25"
                              : ""
                        }
                      >
                        {run.status || "unknown"}
                      </Badge>
                    </div>
                    {run.error && (
                      <p className="text-xs text-destructive mt-1 truncate">{run.error}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDuration(run.durationMs ?? (run.finishedAtMs && run.startedAtMs ? run.finishedAtMs - run.startedAtMs : undefined))}
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}

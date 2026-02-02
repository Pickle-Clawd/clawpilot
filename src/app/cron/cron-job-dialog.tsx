"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useGateway } from "@/lib/gateway-context";
import { parseIntervalToMs, formatMsToInterval } from "@/lib/cron-utils";
import type { CronJob, CronSchedule, CronPayload } from "@/lib/gateway-types";

interface CronJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: CronJob | null; // null = create, CronJob = edit
  mode: "create" | "edit" | "duplicate";
}

function getScheduleKind(schedule?: CronSchedule): string {
  if (!schedule) return "cron";
  return schedule.kind === "at" ? "at" : schedule.kind === "every" ? "every" : "cron";
}

export function CronJobDialog({ open, onOpenChange, job, mode }: CronJobDialogProps) {
  const { send, refreshCronJobs } = useGateway();
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scheduleKind, setScheduleKind] = useState<"cron" | "every" | "at">("cron");
  const [cronExpr, setCronExpr] = useState("0 * * * *");
  const [cronTz, setCronTz] = useState("");
  const [intervalInput, setIntervalInput] = useState("30m");
  const [oneShotDate, setOneShotDate] = useState("");
  const [payloadKind, setPayloadKind] = useState<"systemEvent" | "agentTurn">("agentTurn");
  const [payloadText, setPayloadText] = useState("");
  const [payloadModel, setPayloadModel] = useState("");
  const [payloadThinking, setPayloadThinking] = useState("");
  const [payloadTimeout, setPayloadTimeout] = useState("");
  const [payloadDeliver, setPayloadDeliver] = useState(false);
  const [payloadChannel, setPayloadChannel] = useState("");
  const [payloadTo, setPayloadTo] = useState("");
  const [sessionTarget, setSessionTarget] = useState<"main" | "isolated">("main");
  const [wakeMode, setWakeMode] = useState<"next-heartbeat" | "now">("now");
  const [enabled, setEnabled] = useState(true);
  const [deleteAfterRun, setDeleteAfterRun] = useState(false);

  // Populate form when job changes
  useEffect(() => {
    if (!open) return;
    if (job) {
      setName(mode === "duplicate" ? `${job.name} (copy)` : job.name || "");
      setDescription(job.description || "");
      setScheduleKind(getScheduleKind(job.schedule) as "cron" | "every" | "at");
      if (job.schedule.kind === "cron") {
        setCronExpr(job.schedule.expr);
        setCronTz(job.schedule.tz || "");
      } else if (job.schedule.kind === "every") {
        setIntervalInput(formatMsToInterval(job.schedule.everyMs));
      } else if (job.schedule.kind === "at") {
        setOneShotDate(new Date(job.schedule.atMs).toISOString().slice(0, 16));
      }
      setPayloadKind(job.payload?.kind || "agentTurn");
      if (job.payload?.kind === "systemEvent") {
        setPayloadText(job.payload.text || "");
      } else if (job.payload?.kind === "agentTurn") {
        setPayloadText(job.payload.message || "");
        setPayloadModel(job.payload.model || "");
        setPayloadThinking(job.payload.thinking || "");
        setPayloadTimeout(job.payload.timeoutSeconds?.toString() || "");
        setPayloadDeliver(job.payload.deliver ?? false);
        setPayloadChannel(job.payload.channel || "");
        setPayloadTo(job.payload.to || "");
      }
      setSessionTarget(job.sessionTarget || "main");
      setWakeMode(job.wakeMode || "now");
      setEnabled(mode === "duplicate" ? true : job.enabled);
      setDeleteAfterRun(job.deleteAfterRun ?? false);
    } else {
      // Reset for create
      setName("");
      setDescription("");
      setScheduleKind("cron");
      setCronExpr("0 * * * *");
      setCronTz("");
      setIntervalInput("30m");
      setOneShotDate("");
      setPayloadKind("agentTurn");
      setPayloadText("");
      setPayloadModel("");
      setPayloadThinking("");
      setPayloadTimeout("");
      setPayloadDeliver(false);
      setPayloadChannel("");
      setPayloadTo("");
      setSessionTarget("main");
      setWakeMode("now");
      setEnabled(true);
      setDeleteAfterRun(false);
    }
  }, [open, job, mode]);

  const buildSchedule = (): CronSchedule | null => {
    switch (scheduleKind) {
      case "cron":
        if (!cronExpr.trim()) {
          toast.error("Cron expression is required");
          return null;
        }
        return { kind: "cron", expr: cronExpr.trim(), ...(cronTz ? { tz: cronTz } : {}) } as CronSchedule;
      case "every": {
        const ms = parseIntervalToMs(intervalInput);
        if (!ms || ms <= 0) {
          toast.error("Invalid interval. Use formats like 30m, 2h, 1d");
          return null;
        }
        return { kind: "every", everyMs: ms };
      }
      case "at": {
        const dt = new Date(oneShotDate);
        if (isNaN(dt.getTime())) {
          toast.error("Invalid date/time for one-shot schedule");
          return null;
        }
        return { kind: "at", atMs: dt.getTime() };
      }
      default:
        return null;
    }
  };

  const buildPayload = (): CronPayload => {
    if (payloadKind === "systemEvent") {
      return { kind: "systemEvent", text: payloadText };
    }
    const p: CronPayload = { kind: "agentTurn", message: payloadText };
    if (payloadModel) (p as Record<string, unknown>).model = payloadModel;
    if (payloadThinking) (p as Record<string, unknown>).thinking = payloadThinking;
    if (payloadTimeout) (p as Record<string, unknown>).timeoutSeconds = parseInt(payloadTimeout);
    if (payloadDeliver) (p as Record<string, unknown>).deliver = true;
    if (payloadChannel) (p as Record<string, unknown>).channel = payloadChannel;
    if (payloadTo) (p as Record<string, unknown>).to = payloadTo;
    return p;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Job name is required");
      return;
    }
    const schedule = buildSchedule();
    if (!schedule) return;
    if (!payloadText.trim()) {
      toast.error("Payload text is required");
      return;
    }

    setSaving(true);
    try {
      const payload = buildPayload();
      if (mode === "edit" && job) {
        await send("cron.update", {
          jobId: job.id,
          patch: {
            name: name.trim(),
            description: description.trim() || undefined,
            schedule,
            payload,
            sessionTarget,
            wakeMode,
            enabled,
            deleteAfterRun,
          },
        });
        toast.success(`Updated "${name}"`);
      } else {
        await send("cron.add", {
          name: name.trim(),
          description: description.trim() || undefined,
          schedule,
          payload,
          sessionTarget,
          wakeMode,
          enabled,
          deleteAfterRun,
        });
        toast.success(`Created "${name}"`);
      }
      refreshCronJobs();
      onOpenChange(false);
    } catch (e) {
      toast.error(`Failed to save: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const title = mode === "edit" ? "Edit Job" : mode === "duplicate" ? "Duplicate Job" : "Create Job";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Modify the cron job configuration."
              : "Configure a new scheduled job."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Name & Description */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="job-name">Name *</Label>
              <Input
                id="job-name"
                placeholder="e.g. Daily health check"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="job-desc">Description</Label>
              <Input
                id="job-desc"
                placeholder="Optional description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* Schedule */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Schedule</Label>
            <Tabs value={scheduleKind} onValueChange={(v) => setScheduleKind(v as "cron" | "every" | "at")}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="cron">Cron</TabsTrigger>
                <TabsTrigger value="every">Interval</TabsTrigger>
                <TabsTrigger value="at">One-shot</TabsTrigger>
              </TabsList>
              <TabsContent value="cron" className="space-y-3 mt-3">
                <div className="grid gap-2">
                  <Label htmlFor="cron-expr">Cron Expression *</Label>
                  <Input
                    id="cron-expr"
                    placeholder="0 */6 * * *"
                    value={cronExpr}
                    onChange={(e) => setCronExpr(e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: minute hour day-of-month month day-of-week
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cron-tz">Timezone</Label>
                  <Input
                    id="cron-tz"
                    placeholder="e.g. America/Los_Angeles"
                    value={cronTz}
                    onChange={(e) => setCronTz(e.target.value)}
                  />
                </div>
              </TabsContent>
              <TabsContent value="every" className="space-y-3 mt-3">
                <div className="grid gap-2">
                  <Label htmlFor="interval">Interval *</Label>
                  <Input
                    id="interval"
                    placeholder="e.g. 30m, 2h, 1d"
                    value={intervalInput}
                    onChange={(e) => setIntervalInput(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports: 30s, 5m, 2h, 1d
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="at" className="space-y-3 mt-3">
                <div className="grid gap-2">
                  <Label htmlFor="one-shot">Date & Time *</Label>
                  <Input
                    id="one-shot"
                    type="datetime-local"
                    value={oneShotDate}
                    onChange={(e) => setOneShotDate(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={deleteAfterRun} onCheckedChange={setDeleteAfterRun} />
                  <Label>Delete after run</Label>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <Separator />

          {/* Payload */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Payload</Label>
            <div className="grid gap-3">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={payloadKind} onValueChange={(v) => setPayloadKind(v as "systemEvent" | "agentTurn")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agentTurn">Agent Turn</SelectItem>
                    <SelectItem value="systemEvent">System Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="payload-text">
                  {payloadKind === "agentTurn" ? "Message *" : "Event Text *"}
                </Label>
                <Textarea
                  id="payload-text"
                  placeholder={
                    payloadKind === "agentTurn"
                      ? "Message to send to the agent..."
                      : "System event text..."
                  }
                  value={payloadText}
                  onChange={(e) => setPayloadText(e.target.value)}
                  rows={3}
                />
              </div>

              {payloadKind === "agentTurn" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="payload-model">Model</Label>
                    <Input
                      id="payload-model"
                      placeholder="Optional override"
                      value={payloadModel}
                      onChange={(e) => setPayloadModel(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="payload-thinking">Thinking</Label>
                    <Input
                      id="payload-thinking"
                      placeholder="e.g. low, medium, high"
                      value={payloadThinking}
                      onChange={(e) => setPayloadThinking(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="payload-timeout">Timeout (seconds)</Label>
                    <Input
                      id="payload-timeout"
                      type="number"
                      placeholder="300"
                      value={payloadTimeout}
                      onChange={(e) => setPayloadTimeout(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="payload-channel">Channel</Label>
                    <Input
                      id="payload-channel"
                      placeholder="e.g. discord"
                      value={payloadChannel}
                      onChange={(e) => setPayloadChannel(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="payload-to">To</Label>
                    <Input
                      id="payload-to"
                      placeholder="Target user/channel"
                      value={payloadTo}
                      onChange={(e) => setPayloadTo(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2 self-end pb-2">
                    <Switch checked={payloadDeliver} onCheckedChange={setPayloadDeliver} />
                    <Label>Deliver response</Label>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Session & Wake */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Session Target</Label>
              <Select value={sessionTarget} onValueChange={(v) => setSessionTarget(v as "main" | "isolated")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Main</SelectItem>
                  <SelectItem value="isolated">Isolated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Wake Mode</Label>
              <Select value={wakeMode} onValueChange={(v) => setWakeMode(v as "next-heartbeat" | "now")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="now">Now</SelectItem>
                  <SelectItem value="next-heartbeat">Next Heartbeat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Enabled toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="font-medium">Enabled</Label>
              <p className="text-xs text-muted-foreground">Job will run on schedule when enabled</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Job"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

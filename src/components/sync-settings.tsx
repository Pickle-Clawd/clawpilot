"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getSyncConfig,
  setSyncKey,
  generateSyncKey,
  clearSyncConfig,
  isSyncEnabled,
  pushLayout,
  pullLayout,
} from "@/lib/layout-sync";
import { loadLayout, saveLayout, type WidgetLayoutItem } from "@/lib/widget-registry";
import { Cloud, CloudOff, RefreshCw, Trash2, Upload, Download } from "lucide-react";

interface SyncSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gatewayUrl: string | null;
  onLayoutRestored: (items: WidgetLayoutItem[]) => void;
}

export function SyncSettings({
  open,
  onOpenChange,
  gatewayUrl,
  onLayoutRestored,
}: SyncSettingsProps) {
  const [synced, setSynced] = useState(false);
  const [syncKey, setSyncKeyState] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    const { key } = getSyncConfig();
    setSyncKeyState(key);
    setSynced(!!key);
  }, [open]);

  const handleEnable = useCallback(async () => {
    if (!gatewayUrl) return;
    setLoading(true);
    setStatus(null);
    try {
      const key = await generateSyncKey(gatewayUrl);
      setSyncKey(key);
      setSyncKeyState(key);
      setSynced(true);

      // Push current layout immediately
      const layout = loadLayout();
      if (layout && layout.length > 0) {
        await pushLayout(layout);
        setStatus("Sync enabled & layout uploaded!");
      } else {
        setStatus("Sync enabled!");
      }
    } catch {
      setStatus("Failed to enable sync");
    } finally {
      setLoading(false);
    }
  }, [gatewayUrl]);

  const handleDisable = useCallback(() => {
    clearSyncConfig();
    setSyncKeyState(null);
    setSynced(false);
    setStatus("Sync disabled");
  }, []);

  const handlePush = useCallback(async () => {
    setLoading(true);
    setStatus(null);
    try {
      const layout = loadLayout();
      if (!layout || layout.length === 0) {
        setStatus("No layout to push");
        return;
      }
      const ok = await pushLayout(layout);
      setStatus(ok ? "Layout pushed to cloud!" : "Push failed");
    } catch {
      setStatus("Push failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePull = useCallback(async () => {
    setLoading(true);
    setStatus(null);
    try {
      const remote = await pullLayout();
      if (!remote || !Array.isArray(remote) || remote.length === 0) {
        setStatus("No remote layout found");
        return;
      }
      const items = remote as WidgetLayoutItem[];
      saveLayout(items);
      onLayoutRestored(items);
      setStatus(`Restored ${items.length} widgets from cloud!`);
    } catch {
      setStatus("Pull failed");
    } finally {
      setLoading(false);
    }
  }, [onLayoutRestored]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {synced ? (
              <Cloud className="w-5 h-5 text-success" />
            ) : (
              <CloudOff className="w-5 h-5 text-muted-foreground" />
            )}
            Layout Sync
          </DialogTitle>
          <DialogDescription>
            Sync your dashboard layout across browsers and devices
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant={synced ? "default" : "secondary"}>
              {synced ? "Enabled" : "Disabled"}
            </Badge>
          </div>

          {syncKey && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Sync Key</span>
              <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                {syncKey}
              </code>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            {!synced ? (
              <Button
                className="w-full gap-2"
                onClick={handleEnable}
                disabled={loading || !gatewayUrl}
              >
                <Cloud className="w-4 h-4" />
                {loading ? "Enabling..." : "Enable Cloud Sync"}
              </Button>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={handlePush}
                    disabled={loading}
                  >
                    <Upload className="w-4 h-4" />
                    Push
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={handlePull}
                    disabled={loading}
                  >
                    <Download className="w-4 h-4" />
                    Pull
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full gap-1.5 text-destructive hover:text-destructive"
                  onClick={handleDisable}
                >
                  <Trash2 className="w-4 h-4" />
                  Disable Sync
                </Button>
              </>
            )}
          </div>

          {/* Status message */}
          {status && (
            <p className="text-xs text-center text-muted-foreground">{status}</p>
          )}

          <p className="text-xs text-muted-foreground">
            Layouts are synced to{" "}
            <code className="text-xs">helm-sync.thepickle.dev</code>. Your
            layout is keyed to your gateway URL so it follows you across
            browsers.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

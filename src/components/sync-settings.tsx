"use client";

import { useCallback, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  saveToGateway,
  loadFromGateway,
  downloadLayout,
  importLayout,
} from "@/lib/layout-sync";
import { saveLayout, type WidgetLayoutItem } from "@/lib/widget-registry";
import {
  Download,
  Upload,
  Save,
  FolderDown,
  AlertTriangle,
} from "lucide-react";

interface SyncSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: WidgetLayoutItem[];
  send: (method: string, params?: Record<string, unknown>) => Promise<unknown>;
  onLayoutRestored: (items: WidgetLayoutItem[]) => void;
}

export function SyncSettings({
  open,
  onOpenChange,
  items,
  send,
  onLayoutRestored,
}: SyncSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSaveToGateway = useCallback(async () => {
    if (items.length === 0) {
      setStatus("No layout to save");
      return;
    }
    setLoading(true);
    setStatus(null);
    const ok = await saveToGateway(send, items);
    setStatus(
      ok
        ? "Layout saved to gateway! (Gateway will restart briefly)"
        : "Failed to save — your gateway may not support this yet"
    );
    setLoading(false);
  }, [items, send]);

  const handleLoadFromGateway = useCallback(async () => {
    setLoading(true);
    setStatus(null);
    const remote = await loadFromGateway(send);
    if (remote && Array.isArray(remote) && remote.length > 0) {
      const restored = remote as WidgetLayoutItem[];
      saveLayout(restored);
      onLayoutRestored(restored);
      setStatus(`Restored ${restored.length} widgets from gateway!`);
    } else {
      setStatus("No saved layout found on gateway");
    }
    setLoading(false);
  }, [send, onLayoutRestored]);

  const handleExport = useCallback(() => {
    if (items.length === 0) {
      setStatus("No layout to export");
      return;
    }
    downloadLayout(items);
    setStatus("Layout downloaded!");
  }, [items]);

  const handleImport = useCallback(() => {
    fileRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        const layout = importLayout(text);
        if (layout) {
          const restored = layout as WidgetLayoutItem[];
          saveLayout(restored);
          onLayoutRestored(restored);
          setStatus(`Imported ${restored.length} widgets!`);
        } else {
          setStatus("Invalid layout file");
        }
      };
      reader.readAsText(file);
      // Reset input so same file can be imported again
      e.target.value = "";
    },
    [onLayoutRestored]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Layout Settings</DialogTitle>
          <DialogDescription>
            Save, restore, or transfer your dashboard layout
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Gateway sync */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Gateway Storage</h3>
            <p className="text-xs text-muted-foreground">
              Save your layout to the gateway so it persists across browsers.
              This will briefly restart the gateway.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleSaveToGateway}
                disabled={loading || items.length === 0}
              >
                <Save className="w-4 h-4" />
                Save to Gateway
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleLoadFromGateway}
                disabled={loading}
              >
                <FolderDown className="w-4 h-4" />
                Load from Gateway
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border/50" />

          {/* Export / Import */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Export / Import</h3>
            <p className="text-xs text-muted-foreground">
              Download your layout as a JSON file, or import one.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleExport}
                disabled={items.length === 0}
              >
                <Download className="w-4 h-4" />
                Export JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={handleImport}
              >
                <Upload className="w-4 h-4" />
                Import JSON
              </Button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Status message */}
          {status && (
            <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {status}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

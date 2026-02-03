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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGateway } from "@/lib/gateway-context";
import { Loader2, Save } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { config, status, setConfig } = useGateway();
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    if (open) {
      setUrl(config?.url ?? "ws://localhost:18789");
      setToken(config?.token ?? "");
    }
  }, [open, config]);

  const handleSave = useCallback(() => {
    setConfig({ url: url.trim(), token: token.trim() });
    onOpenChange(false);
  }, [url, token, setConfig, onOpenChange]);

  const isConnecting = status === "connecting";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gateway Settings</DialogTitle>
          <DialogDescription>
            Configure your OpenClaw gateway connection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="settings-url">Gateway URL</Label>
            <Input
              id="settings-url"
              placeholder="ws://100.x.x.x:18789"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-token">Token</Label>
            <Input
              id="settings-token"
              type="password"
              placeholder="Your gateway token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
          <Button
            className="w-full gap-1.5"
            onClick={handleSave}
            disabled={isConnecting || !url.trim()}
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save & Connect
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

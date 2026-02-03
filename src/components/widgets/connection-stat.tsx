"use client";

import { useGateway } from "@/lib/gateway-context";
import { Wifi, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

export function ConnectionStatWidget() {
  const { status } = useGateway();
  const connected = status === "connected";

  return (
    <div className="h-full flex items-center justify-between gap-2 p-4 overflow-hidden">
      <div className="min-w-0 flex flex-col justify-center">
        <p className="text-[clamp(0.65rem,1.8cqw,0.875rem)] font-medium text-muted-foreground truncate">
          Connection
        </p>
        <p className={cn(
          "text-[clamp(1.25rem,5cqw,1.875rem)] font-bold tracking-tight leading-tight",
          connected && "bg-gradient-to-r from-gradient-orange to-gradient-pink bg-clip-text text-transparent"
        )}>
          {connected ? "Online" : "Offline"}
        </p>
        <p className="text-[clamp(0.55rem,1.4cqw,0.75rem)] text-muted-foreground truncate">
          {status}
        </p>
      </div>
      <div className={cn(
        "w-[clamp(1.75rem,6cqw,2.5rem)] h-[clamp(1.75rem,6cqw,2.5rem)] rounded-xl flex items-center justify-center shrink-0",
        connected ? "bg-gradient-to-br from-gradient-orange/20 to-gradient-pink/20" : "bg-muted"
      )}>
        {connected
          ? <Wifi className="w-[clamp(0.875rem,3cqw,1.25rem)] h-[clamp(0.875rem,3cqw,1.25rem)] text-gradient-orange" />
          : <Heart className="w-[clamp(0.875rem,3cqw,1.25rem)] h-[clamp(0.875rem,3cqw,1.25rem)] text-muted-foreground" />
        }
      </div>
    </div>
  );
}

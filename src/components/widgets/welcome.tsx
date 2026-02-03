"use client";

import { LayoutGrid, Plus, Move, Maximize2 } from "lucide-react";

export function WelcomeWidget() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-[clamp(1rem,3cqw,1.5rem)] text-center">
      <div className="w-[clamp(2.5rem,8cqw,4rem)] h-[clamp(2.5rem,8cqw,4rem)] rounded-2xl bg-primary/10 flex items-center justify-center mb-[clamp(0.5rem,2cqw,1rem)]">
        <LayoutGrid className="w-[clamp(1.25rem,4cqw,2rem)] h-[clamp(1.25rem,4cqw,2rem)] text-primary" />
      </div>
      <h3 className="text-[clamp(0.875rem,2.5cqw,1.25rem)] font-semibold mb-[clamp(0.25rem,1cqw,0.5rem)]">Welcome to Your Dashboard</h3>
      <p className="text-[clamp(0.7rem,1.8cqw,0.95rem)] text-muted-foreground max-w-sm mb-[clamp(0.75rem,2.5cqw,1.5rem)]">
        This is your customizable homepage. Add widgets to monitor your gateway
        exactly the way you want.
      </p>
      <div className="grid grid-cols-3 gap-[clamp(0.5rem,2cqw,1rem)] text-[clamp(0.6rem,1.5cqw,0.8rem)] text-muted-foreground">
        <div className="flex flex-col items-center gap-[clamp(0.2rem,0.6cqw,0.375rem)]">
          <Plus className="w-[clamp(0.875rem,2.5cqw,1.25rem)] h-[clamp(0.875rem,2.5cqw,1.25rem)] text-primary" />
          <span>Add widgets</span>
        </div>
        <div className="flex flex-col items-center gap-[clamp(0.2rem,0.6cqw,0.375rem)]">
          <Move className="w-[clamp(0.875rem,2.5cqw,1.25rem)] h-[clamp(0.875rem,2.5cqw,1.25rem)] text-primary" />
          <span>Drag to place</span>
        </div>
        <div className="flex flex-col items-center gap-[clamp(0.2rem,0.6cqw,0.375rem)]">
          <Maximize2 className="w-[clamp(0.875rem,2.5cqw,1.25rem)] h-[clamp(0.875rem,2.5cqw,1.25rem)] text-primary" />
          <span>Resize freely</span>
        </div>
      </div>
    </div>
  );
}

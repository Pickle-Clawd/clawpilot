import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Widget type definitions                                            */
/* ------------------------------------------------------------------ */

export interface WidgetSize {
  w: number;
  h: number;
}

export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  category: "monitoring" | "data" | "utility" | "custom";
  defaultSize: WidgetSize;
  minSize: WidgetSize;
  maxSize?: WidgetSize;
  component: ComponentType<WidgetComponentProps>;
}

export interface WidgetComponentProps {
  /** Unique instance ID for this placed widget */
  instanceId: string;
  /** Whether edit mode is active */
  editMode: boolean;
}

/** Saved layout item */
export interface WidgetLayoutItem {
  /** Unique instance ID (e.g. "cron-summary-abc123") */
  i: string;
  /** Widget definition ID (e.g. "cron-summary") */
  widgetId: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** JSON-based widget definition (future plugin format) */
export interface JsonWidgetConfig {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide icon name
  category: string;
  defaultSize: WidgetSize;
  minSize: WidgetSize;
  /** Data source configuration */
  dataSource: {
    type: "gateway-stats" | "cron-jobs" | "sessions" | "custom-api";
    fields?: string[];
    endpoint?: string;
  };
  /** Display template */
  display: {
    type: "key-value" | "list" | "chart" | "number";
    config: Record<string, unknown>;
  };
}

/* ------------------------------------------------------------------ */
/*  Registry                                                           */
/* ------------------------------------------------------------------ */

const registry = new Map<string, WidgetDefinition>();

export function registerWidget(def: WidgetDefinition) {
  registry.set(def.id, def);
}

export function getWidget(id: string): WidgetDefinition | undefined {
  return registry.get(id);
}

export function getAllWidgets(): WidgetDefinition[] {
  return Array.from(registry.values());
}

export function getWidgetsByCategory(category: string): WidgetDefinition[] {
  return getAllWidgets().filter((w) => w.category === category);
}

export function getCategories(): string[] {
  const cats = new Set(getAllWidgets().map((w) => w.category));
  return Array.from(cats);
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

export function generateInstanceId(widgetId: string): string {
  return `${widgetId}-${Math.random().toString(36).slice(2, 8)}`;
}

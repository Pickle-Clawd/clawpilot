"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ResponsiveGridLayout,
  useContainerWidth,
  verticalCompactor,
  type Layout,
  type LayoutItem,
  type ResponsiveLayouts,
} from "react-grid-layout";
import {
  getWidget,
  generateInstanceId,
  loadLayout,
  saveLayout,
  loadEditMode,
  saveEditMode,
  type WidgetLayoutItem,
} from "@/lib/widget-registry";
import { useGateway } from "@/lib/gateway-context";
import { debouncedPush, isSyncEnabled, pullLayout as pullRemoteLayout } from "@/lib/layout-sync";
import { WidgetWrapper } from "./widget-wrapper";
import { WidgetCatalog } from "./widget-catalog";
import { SyncSettings } from "./sync-settings";
import { Button } from "@/components/ui/button";
import { Lock, Unlock, Plus, RotateCcw, Cloud, CloudOff } from "lucide-react";
import { cn } from "@/lib/utils";

// Import react-grid-layout styles
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const COLS = { lg: 24, md: 18, sm: 12, xs: 6, xxs: 3 };

export function WidgetGrid() {
  const [items, setItems] = useState<WidgetLayoutItem[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { width, containerRef } = useContainerWidth();
  const { config } = useGateway();

  const gatewayUrl = config?.url ?? null;

  // Load saved layout on mount — try localStorage first, fall back to cloud
  useEffect(() => {
    const saved = loadLayout();
    if (saved && saved.length > 0) {
      setItems(saved);
    } else if (isSyncEnabled()) {
      // No local layout — try pulling from cloud
      pullRemoteLayout().then((remote) => {
        if (remote && Array.isArray(remote) && remote.length > 0) {
          const restored = remote as WidgetLayoutItem[];
          setItems(restored);
          saveLayout(restored);
        }
      });
    }
    setEditMode(loadEditMode());
    setMounted(true);
  }, []);

  // Persist layout changes (localStorage + cloud sync)
  const persistItems = useCallback((newItems: WidgetLayoutItem[]) => {
    setItems(newItems);
    saveLayout(newItems);
    debouncedPush(newItems);
  }, []);

  // Convert our items to react-grid-layout format
  const layouts = useMemo((): ResponsiveLayouts => {
    const lg: LayoutItem[] = items.map((item) => {
      const def = getWidget(item.widgetId);
      return {
        i: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        minW: def?.minSize.w ?? 3,
        minH: def?.minSize.h ?? 3,
        maxW: def?.maxSize?.w,
        maxH: def?.maxSize?.h,
        static: !editMode,
      };
    });
    return { lg };
  }, [items, editMode]);

  // Handle layout changes from drag/resize
  const handleLayoutChange = useCallback(
    (layout: Layout) => {
      if (!mounted) return;
      const updated = items.map((item) => {
        const l = layout.find((li) => li.i === item.i);
        if (!l) return item;
        return { ...item, x: l.x, y: l.y, w: l.w, h: l.h };
      });
      persistItems(updated);
    },
    [items, mounted, persistItems]
  );

  // Add a widget
  const addWidget = useCallback(
    (widgetId: string) => {
      const def = getWidget(widgetId);
      if (!def) return;
      const instanceId = generateInstanceId(widgetId);
      const maxY = items.reduce(
        (max, item) => Math.max(max, item.y + item.h),
        0
      );
      const newItem: WidgetLayoutItem = {
        i: instanceId,
        widgetId,
        x: 0,
        y: maxY,
        w: def.defaultSize.w,
        h: def.defaultSize.h,
      };
      persistItems([...items, newItem]);
    },
    [items, persistItems]
  );

  // Remove a widget
  const removeWidget = useCallback(
    (instanceId: string) => {
      persistItems(items.filter((item) => item.i !== instanceId));
    },
    [items, persistItems]
  );

  // Reset layout
  const resetLayout = useCallback(() => {
    persistItems([]);
  }, [persistItems]);

  // Toggle edit mode
  const toggleEditMode = useCallback(() => {
    const next = !editMode;
    setEditMode(next);
    saveEditMode(next);
    if (!next) setCatalogOpen(false);
  }, [editMode]);

  const isEmpty = items.length === 0;

  if (!mounted) return null;

  return (
    <div className="space-y-4" ref={containerRef}>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Home</h1>
          <p className="text-muted-foreground mt-1">
            {editMode
              ? "Drag, resize, and customize your dashboard"
              : "Your personalized command center"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editMode && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCatalogOpen(true)}
                className="gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add Widget
              </Button>
              {items.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetLayout}
                  className="gap-1.5 text-destructive hover:text-destructive"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              )}
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            onClick={() => setSyncOpen(true)}
            title="Layout Sync"
          >
            {isSyncEnabled() ? (
              <Cloud className="w-4 h-4 text-success" />
            ) : (
              <CloudOff className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
          <Button
            variant={editMode ? "default" : "outline"}
            size="sm"
            onClick={toggleEditMode}
            className="gap-1.5"
          >
            {editMode ? (
              <>
                <Unlock className="w-4 h-4" />
                Editing
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Edit
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {isEmpty && !editMode && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Plus className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold mb-2">
            Your dashboard is empty
          </h2>
          <p className="text-muted-foreground max-w-md mb-6">
            Click <strong>Edit</strong> to enter edit mode, then add widgets to
            build your perfect dashboard.
          </p>
          <Button onClick={toggleEditMode} className="gap-1.5">
            <Unlock className="w-4 h-4" />
            Start Customizing
          </Button>
        </div>
      )}

      {isEmpty && editMode && (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border/50 rounded-xl">
          <Plus className="w-10 h-10 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">
            Add your first widget
          </h2>
          <p className="text-muted-foreground text-sm mb-4">
            Click &quot;Add Widget&quot; above to get started
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCatalogOpen(true)}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Browse Widgets
          </Button>
        </div>
      )}

      {/* Widget Grid */}
      {!isEmpty && width > 0 && (
        <div
          className={cn(
            "widget-grid-container",
            editMode && "widget-grid-editing"
          )}
        >
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={BREAKPOINTS}
            cols={COLS}
            rowHeight={30}
            margin={[12, 12] as const}
            containerPadding={[0, 0] as const}
            width={width}
            dragConfig={{
              enabled: editMode,
              handle: ".widget-drag-handle",
              bounded: false,
              threshold: 3,
            }}
            resizeConfig={{
              enabled: editMode,
              handles: ["se"] as const,
            }}
            compactor={verticalCompactor}
            onLayoutChange={handleLayoutChange}
          >
            {items.map((item) => (
              <div key={item.i}>
                <WidgetWrapper
                  instanceId={item.i}
                  widgetId={item.widgetId}
                  editMode={editMode}
                  onRemove={() => removeWidget(item.i)}
                />
              </div>
            ))}
          </ResponsiveGridLayout>
        </div>
      )}

      {/* Widget Catalog Dialog */}
      <WidgetCatalog
        open={catalogOpen}
        onOpenChange={setCatalogOpen}
        onAdd={addWidget}
      />

      {/* Sync Settings Dialog */}
      <SyncSettings
        open={syncOpen}
        onOpenChange={setSyncOpen}
        gatewayUrl={gatewayUrl}
        onLayoutRestored={persistItems}
      />
    </div>
  );
}

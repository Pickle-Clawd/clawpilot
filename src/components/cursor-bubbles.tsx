"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme, type CursorBubbleConfig } from "@/lib/theme-context";

interface CursorBubble {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  drift: number;
  lifetime: number;
}

function resolveColor(template: string, opacity: number): string {
  return template
    .replace("{{opacity}}", opacity.toFixed(3))
    .replace("{{glowOpacity}}", (opacity * 0.5).toFixed(3));
}

let nextId = 0;

export function CursorBubbles() {
  const { currentTheme } = useTheme();
  const config = currentTheme?.ambient?.cursorBubbles;
  const [bubbles, setBubbles] = useState<CursorBubble[]>([]);
  const lastSpawnRef = useRef(0);
  const configRef = useRef(config);
  configRef.current = config;

  const spawnBubble = useCallback((x: number, y: number) => {
    const cfg = configRef.current;
    if (!cfg) return;

    const now = performance.now();
    const minInterval = 1000 / cfg.rate;
    if (now - lastSpawnRef.current < minInterval) return;
    lastSpawnRef.current = now;

    const size = cfg.minSize + Math.random() * (cfg.maxSize - cfg.minSize);
    const opacity = 0.3 + (size - cfg.minSize) / (cfg.maxSize - cfg.minSize) * 0.4;
    const drift = (Math.random() - 0.5) * 2 * cfg.drift;

    const bubble: CursorBubble = {
      id: nextId++,
      x,
      y,
      size,
      opacity,
      drift,
      lifetime: cfg.lifetime,
    };

    setBubbles((prev) => [...prev, bubble]);

    // Remove after lifetime
    setTimeout(() => {
      setBubbles((prev) => prev.filter((b) => b.id !== bubble.id));
    }, cfg.lifetime * 1000);
  }, []);

  useEffect(() => {
    if (!config) return;

    const handleMouseMove = (e: MouseEvent) => {
      spawnBubble(e.clientX, e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [config, spawnBubble]);

  if (!config || bubbles.length === 0) return null;

  return (
    <>
      {bubbles.map((b) => {
        const isBubbleStyle = b.size >= 6;
        const color = resolveColor(config.color, b.opacity);
        const bg = isBubbleStyle
          ? `radial-gradient(circle at 65% 65%, transparent 40%, ${resolveColor(config.color, b.opacity * 0.3)} 70%, ${resolveColor(config.color, b.opacity * 0.6)} 90%, transparent 100%)`
          : color;
        const highlight = isBubbleStyle
          ? `radial-gradient(circle at 30% 25%, rgba(255,255,255,${(b.opacity * 0.7).toFixed(3)}) 0%, rgba(255,255,255,${(b.opacity * 0.15).toFixed(3)}) 30%, transparent 50%)`
          : undefined;
        const shadow = config.glowColor
          ? `0 0 ${b.size}px ${resolveColor(config.glowColor, b.opacity * 0.3)}`
          : undefined;
        const border = isBubbleStyle
          ? `1px solid rgba(255,255,255,${(b.opacity * 0.4).toFixed(3)})`
          : undefined;

        return (
          <div
            key={b.id}
            className="fixed pointer-events-none animate-cursor-bubble"
            style={{
              left: `${b.x}px`,
              top: `${b.y}px`,
              width: `${b.size}px`,
              height: `${b.size}px`,
              borderRadius: "50%",
              background: bg,
              boxShadow: shadow,
              border,
              transform: "translate(-50%, -50%)",
              ["--cursor-drift" as string]: `${b.drift}px`,
              ["--cursor-lifetime" as string]: `${b.lifetime}s`,
            }}
          >
            {highlight && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: highlight,
                }}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

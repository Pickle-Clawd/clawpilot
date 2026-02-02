"use client";

import { useTheme } from "@/lib/theme-context";
import { themes } from "@/lib/themes";

// Pre-generated particle configs to avoid hydration mismatches
const particles = [
  { left: 5, top: 12, size: 3, duration: 12, delay: 0, yOffset: -30 },
  { left: 15, top: 68, size: 5, duration: 16, delay: 2, yOffset: -45 },
  { left: 23, top: 35, size: 2, duration: 9, delay: 5, yOffset: -25 },
  { left: 32, top: 82, size: 4, duration: 14, delay: 1, yOffset: -40 },
  { left: 40, top: 20, size: 6, duration: 18, delay: 7, yOffset: -50 },
  { left: 48, top: 55, size: 3, duration: 11, delay: 3, yOffset: -35 },
  { left: 55, top: 90, size: 2, duration: 8, delay: 9, yOffset: -20 },
  { left: 62, top: 15, size: 5, duration: 15, delay: 4, yOffset: -42 },
  { left: 70, top: 45, size: 4, duration: 13, delay: 6, yOffset: -38 },
  { left: 78, top: 72, size: 3, duration: 17, delay: 2, yOffset: -32 },
  { left: 85, top: 28, size: 6, duration: 10, delay: 8, yOffset: -48 },
  { left: 92, top: 60, size: 2, duration: 19, delay: 1, yOffset: -22 },
  { left: 8, top: 48, size: 4, duration: 12, delay: 5, yOffset: -36 },
  { left: 38, top: 5, size: 3, duration: 20, delay: 3, yOffset: -28 },
  { left: 58, top: 78, size: 5, duration: 14, delay: 7, yOffset: -44 },
  { left: 75, top: 38, size: 2, duration: 9, delay: 0, yOffset: -18 },
  { left: 18, top: 92, size: 4, duration: 16, delay: 4, yOffset: -40 },
  { left: 88, top: 8, size: 3, duration: 11, delay: 6, yOffset: -30 },
];

export function ThemeAmbient() {
  const { theme } = useTheme();
  const currentTheme = themes.find((t) => t.id === theme);

  if (!currentTheme?.hasAmbient) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden
    >
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-particle-float"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: "rgba(255, 107, 74, 0.2)",
            boxShadow: "0 0 6px rgba(255, 107, 74, 0.15)",
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            ["--y-offset" as string]: `${p.yOffset}px`,
          }}
        />
      ))}
    </div>
  );
}

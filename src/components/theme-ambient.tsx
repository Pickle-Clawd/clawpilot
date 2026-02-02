"use client";

import { useTheme } from "@/lib/theme-context";
import { themes } from "@/lib/themes";

// Pre-generated bubble configs — start at bottom, float upward
// Spread across full width, varying sizes for depth illusion
const bubbles = [
  // Small distant bubbles (2-3px)
  { left: 3, size: 2, duration: 18, delay: 0, wobble: 8, opacity: 0.15 },
  { left: 11, size: 3, duration: 22, delay: 4, wobble: -12, opacity: 0.18 },
  { left: 19, size: 2, duration: 16, delay: 8, wobble: 10, opacity: 0.12 },
  { left: 27, size: 3, duration: 20, delay: 2, wobble: -8, opacity: 0.15 },
  { left: 34, size: 2, duration: 24, delay: 11, wobble: 14, opacity: 0.1 },
  { left: 42, size: 3, duration: 17, delay: 6, wobble: -10, opacity: 0.18 },
  { left: 50, size: 2, duration: 21, delay: 14, wobble: 6, opacity: 0.12 },
  { left: 57, size: 3, duration: 19, delay: 1, wobble: -14, opacity: 0.15 },
  { left: 64, size: 2, duration: 23, delay: 9, wobble: 12, opacity: 0.1 },
  { left: 72, size: 3, duration: 15, delay: 5, wobble: -6, opacity: 0.18 },
  { left: 80, size: 2, duration: 25, delay: 13, wobble: 8, opacity: 0.12 },
  { left: 88, size: 3, duration: 18, delay: 3, wobble: -10, opacity: 0.15 },
  { left: 95, size: 2, duration: 20, delay: 7, wobble: 14, opacity: 0.1 },
  // Medium bubbles (4-5px)
  { left: 7, size: 4, duration: 14, delay: 2, wobble: 18, opacity: 0.2 },
  { left: 16, size: 5, duration: 16, delay: 7, wobble: -20, opacity: 0.22 },
  { left: 24, size: 4, duration: 13, delay: 0, wobble: 16, opacity: 0.18 },
  { left: 33, size: 5, duration: 18, delay: 10, wobble: -14, opacity: 0.2 },
  { left: 41, size: 4, duration: 12, delay: 4, wobble: 22, opacity: 0.22 },
  { left: 52, size: 5, duration: 15, delay: 8, wobble: -18, opacity: 0.18 },
  { left: 60, size: 4, duration: 17, delay: 1, wobble: 16, opacity: 0.2 },
  { left: 68, size: 5, duration: 13, delay: 12, wobble: -22, opacity: 0.22 },
  { left: 76, size: 4, duration: 16, delay: 5, wobble: 14, opacity: 0.18 },
  { left: 84, size: 5, duration: 14, delay: 9, wobble: -16, opacity: 0.2 },
  { left: 93, size: 4, duration: 18, delay: 3, wobble: 20, opacity: 0.22 },
  // Large close bubbles (6-8px)
  { left: 10, size: 7, duration: 11, delay: 6, wobble: 25, opacity: 0.25 },
  { left: 22, size: 6, duration: 13, delay: 0, wobble: -28, opacity: 0.22 },
  { left: 37, size: 8, duration: 10, delay: 9, wobble: 22, opacity: 0.28 },
  { left: 48, size: 6, duration: 14, delay: 3, wobble: -25, opacity: 0.2 },
  { left: 56, size: 7, duration: 11, delay: 11, wobble: 30, opacity: 0.25 },
  { left: 67, size: 8, duration: 12, delay: 2, wobble: -22, opacity: 0.28 },
  { left: 79, size: 6, duration: 13, delay: 7, wobble: 28, opacity: 0.22 },
  { left: 90, size: 7, duration: 10, delay: 5, wobble: -30, opacity: 0.25 },
  // Extra scattered small bubbles for density
  { left: 2, size: 2, duration: 26, delay: 15, wobble: 6, opacity: 0.08 },
  { left: 14, size: 3, duration: 22, delay: 12, wobble: -8, opacity: 0.1 },
  { left: 29, size: 2, duration: 28, delay: 16, wobble: 10, opacity: 0.08 },
  { left: 45, size: 3, duration: 24, delay: 10, wobble: -6, opacity: 0.1 },
  { left: 61, size: 2, duration: 26, delay: 18, wobble: 8, opacity: 0.08 },
  { left: 74, size: 3, duration: 22, delay: 14, wobble: -10, opacity: 0.1 },
  { left: 86, size: 2, duration: 28, delay: 17, wobble: 6, opacity: 0.08 },
  { left: 97, size: 3, duration: 24, delay: 11, wobble: -8, opacity: 0.1 },
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
      {bubbles.map((b, i) => (
        <div
          key={i}
          className="absolute animate-bubble-rise"
          style={{
            left: `${b.left}%`,
            bottom: `-${b.size + 10}px`,
            width: `${b.size}px`,
            height: `${b.size}px`,
            borderRadius: "50%",
            background: `radial-gradient(circle at 35% 35%, rgba(255, 140, 100, ${b.opacity * 1.5}), rgba(255, 107, 74, ${b.opacity}))`,
            boxShadow: `0 0 ${b.size * 2}px rgba(255, 107, 74, ${b.opacity * 0.5}), inset 0 0 ${b.size}px rgba(255, 255, 255, ${b.opacity * 0.3})`,
            animationDuration: `${b.duration}s`,
            animationDelay: `${b.delay}s`,
            ["--rise-distance" as string]: `-${110 + (b.size * 5)}vh`,
            ["--wobble" as string]: `${b.wobble}px`,
            ["--bubble-opacity" as string]: `${b.opacity}`,
          }}
        />
      ))}
    </div>
  );
}

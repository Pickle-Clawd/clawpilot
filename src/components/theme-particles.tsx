"use client";

import { useMemo } from "react";
import { useTheme, type ParticleConfig } from "@/lib/theme-context";

/* ------------------------------------------------------------------ */
/*  Deterministic pseudo-random (seeded by index) — no hydration       */
/*  mismatch since values are computed the same on server & client.    */
/* ------------------------------------------------------------------ */

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface Particle {
  left: number;       // % from left
  size: number;       // px
  duration: number;   // seconds
  delay: number;      // seconds
  wobble: number;     // px (positive or negative)
  opacity: number;    // 0-1 base opacity
}

function generateParticles(config: ParticleConfig): Particle[] {
  const particles: Particle[] = [];
  const rand = seededRandom(42);

  for (let i = 0; i < config.count; i++) {
    const r = seededRandom(42 + i * 137);
    const size = config.minSize + r() * (config.maxSize - config.minSize);
    const duration = config.minDuration + r() * (config.maxDuration - config.minDuration);

    // Opacity scales with size: bigger = more opaque
    const sizeRatio = (size - config.minSize) / (config.maxSize - config.minSize || 1);
    const minOpacity = config.minOpacity ?? 0.08;
    const maxOpacity = config.maxOpacity ?? 0.28;
    const opacity = minOpacity + sizeRatio * (maxOpacity - minOpacity);

    const maxWobble = config.maxWobble ?? 30;

    particles.push({
      left: rand() * 100,
      size: Math.round(size * 10) / 10,
      duration: Math.round(duration * 10) / 10,
      delay: Math.round(r() * 20 * 10) / 10,
      wobble: Math.round((r() * 2 - 1) * maxWobble * 10) / 10,
      opacity: Math.round(opacity * 1000) / 1000,
    });
  }

  return particles;
}

function resolveColor(template: string, opacity: number): string {
  return template
    .replace("{{opacity}}", opacity.toFixed(3))
    .replace("{{glowOpacity}}", (opacity * 0.5).toFixed(3))
    .replace("{{highlightOpacity}}", (opacity * 1.5).toFixed(3));
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ThemeParticles() {
  const { currentTheme } = useTheme();
  const config = currentTheme?.ambient?.particles;

  const particles = useMemo(() => {
    if (!config) return [];
    return generateParticles(config);
  }, [config]);

  if (!config || particles.length === 0) return null;

  return (
    <>
      {particles.map((p, i) => {
        const isBubbleStyle = p.size >= 6;
        const baseColor = resolveColor(config.color, p.opacity);

        const bg = isBubbleStyle
          ? `radial-gradient(circle at 65% 65%, transparent 40%, ${resolveColor(config.color, p.opacity * 0.3)} 70%, ${resolveColor(config.color, p.opacity * 0.6)} 90%, transparent 100%)`
          : config.highlightColor
            ? `radial-gradient(circle at 35% 35%, ${resolveColor(config.highlightColor, p.opacity)}, ${resolveColor(config.color, p.opacity)})`
            : baseColor;

        const highlight = isBubbleStyle
          ? `radial-gradient(circle at 30% 25%, rgba(255,255,255,${(p.opacity * 0.7).toFixed(3)}) 0%, rgba(255,255,255,${(p.opacity * 0.15).toFixed(3)}) 30%, transparent 50%)`
          : undefined;

        const shadow = config.glow && config.glowColor
          ? isBubbleStyle
            ? `0 0 ${p.size}px ${resolveColor(config.glowColor, p.opacity * 0.3)}, inset 0 0 ${p.size * 0.4}px rgba(255,255,255,${(p.opacity * 0.1).toFixed(3)})`
            : `0 0 ${p.size * 2}px ${resolveColor(config.glowColor, p.opacity)}, inset 0 0 ${p.size}px rgba(255,255,255,${(p.opacity * 0.3).toFixed(3)})`
          : undefined;

        const border = isBubbleStyle
          ? `1px solid rgba(255,255,255,${(p.opacity * 0.4).toFixed(3)})`
          : undefined;

        const riseDistance = config.direction === "up"
          ? `-${110 + p.size * 5}vh`
          : config.direction === "down"
          ? `${110 + p.size * 5}vh`
          : "0";

        return (
          <div
            key={i}
            className="absolute animate-bubble-rise"
            style={{
              left: `${p.left}%`,
              bottom: config.direction === "up" ? `-${p.size + 10}px` : undefined,
              top: config.direction === "down" ? `-${p.size + 10}px` : undefined,
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: "50%",
              background: bg,
              boxShadow: shadow,
              border,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              ["--rise-distance" as string]: riseDistance,
              ["--wobble" as string]: `${p.wobble}px`,
              ["--bubble-opacity" as string]: `${p.opacity}`,
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

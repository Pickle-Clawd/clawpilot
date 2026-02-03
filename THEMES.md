# THEMES.md — Theme System

How to create themes for The Helm dashboard. Read this entire file before making a theme.

---

## Architecture

The Helm uses a **folder-based theme engine**. Each theme is a self-contained folder under `public/themes/<theme-id>/` containing a `theme.json` definition and an optional `styles.css` for advanced effects.

At build time, a script (`scripts/build-theme-index.mjs`) scans all theme folders and generates `public/themes/index.json` — the runtime registry. The app loads this index on mount, and the `ThemeProvider` applies the active theme's CSS variables to `:root`.

### How Themes Are Applied

1. **CSS Variables** — `theme.json` defines a `variables` map. On theme switch, the provider sets each as an inline style on `document.documentElement`. The entire UI is built on these variables via Tailwind CSS v4's `@theme inline` block.
2. **Data Attribute** — `document.documentElement` gets `data-theme="<id>"`, enabling CSS selectors like `[data-theme="retrowave"]`.
3. **Custom Styles** — If `styles.css` exists for the theme, it's fetched and injected as a `<style>` tag. Previous theme styles are removed first.
4. **Ambient Particles** — `theme.json` can define a `particles` config under `ambient`. The `ThemeParticles` component renders these as animated elements using a shared keyframe animation.

### Theme Persistence

The selected theme ID is stored in `localStorage` under key `the-helm-theme`. Default theme is `midnight`.

---

## File Structure

```
public/themes/
├── index.json              ← Auto-generated at build time (DO NOT edit manually)
├── midnight/
│   ├── theme.json          ← Theme definition
│   └── styles.css          ← Custom CSS overrides (can be minimal/empty)
├── reef/
│   ├── theme.json
│   └── styles.css
└── your-theme/
    ├── theme.json          ← Required
    └── styles.css          ← Optional
```

---

## Creating a Theme

### Two things are required:

1. **A folder** in `public/themes/<your-theme-id>/`
2. **A `theme.json`** file inside that folder

Optionally add `styles.css` for advanced visual effects.

After creating your theme, run the build script or just `npm run build` — the index is regenerated automatically.

### theme.json Schema

```tsx
interface ThemeDefinition {
  id: string;                              // Unique ID, kebab-case, matches folder name
  name: string;                            // Display name shown in theme picker
  author?: string;                         // Creator attribution
  description: string;                     // One-line description shown in picker dropdown
  preview: [string, string, string];       // Three hex colors for the picker swatches
  variables: Record<string, string>;       // CSS variable overrides (applied to :root)
  ambient?: AmbientConfig;                 // Optional ambient effects
}
```

### Required CSS Variables

Every theme **must** define all of these variables. The entire UI depends on them — missing variables will cause broken styling.

#### Core

| Variable | Purpose |
|----------|---------|
| `--background` | Page background |
| `--foreground` | Default text color |
| `--card` | Card/panel backgrounds |
| `--card-foreground` | Text inside cards |
| `--popover` | Dropdown/popover backgrounds |
| `--popover-foreground` | Text in popovers |
| `--primary` | Primary accent color (buttons, links, highlights) |
| `--primary-foreground` | Text on primary-colored elements |
| `--secondary` | Secondary surfaces |
| `--secondary-foreground` | Text on secondary surfaces |
| `--muted` | Subtle backgrounds (badges, inactive areas) |
| `--muted-foreground` | De-emphasized text |
| `--accent` | Accent surfaces (hover states, active items) |
| `--accent-foreground` | Text on accent surfaces |
| `--destructive` | Error/delete actions |
| `--border` | Default border color |
| `--input` | Input field borders |
| `--ring` | Focus ring color |

#### Charts

| Variable | Purpose |
|----------|---------|
| `--chart-1` through `--chart-5` | Colors for recharts data series |

#### Gradients & Status

| Variable | Purpose |
|----------|---------|
| `--gradient-orange` | Background glow gradient (top-left) |
| `--gradient-pink` | Background glow gradient (bottom-right) |
| `--gradient-purple` | Additional gradient accent |
| `--success` | Success/online indicators |
| `--warning` | Warning indicators |

#### Sidebar

| Variable | Purpose |
|----------|---------|
| `--sidebar` | Sidebar background |
| `--sidebar-foreground` | Sidebar text |
| `--sidebar-primary` | Active/selected sidebar item |
| `--sidebar-primary-foreground` | Text on active sidebar item |
| `--sidebar-accent` | Sidebar hover/accent state |
| `--sidebar-accent-foreground` | Text on sidebar accent |
| `--sidebar-border` | Sidebar border |
| `--sidebar-ring` | Sidebar focus ring |

### Color Formats

Variables accept any valid CSS color value:
- **Hex**: `#0A1628`
- **RGBA**: `rgba(255, 248, 240, 0.1)` — useful for semi-transparent borders
- **OKLCH**: `oklch(0.75 0.18 55)` — perceptually uniform, used by the default Midnight theme

Pick one format and be consistent within your theme for readability.

### Preview Swatches

The `preview` array holds exactly **three hex colors** displayed as small circles in the theme picker dropdown. Choose colors that represent the theme's visual identity at a glance — typically background, primary accent, and a secondary/card color.

---

## Ambient System

The `ambient` field in `theme.json` drives background particle effects. This is entirely optional — themes without it simply have no particles.

### Particle Config

```tsx
interface ParticleConfig {
  count: number;                           // Number of particles (40-60 is typical)
  color: string;                           // Base color with {{opacity}} template
  glowColor?: string;                      // Outer glow color with {{glowOpacity}}
  highlightColor?: string;                 // Inner highlight with {{highlightOpacity}}
  minSize: number;                         // Smallest particle diameter (px)
  maxSize: number;                         // Largest particle diameter (px)
  minDuration: number;                     // Fastest animation cycle (seconds)
  maxDuration: number;                     // Slowest animation cycle (seconds)
  direction: "up" | "down" | "left" | "right";  // Travel direction
  wobble?: boolean;                        // Enable horizontal sway
  maxWobble?: number;                      // Max horizontal offset (px, default 30)
  glow?: boolean;                          // Enable glow box-shadow
}
```

### Opacity Templates

Particle colors use template strings that the renderer fills in based on each particle's computed opacity (derived from size — bigger particles are more opaque):

- `{{opacity}}` — Base opacity (0.08–0.28)
- `{{glowOpacity}}` — Half of base opacity
- `{{highlightOpacity}}` — 1.5× base opacity

Use these in your RGBA color strings: `"rgba(255, 107, 74, {{opacity}})"`

### Particle Rendering

Particles are rendered as absolute-positioned `div` elements with:
- **Seeded pseudo-random positioning** — deterministic, no hydration mismatch
- **`animate-bubble-rise` class** — shared keyframe defined in `globals.css`
- **`will-change: transform, opacity`** — compositor-friendly for performance
- If `highlightColor` is set, particles use a `radial-gradient` for a 3D bubble effect
- If `glow` is true and `glowColor` is set, particles get a `box-shadow` glow

### Performance Considerations

- Keep `count` reasonable (30–60). Each particle is a DOM node.
- Use compositor-friendly properties only (transform, opacity) — the shared animation already does this.
- Particles are positioned once and animated via CSS — no per-frame JavaScript.

---

## Custom Styles (styles.css)

For effects that go beyond CSS variables — overlays, glows, animations, perspective transforms — add a `styles.css` to your theme folder.

### Scoping

**All selectors must be scoped to `[data-theme="your-theme-id"]`** to avoid leaking into other themes. The provider injects/removes the stylesheet on theme switch, but proper scoping prevents flash-of-wrong-style issues.

```css
[data-theme="your-theme-id"] .some-element {
  /* your styles */
}
```

### Available Selectors

| Selector | What It Targets |
|----------|-----------------|
| `[data-theme="id"]` | The `<html>` element when your theme is active |
| `[data-theme="id"]::before`, `::after` | Pseudo-elements on `<html>` (use for fullscreen overlays) |
| `.theme-ambient-layer` | A fixed container for ambient effects (z-index 0) |
| `.theme-ambient-layer::before`, `::after` | Pseudo-elements on the ambient layer |
| `[data-slot="card"]` | shadcn Card components |
| `[data-slot="sidebar"]` | The sidebar component |
| `[data-slot="sidebar-menu-button"]` | Sidebar navigation buttons |
| `.bg-card`, `.bg-primary`, etc. | Tailwind utility classes on elements |
| `.react-grid-item` | Dashboard widget containers |

### Technique Reference

Things you can do in `styles.css`:

- **Fullscreen overlays** — Scanlines, noise, vignette via `::after` on `[data-theme]` with `position: fixed; inset: 0; pointer-events: none; z-index: 9999`
- **Card enhancements** — Custom `box-shadow`, border effects, `backdrop-filter`
- **Sidebar accents** — Gradient dividers, glow effects via `::after`
- **Background effects** — Gradient floors, horizon glows via `.theme-ambient-layer` pseudo-elements
- **Keyframe animations** — Pulsing glows, flickering neon, etc.

### Rules

- Always use `pointer-events: none` on overlays
- Use `position: fixed` for fullscreen effects
- Keep overlays subtle — they cover the entire UI including interactive elements
- Use `mix-blend-mode` to avoid washing out content
- Test with the widget grid in both edit and view modes
- Scope everything to your `data-theme` selector

---

## Theme Picker Integration

The theme picker is a dropdown in the sidebar. It automatically reads from the built `index.json` — no code changes needed. It displays:

- **Three color swatches** from `preview`
- **Theme name** from `name`
- **Description** from `description`

The active theme gets an `bg-accent` highlight.

---

## Build Process

The build script (`scripts/build-theme-index.mjs`) runs before `next build`:

1. Scans `public/themes/` for directories
2. Reads `theme.json` from each (skips folders without a valid one)
3. Sorts: `midnight` first (default theme), then alphabetical by `name`
4. Writes `public/themes/index.json`

**Do not manually edit `index.json`** — it's regenerated on every build.

To test locally: `node scripts/build-theme-index.mjs && npm run dev`

---

## Tech Context

- **Next.js 16** (App Router) / **React 19**
- **Tailwind CSS v4** — all color utilities resolve to CSS variables via `@theme inline`
- **shadcn/ui** — uses `data-slot` attributes on components
- **`globals.css`** — defines the base `:root` and `.dark` variable sets (overridden at runtime by theme variables), plus the `bubble-rise` keyframe
- **`ThemeProvider`** (`src/lib/theme-context.tsx`) — manages theme state, applies variables, injects styles
- **`ThemeParticles`** (`src/components/theme-particles.tsx`) — renders ambient particles from config
- **`ThemePicker`** (`src/components/theme-picker.tsx`) — sidebar dropdown UI

---

## Checklist

- [ ] Folder created at `public/themes/<id>/`
- [ ] `theme.json` with valid `id`, `name`, `description`, `preview`, and complete `variables`
- [ ] `id` matches folder name (kebab-case)
- [ ] All required CSS variables defined (core + charts + gradients + status + sidebar)
- [ ] Preview array has exactly 3 hex color strings
- [ ] Colors work together — test card contrast, text readability, border visibility
- [ ] `styles.css` (if present) scopes all selectors to `[data-theme="your-id"]`
- [ ] Overlays use `pointer-events: none` and don't block interaction
- [ ] Ambient particles (if used) stay under 60 count
- [ ] Theme looks good with widgets at various sizes
- [ ] Build script regenerates index successfully (`node scripts/build-theme-index.mjs`)

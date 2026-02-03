# 🦞 The Helm

A modular, theme-able dashboard for [OpenClaw](https://github.com/openclaw/openclaw) — the open-source AI agent gateway.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)

## What It Does

The Helm connects to your OpenClaw gateway over WebSocket and gives you a real-time control panel:

- **Widget Dashboard** — Drag-and-drop homepage with a 24-column grid. Add, remove, resize, and rearrange widgets. Empty by default — build your own layout.
- **Cron Management** — Create, edit, toggle, trigger, and view run history for scheduled tasks.
- **Session Explorer** — Browse active conversations, view message history, send messages, kill sessions.
- **Config Editor** — View and edit your gateway configuration with JSON validation.
- **Theme Engine** — Three built-in themes (Midnight, Reef, Retrowave) with ambient particle effects. Create your own — see `THEMES.md`.
- **Layout Persistence** — Layouts saved per-gateway in localStorage, with optional backup to gateway config for cross-browser restore.

## Local Setup

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A running **OpenClaw gateway** (local or remote)

### Install

```bash
git clone https://github.com/Pickle-Clawd/the-helm.git
cd the-helm
npm install
```

### Run

```bash
npm run dev
```

Open `http://localhost:3000`.

### Connect

1. Enter your OpenClaw gateway WebSocket URL (e.g. `ws://localhost:18789`)
2. Enter your gateway auth token (found in your `openclaw.json` under `gateway.auth.token`)
3. You're in — add widgets, manage cron jobs, monitor sessions

### Build for Production

```bash
npm run build
npm start
```

The build step automatically generates the theme index from `public/themes/`.

## Project Structure

```
src/
├── app/                    # Next.js pages
│   ├── page.tsx            # Widget dashboard (homepage)
│   ├── cron/               # Cron job management
│   ├── sessions/           # Session explorer
│   └── config/             # Config editor
├── components/
│   ├── widgets/            # Dashboard widget components
│   ├── widget-grid.tsx     # Grid layout engine
│   ├── widget-catalog.tsx  # Widget picker dialog
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── gateway-context.tsx # WebSocket connection + state
│   ├── gateway-types.ts    # TypeScript types
│   ├── theme-context.tsx   # Theme provider
│   ├── widget-registry.ts  # Widget registration system
│   └── register-widgets.ts # Built-in widget registrations
public/themes/              # Theme folders (theme.json + styles.css)
```

## Creating Widgets

See `MODULE.md` for the full guide. In short:

1. Create a component in `src/components/widgets/`
2. Register it in `src/lib/register-widgets.ts`
3. Use `useGateway()` for data, theme tokens for colors

## Creating Themes

See `THEMES.md` for the full guide. In short:

1. Create a folder in `public/themes/<your-theme>/`
2. Add a `theme.json` with CSS variable overrides
3. Optionally add `styles.css` for advanced effects
4. Rebuild the index: `node scripts/build-theme-index.mjs`

## Tech Stack

- **Next.js 16** (App Router) / **React 19**
- **Tailwind CSS v4** with CSS variable theming
- **shadcn/ui** (Radix-based components)
- **react-grid-layout v2** (drag-and-drop grid)
- **recharts** (charts)
- **lucide-react** (icons)

## License

MIT

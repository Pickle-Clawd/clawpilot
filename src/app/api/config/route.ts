import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

const CONFIG_PATH = path.join(process.cwd(), "data", "helm-config.json");

interface HelmConfig {
  gateway: { url: string; token: string };
  layout: unknown[];
  editMode: boolean;
}

const DEFAULTS: HelmConfig = {
  gateway: { url: "ws://localhost:18789", token: "" },
  layout: [],
  editMode: false,
};

function readConfig(): HelmConfig {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return { ...DEFAULTS };
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

function writeConfig(config: HelmConfig) {
  const dir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export async function GET() {
  return NextResponse.json(readConfig());
}

async function handleWrite(request: Request) {
  try {
    const body = await request.json();
    const current = readConfig();
    const updated: HelmConfig = {
      gateway: body.gateway ?? current.gateway,
      layout: body.layout ?? current.layout,
      editMode: body.editMode ?? current.editMode,
    };
    writeConfig(updated);
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }
}

// PUT for normal saves, POST for sendBeacon (beforeunload)
export const PUT = handleWrite;
export const POST = handleWrite;

export async function DELETE() {
  try {
    if (fs.existsSync(CONFIG_PATH)) fs.unlinkSync(CONFIG_PATH);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}

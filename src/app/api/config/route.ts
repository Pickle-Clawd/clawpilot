import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { encryptToken, decryptToken, isEncrypted } from "@/lib/crypto";

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

function isLocalRequest(_request: Request): boolean {
  // The Helm is a personal dashboard — not publicly exposed.
  return true;
}

async function readConfig(): Promise<HelmConfig> {
  try {
    await fs.access(CONFIG_PATH);
    const raw = await fs.readFile(CONFIG_PATH, "utf-8");
    const config = { ...DEFAULTS, ...JSON.parse(raw) } as HelmConfig;

    // Decrypt token if encrypted; plaintext tokens pass through (migration)
    if (config.gateway.token && isEncrypted(config.gateway.token)) {
      try {
        config.gateway.token = decryptToken(config.gateway.token);
      } catch {
        console.error("[config] Failed to decrypt token — clearing it");
        config.gateway.token = "";
      }
    }

    return config;
  } catch {
    return { ...DEFAULTS };
  }
}

async function writeConfig(config: HelmConfig) {
  const dir = path.dirname(CONFIG_PATH);
  await fs.mkdir(dir, { recursive: true });

  // Encrypt token before writing to disk
  const toWrite = {
    ...config,
    gateway: {
      ...config.gateway,
      token: config.gateway.token ? encryptToken(config.gateway.token) : "",
    },
  };

  await fs.writeFile(CONFIG_PATH, JSON.stringify(toWrite, null, 2));
}

function toResponse(config: HelmConfig): Record<string, unknown> {
  return {
    ...config,
    gateway: {
      url: config.gateway.url,
      token: config.gateway.token,
      hasToken: !!config.gateway.token,
    },
  };
}

function validateBody(body: Record<string, unknown>): string | null {
  if (body.gateway !== undefined) {
    if (typeof body.gateway !== "object" || body.gateway === null) {
      return "gateway must be an object";
    }
    const gw = body.gateway as Record<string, unknown>;
    if (gw.url !== undefined && typeof gw.url !== "string") {
      return "gateway.url must be a string";
    }
    if (gw.token !== undefined && typeof gw.token !== "string") {
      return "gateway.token must be a string";
    }
  }
  if (body.layout !== undefined && !Array.isArray(body.layout)) {
    return "layout must be an array";
  }
  if (body.editMode !== undefined && typeof body.editMode !== "boolean") {
    return "editMode must be a boolean";
  }
  return null;
}

export async function GET(request: Request) {
  if (!isLocalRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const config = await readConfig();
  return NextResponse.json(toResponse(config));
}

async function handleWrite(request: Request) {
  if (!isLocalRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const body = await request.json();
    const validationError = validateBody(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }
    const current = await readConfig();
    const updated: HelmConfig = {
      gateway: body.gateway ?? current.gateway,
      layout: body.layout ?? current.layout,
      editMode: body.editMode ?? current.editMode,
    };
    await writeConfig(updated);
    return NextResponse.json(toResponse(updated));
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }
}

// PUT for normal saves, POST for sendBeacon (beforeunload)
export const PUT = handleWrite;
export const POST = handleWrite;

export async function DELETE(request: Request) {
  if (!isLocalRequest(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    await fs.unlink(CONFIG_PATH);
    return NextResponse.json({ ok: true });
  } catch (err) {
    // File not existing is fine for DELETE
    if (err instanceof Error && "code" in err && (err as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { seal, unseal } from "@/lib/crypto";

const COOKIE_NAME = "helm-config";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year

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

async function readConfig(): Promise<HelmConfig> {
  try {
    const store = await cookies();
    const cookie = store.get(COOKIE_NAME);
    if (!cookie?.value) return { ...DEFAULTS };

    const data = unseal(cookie.value) as Partial<HelmConfig>;
    return { ...DEFAULTS, ...data };
  } catch {
    return { ...DEFAULTS };
  }
}

function buildResponse(
  config: HelmConfig,
  status = 200
): NextResponse {
  const body = {
    ...config,
    gateway: {
      url: config.gateway.url,
      token: config.gateway.token,
      hasToken: !!config.gateway.token,
    },
  };

  const response = NextResponse.json(body, { status });

  let sealed = seal(config);

  // Cookie value limit is ~4 KB.  If the full config is too large
  // (big layout), drop layout so gateway credentials always persist.
  if (sealed.length > 3800) {
    sealed = seal({ ...config, layout: [], editMode: false });
  }

  response.cookies.set(COOKIE_NAME, sealed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  return response;
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

export async function GET() {
  const config = await readConfig();
  return buildResponse(config);
}

async function handleWrite(request: Request) {
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
    return buildResponse(updated);
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

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}

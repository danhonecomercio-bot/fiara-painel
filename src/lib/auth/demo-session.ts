import { createHmac, timingSafeEqual } from "node:crypto";

export type DemoRole = "admin" | "member";

type DemoPayload = {
  email: string;
  role: DemoRole;
  exp: number;
};

function secret() {
  return process.env.DEMO_SESSION_SECRET || "fiara-demo-local-only";
}

export function signDemoSession(input: { email: string; role: DemoRole }) {
  const payload: DemoPayload = {
    email: input.email,
    role: input.role,
    exp: Date.now() + 1000 * 60 * 60 * 12,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const mac = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function readDemoSession(token: string | undefined) {
  if (!token) return null;
  const [body, mac] = token.split(".");
  if (!body || !mac) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const received = Buffer.from(mac);
  const wanted = Buffer.from(expected);
  if (received.length !== wanted.length || !timingSafeEqual(received, wanted)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as DemoPayload;
    if (payload.exp < Date.now()) return null;
    if (payload.role !== "admin" && payload.role !== "member") return null;
    if (typeof payload.email !== "string" || !payload.email.includes("@")) return null;
    return { email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

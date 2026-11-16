import type { DemoRole } from "./demo-session";

export const DEMO_EMAIL = "demo@fiara.com.br";
export const DEMO_PASSWORD = "fiara-demo";

export type DemoMember = {
  id: string;
  email: string;
  password: string;
  role: DemoRole;
  createdAt: string;
};

const store = globalThis as { __fiaraMembers?: DemoMember[] };

function members() {
  if (!store.__fiaraMembers) {
    store.__fiaraMembers = [
      {
        id: "demo-admin",
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        role: "admin",
        createdAt: "2026-11-01T13:00:00.000Z",
      },
    ];
  }
  return store.__fiaraMembers;
}

export function listDemoMembers() {
  return members().map((member) => ({
    id: member.id,
    email: member.email,
    role: member.role,
    createdAt: member.createdAt,
  }));
}

export function verifyDemoPassword(email: string, password: string) {
  const member = members().find((item) => item.email.toLowerCase() === email.toLowerCase());
  if (!member || member.password !== password) return null;
  return { email: member.email, role: member.role };
}

export function addDemoMember(input: { email: string; password: string; role: DemoRole }) {
  const list = members();
  if (list.some((item) => item.email.toLowerCase() === input.email.toLowerCase())) {
    return { error: "Já existe um membro com esse e-mail." };
  }
  list.push({
    id: `demo-${list.length + 1}`,
    email: input.email,
    password: input.password,
    role: input.role,
    createdAt: new Date().toISOString(),
  });
  return { ok: "Membro criado neste ambiente de demonstração. A conta some quando o servidor reinicia." };
}

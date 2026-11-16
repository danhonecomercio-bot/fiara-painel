"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createMember, type MemberState } from "./actions";

const initial: MemberState = {};

export function MemberForm() {
  const [state, action, pending] = useActionState(createMember, initial);

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="member-email">E-mail</Label>
        <Input id="member-email" name="email" type="email" autoComplete="off" required />
      </div>
      <fieldset className="grid gap-2">
        <legend className="text-sm font-semibold">Como criar</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="mode" value="senha" defaultChecked />
          Criar com senha
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="mode" value="convite" />
          Convidar por e-mail
        </label>
      </fieldset>
      <div className="grid gap-1.5">
        <Label htmlFor="member-password">Senha</Label>
        <Input id="member-password" name="password" type="password" autoComplete="new-password" minLength={8} />
        <p className="text-xs text-muted">Obrigatória só na criação com senha. Mínimo de 8 caracteres.</p>
      </div>
      <fieldset className="grid gap-2">
        <legend className="text-sm font-semibold">Papel</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="role" value="member" defaultChecked />
          Membro
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" name="role" value="admin" />
          Administrador
        </label>
      </fieldset>
      {state.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-gold" role="status">
          {state.ok}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Salvando…" : "Criar membro"}
      </Button>
    </form>
  );
}

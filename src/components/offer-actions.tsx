"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { formatUsedOn } from "@/lib/offers/format";
import type { OfferAction, OfferActionName } from "@/lib/actions/types";

export function OfferActions({
  slug,
  initial,
  topadsReady,
  modelarReady,
  varreduraReady,
}: {
  slug: string;
  initial: OfferAction[];
  topadsReady: boolean;
  modelarReady: boolean;
  varreduraReady: boolean;
}) {
  const [actions, setActions] = useState(initial);
  const [busy, setBusy] = useState<OfferActionName | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const waiting = actions.some((action) => action.status === "pending" || action.status === "sent");
    if (!waiting) return;
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/offers/${encodeURIComponent(slug)}/actions`);
      if (!response.ok) return;
      const payload = (await response.json()) as { actions?: OfferAction[] };
      if (payload.actions) setActions(payload.actions);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [actions, slug]);

  async function run(action: OfferActionName) {
    setBusy(action);
    setNotice(null);
    try {
      const response = await fetch(`/api/offers/${encodeURIComponent(slug)}/actions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = (await response.json()) as { action?: OfferAction; message?: string };
      if (payload.action) {
        setActions((current) => [
          payload.action as OfferAction,
          ...current.filter((item) => item.action !== payload.action?.action),
        ]);
      } else {
        setNotice(payload.message ?? "Não foi possível enviar o pedido.");
      }
    } catch {
      setNotice("Não foi possível enviar o pedido.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <ActionButton
          label="Baixar top ads"
          action="baixar_top_ads"
          ready={topadsReady}
          disabledHint="não configurado"
          row={actions.find((item) => item.action === "baixar_top_ads") ?? null}
          busy={busy === "baixar_top_ads"}
          onRun={run}
        />
        <ActionButton
          label="Varredura em idiomas"
          action="varredura_idiomas"
          ready={varreduraReady}
          disabledHint="webhook do Minerador não configurado"
          row={actions.find((item) => item.action === "varredura_idiomas") ?? null}
          busy={busy === "varredura_idiomas"}
          onRun={run}
        />
        <ActionButton
          label="Modelar"
          action="modelar"
          ready={modelarReady}
          disabledHint="em breve"
          row={actions.find((item) => item.action === "modelar") ?? null}
          busy={busy === "modelar"}
          onRun={run}
        />
      </div>
      <DissecarStatus row={actions.find((item) => item.action === "dissecar") ?? null} />
      {notice ? <p className="text-sm text-danger">{notice}</p> : null}
    </div>
  );
}

function ActionButton({
  label,
  action,
  ready,
  disabledHint,
  row,
  busy,
  onRun,
}: {
  label: string;
  action: OfferActionName;
  ready: boolean;
  disabledHint: string;
  row: OfferAction | null;
  busy: boolean;
  onRun: (action: OfferActionName) => void;
}) {
  const status = statusLine(row, ready, disabledHint, busy);
  return (
    <div className="grid min-w-0 gap-1">
      <Button type="button" variant="outline" disabled={!ready || busy} onClick={() => onRun(action)}>
        {label}
      </Button>
      {status}
      {row && (action === "baixar_top_ads" || action === "varredura_idiomas") ? (
        <p className="text-xs text-muted">{formatUsedOn(row.created_at)}</p>
      ) : null}
    </div>
  );
}

function DissecarStatus({ row }: { row: OfferAction | null }) {
  if (!row) return null;
  if (row.status === "pending" || row.status === "sent") {
    return <p className="text-xs text-gold">Dissecando…</p>;
  }
  if (row.status === "failed") return <p className="text-xs text-danger">Falhou</p>;
  if (row.result_url) {
    return (
      <a
        href={row.result_url}
        target="_blank"
        rel="noreferrer"
        className="break-all text-xs text-gold underline decoration-gold/40 underline-offset-2"
      >
        {row.result_url}
      </a>
    );
  }
  return <p className="text-xs text-gold">Dissecação concluída</p>;
}

function statusLine(row: OfferAction | null, ready: boolean, disabledHint: string, busy: boolean) {
  if (!ready) return <p className="text-xs text-muted">{disabledHint}</p>;
  if (busy) return <p className="text-xs text-muted">Enviando…</p>;
  if (!row || row.status === "pending" || row.status === "sent") {
    return row ? <p className="text-xs text-gold">Pedido enviado</p> : null;
  }
  if (row.status === "failed") return <p className="text-xs text-danger">Falhou</p>;
  if (row.result_url) {
    return (
      <a
        href={row.result_url}
        target="_blank"
        rel="noreferrer"
        className="break-all text-xs text-gold underline decoration-gold/40 underline-offset-2"
      >
        Pasta no Drive
      </a>
    );
  }
  return <p className="text-xs text-gold">Pedido concluído</p>;
}

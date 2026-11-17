import type { OfferAction, OfferActionName } from "./types";

export function shouldAutoVarredura(
  score: number | null | undefined,
  existing: Pick<OfferAction, "action" | "status">[],
) {
  if (score == null || score < 4) return false;
  return !existing.some((row) => row.action === "varredura_idiomas");
}

export function autoSkipMessage(action: OfferActionName, slug: string) {
  return `[fiara] auto ${action} ignorado para ${slug}: webhook não configurado`;
}

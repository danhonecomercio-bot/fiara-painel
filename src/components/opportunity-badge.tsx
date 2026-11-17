import { formatScore } from "@/lib/offers/format";
import { cn } from "@/lib/utils";

export function OportunidadeMark({ available }: { available: boolean }) {
  if (!available) return null;
  return (
    <span className="inline-flex items-center whitespace-nowrap rounded bg-gold px-1.5 py-0.5 text-xs font-semibold leading-5 text-black">
      Oportunidade
    </span>
  );
}

export function OpportunityBadge({ score }: { score: number | null }) {
  if (score == null) {
    return (
      <span className="inline-flex items-center whitespace-nowrap rounded border border-dashed border-gold px-1.5 py-0.5 text-xs font-semibold leading-5 text-white">
        Não avaliada
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-semibold leading-5",
        score >= 4 ? "bg-gold text-black" : "border border-gold text-white",
      )}
    >
      Nota {formatScore(score)}
    </span>
  );
}

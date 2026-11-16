import { OPPORTUNITY_LABEL, type Opportunity } from "@/lib/offers/schema";
import { cn } from "@/lib/utils";

const styles: Record<Opportunity, string> = {
  alta: "bg-gold text-background",
  media: "border border-gold text-white",
  baixa: "border border-white/40 text-white",
  nenhuma: "border border-white/25 text-muted",
  nao_avaliada: "border border-dashed border-gold text-white",
};

export function OpportunityBadge({ value }: { value: Opportunity }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-semibold leading-5",
        styles[value],
      )}
    >
      {OPPORTUNITY_LABEL[value]}
    </span>
  );
}

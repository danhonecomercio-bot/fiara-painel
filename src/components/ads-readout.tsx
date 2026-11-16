import { adsReadout } from "@/lib/offers/format";
import { cn } from "@/lib/utils";

export function AdsReadout({
  total,
  previousTotal,
  previousCapturedAt,
}: {
  total: number | null;
  previousTotal: number | null;
  previousCapturedAt: string | null;
}) {
  const readout = adsReadout(total, previousTotal, previousCapturedAt);
  if (readout.delta == null) {
    return <span className="tabular-nums">{readout.text}</span>;
  }
  const signed = readout.delta > 0 ? `+${readout.delta}` : readout.delta === 0 ? "+0" : String(readout.delta);
  return (
    <span className="tabular-nums">
      <span className="font-semibold">{readout.total}</span>{" "}
      <span className={cn(readout.delta > 0 ? "text-gold" : readout.delta < 0 ? "text-danger" : "text-muted")}>
        ({signed} desde {readout.sinceLabel})
      </span>
    </span>
  );
}

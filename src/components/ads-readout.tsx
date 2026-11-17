import { adsReadout, heatLabel, heatPrefix } from "@/lib/offers/format";
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
  const prefix = heatPrefix(total);
  const label = heatLabel(total);
  if (readout.delta == null) {
    return (
      <span className="tabular-nums">
        {label ? <span className="sr-only">{label} </span> : null}
        {prefix ? <span aria-hidden="true">{prefix} </span> : null}
        {readout.text}
      </span>
    );
  }
  const signed = readout.delta > 0 ? `+${readout.delta}` : readout.delta === 0 ? "+0" : String(readout.delta);
  return (
    <span className="tabular-nums">
      {label ? <span className="sr-only">{label} </span> : null}
      {prefix ? <span aria-hidden="true">{prefix} </span> : null}
      <span className="font-semibold">{readout.total}</span>{" "}
      <span className={cn(readout.delta > 0 ? "text-gold" : readout.delta < 0 ? "text-danger" : "text-muted")}>
        ({signed} desde {readout.sinceLabel})
      </span>
    </span>
  );
}

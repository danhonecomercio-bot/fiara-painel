const TIME_ZONE = "America/Sao_Paulo";

export function heatPrefix(total: number | null | undefined) {
  if (total == null) return "";
  if (total > 500) return "⭐";
  if (total > 200) return "🔥";
  return "";
}

export function heatLabel(total: number | null | undefined) {
  if (total == null) return "";
  if (total > 500) return "Destaque, mais de 500 anúncios ativos.";
  if (total > 200) return "Em alta, mais de 200 anúncios ativos.";
  return "";
}

type Stamp = { day: string; month: string; hour: string };

export function saoPauloStamp(input: string | Date): Stamp {
  const date = input instanceof Date ? input : new Date(input);
  const map = new Map(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return {
    day: map.get("day") ?? "",
    month: map.get("month") ?? "",
    hour: String(Number(map.get("hour") ?? "0")),
  };
}

export function formatUpdated(input: string | Date) {
  const stamp = saoPauloStamp(input);
  return `atualizado em ${stamp.day}/${stamp.month} - ${stamp.hour}h`;
}

export function formatSince(input: string | Date) {
  const stamp = saoPauloStamp(input);
  return `${stamp.day}/${stamp.month} ${stamp.hour}h`;
}

export function formatSaoPauloDate(input: string | Date) {
  const date = input instanceof Date ? input : new Date(input);
  const map = new Map(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TIME_ZONE,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return `${map.get("day")}/${map.get("month")}/${map.get("year")}`;
}

export function formatCalendarDate(isoDate: string) {
  const [year, month, day] = isoDate.slice(0, 10).split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}/${year}`;
}

export type AdsReadout = {
  text: string;
  total: number | null;
  delta: number | null;
  sinceLabel: string | null;
};

export function adsReadout(
  total: number | null | undefined,
  previousTotal: number | null | undefined,
  previousCapturedAt: string | null | undefined,
): AdsReadout {
  if (total == null) {
    return { text: "sem leitura", total: null, delta: null, sinceLabel: null };
  }
  if (previousTotal == null || !previousCapturedAt) {
    return { text: String(total), total, delta: null, sinceLabel: null };
  }
  const delta = total - previousTotal;
  const signed = delta > 0 ? `+${delta}` : delta === 0 ? "+0" : String(delta);
  const sinceLabel = formatSince(previousCapturedAt);
  return {
    text: `${total} (${signed} desde ${sinceLabel})`,
    total,
    delta,
    sinceLabel,
  };
}

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

export function formatListUpdated(input: string | Date) {
  const stamp = saoPauloStamp(input);
  return `${stamp.day}/${stamp.month} - ${stamp.hour}h`;
}

export function isHalfStepScore(value: number) {
  if (!Number.isFinite(value) || value < 0 || value > 5) return false;
  return Math.abs(value * 2 - Math.round(value * 2)) < 1e-6;
}

export function normalizeScore(value: unknown) {
  const number =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value.trim().replace(",", "."))
        : Number.NaN;
  if (!isHalfStepScore(number)) return null;
  return Math.round(number * 2) / 2;
}

export function formatFunnel(value: string | null | undefined) {
  if (!value) return null;
  return value.trim().toLowerCase() === "quiz" ? "Quiz+LP" : value;
}

export function formatUsedOn(input: string | Date) {
  const stamp = saoPauloStamp(input);
  return `usado em ${stamp.day}/${stamp.month}`;
}

export function formatScore(score: number) {
  return score.toLocaleString("pt-BR", {
    minimumFractionDigits: Number.isInteger(score) ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

export function formatTicketCompact(value: string | null | undefined) {
  const text = value?.trim();
  if (!text) return null;
  const match = text.match(/(R\$|MX\$|US\$|€)\s*(\d{1,3}(?:\.\d{3})*|\d+)(?:([,.])(\d{1,2}))?/);
  if (!match) return null;
  const currency = match[1];
  const whole = match[2] ?? "";
  const separator = match[3];
  const fraction = match[4] ?? "";
  const digits = separator === "," || (separator === "." && !whole.includes("."))
    ? Number(`${whole.replace(/\./g, "")}.${fraction || "0"}`)
    : Number(whole.replace(/\./g, ""));
  if (!Number.isFinite(digits)) return null;
  const formatted = digits.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency} ${formatted}`;
}

export function formatScanStamp(input: string | Date) {
  const stamp = saoPauloStamp(input);
  return `varredura em ${stamp.day}/${stamp.month} - ${stamp.hour}h`;
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

const TRACKING_PARAMS = new Set([
  "fbclid",
  "gclid",
  "gbraid",
  "wbraid",
  "dclid",
  "msclkid",
  "ttclid",
  "twclid",
  "yclid",
  "igshid",
  "igsh",
  "mc_cid",
  "mc_eid",
  "src",
  "sck",
  "fb_source",
  "fb_action_ids",
  "fb_action_types",
  "li_fat_id",
  "sccid",
  "epik",
  "irclickid",
  "gad_source",
  "gad_campaignid",
  "_ga",
  "_gl",
  "ref_src",
]);

export function stripTracking(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  const hasProtocol = /^https?:\/\//i.test(trimmed);
  try {
    const url = new URL(hasProtocol ? trimmed : `https://${trimmed}`);
    for (const key of [...url.searchParams.keys()]) {
      const lower = key.toLowerCase();
      if (lower.startsWith("utm_") || TRACKING_PARAMS.has(lower)) url.searchParams.delete(key);
    }
    const serialized = url.toString();
    return hasProtocol ? serialized : serialized.replace(/^https?:\/\//, "");
  } catch {
    return trimmed;
  }
}

export function formatBumpPrice(cash?: string | null, installments?: string | null) {
  const cashText = cash?.trim() || "";
  const installmentText = formatInstallmentPhrase(installments);
  if (cashText && installmentText) return `${cashText} (ou ${installmentText})`;
  if (cashText) return cashText;
  if (installmentText) return installmentText;
  return null;
}

function formatInstallmentPhrase(value?: string | null) {
  const text = value?.trim();
  if (!text) return null;
  const match = text.match(/(\d+)\s*x\s*(?:de\s*)?R\$\s*([\d.,]+)/i);
  if (!match) return text;
  return `${match[1]}x de R$${match[2]}`;
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

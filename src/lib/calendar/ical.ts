// Parser mínimo de iCalendar (RFC 5545) para os calendários exportados pelo
// Airbnb, Booking e afins: só lê VEVENTs e as propriedades que usamos.

export type CalendarSource = "airbnb" | "booking" | "outro";
export type EventKind = "reserva" | "bloqueio";

export type ParsedEvent = {
  uid: string;
  kind: EventKind;
  summary: string | null;
  description: string | null;
  /** Check-in, meia-noite UTC. */
  startDate: Date;
  /** Check-out (exclusivo), meia-noite UTC. */
  endDate: Date;
  reservationUrl: string | null;
  phoneLast4: string | null;
};

type Property = { name: string; params: Record<string, string>; value: string };

/** Junta as linhas dobradas (continuação começa com espaço ou tab). */
function unfold(text: string): string[] {
  return text.replace(/\r\n|\r/g, "\n").replace(/\n[ \t]/g, "").split("\n");
}

function parseLine(line: string): Property | null {
  // O ":" que separa o valor é o primeiro fora de aspas.
  let inQuotes = false;
  let colon = -1;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') inQuotes = !inQuotes;
    else if (char === ":" && !inQuotes) {
      colon = i;
      break;
    }
  }
  if (colon <= 0) return null;

  const [name, ...rawParams] = line.slice(0, colon).split(";");
  const params: Record<string, string> = {};
  for (const raw of rawParams) {
    const eq = raw.indexOf("=");
    if (eq > 0) params[raw.slice(0, eq).toUpperCase()] = raw.slice(eq + 1).replace(/^"|"$/g, "");
  }
  return { name: name.toUpperCase(), params, value: line.slice(colon + 1) };
}

function unescapeText(value: string): string {
  return value.replace(/\\([nN,;\\])/g, (_, char: string) => (char.toLowerCase() === "n" ? "\n" : char));
}

/**
 * Converte DATE (20260920) ou DATE-TIME (20260920T150000Z) para o dia
 * correspondente à meia-noite UTC — reservas são sempre por diária.
 */
export function parseIcalDate(value: string): Date | null {
  const match = value.trim().match(/^(\d{4})(\d{2})(\d{2})(?:T\d{6}Z?)?$/);
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(date.getTime()) || date.getUTCMonth() !== month - 1 ? null : date;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function detectSource(url: string): CalendarSource {
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return "outro";
  }
  if (/(^|\.)airbnb\.[a-z.]+$/.test(host)) return "airbnb";
  if (/(^|\.)booking\.com$/.test(host)) return "booking";
  return "outro";
}

function classify(source: CalendarSource, summary: string | null, description: string | null): EventKind {
  const text = `${summary ?? ""} ${description ?? ""}`.toLowerCase();
  if (source === "airbnb") {
    // Airbnb: "Reserved" = reserva; "Airbnb (Not available)" = bloqueio.
    return /reserv/.test(text) ? "reserva" : "bloqueio";
  }
  if (source === "booking") {
    // Booking exporta reservas como "CLOSED - Not available"; não diferencia
    // datas fechadas manualmente, então tratamos tudo como ocupado.
    return "reserva";
  }
  return /not available|indispon|bloque|blocked|closed/.test(text) && !/reserv/.test(text)
    ? "bloqueio"
    : "reserva";
}

export function parseIcal(text: string, source: CalendarSource): ParsedEvent[] {
  const events: ParsedEvent[] = [];
  let current: Map<string, Property> | null = null;
  let depth = 0;

  for (const line of unfold(text)) {
    const upper = line.trim().toUpperCase();
    if (upper === "BEGIN:VEVENT") {
      current = new Map();
      depth = 0;
      continue;
    }
    if (!current) continue;
    // Ignora subcomponentes (ex.: VALARM) dentro do evento.
    if (upper.startsWith("BEGIN:")) {
      depth += 1;
      continue;
    }
    if (upper.startsWith("END:") && depth > 0) {
      depth -= 1;
      continue;
    }
    if (upper === "END:VEVENT") {
      const event = toEvent(current, source);
      if (event) events.push(event);
      current = null;
      continue;
    }
    if (depth > 0) continue;

    const property = parseLine(line);
    if (property && !current.has(property.name)) current.set(property.name, property);
  }

  return events;
}

function toEvent(props: Map<string, Property>, source: CalendarSource): ParsedEvent | null {
  if (props.get("STATUS")?.value.toUpperCase() === "CANCELLED") return null;

  const startDate = parseIcalDate(props.get("DTSTART")?.value ?? "");
  if (!startDate) return null;
  let endDate = parseIcalDate(props.get("DTEND")?.value ?? "");
  // Sem DTEND (ou inválido), um evento de dia inteiro dura uma diária.
  if (!endDate || endDate <= startDate) endDate = new Date(startDate.getTime() + DAY_MS);

  const summary = props.has("SUMMARY") ? unescapeText(props.get("SUMMARY")!.value).trim() || null : null;
  const description = props.has("DESCRIPTION")
    ? unescapeText(props.get("DESCRIPTION")!.value).trim() || null
    : null;

  const uid =
    props.get("UID")?.value.trim() ||
    `${startDate.toISOString().slice(0, 10)}_${endDate.toISOString().slice(0, 10)}_${summary ?? ""}`;

  const urlMatch = description?.match(/https:\/\/[^\s]+\/reservations\/details\/[A-Z0-9]+/i);
  const phoneMatch = description?.match(/Phone Number \(Last 4 Digits\):\s*(\d{4})/i);

  return {
    uid,
    kind: classify(source, summary, description),
    summary,
    description,
    startDate,
    endDate,
    reservationUrl: urlMatch?.[0] ?? null,
    phoneLast4: phoneMatch?.[1] ?? null,
  };
}

export function nightsBetween(start: Date, end: Date): number {
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / DAY_MS));
}

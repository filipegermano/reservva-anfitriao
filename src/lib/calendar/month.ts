// Cálculos do calendário mensal. Datas são strings "AAAA-MM-DD" para não
// sofrer com fuso horário: uma reserva de 20 a 25 ocupa as noites 20..24.

export type DayKey = string;

export type CalendarEntry = {
  id: string;
  feedId: string;
  /** Imóvel vinculado ou o próprio calendário, para calcular ocupação. */
  unitId: string;
  kind: "reserva" | "bloqueio";
  start: DayKey;
  end: DayKey;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export function toDayKey(date: Date): DayKey {
  return date.toISOString().slice(0, 10);
}

/** Data de N dias atrás — usada para limitar o histórico carregado. */
export function daysAgo(days: number): Date {
  return new Date(Date.now() - days * DAY_MS);
}

/** Dia de hoje no fuso local, como DayKey. */
export function localToday(now = new Date()): DayKey {
  return toDayKey(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
}

export function fromDayKey(key: DayKey): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

export function addDays(key: DayKey, amount: number): DayKey {
  return toDayKey(new Date(fromDayKey(key).getTime() + amount * DAY_MS));
}

export function diffDays(from: DayKey, to: DayKey): number {
  return Math.round((fromDayKey(to).getTime() - fromDayKey(from).getTime()) / DAY_MS);
}

export function monthKey(key: DayKey): string {
  return key.slice(0, 7);
}

export function shiftMonth(month: string, amount: number): string {
  const [year, m] = month.split("-").map(Number);
  return toDayKey(new Date(Date.UTC(year, m - 1 + amount, 1))).slice(0, 7);
}

export function daysInMonth(month: string): number {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m, 0)).getUTCDate();
}

/** Semanas (domingo a sábado) que cobrem o mês inteiro. */
export function monthWeeks(month: string): DayKey[][] {
  const first = `${month}-01`;
  const start = addDays(first, -fromDayKey(first).getUTCDay());
  const last = `${month}-${String(daysInMonth(month)).padStart(2, "0")}`;
  const weeks: DayKey[][] = [];
  for (let day = start; day <= last; day = addDays(day, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, index) => addDays(day, index)));
  }
  return weeks;
}

export type WeekBar<T extends CalendarEntry> = {
  entry: T;
  /** Coluna inicial (0-6) e quantidade de dias na semana. */
  column: number;
  span: number;
  lane: number;
  /** A reserva começou antes / continua depois desta semana. */
  continuesBefore: boolean;
  continuesAfter: boolean;
};

/** Distribui as estadias da semana em faixas sem sobreposição. */
export function layoutWeek<T extends CalendarEntry>(week: DayKey[], entries: T[]): WeekBar<T>[] {
  const weekStart = week[0];
  const weekEnd = addDays(week[6], 1);
  const visible = entries
    .filter((entry) => entry.start < weekEnd && entry.end > weekStart)
    .sort((a, b) => (a.start === b.start ? diffDays(b.start, b.end) - diffDays(a.start, a.end) : a.start < b.start ? -1 : 1));

  const laneEnds: number[] = [];
  return visible.map((entry) => {
    const column = Math.max(0, diffDays(weekStart, entry.start));
    const endColumn = Math.min(7, diffDays(weekStart, entry.end));
    let lane = laneEnds.findIndex((end) => end <= column);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = endColumn;
    return {
      entry,
      column,
      span: Math.max(1, endColumn - column),
      lane,
      continuesBefore: entry.start < weekStart,
      continuesAfter: entry.end > weekEnd,
    };
  });
}

/**
 * Taxa de ocupação do mês: noites reservadas (sem contar duas vezes a
 * mesma noite na mesma unidade) sobre noites disponíveis de todas as unidades.
 */
export function monthOccupancy(month: string, entries: CalendarEntry[], unitIds: string[]) {
  const total = daysInMonth(month) * unitIds.length;
  if (total === 0) return { booked: 0, total: 0, rate: 0 };

  const first = `${month}-01`;
  const next = `${shiftMonth(month, 1)}-01`;
  const nights = new Set<string>();
  for (const entry of entries) {
    if (entry.kind !== "reserva") continue;
    const from = entry.start > first ? entry.start : first;
    const to = entry.end < next ? entry.end : next;
    for (let day = from; day < to; day = addDays(day, 1)) nights.add(`${entry.unitId}|${day}`);
  }
  return { booked: nights.size, total, rate: nights.size / total };
}

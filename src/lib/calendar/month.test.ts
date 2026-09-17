import { describe, expect, it } from "vitest";

import { layoutWeek, monthOccupancy, monthWeeks, shiftMonth, type CalendarEntry } from "./month";

const entry = (id: string, start: string, end: string, extra: Partial<CalendarEntry> = {}): CalendarEntry => ({
  id,
  feedId: "f",
  unitId: "u1",
  kind: "reserva",
  start,
  end,
  ...extra,
});

describe("monthWeeks", () => {
  it("cobre o mês com semanas de domingo a sábado", () => {
    const weeks = monthWeeks("2026-09");
    expect(weeks[0][0]).toBe("2026-08-30");
    expect(weeks.at(-1)!.includes("2026-09-30")).toBe(true);
    expect(weeks.every((week) => week.length === 7)).toBe(true);
  });

  it("muda de ano", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });
});

describe("layoutWeek", () => {
  const week = monthWeeks("2026-09")[3]; // 20 a 26 de setembro

  it("posiciona barras e empilha sobreposições", () => {
    const bars = layoutWeek(week, [
      entry("a", "2026-09-18", "2026-09-22"),
      entry("b", "2026-09-21", "2026-09-24"),
      entry("c", "2026-09-22", "2026-09-30"),
      entry("fora", "2026-10-01", "2026-10-03"),
    ]);
    expect(bars.map((bar) => [bar.entry.id, bar.column, bar.span, bar.lane])).toEqual([
      ["a", 0, 2, 0],
      ["b", 1, 3, 1],
      ["c", 2, 5, 0],
    ]);
    expect(bars[0].continuesBefore).toBe(true);
    expect(bars[2].continuesAfter).toBe(true);
  });
});

describe("monthOccupancy", () => {
  it("conta noites únicas por unidade e ignora bloqueios", () => {
    const result = monthOccupancy(
      "2026-09",
      [
        entry("a", "2026-08-30", "2026-09-03"), // 2 noites em setembro
        entry("dup", "2026-09-01", "2026-09-03", { feedId: "g" }), // mesmas noites
        entry("b", "2026-09-29", "2026-10-05", { unitId: "u2" }), // 2 noites
        entry("c", "2026-09-10", "2026-09-15", { kind: "bloqueio" }),
      ],
      ["u1", "u2"],
    );
    expect(result).toEqual({ booked: 4, total: 60, rate: 4 / 60 });
  });
});

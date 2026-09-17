"use client";

import { getCalendarColor } from "@/lib/calendar/colors";
import { diffDays, layoutWeek, monthKey, monthWeeks, type DayKey } from "@/lib/calendar/month";
import { cn } from "@/lib/utils";
import { nightsLabel } from "@/components/calendar/format";
import type { EventView, FeedView } from "@/components/calendar/types";

const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const LANE_HEIGHT = 26;

export function MonthGrid({
  month,
  today,
  events,
  feedsById,
  onSelect,
}: {
  month: string;
  today: DayKey;
  events: EventView[];
  feedsById: Map<string, FeedView>;
  onSelect: (event: EventView) => void;
}) {
  const weeks = monthWeeks(month);

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-xs font-medium text-muted-foreground">
        {weekdays.map((day) => (
          <div key={day} className="py-2">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.charAt(0)}</span>
          </div>
        ))}
      </div>

      {weeks.map((week) => {
        const bars = layoutWeek(week, events);
        const lanes = bars.reduce((max, bar) => Math.max(max, bar.lane + 1), 0);

        return (
          <div key={week[0]} className="relative border-b last:border-b-0">
            <div className="grid grid-cols-7">
              {week.map((day) => (
                <div
                  key={day}
                  className={cn(
                    "min-h-24 border-r p-1.5 last:border-r-0",
                    monthKey(day) !== month && "bg-muted/30 text-muted-foreground/60",
                  )}
                  style={{ paddingBottom: lanes * LANE_HEIGHT + 6 }}
                >
                  <span
                    className={cn(
                      "inline-flex size-6 items-center justify-center rounded-full text-xs",
                      day === today && "bg-primary font-semibold text-primary-foreground",
                    )}
                  >
                    {Number(day.slice(8))}
                  </span>
                </div>
              ))}
            </div>

            {/* Barras das estadias, sobrepostas à grade dos dias. */}
            <div className="pointer-events-none absolute inset-x-0 bottom-1.5 grid grid-cols-7 gap-y-0.5">
              {bars.map((bar) => {
                const { entry } = bar;
                const feed = feedsById.get(entry.feedId);
                const color = getCalendarColor(feed?.color ?? "rosa");
                const isBlock = entry.kind === "bloqueio";
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => onSelect(entry)}
                    title={`${feed?.name ?? "Calendário"} · ${nightsLabel(entry.start, entry.end)}`}
                    className={cn(
                      "pointer-events-auto mx-0.5 flex h-[22px] items-center gap-1 overflow-hidden px-2 text-left text-[11px] font-medium whitespace-nowrap transition-opacity hover:opacity-80",
                      bar.continuesBefore ? "rounded-l-none" : "rounded-l-full",
                      bar.continuesAfter ? "rounded-r-none" : "rounded-r-full",
                    )}
                    style={{
                      gridColumn: `${bar.column + 1} / span ${bar.span}`,
                      gridRow: bar.lane + 1,
                      background: isBlock ? color.soft : color.bar,
                      color: isBlock ? "#334155" : "#ffffff",
                      border: isBlock ? `1px dashed ${color.bar}` : undefined,
                    }}
                  >
                    <span className="truncate">
                      {/* A continuação na semana seguinte repete o nome com "…". */}
                      {bar.continuesBefore && "… "}
                      {isBlock ? "Bloqueado" : (feed?.name ?? "Reserva")}
                    </span>
                    {!bar.continuesBefore && bar.span > 2 && diffDays(entry.start, entry.end) > 1 && (
                      <span className="opacity-75">· {nightsLabel(entry.start, entry.end)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

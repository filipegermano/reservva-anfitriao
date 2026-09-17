import type { CalendarSource } from "@/lib/calendar/ical";

export const calendarColors = [
  { id: "rosa", label: "Rosa", bar: "#e11d48", soft: "#ffe4e6" },
  { id: "azul", label: "Azul", bar: "#1d4ed8", soft: "#dbeafe" },
  { id: "verde", label: "Verde", bar: "#047857", soft: "#d1fae5" },
  { id: "ambar", label: "Âmbar", bar: "#b45309", soft: "#fef3c7" },
  { id: "violeta", label: "Violeta", bar: "#6d28d9", soft: "#ede9fe" },
  { id: "grafite", label: "Grafite", bar: "#334155", soft: "#e2e8f0" },
] as const;

export type CalendarColor = (typeof calendarColors)[number];

export function getCalendarColor(id: string): CalendarColor {
  return calendarColors.find((color) => color.id === id) ?? calendarColors[0];
}

/** Cor padrão por origem: rosa para Airbnb, azul para Booking. */
export function defaultColorFor(source: CalendarSource, taken: string[]): string {
  const preferred = source === "airbnb" ? "rosa" : source === "booking" ? "azul" : "verde";
  if (!taken.includes(preferred)) return preferred;
  return calendarColors.find((color) => !taken.includes(color.id))?.id ?? preferred;
}

export const sourceLabels: Record<CalendarSource, string> = {
  airbnb: "Airbnb",
  booking: "Booking.com",
  outro: "Outro",
};

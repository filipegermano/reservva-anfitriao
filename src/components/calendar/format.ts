import { diffDays, fromDayKey, type DayKey } from "@/lib/calendar/month";

const dayFormat = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" });
const longFormat = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const shortMonthFormat = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });
const monthFormat = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

export const formatDay = (key: DayKey) => dayFormat.format(fromDayKey(key)).replace(".", "");
export const formatLongDay = (key: DayKey) => longFormat.format(fromDayKey(key));
/** Mês abreviado do dia ("set"), para o selo de data. */
export const formatShortMonth = (key: DayKey) =>
  shortMonthFormat.format(fromDayKey(key)).replace(".", "").toUpperCase();
export const formatMonth = (month: string) => {
  const label = monthFormat.format(fromDayKey(`${month}-01`));
  return label.charAt(0).toUpperCase() + label.slice(1);
};

export function nightsLabel(start: DayKey, end: DayKey) {
  const nights = diffDays(start, end);
  return `${nights} ${nights === 1 ? "noite" : "noites"}`;
}

export function relativeDay(day: DayKey, today: DayKey) {
  const diff = diffDays(today, day);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  if (diff === -1) return "Ontem";
  if (diff > 1 && diff < 7) return `Em ${diff} dias`;
  return formatDay(day);
}

export function formatSyncedAt(iso: string | null) {
  if (!iso) return "Nunca sincronizado";
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "Sincronizado agora";
  if (minutes < 60) return `Sincronizado há ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Sincronizado há ${hours} h`;
  return `Sincronizado em ${new Date(iso).toLocaleDateString("pt-BR")}`;
}

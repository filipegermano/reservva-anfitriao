import type { CalendarSource } from "@/lib/calendar/ical";
import type { CalendarEntry } from "@/lib/calendar/month";

export type FeedView = {
  id: string;
  name: string;
  host: string;
  source: CalendarSource;
  color: string;
  propertyId: string | null;
  lastSyncedAt: string | null;
  lastError: string | null;
  eventCount: number;
};

export type EventView = CalendarEntry & {
  summary: string | null;
  description: string | null;
  reservationUrl: string | null;
  phoneLast4: string | null;
};

export type PropertyOption = { id: string; name: string };

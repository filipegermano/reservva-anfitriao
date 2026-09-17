import type { Metadata } from "next";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { daysAgo, toDayKey } from "@/lib/calendar/month";
import type { CalendarSource } from "@/lib/calendar/ical";
import { CalendarView } from "@/components/calendar/calendar-view";

export const metadata: Metadata = { title: "Calendário · Reservva Anfitrião" };

/** Mostra estadias a partir de alguns meses atrás (histórico recente). */
const HISTORY_DAYS = 180;

export default async function CalendarPage() {
  const session = await auth();
  const userId = session!.user.id;
  const since = daysAgo(HISTORY_DAYS);

  const [feeds, events, properties] = await Promise.all([
    prisma.calendarFeed.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: { _count: { select: { events: true } } },
    }),
    prisma.calendarEvent.findMany({
      where: { feed: { userId }, endDate: { gte: since } },
      orderBy: { startDate: "asc" },
    }),
    prisma.property.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const unitByFeed = new Map(feeds.map((feed) => [feed.id, feed.propertyId ?? feed.id]));

  return (
    <CalendarView
      properties={properties}
      feeds={feeds.map((feed) => ({
        id: feed.id,
        name: feed.name,
        // O link tem um token secreto: só mostramos o domínio.
        host: new URL(feed.url).hostname,
        source: feed.source as CalendarSource,
        color: feed.color,
        propertyId: feed.propertyId,
        lastSyncedAt: feed.lastSyncedAt?.toISOString() ?? null,
        lastError: feed.lastError,
        eventCount: feed._count.events,
      }))}
      events={events.map((event) => ({
        id: event.id,
        feedId: event.feedId,
        unitId: unitByFeed.get(event.feedId) ?? event.feedId,
        kind: event.kind as "reserva" | "bloqueio",
        start: toDayKey(event.startDate),
        end: toDayKey(event.endDate),
        summary: event.summary,
        description: event.description,
        reservationUrl: event.reservationUrl,
        phoneLast4: event.phoneLast4,
      }))}
    />
  );
}

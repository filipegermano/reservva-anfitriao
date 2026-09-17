import { prisma } from "@/lib/prisma";
import { safeFetch, UnsafeUrlError } from "@/lib/import/safe-fetch";
import { parseIcal, type CalendarSource } from "@/lib/calendar/ical";

/** Depois desse tempo, abrir o calendário dispara uma nova sincronização. */
export const STALE_AFTER_MS = 30 * 60 * 1000;

const MAX_ICAL_BYTES = 5 * 1024 * 1024;

export class CalendarSyncError extends Error {}

/** Baixa e interpreta um link iCal, falhando com mensagem amigável. */
export async function fetchIcal(url: string, source: CalendarSource) {
  let body: Buffer;
  try {
    ({ body } = await safeFetch(url, {
      maxBytes: MAX_ICAL_BYTES,
      accept: "text/calendar, text/plain;q=0.9, */*;q=0.1",
    }));
  } catch (error) {
    if (error instanceof UnsafeUrlError) throw new CalendarSyncError(error.message);
    throw new CalendarSyncError("Não foi possível baixar o calendário. Confira o link.");
  }

  const text = body.toString("utf8");
  if (!/^﻿?\s*BEGIN:VCALENDAR/i.test(text)) {
    throw new CalendarSyncError("O link não é um calendário iCal (.ics).");
  }
  return parseIcal(text, source);
}

type FeedToSync = { id: string; url: string; source: string };

/** Substitui os eventos salvos pelos do link. Erros ficam em lastError. */
export async function syncFeed(feed: FeedToSync): Promise<{ ok: boolean; error?: string }> {
  try {
    const events = await fetchIcal(feed.url, feed.source as CalendarSource);
    // Mesmo UID repetido no arquivo quebraria a constraint única.
    const unique = [...new Map(events.map((event) => [event.uid, event])).values()];

    await prisma.$transaction([
      prisma.calendarEvent.deleteMany({ where: { feedId: feed.id } }),
      prisma.calendarEvent.createMany({
        data: unique.map((event) => ({ ...event, feedId: feed.id })),
      }),
      prisma.calendarFeed.update({
        where: { id: feed.id },
        data: { lastSyncedAt: new Date(), lastError: null },
      }),
    ]);
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof CalendarSyncError ? error.message : "Erro inesperado ao sincronizar.";
    if (!(error instanceof CalendarSyncError)) console.error("Falha ao sincronizar calendário", error);
    await prisma.calendarFeed.update({
      where: { id: feed.id },
      data: { lastError: message, lastSyncedAt: new Date() },
    });
    return { ok: false, error: message };
  }
}

/** Sincroniza os calendários do usuário (só os desatualizados, a menos que force). */
export async function syncUserFeeds(userId: string, { force = false } = {}) {
  const feeds = await prisma.calendarFeed.findMany({
    where: {
      userId,
      ...(force
        ? {}
        : {
            OR: [
              { lastSyncedAt: null },
              { lastSyncedAt: { lt: new Date(Date.now() - STALE_AFTER_MS) } },
            ],
          }),
    },
    select: { id: true, url: true, source: true },
  });

  const results = await Promise.all(feeds.map((feed) => syncFeed(feed)));
  return { synced: feeds.length, failed: results.filter((result) => !result.ok).length };
}

/** Busca um calendário garantindo que pertence ao usuário. */
export async function getOwnedFeed(feedId: string, userId: string) {
  const feed = await prisma.calendarFeed.findUnique({ where: { id: feedId } });
  return feed && feed.userId === userId ? feed : null;
}

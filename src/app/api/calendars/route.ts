import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/api";
import { checkPropertyLink, requireUserId } from "@/lib/calendar/api";
import { defaultColorFor } from "@/lib/calendar/colors";
import { detectSource } from "@/lib/calendar/ical";
import { CalendarSyncError, fetchIcal } from "@/lib/calendar/sync";
import { createCalendarSchema } from "@/lib/validations/calendar";

const MAX_FEEDS_PER_USER = 50;

export async function POST(request: Request) {
  const { userId, error: authError } = await requireUserId();
  if (authError) return authError;

  const { data, error } = await parseJsonBody(request, createCalendarSchema);
  if (error) return error;

  const linkError = await checkPropertyLink(data.propertyId, userId);
  if (linkError) return linkError;

  const existing = await prisma.calendarFeed.findMany({
    where: { userId },
    select: { url: true, color: true },
  });
  if (existing.length >= MAX_FEEDS_PER_USER) {
    return NextResponse.json({ error: "Limite de calendários atingido" }, { status: 400 });
  }
  if (existing.some((feed) => feed.url === data.url)) {
    return NextResponse.json({ error: "Esse calendário já foi importado" }, { status: 409 });
  }

  const source = detectSource(data.url);

  // Valida o link antes de salvar: um link errado não vira calendário.
  let events;
  try {
    events = await fetchIcal(data.url, source);
  } catch (fetchError) {
    if (fetchError instanceof CalendarSyncError) {
      return NextResponse.json({ error: fetchError.message }, { status: 400 });
    }
    throw fetchError;
  }
  const unique = [...new Map(events.map((event) => [event.uid, event])).values()];

  const feed = await prisma.calendarFeed.create({
    data: {
      userId,
      propertyId: data.propertyId,
      name: data.name,
      url: data.url,
      source,
      color: data.color ?? defaultColorFor(source, existing.map((feed) => feed.color)),
      lastSyncedAt: new Date(),
      events: { createMany: { data: unique } },
    },
    select: { id: true },
  });

  return NextResponse.json(
    { feed, events: unique.length, reservations: unique.filter((event) => event.kind === "reserva").length },
    { status: 201 },
  );
}

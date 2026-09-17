import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/api";
import { checkPropertyLink, requireUserId } from "@/lib/calendar/api";
import { getOwnedFeed } from "@/lib/calendar/sync";
import { updateCalendarSchema } from "@/lib/validations/calendar";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const { userId, error: authError } = await requireUserId();
  if (authError) return authError;

  const { id } = await params;
  if (!(await getOwnedFeed(id, userId))) {
    return NextResponse.json({ error: "Calendário não encontrado" }, { status: 404 });
  }

  const { data, error } = await parseJsonBody(request, updateCalendarSchema);
  if (error) return error;

  const linkError = await checkPropertyLink(data.propertyId, userId);
  if (linkError) return linkError;

  await prisma.calendarFeed.update({ where: { id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { userId, error: authError } = await requireUserId();
  if (authError) return authError;

  const { id } = await params;
  if (!(await getOwnedFeed(id, userId))) {
    return NextResponse.json({ error: "Calendário não encontrado" }, { status: 404 });
  }

  await prisma.calendarFeed.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

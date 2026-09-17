import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/calendar/api";
import { getOwnedFeed, syncFeed } from "@/lib/calendar/sync";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  const { userId, error: authError } = await requireUserId();
  if (authError) return authError;

  const { id } = await params;
  const feed = await getOwnedFeed(id, userId);
  if (!feed) {
    return NextResponse.json({ error: "Calendário não encontrado" }, { status: 404 });
  }

  const result = await syncFeed(feed);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}

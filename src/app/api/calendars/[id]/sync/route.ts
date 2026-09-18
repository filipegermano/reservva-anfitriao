import { NextResponse } from "next/server";

import { requireAccountId } from "@/lib/calendar/api";
import { getAccountFeed, syncFeed } from "@/lib/calendar/sync";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  const { accountId, error: authError } = await requireAccountId();
  if (authError) return authError;

  const { id } = await params;
  const feed = await getAccountFeed(id, accountId);
  if (!feed) {
    return NextResponse.json({ error: "Calendário não encontrado" }, { status: 404 });
  }

  const result = await syncFeed(feed);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}

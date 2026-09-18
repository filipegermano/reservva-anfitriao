import { NextResponse } from "next/server";

import { requireAccountId } from "@/lib/calendar/api";
import { syncAccountFeeds } from "@/lib/calendar/sync";

/** Sincroniza os calendários desatualizados (ou todos, com ?force=1). */
export async function POST(request: Request) {
  const { accountId, error: authError } = await requireAccountId();
  if (authError) return authError;

  const force = new URL(request.url).searchParams.get("force") === "1";
  return NextResponse.json(await syncAccountFeeds(accountId, { force }));
}

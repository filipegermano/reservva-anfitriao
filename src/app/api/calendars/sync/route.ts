import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/calendar/api";
import { syncUserFeeds } from "@/lib/calendar/sync";

/** Sincroniza os calendários desatualizados (ou todos, com ?force=1). */
export async function POST(request: Request) {
  const { userId, error: authError } = await requireUserId();
  if (authError) return authError;

  const force = new URL(request.url).searchParams.get("force") === "1";
  return NextResponse.json(await syncUserFeeds(userId, { force }));
}

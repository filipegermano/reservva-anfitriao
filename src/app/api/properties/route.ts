import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSessionAccount } from "@/lib/account";
import { parseJsonBody } from "@/lib/api";
import { createBlankGuide, createGuideFromDraft } from "@/lib/guide/create-guide";
import { createPropertySchema } from "@/lib/validations/property";

export async function GET() {
  const account = await getSessionAccount();
  if (!account) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const properties = await prisma.property.findMany({
    where: { accountId: account.accountId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { sections: true, feedbacks: true } } },
  });

  return NextResponse.json({ properties });
}

export async function POST(request: Request) {
  const account = await getSessionAccount();
  if (!account) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { data, error } = await parseJsonBody(request, createPropertySchema);
  if (error) return error;

  const property =
    data.mode === "draft"
      ? await createGuideFromDraft(account.accountId, data.draft)
      : await createBlankGuide(account.accountId, data);

  return NextResponse.json({ property }, { status: 201 });
}

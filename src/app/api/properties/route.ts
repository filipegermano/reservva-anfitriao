import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parseJsonBody } from "@/lib/api";
import { createBlankGuide, createGuideFromDraft } from "@/lib/guide/create-guide";
import { createPropertySchema } from "@/lib/validations/property";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const properties = await prisma.property.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { sections: true, feedbacks: true } } },
  });

  return NextResponse.json({ properties });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { data, error } = await parseJsonBody(request, createPropertySchema);
  if (error) return error;

  const property =
    data.mode === "draft"
      ? await createGuideFromDraft(session.user.id, data.draft)
      : await createBlankGuide(session.user.id, data);

  return NextResponse.json({ property }, { status: 201 });
}

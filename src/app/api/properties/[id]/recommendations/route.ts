import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireOwnedProperty } from "@/lib/api";
import { recommendationSchema } from "@/lib/validations/property";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const owned = await requireOwnedProperty(id);
  if (owned.error) return owned.error;

  const body = await request.json().catch(() => null);
  const parsed = recommendationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const count = await prisma.recommendation.count({ where: { propertyId: id } });

  const recommendation = await prisma.recommendation.create({
    data: { ...parsed.data, propertyId: id, order: count },
  });

  return NextResponse.json({ recommendation }, { status: 201 });
}

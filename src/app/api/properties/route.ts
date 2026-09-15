import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateUniqueSlug } from "@/lib/slug";
import { createPropertySchema } from "@/lib/validations/property";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const properties = await prisma.property.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { recommendations: true } } },
  });

  return NextResponse.json({ properties });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createPropertySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const slug = await generateUniqueSlug(parsed.data.name);

  const property = await prisma.property.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      address: parsed.data.address,
      slug,
    },
  });

  return NextResponse.json({ property }, { status: 201 });
}

import Link from "next/link";
import { Home, MapPin, Plus, QrCode } from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const session = await auth();

  const properties = await prisma.property.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { recommendations: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Seus imóveis</h1>
          <p className="text-muted-foreground">
            Gerencie os guias digitais e cartazes de boas-vindas de cada imóvel.
          </p>
        </div>
        <Button asChild>
          <Link href="/app/propriedades/novo">
            <Plus className="size-4" />
            Novo imóvel
          </Link>
        </Button>
      </div>

      {properties.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Home className="size-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Você ainda não cadastrou nenhum imóvel</p>
              <p className="text-sm text-muted-foreground">
                Crie seu primeiro guia digital para começar a compartilhar com os hóspedes.
              </p>
            </div>
            <Button asChild>
              <Link href="/app/propriedades/novo">
                <Plus className="size-4" />
                Criar meu primeiro imóvel
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Link key={property.id} href={`/app/propriedades/${property.id}`}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Home className="size-4 shrink-0 text-primary" />
                    {property.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {property.address && (
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0" />
                      {property.address}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      <QrCode className="size-3" />
                      /g/{property.slug}
                    </Badge>
                    <Badge variant="outline">
                      {property._count.recommendations} recomendaç
                      {property._count.recommendations === 1 ? "ão" : "ões"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

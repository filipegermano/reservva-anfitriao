import Link from "next/link";
import { CalendarDays, Eye, FileText, Globe, Home, MapPin, Plus, Star } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireSessionAccount } from "@/lib/account";
import { imageSrc } from "@/lib/guide/contacts";
import { getTheme } from "@/lib/guide/themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const account = await requireSessionAccount();

  const [properties, ratings] = await Promise.all([
    prisma.property.findMany({
      where: { accountId: account.accountId },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { sections: true, feedbacks: true } } },
    }),
    prisma.guestFeedback.groupBy({
      by: ["propertyId"],
      where: { property: { accountId: account.accountId } },
      _avg: { rating: true },
    }),
  ]);

  const averageByProperty = new Map(ratings.map((row) => [row.propertyId, row._avg.rating]));
  const published = properties.filter((property) => property.published).length;
  const totalViews = properties.reduce((sum, property) => sum + property.viewCount, 0);
  const totalFeedbacks = properties.reduce((sum, property) => sum + property._count.feedbacks, 0);

  const stats = [
    { label: "Guias", value: properties.length, hint: "Todos os seus guias", icon: FileText },
    { label: "Publicados", value: published, hint: "Visíveis para hóspedes", icon: Globe },
    { label: "Visualizações", value: totalViews, hint: "Acessos aos guias publicados", icon: Eye },
    { label: "Avaliações", value: totalFeedbacks, hint: "Recebidas pelos guias", icon: Star },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Olá, {account.userName.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground">Gerencie os guias digitais e cartazes dos seus imóveis.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/app/calendario">
              <CalendarDays className="size-4" />
              Calendário
            </Link>
          </Button>
          <Button asChild>
            <Link href="/app/propriedades/novo">
              <Plus className="size-4" />
              Criar guia
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="space-y-1 py-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                {stat.label}
                <stat.icon className="size-4" />
              </div>
              <p className="text-2xl font-semibold">{stat.value.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground">{stat.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {properties.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Home className="size-10 text-muted-foreground" />
            <div>
              <p className="font-medium">Você ainda não criou nenhum guia</p>
              <p className="text-sm text-muted-foreground">
                Importe seu anúncio do Airbnb e tenha um guia pronto em minutos.
              </p>
            </div>
            <Button asChild>
              <Link href="/app/propriedades/novo">
                <Plus className="size-4" />
                Criar meu primeiro guia
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => {
            const cover = imageSrc(property.coverImageUrl);
            const average = averageByProperty.get(property.id);
            return (
              <Link key={property.id} href={`/app/propriedades/${property.id}`} className="group">
                <Card className="h-full overflow-hidden pt-0 transition-shadow group-hover:shadow-md">
                  <div
                    className="relative aspect-[16/9]"
                    style={{ background: cover ? undefined : getTheme(property.theme).headerGradient }}
                  >
                    {cover && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cover} alt="" className="absolute inset-0 size-full object-cover" />
                    )}
                    <Badge
                      className={
                        property.published
                          ? "absolute top-2 left-2 bg-emerald-600 text-white"
                          : "absolute top-2 left-2 bg-amber-500 text-white"
                      }
                    >
                      {property.published ? "Publicado" : "Rascunho"}
                    </Badge>
                  </div>
                  <CardContent className="space-y-2">
                    <p className="line-clamp-2 font-medium">{property.name}</p>
                    {(property.city || property.address) && (
                      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="size-3.5 shrink-0" />
                        <span className="truncate">{property.city ?? property.address}</span>
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {property.propertyType && <span>{property.propertyType}</span>}
                      <span>{property._count.sections} seções</span>
                      <span className="flex items-center gap-1">
                        <Eye className="size-3" /> {property.viewCount}
                      </span>
                      {average != null && (
                        <span className="flex items-center gap-1">
                          <Star className="size-3 fill-amber-400 text-amber-400" /> {average.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

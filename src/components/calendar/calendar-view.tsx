"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  LogIn,
  LogOut,
  Percent,
  RefreshCw,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { getCalendarColor, sourceLabels } from "@/lib/calendar/colors";
import { diffDays, monthKey, monthOccupancy, shiftMonth } from "@/lib/calendar/month";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddFeedDialog } from "@/components/calendar/add-feed-dialog";
import { FeedsPanel } from "@/components/calendar/feeds-panel";
import { MonthGrid } from "@/components/calendar/month-grid";
import { useToday } from "@/components/calendar/use-today";
import {
  formatLongDay,
  formatMonth,
  formatShortMonth,
  nightsLabel,
  relativeDay,
} from "@/components/calendar/format";
import type { EventView, FeedView, PropertyOption } from "@/components/calendar/types";

export function CalendarView({
  feeds,
  events,
  properties,
}: {
  feeds: FeedView[];
  events: EventView[];
  properties: PropertyOption[];
}) {
  const router = useRouter();
  const today = useToday();
  // Sem mês escolhido, mostra o mês corrente.
  const [pinnedMonth, setMonth] = useState<string | null>(null);
  const month = pinnedMonth ?? monthKey(today);
  const [hidden, setHidden] = useState<string[]>([]);
  const [showBlocks, setShowBlocks] = useState(true);
  const [selected, setSelected] = useState<EventView | null>(null);
  const [syncing, setSyncing] = useState(false);

  const feedsById = useMemo(() => new Map(feeds.map((feed) => [feed.id, feed])), [feeds]);

  const visible = useMemo(
    () =>
      events.filter(
        (event) =>
          !hidden.includes(event.feedId) && (showBlocks || event.kind === "reserva"),
      ),
    [events, hidden, showBlocks],
  );

  const stats = useMemo(() => {
    const reservations = visible.filter((event) => event.kind === "reserva");
    const unitIds = [...new Set(feeds.filter((feed) => !hidden.includes(feed.id)).map((feed) => feed.propertyId ?? feed.id))];
    const occupancy = monthOccupancy(month, visible, unitIds);
    return {
      staying: reservations.filter((event) => event.start <= today && event.end > today).length,
      checkIns: reservations.filter((event) => {
        const days = diffDays(today, event.start);
        return days >= 0 && days <= 7;
      }).length,
      checkOuts: reservations.filter((event) => {
        const days = diffDays(today, event.end);
        return days >= 0 && days <= 7;
      }).length,
      occupancy,
    };
  }, [visible, feeds, hidden, month, today]);

  const upcoming = useMemo(
    () =>
      visible
        .filter((event) => event.kind === "reserva" && event.end > today)
        .sort((a, b) => (a.start < b.start ? -1 : 1))
        .slice(0, 8),
    [visible, today],
  );

  // Ao abrir a página, atualiza os calendários desatualizados em segundo plano.
  const autoSynced = useRef(false);
  useEffect(() => {
    if (autoSynced.current || feeds.length === 0) return;
    autoSynced.current = true;
    fetch("/api/calendars/sync", { method: "POST" })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        if (payload?.synced) router.refresh();
      })
      .catch(() => {});
  }, [feeds.length, router]);

  async function syncAll() {
    setSyncing(true);
    const response = await fetch("/api/calendars/sync?force=1", { method: "POST" });
    const payload = await response.json().catch(() => ({}));
    setSyncing(false);
    if (!response.ok) {
      toast.error("Não foi possível sincronizar");
      return;
    }
    if (payload.failed) toast.error(`${payload.failed} calendário(s) com erro`);
    else toast.success("Calendários atualizados");
    router.refresh();
  }

  if (feeds.length === 0) {
    return <EmptyState properties={properties} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendário</h1>
          <p className="text-muted-foreground">
            Reservas do Airbnb, Booking e outros sites em um só lugar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={syncAll} disabled={syncing}>
            {syncing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
            Sincronizar
          </Button>
          <AddFeedDialog properties={properties} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Hospedados agora" value={stats.staying} hint="Estadias em andamento" icon={Users} />
        <Stat label="Check-ins" value={stats.checkIns} hint="Nos próximos 7 dias" icon={LogIn} />
        <Stat label="Check-outs" value={stats.checkOuts} hint="Nos próximos 7 dias" icon={LogOut} />
        <Stat
          label="Ocupação"
          value={`${Math.round(stats.occupancy.rate * 100)}%`}
          hint={`${stats.occupancy.booked} de ${stats.occupancy.total} noites em ${formatMonth(month).toLowerCase()}`}
          icon={Percent}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Mês anterior" onClick={() => setMonth(shiftMonth(month, -1))}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-40 text-center font-medium">{formatMonth(month)}</span>
          <Button variant="outline" size="icon" aria-label="Próximo mês" onClick={() => setMonth(shiftMonth(month, 1))}>
            <ChevronRight className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setMonth(null)}>
            Hoje
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {feeds.map((feed) => {
            const color = getCalendarColor(feed.color);
            const off = hidden.includes(feed.id);
            return (
              <button
                key={feed.id}
                type="button"
                aria-pressed={!off}
                onClick={() =>
                  setHidden((current) =>
                    off ? current.filter((id) => id !== feed.id) : [...current, feed.id],
                  )
                }
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                  off ? "text-muted-foreground" : "bg-muted/60",
                )}
              >
                <span
                  className="size-2.5 rounded-full"
                  style={{ background: off ? "transparent" : color.bar, border: `1px solid ${color.bar}` }}
                />
                {feed.name}
              </button>
            );
          })}
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Switch checked={showBlocks} onCheckedChange={setShowBlocks} />
            Bloqueios
          </label>
        </div>
      </div>

      <MonthGrid
        month={month}
        today={today}
        events={visible}
        feedsById={feedsById}
        onSelect={setSelected}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="font-semibold">Próximas reservas</h2>
          {upcoming.length === 0 ? (
            <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              Nenhuma reserva futura nos calendários importados.
            </p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((event) => {
                const feed = feedsById.get(event.feedId);
                const color = getCalendarColor(feed?.color ?? "rosa");
                const ongoing = event.start <= today;
                return (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => setSelected(event)}
                    className="flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left transition-shadow hover:shadow-sm"
                  >
                    <span className="w-14 shrink-0 text-center">
                      <span className="block text-lg font-semibold leading-none">
                        {Number(event.start.slice(8))}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {formatShortMonth(event.start)}
                      </span>
                    </span>
                    <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: color.bar }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {ongoing ? "Hospedado agora" : relativeDay(event.start, today)} ·{" "}
                        {nightsLabel(event.start, event.end)}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {feed?.name} · saída {relativeDay(event.end, today).toLowerCase()}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="font-semibold">Calendários importados</h2>
          <FeedsPanel feeds={feeds} properties={properties} />
          <AddFeedDialog properties={properties}>
            <Button variant="outline" className="w-full border-dashed">
              <CalendarPlus className="size-4" />
              Importar outro calendário
            </Button>
          </AddFeedDialog>
        </section>
      </div>

      <EventDialog
        event={selected}
        feed={selected ? feedsById.get(selected.feedId) : undefined}
        properties={properties}
        today={today}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="space-y-1 py-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          {label}
          <Icon className="size-4" />
        </div>
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function EventDialog({
  event,
  feed,
  properties,
  today,
  onClose,
}: {
  event: EventView | null;
  feed: FeedView | undefined;
  properties: PropertyOption[];
  today: string;
  onClose: () => void;
}) {
  const property = properties.find((option) => option.id === feed?.propertyId);

  return (
    <Dialog open={!!event} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {event && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {event.kind === "reserva" ? "Reserva" : "Período bloqueado"}
                {feed && <Badge variant="secondary">{sourceLabels[feed.source]}</Badge>}
              </DialogTitle>
              <DialogDescription>
                {nightsLabel(event.start, event.end)} · {relativeDay(event.start, today)}
              </DialogDescription>
            </DialogHeader>

            <dl className="space-y-3 text-sm">
              <Row label="Check-in" value={formatLongDay(event.start)} />
              <Row label="Check-out" value={formatLongDay(event.end)} />
              <Row label="Calendário" value={feed?.name ?? "—"} />
              {property && <Row label="Imóvel" value={property.name} />}
              {event.phoneLast4 && (
                <Row label="Telefone do hóspede" value={`•••• ${event.phoneLast4}`} />
              )}
              {event.summary && <Row label="Descrição" value={event.summary} />}
            </dl>

            {event.reservationUrl && (
              <Button asChild variant="outline">
                <a href={event.reservationUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" />
                  Abrir reserva no {feed ? sourceLabels[feed.source] : "site"}
                </a>
              </Button>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function EmptyState({ properties }: { properties: PropertyOption[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Calendário</h1>
        <p className="text-muted-foreground">
          Importe os calendários compartilhados dos seus anúncios para ver todas as reservas juntas.
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
          <CalendarDays className="size-10 text-muted-foreground" />
          <div className="max-w-md space-y-2">
            <p className="font-medium">Nenhum calendário importado ainda</p>
            <p className="text-sm text-muted-foreground">
              No Airbnb, abra <strong>Calendário → Disponibilidade → Conectar outro site → Exportar
              calendário</strong>. No Booking.com, vá em <strong>Tarifas e disponibilidade →
              Sincronizar calendários → Exportar calendário</strong>. Copie o link e cole aqui.
            </p>
          </div>
          <AddFeedDialog properties={properties} />
          <p className="text-xs text-muted-foreground">
            A sincronização é só de leitura: nada é alterado nos seus anúncios.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

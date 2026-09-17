"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Pencil, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { calendarColors, getCalendarColor, sourceLabels } from "@/lib/calendar/colors";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatSyncedAt } from "@/components/calendar/format";
import { PropertySelect } from "@/components/calendar/property-select";
import type { FeedView, PropertyOption } from "@/components/calendar/types";

export function FeedsPanel({
  feeds,
  properties,
}: {
  feeds: FeedView[];
  properties: PropertyOption[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<FeedView | null>(null);
  const [removing, setRemoving] = useState<FeedView | null>(null);

  async function syncOne(feed: FeedView) {
    setBusyId(feed.id);
    const response = await fetch(`/api/calendars/${feed.id}/sync`, { method: "POST" });
    const payload = await response.json().catch(() => ({}));
    setBusyId(null);
    if (payload.ok) toast.success(`“${feed.name}” sincronizado`);
    else toast.error(payload.error ?? "Não foi possível sincronizar");
    router.refresh();
  }

  async function remove(feed: FeedView) {
    setBusyId(feed.id);
    const response = await fetch(`/api/calendars/${feed.id}`, { method: "DELETE" });
    setBusyId(null);
    setRemoving(null);
    if (!response.ok) {
      toast.error("Não foi possível remover o calendário");
      return;
    }
    toast.success("Calendário removido");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {feeds.map((feed) => {
        const color = getCalendarColor(feed.color);
        const property = properties.find((option) => option.id === feed.propertyId);
        return (
          <div key={feed.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
            <span className="size-3 shrink-0 rounded-full" style={{ background: color.bar }} />
            <div className="min-w-40 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{feed.name}</p>
                <Badge variant="secondary">{sourceLabels[feed.source]}</Badge>
                {property && <span className="text-xs text-muted-foreground">{property.name}</span>}
              </div>
              <p className="text-xs text-muted-foreground">
                {feed.eventCount} evento(s) · {formatSyncedAt(feed.lastSyncedAt)} · {feed.host}
              </p>
              {feed.lastError && (
                <p className="mt-1 flex items-center gap-1 text-xs text-destructive">
                  <AlertTriangle className="size-3.5 shrink-0" />
                  {feed.lastError}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Sincronizar agora"
                disabled={busyId === feed.id}
                onClick={() => syncOne(feed)}
              >
                {busyId === feed.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RefreshCw className="size-4" />
                )}
              </Button>
              <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => setEditing(feed)}>
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Remover"
                onClick={() => setRemoving(feed)}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </div>
        );
      })}

      {editing && (
        <EditFeedDialog
          feed={editing}
          properties={properties}
          onClose={() => setEditing(null)}
        />
      )}

      <Dialog open={!!removing} onOpenChange={(open) => !open && setRemoving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover “{removing?.name}”?</DialogTitle>
            <DialogDescription>
              As reservas importadas desse calendário deixam de aparecer aqui. O calendário no
              Airbnb/Booking não é alterado.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={busyId === removing?.id}
              onClick={() => removing && remove(removing)}
            >
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditFeedDialog({
  feed,
  properties,
  onClose,
}: {
  feed: FeedView;
  properties: PropertyOption[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(feed.name);
  const [color, setColor] = useState(feed.color);
  const [propertyId, setPropertyId] = useState(feed.propertyId);
  const [saving, setSaving] = useState(false);

  async function save(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    setSaving(true);
    const response = await fetch(`/api/calendars/${feed.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), color, propertyId }),
    });
    const payload = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      toast.error(payload.error ?? "Não foi possível salvar");
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={save} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Editar calendário</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {calendarColors.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-label={option.label}
                  aria-pressed={color === option.id}
                  onClick={() => setColor(option.id)}
                  className={cn(
                    "size-7 rounded-full border-2 transition-transform",
                    color === option.id ? "scale-110 border-foreground" : "border-transparent",
                  )}
                  style={{ background: option.bar }}
                />
              ))}
            </div>
          </div>

          {properties.length > 0 && (
            <div className="space-y-2">
              <Label>Imóvel</Label>
              <PropertySelect properties={properties} value={propertyId} onChange={setPropertyId} />
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

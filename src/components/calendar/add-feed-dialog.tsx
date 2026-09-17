"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { sourceLabels } from "@/lib/calendar/colors";
import { detectSource } from "@/lib/calendar/ical";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PropertySelect } from "@/components/calendar/property-select";
import type { PropertyOption } from "@/components/calendar/types";

const helpBySource = {
  airbnb:
    "No Airbnb: Calendário → Disponibilidade → Conectar outro site → Exportar calendário e copie o link.",
  booking:
    "No Booking.com: Tarifas e disponibilidade → Sincronizar calendários → Exportar calendário.",
  outro: "Procure por “exportar calendário” ou “iCal” no painel do site de reservas.",
} as const;

export function AddFeedDialog({
  properties,
  color,
  children,
}: {
  properties: PropertyOption[];
  color?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const source = url.trim() ? detectSource(url.trim().replace(/^webcals?:\/\//i, "https://")) : "outro";

  async function submit(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    setSaving(true);
    const response = await fetch("/api/calendars", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: url.trim(),
        name: name.trim() || sourceLabels[source],
        propertyId,
        ...(color ? { color } : {}),
      }),
    });
    const payload = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      toast.error(payload.error ?? "Não foi possível importar o calendário");
      return;
    }

    toast.success(
      payload.reservations
        ? `Calendário importado com ${payload.reservations} reserva(s)`
        : "Calendário importado",
    );
    setOpen(false);
    setUrl("");
    setName("");
    setPropertyId(null);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button>
            <CalendarPlus className="size-4" />
            Importar calendário
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Importar calendário</DialogTitle>
            <DialogDescription>
              Cole o link de exportação (iCal) do Airbnb, Booking ou outro site para acompanhar as
              reservas por aqui.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="feed-url">Link do calendário (.ics)</Label>
            <Input
              id="feed-url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://www.airbnb.com.br/calendar/ical/12345.ics?s=..."
              required
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">{helpBySource[source]}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feed-name">Nome</Label>
            <Input
              id="feed-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={`Ex.: Casa da praia — ${sourceLabels[source]}`}
              maxLength={80}
            />
          </div>

          {properties.length > 0 && (
            <div className="space-y-2">
              <Label>Imóvel</Label>
              <PropertySelect properties={properties} value={propertyId} onChange={setPropertyId} />
              <p className="text-xs text-muted-foreground">
                Vincular ao imóvel junta Airbnb e Booking do mesmo lugar no cálculo de ocupação.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={saving || !url.trim()}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {saving ? "Verificando link..." : "Importar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

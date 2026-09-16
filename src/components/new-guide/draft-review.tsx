"use client";

import { useState } from "react";
import { ArrowLeft, Check, Loader2, X } from "lucide-react";

import type { ListingDraft } from "@/lib/import/listing-draft";
import { propertyTypes } from "@/lib/guide/sections";
import { guideThemes } from "@/lib/guide/themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/new-guide/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
      <div>
        <h2 className="font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function RemovableList({
  items,
  onChange,
  empty,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  empty: string;
}) {
  if (items.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs">
          {item}
          <button
            type="button"
            aria-label={`Remover ${item}`}
            onClick={() => onChange(items.filter((current) => current !== item))}
            className="rounded-full p-0.5 hover:bg-background"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
    </div>
  );
}

export function DraftReview({
  initialDraft,
  partial,
  onBack,
  onCreate,
}: {
  initialDraft: ListingDraft;
  partial: boolean;
  onBack: () => void;
  onCreate: (draft: ListingDraft) => Promise<boolean>;
}) {
  const [draft, setDraft] = useState(initialDraft);
  const [selectedPhotos, setSelectedPhotos] = useState(() => new Set(initialDraft.photos.map((photo) => photo.url)));
  const [confirmed, setConfirmed] = useState(false);
  const [creating, setCreating] = useState(false);

  const set = (patch: Partial<ListingDraft>) => setDraft((current) => ({ ...current, ...patch }));

  function togglePhoto(url: string) {
    setSelectedPhotos((current) => {
      const next = new Set(current);
      if (next.has(url)) next.delete(url);
      else next.add(url);
      return next;
    });
  }

  async function submit() {
    setCreating(true);
    const ok = await onCreate({
      ...draft,
      photos: draft.photos.filter((photo) => selectedPhotos.has(photo.url)),
    });
    if (!ok) setCreating(false);
  }

  const counts = [
    { key: "guests", label: "Hóspedes" },
    { key: "bedrooms", label: "Quartos" },
    { key: "beds", label: "Camas" },
    { key: "bathrooms", label: "Banheiros" },
  ] as const;

  const nameValid = draft.name.trim().length >= 2;

  return (
    <div className="space-y-5 pb-24">
      <Button type="button" variant="ghost" size="sm" className="-ml-2" onClick={onBack} disabled={creating}>
        <ArrowLeft /> Voltar
      </Button>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Revise os dados do anúncio</h1>
        <p className="text-muted-foreground">
          Confira o que encontramos. Tudo poderá ser ajustado depois no editor.
        </p>
        {partial && (
          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            Só conseguimos ler parte das informações desse site. Complete o que faltar aqui ou no editor.
          </p>
        )}
      </div>

      <Section title="Informações básicas">
        <div className="space-y-1.5">
          <Label htmlFor="draft-name">Nome da propriedade</Label>
          <Input id="draft-name" value={draft.name} maxLength={120} onChange={(event) => set({ name: event.target.value })} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="draft-type">Tipo de imóvel</Label>
            <Select value={draft.propertyType} onValueChange={(value) => set({ propertyType: value as ListingDraft["propertyType"] })}>
              <SelectTrigger id="draft-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {propertyTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="draft-city">Cidade</Label>
            <Input id="draft-city" value={draft.city} maxLength={120} onChange={(event) => set({ city: event.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="draft-host">Anfitrião</Label>
            <Input id="draft-host" value={draft.hostName} maxLength={120} onChange={(event) => set({ hostName: event.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="draft-theme">Tema do guia</Label>
            <Select value={draft.theme} onValueChange={(theme) => set({ theme })}>
              <SelectTrigger id="draft-theme" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {guideThemes.map((theme) => (
                  <SelectItem key={theme.id} value={theme.id}>
                    {theme.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="draft-welcome">Mensagem de boas-vindas</Label>
          <Input id="draft-welcome" value={draft.welcomeMessage} maxLength={160} onChange={(event) => set({ welcomeMessage: event.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="draft-description">Descrição</Label>
          <Textarea id="draft-description" rows={6} value={draft.description} maxLength={4000} onChange={(event) => set({ description: event.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {counts.map(({ key, label }) => (
            <div key={key} className="space-y-1.5 rounded-lg border p-3 text-center">
              <Label htmlFor={`draft-${key}`} className="justify-center text-xs text-muted-foreground">
                {label}
              </Label>
              <Input
                id={`draft-${key}`}
                type="number"
                min={0}
                max={999}
                className="text-center text-lg font-semibold"
                value={draft[key]}
                onChange={(event) => set({ [key]: Math.max(0, Math.min(999, Number(event.target.value) || 0)) })}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Check-in e check-out">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="draft-checkin">Check-in a partir das</Label>
            <Input id="draft-checkin" value={draft.checkInTime} maxLength={60} placeholder="14:00" onChange={(event) => set({ checkInTime: event.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="draft-checkout">Check-out até as</Label>
            <Input id="draft-checkout" value={draft.checkOutTime} maxLength={60} placeholder="11:00" onChange={(event) => set({ checkOutTime: event.target.value })} />
          </div>
        </div>
      </Section>

      <Section title={`Comodidades encontradas (${draft.amenities.length})`}>
        <RemovableList items={draft.amenities} empty="Nenhuma comodidade encontrada." onChange={(amenities) => set({ amenities })} />
      </Section>

      <Section title={`Regras da casa (${draft.rules.length})`}>
        <RemovableList items={draft.rules} empty="Nenhuma regra encontrada." onChange={(rules) => set({ rules })} />
      </Section>

      <Section
        title={`Fotos (${selectedPhotos.size}/${draft.photos.length} selecionadas)`}
        description="A primeira foto selecionada vira a capa do guia. As demais ficam na seção Ambientes."
      >
        {draft.photos.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma foto encontrada no anúncio.</p>
        ) : (
          <>
            <div className="flex gap-2">
              <Button type="button" size="xs" variant="outline" onClick={() => setSelectedPhotos(new Set(draft.photos.map((photo) => photo.url)))}>
                Selecionar todas
              </Button>
              <Button type="button" size="xs" variant="ghost" onClick={() => setSelectedPhotos(new Set())}>
                Limpar seleção
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {draft.photos.map((photo) => {
                const selected = selectedPhotos.has(photo.url);
                return (
                  <button
                    key={photo.url}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => togglePhoto(photo.url)}
                    className={cn(
                      "relative aspect-[4/3] overflow-hidden rounded-lg border-2 transition",
                      selected ? "border-primary" : "border-transparent opacity-50",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt={photo.room || "Foto do anúncio"} loading="lazy" className="size-full object-cover" />
                    <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 px-2 pt-4 pb-1.5 text-left text-xs font-medium text-white">
                      {photo.room || "Outros"}
                    </span>
                    {selected && (
                      <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </Section>

      <div className="sticky bottom-0 -mx-4 space-y-3 border-t bg-background/95 px-4 py-4 backdrop-blur">
        <label className="flex items-start gap-2 text-sm">
          <Checkbox checked={confirmed} onChange={setConfirmed} />
          <span>
            Confirmo que tenho o direito de usar os dados e as fotos deste anúncio no meu guia.
          </span>
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onBack} disabled={creating}>
            Cancelar
          </Button>
          <Button type="button" onClick={submit} disabled={!confirmed || !nameValid || creating}>
            {creating ? <Loader2 className="animate-spin" /> : <Check />}
            {creating ? "Criando guia e importando fotos…" : "Criar guia"}
          </Button>
        </div>
      </div>
    </div>
  );
}

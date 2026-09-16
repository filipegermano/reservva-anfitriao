"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { GuideRecommendation } from "@/lib/guide/data";
import { recommendationsFor } from "@/lib/guide/presence";
import type { SectionContent } from "@/lib/guide/sections";
import {
  recommendationCategories,
  recommendationSchema,
  type RecommendationInput,
} from "@/lib/validations/property";
import { recommendationCategoryLabels } from "@/lib/recommendation-categories";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEditor } from "@/components/editor/editor-context";
import { TextAreaField } from "@/components/editor/fields";

type NearbyType = "local_tips" | "restaurants";

function RecommendationsManager({ type }: { type: NearbyType }) {
  const { propertyId, editor } = useEditor();
  const items = recommendationsFor(type, editor.guide.recommendations);
  const categories =
    type === "restaurants"
      ? (["RESTAURANTE"] as const)
      : recommendationCategories.filter((category) => category !== "RESTAURANTE");
  const defaultCategory = categories[0];

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GuideRecommendation | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<RecommendationInput>({
    resolver: zodResolver(recommendationSchema),
    defaultValues: { category: defaultCategory, name: "", description: "", mapsUrl: "" },
  });

  function openDialog(recommendation: GuideRecommendation | null) {
    setEditing(recommendation);
    reset({
      category: recommendation?.category ?? defaultCategory,
      name: recommendation?.name ?? "",
      description: recommendation?.description ?? "",
      mapsUrl: recommendation?.mapsUrl ?? "",
    });
    setOpen(true);
  }

  async function onSubmit(data: RecommendationInput) {
    setSubmitting(true);
    const response = await fetch(
      editing
        ? `/api/properties/${propertyId}/recommendations/${editing.id}`
        : `/api/properties/${propertyId}/recommendations`,
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      },
    ).catch(() => null);
    setSubmitting(false);

    if (!response?.ok) {
      toast.error("Não foi possível salvar a indicação");
      return;
    }

    const { recommendation } = await response.json();
    editor.setRecommendations((current) =>
      editing
        ? current.map((item) => (item.id === recommendation.id ? recommendation : item))
        : [...current, recommendation],
    );
    setOpen(false);
  }

  async function remove(recommendation: GuideRecommendation) {
    const response = await fetch(
      `/api/properties/${propertyId}/recommendations/${recommendation.id}`,
      { method: "DELETE" },
    ).catch(() => null);
    if (!response?.ok) {
      toast.error("Não foi possível remover a indicação");
      return;
    }
    editor.setRecommendations((current) => current.filter((item) => item.id !== recommendation.id));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <Label>Suas indicações</Label>
        <Button type="button" size="sm" variant="outline" onClick={() => openDialog(null)}>
          <Plus />
          {type === "restaurants" ? "Adicionar restaurante" : "Adicionar indicação"}
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          {type === "restaurants"
            ? "Nenhum restaurante ainda. Indique seus favoritos por perto."
            : "Nenhuma indicação ainda. Adicione atrações, mercados, farmácias…"}
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-2 rounded-lg border p-3">
              <div className="min-w-0">
                {type === "local_tips" && (
                  <Badge variant="secondary">{recommendationCategoryLabels[item.category]}</Badge>
                )}
                <p className="mt-1 font-medium">{item.name}</p>
                {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                {item.mapsUrl && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" /> Link do mapa
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-1">
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Editar" onClick={() => openDialog(item)}>
                  <Pencil />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" aria-label="Remover" className="text-destructive" onClick={() => remove(item)}>
                  <Trash2 />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <DialogHeader>
              <DialogTitle>{editing ? "Editar indicação" : "Nova indicação"}</DialogTitle>
              <DialogDescription>Um lugar que você recomenda para quem está hospedado.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {categories.length > 1 && (
                <div className="space-y-2">
                  <Label htmlFor="rec-category">Categoria</Label>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="rec-category" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {recommendationCategoryLabels[category]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="rec-name">Nome</Label>
                <Input id="rec-name" {...register("name")} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="rec-description">Descrição (opcional)</Label>
                <Textarea id="rec-description" rows={3} {...register("description")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rec-maps">Link do Google Maps (opcional)</Label>
                <Input id="rec-maps" placeholder="https://maps.app.goo.gl/…" {...register("mapsUrl")} />
                {errors.mapsUrl && <p className="text-sm text-destructive">{errors.mapsUrl.message}</p>}
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Salvando…" : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function NearbyEditor({
  type,
  content,
  onChange,
}: {
  type: NearbyType;
  content: SectionContent<"local_tips">;
  onChange: (content: SectionContent<"local_tips">) => void;
}) {
  const { editor } = useEditor();
  const { address, city } = editor.guide.property;

  return (
    <div className="space-y-5">
      <TextAreaField
        label="Introdução"
        value={content.intro}
        rows={2}
        max={4000}
        placeholder={
          type === "restaurants"
            ? "Ex.: A orla tem ótimas opções de frutos do mar a poucos passos."
            : "Ex.: O bairro é tranquilo e tem tudo a uma caminhada de distância."
        }
        onChange={(intro) => onChange({ intro })}
      />
      <RecommendationsManager type={type} />
      <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
        {address || city
          ? "O hóspede também vê atalhos para buscar no Google Maps o que há perto do imóvel."
          : "Preencha o endereço nas informações básicas para o hóspede ver atalhos de busca no Google Maps."}
      </p>
    </div>
  );
}

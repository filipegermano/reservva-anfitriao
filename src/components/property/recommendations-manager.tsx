"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";

import type { Recommendation } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  recommendationCategories,
  recommendationSchema,
  type RecommendationInput,
} from "@/lib/validations/property";
import { recommendationCategoryLabels } from "@/lib/recommendation-categories";

export function RecommendationsManager({
  propertyId,
  initialRecommendations,
}: {
  propertyId: string;
  initialRecommendations: Recommendation[];
}) {
  const [recommendations, setRecommendations] = useState(initialRecommendations);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Recommendation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<RecommendationInput>({
    resolver: zodResolver(recommendationSchema),
    defaultValues: { category: "OUTRO", name: "", description: "", mapsUrl: "" },
  });

  function openCreateDialog() {
    setEditing(null);
    reset({ category: "OUTRO", name: "", description: "", mapsUrl: "" });
    setDialogOpen(true);
  }

  function openEditDialog(recommendation: Recommendation) {
    setEditing(recommendation);
    reset({
      category: recommendation.category,
      name: recommendation.name,
      description: recommendation.description ?? "",
      mapsUrl: recommendation.mapsUrl ?? "",
    });
    setDialogOpen(true);
  }

  async function onSubmit(data: RecommendationInput) {
    setIsSubmitting(true);

    const url = editing
      ? `/api/properties/${propertyId}/recommendations/${editing.id}`
      : `/api/properties/${propertyId}/recommendations`;

    const response = await fetch(url, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      toast.error("Não foi possível salvar a recomendação");
      return;
    }

    const { recommendation } = await response.json();

    setRecommendations((current) =>
      editing
        ? current.map((item) => (item.id === recommendation.id ? recommendation : item))
        : [...current, recommendation],
    );
    setDialogOpen(false);
    toast.success(editing ? "Recomendação atualizada" : "Recomendação adicionada");
  }

  async function handleDelete(recommendation: Recommendation) {
    const response = await fetch(
      `/api/properties/${propertyId}/recommendations/${recommendation.id}`,
      { method: "DELETE" },
    );

    if (!response.ok) {
      toast.error("Não foi possível remover a recomendação");
      return;
    }

    setRecommendations((current) => current.filter((item) => item.id !== recommendation.id));
    toast.success("Recomendação removida");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Restaurantes, atrações e outras dicas locais para os hóspedes.
        </p>

        <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreateDialog}>
              <Plus className="size-4" />
              Nova recomendação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <DialogHeader>
                <DialogTitle>
                  {editing ? "Editar recomendação" : "Nova recomendação"}
                </DialogTitle>
                <DialogDescription>
                  Compartilhe um lugar ou dica útil para quem está hospedado.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="category" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {recommendationCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {recommendationCategoryLabels[category]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" {...register("name")} />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea id="description" rows={3} {...register("description")} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mapsUrl">Link do Google Maps (opcional)</Label>
                  <Input id="mapsUrl" placeholder="https://maps.google.com/…" {...register("mapsUrl")} />
                  {errors.mapsUrl && (
                    <p className="text-sm text-destructive">{errors.mapsUrl.message}</p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando…" : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {recommendations.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma recomendação cadastrada ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {recommendations.map((recommendation) => (
            <Card key={recommendation.id}>
              <CardContent className="space-y-2 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge variant="secondary">
                      {recommendationCategoryLabels[recommendation.category]}
                    </Badge>
                    <p className="mt-1.5 font-medium">{recommendation.name}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      onClick={() => openEditDialog(recommendation)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(recommendation)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                {recommendation.description && (
                  <p className="text-sm text-muted-foreground">{recommendation.description}</p>
                )}
                {recommendation.mapsUrl && (
                  <a
                    href={recommendation.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary underline underline-offset-4"
                  >
                    <MapPin className="size-3.5" />
                    Ver no mapa
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

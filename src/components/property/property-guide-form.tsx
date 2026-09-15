"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import type { Property } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updatePropertySchema, type UpdatePropertyInput } from "@/lib/validations/property";
import { CoverImageUploader } from "@/components/property/cover-image-uploader";

export function PropertyGuideForm({ property }: { property: Property }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdatePropertyInput>({
    resolver: zodResolver(updatePropertySchema),
    defaultValues: {
      name: property.name,
      address: property.address ?? "",
      welcomeMessage: property.welcomeMessage ?? "",
      wifiName: property.wifiName ?? "",
      wifiPassword: property.wifiPassword ?? "",
      checkInTime: property.checkInTime ?? "",
      checkInInstructions: property.checkInInstructions ?? "",
      checkOutTime: property.checkOutTime ?? "",
      checkOutInstructions: property.checkOutInstructions ?? "",
      houseRules: property.houseRules ?? "",
    },
  });

  async function onSubmit(data: UpdatePropertyInput) {
    setIsSubmitting(true);

    const response = await fetch(`/api/properties/${property.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      toast.error("Não foi possível salvar as alterações");
      return;
    }

    toast.success("Guia atualizado");
    router.refresh();
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Informações gerais</CardTitle>
          <CardDescription>
            Nome, endereço e uma mensagem de boas-vindas para o hóspede.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do imóvel</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Input id="address" {...register("address")} />
          </div>
          <div className="sm:col-span-2">
            <CoverImageUploader propertyId={property.id} initialUrl={property.coverImageUrl} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="welcomeMessage">Mensagem de boas-vindas</Label>
            <Textarea
              id="welcomeMessage"
              rows={3}
              placeholder="Seja bem-vindo(a)! Ficamos felizes em receber você…"
              {...register("welcomeMessage")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wi-Fi</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="wifiName">Nome da rede</Label>
            <Input id="wifiName" {...register("wifiName")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wifiPassword">Senha</Label>
            <Input id="wifiPassword" {...register("wifiPassword")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Check-in e check-out</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="checkInTime">Horário de check-in</Label>
            <Input id="checkInTime" placeholder="A partir das 14h" {...register("checkInTime")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="checkOutTime">Horário de check-out</Label>
            <Input id="checkOutTime" placeholder="Até as 11h" {...register("checkOutTime")} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="checkInInstructions">Como fazer o check-in</Label>
            <Textarea
              id="checkInInstructions"
              rows={3}
              placeholder="Onde retirar a chave, código do cofre, etc."
              {...register("checkInInstructions")}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="checkOutInstructions">Como fazer o check-out</Label>
            <Textarea
              id="checkOutInstructions"
              rows={3}
              placeholder="Onde deixar a chave, o que verificar antes de sair, etc."
              {...register("checkOutInstructions")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regras da casa</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            id="houseRules"
            rows={5}
            placeholder="Não é permitido fumar, silêncio após às 22h, etc."
            {...register("houseRules")}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando…" : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createPropertySchema,
  type CreatePropertyInput,
} from "@/lib/validations/property";

export default function NewPropertyPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePropertyInput>({ resolver: zodResolver(createPropertySchema) });

  async function onSubmit(data: CreatePropertyInput) {
    setIsSubmitting(true);

    const response = await fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      toast.error("Não foi possível criar o imóvel");
      return;
    }

    const { property } = await response.json();
    toast.success("Imóvel criado! Agora complete o guia.");
    router.push(`/app/propriedades/${property.id}`);
  }

  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle>Novo imóvel</CardTitle>
          <CardDescription>
            Dê um nome ao imóvel para começar a montar o guia digital dos hóspedes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="space-y-2">
              <Label htmlFor="name">Nome do imóvel</Label>
              <Input
                id="name"
                placeholder="Ex.: Casa de Praia Itamambuca"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Endereço (opcional)</Label>
              <Input id="address" placeholder="Rua, número, bairro, cidade" {...register("address")} />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Criando…" : "Criar imóvel"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

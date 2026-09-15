"use client";

import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";

import type { Property } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function PosterPanel({ property }: { property: Property }) {
  const [copied, setCopied] = useState(false);

  const guideUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/g/${property.slug}`
      : `/g/${property.slug}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(guideUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Link do guia</CardTitle>
          <CardDescription>
            Compartilhe este link com os hóspedes por WhatsApp, e-mail ou nas
            plataformas de reserva.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input readOnly value={guideUrl} />
            <Button type="button" variant="outline" size="icon" onClick={handleCopy}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </Button>
          </div>

          <div className="flex flex-col items-center gap-3 rounded-lg border bg-muted/30 p-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/properties/${property.id}/qrcode`}
              alt={`QR code do guia de ${property.name}`}
              width={200}
              height={200}
              className="rounded-md bg-white p-2"
            />
            <p className="text-center text-xs text-muted-foreground">
              Aponte a câmera do celular para acessar o guia
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cartaz para impressão</CardTitle>
          <CardDescription>
            Baixe um cartaz pronto em PDF, com o QR code, para deixar impresso
            no imóvel.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-4 py-10">
          <Button asChild size="lg">
            <a href={`/api/properties/${property.id}/poster`} download>
              <Download className="size-4" />
              Baixar cartaz em PDF
            </a>
          </Button>
          <p className="max-w-xs text-center text-xs text-muted-foreground">
            Formato A4, pronto para imprimir e deixar em um porta-retratos ou
            na porta de entrada.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

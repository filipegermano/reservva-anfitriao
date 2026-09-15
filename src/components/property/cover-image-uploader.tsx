"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export function CoverImageUploader({
  propertyId,
  initialUrl,
}: {
  propertyId: string;
  initialUrl: string | null;
}) {
  const [imageUrl, setImageUrl] = useState(initialUrl);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Formato não suportado. Envie JPG, PNG ou WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Arquivo muito grande. Tamanho máximo: 5MB.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    const response = await fetch(`/api/properties/${propertyId}/cover-image`, {
      method: "POST",
      body: formData,
    });
    setIsUploading(false);

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      toast.error(body?.error ?? "Não foi possível enviar a foto");
      return;
    }

    const { property } = await response.json();
    setImageUrl(property.coverImageUrl);
    toast.success("Foto de capa atualizada");
  }

  return (
    <div className="space-y-2">
      <Label>Foto de capa</Label>
      <div className="flex items-center gap-4">
        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/30">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="Foto de capa do imóvel" className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-6 text-muted-foreground" />
          )}
        </div>
        <div className="space-y-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            {imageUrl ? "Trocar foto" : "Enviar foto"}
          </Button>
          <p className="text-xs text-muted-foreground">JPG, PNG ou WebP — até 5MB.</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}

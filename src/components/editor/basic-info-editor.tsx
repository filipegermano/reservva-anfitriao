"use client";

import { ImagePlus } from "lucide-react";

import { propertyTypes } from "@/lib/guide/sections";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEditor } from "@/components/editor/editor-context";
import {
  AiButton,
  TextAreaField,
  TextField,
  UploadButton,
  useImageUpload,
} from "@/components/editor/fields";

export function BasicInfoEditor() {
  const { propertyId, editor } = useEditor();
  const { property } = editor.guide;
  const { upload, uploading } = useImageUpload(`/api/properties/${propertyId}/cover-image`);

  return (
    <div className="space-y-5">
      <TextField
        label="Título do guia"
        value={property.name}
        max={120}
        onChange={(name) => editor.updateProperty({ name })}
        hint={property.name.trim().length < 2 ? "O título precisa ter pelo menos 2 caracteres." : undefined}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="property-type">Tipo de imóvel</Label>
          <Select
            value={property.propertyType ?? undefined}
            onValueChange={(propertyType) => editor.updateProperty({ propertyType })}
          >
            <SelectTrigger id="property-type" className="w-full">
              <SelectValue placeholder="Selecione o tipo" />
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
        <TextField
          label="Cidade"
          value={property.city ?? ""}
          max={120}
          placeholder="Ex.: João Pessoa, Paraíba"
          onChange={(city) => editor.updateProperty({ city })}
        />
      </div>

      <TextField
        label="Endereço"
        value={property.address ?? ""}
        max={200}
        placeholder="Rua, número, bairro"
        hint="Usado no botão de mapa e nas buscas de lugares próximos."
        onChange={(address) => editor.updateProperty({ address })}
      />

      <TextField
        label="Mensagem de boas-vindas"
        value={property.welcomeMessage ?? ""}
        max={160}
        placeholder="Seja muito bem-vindo(a)!"
        onChange={(welcomeMessage) => editor.updateProperty({ welcomeMessage })}
        action={
          <AiButton
            task="welcome"
            onResult={({ welcomeMessage, shortDescription }) =>
              editor.updateProperty({
                welcomeMessage: welcomeMessage.slice(0, 160),
                shortDescription: shortDescription.slice(0, 200),
              })
            }
          />
        }
      />

      <TextAreaField
        label="Descrição curta"
        value={property.shortDescription ?? ""}
        max={200}
        rows={2}
        placeholder="Uma frase que aparece no início do guia"
        onChange={(shortDescription) => editor.updateProperty({ shortDescription })}
      />

      <div className="space-y-1.5">
        <Label>Imagem de capa</Label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex aspect-video w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/40 sm:w-48">
            {property.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={property.coverImageUrl} alt="Capa do guia" className="size-full object-cover" />
            ) : (
              <ImagePlus className="size-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <UploadButton
              uploading={uploading}
              label={property.coverImageUrl ? "Trocar capa" : "Enviar capa"}
              onFile={async ([file]) => {
                const result = await upload(file);
                const cover = (result?.property as { coverImageUrl?: string } | undefined)?.coverImageUrl;
                if (cover) editor.setCoverImage(cover);
              }}
            />
            {property.coverImageUrl && (
              <Button type="button" variant="ghost" size="sm" onClick={() => editor.updatePropertyNow({ removeCover: true })}>
                Remover
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          JPG, PNG ou WebP até 5MB. Você também pode usar uma foto de um ambiente como capa.
        </p>
      </div>

      <label className="flex items-center justify-between gap-3 rounded-lg border p-3">
        <span>
          <span className="block text-sm font-medium">Exibir capa de entrada</span>
          <span className="block text-xs text-muted-foreground">
            Tela de boas-vindas com a foto e o botão “Explorar Guia”
          </span>
        </span>
        <Switch
          checked={property.showCover}
          onCheckedChange={(showCover) => editor.updateProperty({ showCover })}
        />
      </label>
    </div>
  );
}

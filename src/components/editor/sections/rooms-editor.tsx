"use client";

import { ArrowLeft, ImageUp, X } from "lucide-react";
import { toast } from "sonner";

import type { SectionContent } from "@/lib/guide/sections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useEditor } from "@/components/editor/editor-context";
import { ListEditor, UploadButton, useImageUpload } from "@/components/editor/fields";

type Content = SectionContent<"rooms">;
type Room = Content["rooms"][number];

const MAX_PHOTOS = 30;

function RoomPhotos({ room, onChange }: { room: Room; onChange: (room: Room) => void }) {
  const { editor } = useEditor();
  const { upload, uploading } = useImageUpload();
  const coverUrl = editor.guide.property.coverImageUrl;

  async function addFiles(files: File[]) {
    const available = MAX_PHOTOS - room.photos.length;
    const urls: string[] = [];
    for (const file of files.slice(0, available)) {
      const result = await upload(file);
      if (typeof result?.url === "string") urls.push(result.url);
    }
    if (urls.length > 0) onChange({ ...room, photos: [...room.photos, ...urls] });
  }

  function moveFirst(index: number) {
    const photos = [...room.photos];
    const [photo] = photos.splice(index, 1);
    onChange({ ...room, photos: [photo, ...photos] });
  }

  async function setAsCover(url: string) {
    const ok = await editor.updatePropertyNow({ coverImageUrl: url });
    if (ok) toast.success("Foto de capa atualizada");
  }

  return (
    <div className="space-y-2">
      {room.photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {room.photos.map((url, index) => (
            <div key={url} className="group relative aspect-[4/3] overflow-hidden rounded-md border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="size-full object-cover" loading="lazy" />
              {url === coverUrl && (
                <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">Capa</span>
              )}
              <div className="absolute inset-x-1 top-1 flex justify-between opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                <div className="flex gap-1">
                  {index > 0 && (
                    <Button type="button" size="icon-xs" variant="secondary" aria-label="Mover para o início" onClick={() => moveFirst(index)}>
                      <ArrowLeft />
                    </Button>
                  )}
                  {url !== coverUrl && (
                    <Button type="button" size="icon-xs" variant="secondary" aria-label="Usar como capa do guia" title="Usar como capa" onClick={() => setAsCover(url)}>
                      <ImageUp />
                    </Button>
                  )}
                </div>
                <Button
                  type="button"
                  size="icon-xs"
                  variant="secondary"
                  aria-label="Remover foto"
                  onClick={() => onChange({ ...room, photos: room.photos.filter((photo) => photo !== url) })}
                >
                  <X />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      {room.photos.length < MAX_PHOTOS && (
        <UploadButton uploading={uploading} multiple label="Adicionar fotos" onFile={addFiles} />
      )}
    </div>
  );
}

export function RoomsEditor({
  content,
  onChange,
}: {
  content: Content;
  onChange: (content: Content) => void;
}) {
  return (
    <ListEditor
      items={content.rooms}
      max={40}
      addLabel="Adicionar ambiente"
      emptyText="Mostre cada cômodo com fotos: quarto, sala, cozinha, varanda…"
      createItem={() => ({ name: "", description: "", photos: [] })}
      onChange={(rooms) => onChange({ rooms })}
      renderItem={(room, update) => (
        <>
          <Input
            value={room.name}
            maxLength={120}
            aria-label="Nome do ambiente"
            placeholder="Nome do ambiente (ex.: Quarto de casal)"
            onChange={(event) => update({ ...room, name: event.target.value })}
          />
          <Textarea
            value={room.description}
            maxLength={2000}
            rows={2}
            aria-label="Descrição do ambiente"
            placeholder="Detalhes: tipo de cama, equipamentos, observações"
            onChange={(event) => update({ ...room, description: event.target.value })}
          />
          <RoomPhotos room={room} onChange={update} />
        </>
      )}
    />
  );
}

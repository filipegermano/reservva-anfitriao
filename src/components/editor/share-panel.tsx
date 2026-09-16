"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Mail,
  MessageCircle,
  Printer,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { posterLanguages, posterSizes, posterTemplates } from "@/lib/poster";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useEditor } from "@/components/editor/editor-context";

function Panel({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border bg-card p-4">
      <div>
        <h2 className="font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function SharePanel({ guideUrl }: { guideUrl: string }) {
  const { propertyId, editor } = useEditor();
  const { property } = editor.guide;
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [template, setTemplate] = useState("moderno");
  const [size, setSize] = useState<keyof typeof posterSizes>("A4");
  const [lang, setLang] = useState<keyof typeof posterLanguages>("pt");
  const [showImage, setShowImage] = useState(true);
  const [showWifi, setShowWifi] = useState(true);
  const [showRules, setShowRules] = useState(true);
  const [previewKey, setPreviewKey] = useState(0);

  const posterQuery = new URLSearchParams({
    template,
    size,
    lang,
    showImage: showImage ? "1" : "0",
    showWifi: showWifi ? "1" : "0",
    showRules: showRules ? "1" : "0",
  }).toString();
  const posterUrl = `/api/properties/${propertyId}/poster?${posterQuery}`;

  const shareText = `Olá! Aqui está o guia da sua estadia em ${property.name}: ${guideUrl}`;

  async function copyLink() {
    await navigator.clipboard.writeText(guideUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function togglePublished(published: boolean) {
    setPublishing(true);
    await editor.flushAll();
    const ok = await editor.updatePropertyNow({ published });
    setPublishing(false);
    if (ok) toast.success(published ? "Guia publicado! O link já pode ser enviado." : "Guia despublicado");
  }

  async function deleteProperty() {
    setDeleting(true);
    const response = await fetch(`/api/properties/${propertyId}`, { method: "DELETE" }).catch(() => null);
    if (!response?.ok) {
      setDeleting(false);
      toast.error("Não foi possível excluir o guia");
      return;
    }
    toast.success("Guia excluído");
    router.push("/app");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Panel title="Publicação" description="Só guias publicados abrem para os hóspedes.">
        <label className="flex items-center justify-between gap-3 rounded-lg border p-3">
          <span>
            <span className="flex items-center gap-2 text-sm font-medium">
              <span className={cn("size-2 rounded-full", property.published ? "bg-emerald-500" : "bg-amber-500")} />
              {property.published ? "Publicado" : "Rascunho"}
            </span>
            <span className="block text-xs text-muted-foreground">
              {property.published
                ? "Qualquer pessoa com o link ou QR code acessa o guia."
                : "Só você vê o guia (pela pré-visualização)."}
            </span>
          </span>
          <Switch checked={property.published} disabled={publishing} onCheckedChange={togglePublished} />
        </label>
      </Panel>

      <Panel title="Link e QR code" description="Envie o link antes da chegada e deixe o QR code impresso no imóvel.">
        <div className="flex gap-2">
          <Input readOnly value={guideUrl} aria-label="Link do guia" onFocus={(event) => event.target.select()} />
          <Button type="button" variant="outline" size="icon-lg" aria-label="Copiar link" onClick={copyLink}>
            {copied ? <Check /> : <Copy />}
          </Button>
          <Button asChild variant="outline" size="icon-lg" aria-label="Abrir guia">
            <a href={guideUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink />
            </a>
          </Button>
        </div>

        {!property.published && (
          <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
            O guia ainda não está publicado: o link só vai funcionar para os hóspedes depois de publicar.
          </p>
        )}

        <div className="flex flex-col items-center gap-4 sm:flex-row">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/properties/${propertyId}/qrcode`}
            alt={`QR code do guia de ${property.name}`}
            className="size-36 rounded-lg border bg-white p-2"
          />
          <div className="flex w-full flex-col gap-2">
            <Button asChild variant="outline">
              <a href={`/api/properties/${propertyId}/qrcode?download=1`} download>
                <Download /> Baixar QR code (PNG)
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer">
                <MessageCircle /> Enviar por WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={`mailto:?subject=${encodeURIComponent(`Guia da sua estadia — ${property.name}`)}&body=${encodeURIComponent(shareText)}`}>
                <Mail /> Enviar por e-mail
              </a>
            </Button>
          </div>
        </div>
      </Panel>

      <Panel title="Cartaz para impressão" description="Um cartaz de boas-vindas com Wi-Fi, horários, regras e o QR code do guia.">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {posterTemplates.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={template === item.id}
              onClick={() => setTemplate(item.id)}
              className={cn(
                "overflow-hidden rounded-lg border text-left transition hover:shadow-sm",
                template === item.id && "ring-2 ring-primary",
              )}
            >
              <div className="flex h-14 flex-col justify-between p-2" style={{ background: item.background }}>
                <div className="h-3 rounded-sm" style={{ background: item.banner ? item.accent : "transparent", borderBottom: item.banner ? undefined : `2px solid ${item.accent}` }} />
                <div className="h-3 w-1/2 self-end rounded-sm" style={{ background: item.accent }} />
              </div>
              <div className="p-2">
                <p className="text-xs font-medium">{item.name}</p>
                <p className="text-[11px] leading-tight text-muted-foreground">{item.description}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="poster-size">Tamanho</Label>
            <Select value={size} onValueChange={(value) => setSize(value as typeof size)}>
              <SelectTrigger id="poster-size" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(posterSizes).map((key) => (
                  <SelectItem key={key} value={key}>
                    {key}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="poster-lang">Idioma dos textos</Label>
            <Select value={lang} onValueChange={(value) => setLang(value as typeof lang)}>
              <SelectTrigger id="poster-lang" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(posterLanguages).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
            <span>
              Mostrar foto
              {!property.coverImageUrl && (
                <span className="block text-xs text-muted-foreground">Adicione uma capa ao guia</span>
              )}
            </span>
            <Switch
              checked={showImage && Boolean(property.coverImageUrl)}
              disabled={!property.coverImageUrl}
              onCheckedChange={setShowImage}
            />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
            Mostrar Wi-Fi
            <Switch checked={showWifi} onCheckedChange={setShowWifi} />
          </label>
          <label className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
            Mostrar regras
            <Switch checked={showRules} onCheckedChange={setShowRules} />
          </label>
        </div>

        <div className="overflow-hidden rounded-lg border bg-muted/40">
          <iframe
            key={`${posterQuery}-${previewKey}`}
            src={`${posterUrl}#toolbar=0&view=FitH`}
            title="Pré-visualização do cartaz"
            className="aspect-[1/1.414] w-full"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <a href={`${posterUrl}&download=1`} download>
              <Download /> Baixar PDF
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={posterUrl} target="_blank" rel="noopener noreferrer">
              <Printer /> Abrir para imprimir
            </a>
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={async () => {
              await editor.flushAll();
              setPreviewKey((key) => key + 1);
            }}
          >
            Atualizar prévia
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          O cartaz usa a foto de capa, o Wi-Fi, os horários, as primeiras regras e o contato do anfitrião cadastrados no guia.
        </p>
      </Panel>

      <Panel title="Zona de perigo">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 /> Excluir guia
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir “{property.name}”?</DialogTitle>
              <DialogDescription>
                O guia, as fotos enviadas e as avaliações serão apagados. O link e o QR code deixam de funcionar.
                Essa ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button variant="destructive" disabled={deleting} onClick={deleteProperty}>
                {deleting ? "Excluindo…" : "Excluir guia"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Panel>
    </div>
  );
}

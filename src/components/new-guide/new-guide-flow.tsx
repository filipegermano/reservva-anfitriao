"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ClipboardPaste,
  Link2,
  Loader2,
  PencilLine,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import type { ListingDraft } from "@/lib/import/listing-draft";
import { propertyTypes } from "@/lib/guide/sections";
import { cn } from "@/lib/utils";
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
import { DraftReview } from "@/components/new-guide/draft-review";

type Step =
  | { kind: "choose" }
  | { kind: "import"; source: "url" | "text" }
  | { kind: "review"; draft: ListingDraft; partial: boolean }
  | { kind: "manual" };

function OptionCard({
  icon: Icon,
  title,
  description,
  badge,
  disabled,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  badge?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-xl border bg-card p-4 text-left transition hover:border-primary hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-border disabled:hover:shadow-none"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2 font-medium">
          {title}
          {badge && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
              {badge}
            </span>
          )}
        </span>
        <span className="block text-sm text-muted-foreground">{description}</span>
      </span>
    </button>
  );
}

export function NewGuideFlow({ aiEnabled }: { aiEnabled: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>({ kind: "choose" });
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [manual, setManual] = useState({ name: "", address: "", propertyType: "" });

  async function runImport(source: "url" | "text") {
    setLoading(true);
    const response = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(source === "url" ? { url: url.trim() } : { text }),
    }).catch(() => null);
    const body = await response?.json().catch(() => null);
    setLoading(false);

    if (!response?.ok) {
      toast.error(body?.error ?? "Não foi possível ler o anúncio");
      return;
    }
    setStep({ kind: "review", draft: body.draft, partial: Boolean(body.partial) });
  }

  async function createGuide(payload: unknown) {
    const response = await fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => null);
    const body = await response?.json().catch(() => null);
    if (!response?.ok) {
      toast.error(body?.error ?? "Não foi possível criar o guia");
      return false;
    }
    toast.success("Guia criado! Revise as seções e publique quando estiver pronto.");
    router.push(`/app/propriedades/${body.property.id}`);
    return true;
  }

  const back = (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-2"
      onClick={() => setStep({ kind: "choose" })}
      disabled={loading}
    >
      <ArrowLeft /> Voltar
    </Button>
  );

  return (
    <div className={cn("mx-auto space-y-6", step.kind === "review" ? "max-w-4xl" : "max-w-xl")}>
      {step.kind === "choose" && (
        <>
          <div>
            <Button asChild variant="ghost" size="sm" className="-ml-2 mb-2">
              <Link href="/app">
                <ArrowLeft /> Meus guias
              </Link>
            </Button>
            <h1 className="text-2xl font-semibold tracking-tight">Criar guia</h1>
            <p className="text-muted-foreground">Escolha como quer começar.</p>
          </div>
          <div className="space-y-3">
            <OptionCard
              icon={Link2}
              title="Importar anúncio"
              badge="Recomendado"
              description="Cole o link do Airbnb (ou Booking, site próprio…) e o guia vem pré-preenchido com fotos, regras e comodidades."
              onClick={() => setStep({ kind: "import", source: "url" })}
            />
            <OptionCard
              icon={ClipboardPaste}
              title="Colar o texto do anúncio"
              description={
                aiEnabled
                  ? "Para sites que bloqueiam a leitura automática: a IA interpreta o texto e preenche o guia."
                  : "Disponível quando os recursos de IA estiverem configurados."
              }
              disabled={!aiEnabled}
              onClick={() => setStep({ kind: "import", source: "text" })}
            />
            <OptionCard
              icon={PencilLine}
              title="Criar manualmente"
              description="Comece com as seções essenciais e preencha você mesmo."
              onClick={() => setStep({ kind: "manual" })}
            />
          </div>
        </>
      )}

      {step.kind === "import" && (
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            void runImport(step.source);
          }}
        >
          {back}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {step.source === "url" ? "Importar de um anúncio" : "Colar o texto do anúncio"}
            </h1>
            <p className="text-muted-foreground">
              {step.source === "url"
                ? "Lemos o anúncio e preparamos um rascunho para você revisar. Nada é publicado sem sua confirmação."
                : "Copie a descrição, regras e comodidades do anúncio e cole abaixo."}
            </p>
          </div>

          {step.source === "url" ? (
            <div className="space-y-1.5">
              <Label htmlFor="listing-url">Link do anúncio</Label>
              <Input
                id="listing-url"
                type="url"
                required
                autoFocus
                value={url}
                disabled={loading}
                placeholder="https://www.airbnb.com.br/rooms/…"
                onChange={(event) => setUrl(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Alguns sites bloqueiam a leitura automática. Se falhar, use a opção “Colar o texto”.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="listing-text">Texto do anúncio</Label>
              <Textarea
                id="listing-text"
                required
                autoFocus
                rows={12}
                value={text}
                disabled={loading}
                maxLength={60000}
                onChange={(event) => setText(event.target.value)}
              />
            </div>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={loading || (step.source === "url" ? !url.trim() : text.trim().length < 40)}>
            {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {loading ? "Lendo o anúncio… isso pode levar até um minuto" : "Importar anúncio"}
          </Button>
        </form>
      )}

      {step.kind === "review" && (
        <DraftReview
          initialDraft={step.draft}
          partial={step.partial}
          onBack={() => setStep({ kind: "choose" })}
          onCreate={(draft) => createGuide({ mode: "draft", draft, confirmRights: true })}
        />
      )}

      {step.kind === "manual" && (
        <form
          className="space-y-5"
          onSubmit={async (event) => {
            event.preventDefault();
            setLoading(true);
            const ok = await createGuide({
              mode: "blank",
              name: manual.name,
              address: manual.address,
              ...(manual.propertyType ? { propertyType: manual.propertyType } : {}),
            });
            if (!ok) setLoading(false);
          }}
        >
          {back}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Novo guia</h1>
            <p className="text-muted-foreground">Dê um nome ao imóvel para começar.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="manual-name">Nome do imóvel</Label>
            <Input
              id="manual-name"
              required
              minLength={2}
              maxLength={120}
              autoFocus
              value={manual.name}
              placeholder="Ex.: Casa de Praia Itamambuca"
              onChange={(event) => setManual({ ...manual, name: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="manual-type">Tipo de imóvel</Label>
            <Select value={manual.propertyType} onValueChange={(propertyType) => setManual({ ...manual, propertyType })}>
              <SelectTrigger id="manual-type" className="w-full">
                <SelectValue placeholder="Selecione" />
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
            <Label htmlFor="manual-address">Endereço (opcional)</Label>
            <Input
              id="manual-address"
              maxLength={200}
              value={manual.address}
              placeholder="Rua, número, bairro, cidade"
              onChange={(event) => setManual({ ...manual, address: event.target.value })}
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading || manual.name.trim().length < 2}>
            {loading && <Loader2 className="animate-spin" />}
            {loading ? "Criando…" : "Criar guia"}
          </Button>
        </form>
      )}
    </div>
  );
}

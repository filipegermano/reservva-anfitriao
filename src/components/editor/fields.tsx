"use client";

import { useId, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import type { AiTask, AiTaskResult } from "@/lib/ai";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEditor } from "@/components/editor/editor-context";

export function Field({
  label,
  hint,
  count,
  max,
  action,
  children,
  className,
}: {
  label: string;
  hint?: string;
  count?: number;
  max?: number;
  action?: React.ReactNode;
  children: (id: string) => React.ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        <div className="flex items-center gap-2">
          {action}
          {max !== undefined && (
            <span className={cn("text-xs text-muted-foreground", (count ?? 0) > max && "text-destructive")}>
              {count ?? 0}/{max}
            </span>
          )}
        </div>
      </div>
      {children(id)}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  max,
  hint,
  type = "text",
  action,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  max?: number;
  hint?: string;
  type?: string;
  action?: React.ReactNode;
}) {
  return (
    <Field label={label} hint={hint} max={max} count={value.length} action={action}>
      {(id) => (
        <Input
          id={id}
          type={type}
          value={value}
          maxLength={max}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </Field>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  max,
  rows = 4,
  hint,
  action,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  max?: number;
  rows?: number;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <Field label={label} hint={hint} max={max} count={value.length} action={action}>
      {(id) => (
        <Textarea
          id={id}
          value={value}
          rows={rows}
          maxLength={max}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </Field>
  );
}

/** Lista editável genérica: adicionar, remover e reordenar itens. */
export function ListEditor<T>({
  items,
  onChange,
  renderItem,
  createItem,
  addLabel,
  emptyText,
  max = 100,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  renderItem: (item: T, update: (item: T) => void, index: number) => React.ReactNode;
  createItem: () => T;
  addLabel: string;
  emptyText?: string;
  max?: number;
}) {
  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-2">
      {items.length === 0 && emptyText && (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          {emptyText}
        </p>
      )}
      {items.map((item, index) => (
        <div key={index} className="flex gap-2 rounded-lg border bg-background p-2.5">
          <div className="min-w-0 flex-1 space-y-2">
            {renderItem(item, (updated) => onChange(items.map((current, i) => (i === index ? updated : current))), index)}
          </div>
          <div className="flex shrink-0 flex-col gap-1">
            <Button type="button" variant="ghost" size="icon-xs" aria-label="Mover para cima" disabled={index === 0} onClick={() => move(index, -1)}>
              <ArrowUp />
            </Button>
            <Button type="button" variant="ghost" size="icon-xs" aria-label="Mover para baixo" disabled={index === items.length - 1} onClick={() => move(index, 1)}>
              <ArrowDown />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              aria-label="Remover"
              className="text-destructive"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      ))}
      {items.length < max && (
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, createItem()])}>
          <Plus />
          {addLabel}
        </Button>
      )}
    </div>
  );
}

/** Lista de textos curtos em forma de etiquetas. */
export function TagInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const value = draft.trim();
    if (!value) return;
    if (!values.some((item) => item.toLowerCase() === value.toLowerCase())) {
      onChange([...values, value]);
    }
    setDraft("");
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={draft}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={add} disabled={!draft.trim()}>
          <Plus />
          Adicionar
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((value) => (
            <span key={value} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs">
              {value}
              <button
                type="button"
                aria-label={`Remover ${value}`}
                onClick={() => onChange(values.filter((item) => item !== value))}
                className="rounded-full p-0.5 hover:bg-background"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function useImageUpload(endpoint?: string) {
  const { propertyId } = useEditor();
  const [uploading, setUploading] = useState(false);

  async function upload(file: File): Promise<Record<string, unknown> | null> {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Formato não suportado. Envie JPG, PNG ou WebP.");
      return null;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Tamanho máximo: 5MB.");
      return null;
    }

    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      const response = await fetch(endpoint ?? `/api/properties/${propertyId}/images`, {
        method: "POST",
        body: formData,
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(body?.error ?? "Não foi possível enviar a imagem");
        return null;
      }
      return body;
    } catch {
      toast.error("Não foi possível enviar a imagem");
      return null;
    } finally {
      setUploading(false);
    }
  }

  return { upload, uploading };
}

export function UploadButton({
  onFile,
  uploading,
  label,
  multiple = false,
  variant = "outline",
}: {
  onFile: (files: File[]) => void;
  uploading: boolean;
  label: string;
  multiple?: boolean;
  variant?: "outline" | "default" | "secondary";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <Button type="button" variant={variant} size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
        {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}
        {label}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={multiple}
        className="hidden"
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          event.target.value = "";
          if (files.length > 0) onFile(files);
        }}
      />
    </>
  );
}

/** Foto única (ex.: anfitrião) com envio e remoção. */
export function ImageField({
  label,
  value,
  onChange,
  round = false,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  round?: boolean;
}) {
  const { upload, uploading } = useImageUpload();

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div className={cn("flex size-20 shrink-0 items-center justify-center overflow-hidden border bg-muted/40", round ? "rounded-full" : "rounded-lg")}>
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="size-full object-cover" />
          ) : (
            <ImagePlus className="size-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <UploadButton
            uploading={uploading}
            label={value ? "Trocar" : "Enviar foto"}
            onFile={async ([file]) => {
              const result = await upload(file);
              if (typeof result?.url === "string") onChange(result.url);
            }}
          />
          {value && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
              Remover
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">JPG, PNG ou WebP — até 5MB.</p>
    </div>
  );
}

export function AiButton<T extends AiTask>({
  task,
  onResult,
  label = "Gerar com IA",
}: {
  task: T;
  onResult: (result: AiTaskResult[T]) => void;
  label?: string;
}) {
  const { aiEnabled, propertyId, editor } = useEditor();
  const [loading, setLoading] = useState(false);
  if (!aiEnabled) return null;

  async function run() {
    setLoading(true);
    try {
      // Garante que a IA veja o que acabou de ser digitado.
      await editor.flushAll();
      const response = await fetch(`/api/properties/${propertyId}/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(body?.error ?? "Não foi possível gerar o texto");
        return;
      }
      onResult(body.result);
      toast.success("Texto gerado — revise antes de publicar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="secondary" size="xs" onClick={run} disabled={loading}>
      {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
      {loading ? "Gerando…" : label}
    </Button>
  );
}

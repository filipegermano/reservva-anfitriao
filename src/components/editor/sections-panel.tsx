"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import type { GuideSectionData } from "@/lib/guide/data";
import { basicInfoIcon, sectionMeta, sectionTypes, type SectionType } from "@/lib/guide/sections";
import { sectionHasContent } from "@/lib/guide/presence";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEditor } from "@/components/editor/editor-context";
import { BasicInfoEditor } from "@/components/editor/basic-info-editor";
import { SectionEditor } from "@/components/editor/section-editor";
import type { ReceivedFeedback } from "@/components/editor/sections/feedback-editor";

export type EditingTarget = "basic" | string | null;

function SectionRow({
  section,
  index,
  total,
  open,
  onToggleOpen,
  onDelete,
  feedbacks,
}: {
  section: GuideSectionData;
  index: number;
  total: number;
  open: boolean;
  onToggleOpen: () => void;
  onDelete: () => void;
  feedbacks: ReceivedFeedback[];
}) {
  const { editor } = useEditor();
  const meta = sectionMeta[section.type];
  const empty = !sectionHasContent(section);

  return (
    <div className={cn("rounded-xl border bg-card transition-shadow", open && "shadow-md ring-2 ring-primary/30")}>
      <div className="flex items-center gap-2 p-2.5 sm:gap-3 sm:p-3">
        <div className="flex flex-col">
          <Button type="button" variant="ghost" size="icon-xs" aria-label={`Mover ${section.title} para cima`} disabled={index === 0} onClick={() => editor.moveSection(section.id, -1)}>
            <ArrowUp />
          </Button>
          <Button type="button" variant="ghost" size="icon-xs" aria-label={`Mover ${section.title} para baixo`} disabled={index === total - 1} onClick={() => editor.moveSection(section.id, 1)}>
            <ArrowDown />
          </Button>
        </div>
        <button type="button" onClick={onToggleOpen} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <meta.icon className="size-4.5" />
          </span>
          <span className="min-w-0">
            <span className={cn("block truncate text-sm font-medium", !section.enabled && "text-muted-foreground line-through")}>
              {section.title}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {!section.enabled ? "Oculta para os hóspedes" : empty ? "Vazia — não aparece no guia" : meta.description}
            </span>
          </span>
        </button>
        <Switch
          checked={section.enabled}
          aria-label={section.enabled ? `Ocultar ${section.title}` : `Mostrar ${section.title}`}
          onCheckedChange={(enabled) => editor.updateSection(section.id, { enabled })}
        />
        <Button type="button" variant={open ? "secondary" : "ghost"} size="icon-sm" aria-label={`Editar ${section.title}`} aria-expanded={open} onClick={onToggleOpen}>
          {open ? <ChevronDown /> : <Pencil />}
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Excluir ${section.title}`} className="text-destructive" onClick={onDelete}>
          <Trash2 />
        </Button>
      </div>

      {open && (
        <div className="space-y-5 border-t p-4">
          <div className="space-y-1.5">
            <Label htmlFor={`title-${section.id}`}>Título da seção</Label>
            <Input
              id={`title-${section.id}`}
              value={section.title}
              maxLength={80}
              onChange={(event) => editor.updateSection(section.id, { title: event.target.value })}
            />
          </div>
          <SectionEditor
            section={section}
            feedbacks={feedbacks}
            onChange={(content) => editor.updateSection(section.id, { content })}
          />
        </div>
      )}
    </div>
  );
}

function AddSectionPalette({ onAdded }: { onAdded: (section: GuideSectionData) => void }) {
  const { editor } = useEditor();
  const [adding, setAdding] = useState<SectionType | null>(null);
  const existing = new Set(editor.guide.sections.map((section) => section.type));
  const available = sectionTypes.filter((type) => !existing.has(type));

  if (available.length === 0) {
    return <p className="text-sm text-muted-foreground">Todas as seções disponíveis já estão no guia.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {available.map((type) => {
        const meta = sectionMeta[type];
        return (
          <button
            key={type}
            type="button"
            disabled={adding !== null}
            onClick={async () => {
              setAdding(type);
              const section = await editor.addSection(type);
              setAdding(null);
              if (section) onAdded(section);
            }}
            className="flex items-start gap-2.5 rounded-lg border bg-card p-3 text-left transition hover:border-primary hover:shadow-sm disabled:opacity-60"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              {adding === type ? <Loader2 className="size-4 animate-spin" /> : <meta.icon className="size-4" />}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">{meta.label}</span>
              <span className="block text-xs leading-snug text-muted-foreground">{meta.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function SectionsPanel({
  editing,
  onEditingChange,
  feedbacks,
}: {
  editing: EditingTarget;
  onEditingChange: (target: EditingTarget) => void;
  feedbacks: ReceivedFeedback[];
}) {
  const { editor } = useEditor();
  const { sections } = editor.guide;
  const [toDelete, setToDelete] = useState<GuideSectionData | null>(null);
  const [showPalette, setShowPalette] = useState(false);
  const BasicIcon = basicInfoIcon;
  const progress = Math.round((sections.length / sectionTypes.length) * 100);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Progresso do guia</span>
          <span className="text-muted-foreground">
            {sections.length}/{sectionTypes.length} seções
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className={cn("rounded-xl border bg-card", editing === "basic" && "shadow-md ring-2 ring-primary/30")}>
        <button
          type="button"
          aria-expanded={editing === "basic"}
          onClick={() => onEditingChange(editing === "basic" ? null : "basic")}
          className="flex w-full items-center gap-3 p-3 text-left"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BasicIcon className="size-4.5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium">Informações básicas & boas-vindas</span>
            <span className="block text-xs text-muted-foreground">Título, capa, mensagem e endereço</span>
          </span>
          <ChevronDown className={cn("size-4 transition", editing === "basic" && "rotate-180")} />
        </button>
        {editing === "basic" && (
          <div className="border-t p-4">
            <BasicInfoEditor />
          </div>
        )}
      </div>

      <div className="space-y-2">
        {sections.map((section, index) => (
          <SectionRow
            key={section.id}
            section={section}
            index={index}
            total={sections.length}
            open={editing === section.id}
            feedbacks={feedbacks}
            onToggleOpen={() => onEditingChange(editing === section.id ? null : section.id)}
            onDelete={() => setToDelete(section)}
          />
        ))}
      </div>

      <div className="rounded-xl border border-dashed p-4">
        <button
          type="button"
          onClick={() => setShowPalette((value) => !value)}
          aria-expanded={showPalette}
          className="flex w-full items-center justify-between text-sm font-medium"
        >
          <span className="flex items-center gap-2">
            <Plus className="size-4" /> Adicionar seção
          </span>
          <ChevronDown className={cn("size-4 transition", showPalette && "rotate-180")} />
        </button>
        {showPalette && (
          <div className="mt-3">
            <AddSectionPalette
              onAdded={(section) => {
                setShowPalette(false);
                onEditingChange(section.id);
              }}
            />
          </div>
        )}
      </div>

      <Dialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir “{toDelete?.title}”?</DialogTitle>
            <DialogDescription>
              O conteúdo desta seção será apagado. Se quiser só escondê-la dos hóspedes, use o botão de
              ativar/desativar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!toDelete) return;
                if (editing === toDelete.id) onEditingChange(null);
                await editor.removeSection(toDelete.id);
                setToDelete(null);
              }}
            >
              Excluir seção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { Check, Plus } from "lucide-react";

import type { SectionContent } from "@/lib/guide/sections";
import { suggestedAmenities } from "@/lib/guide/sections";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AiButton,
  ListEditor,
  TagInput,
  TextAreaField,
  TextField,
} from "@/components/editor/fields";

type EditorProps<T extends keyof SectionMap> = {
  content: SectionMap[T];
  onChange: (content: SectionMap[T]) => void;
};

type SectionMap = {
  wifi: SectionContent<"wifi">;
  amenities: SectionContent<"amenities">;
  rules: SectionContent<"rules">;
  emergency: SectionContent<"emergency">;
  checkin: SectionContent<"checkin">;
  infoList: SectionContent<"transport">;
};

export function WifiEditor({ content, onChange }: EditorProps<"wifi">) {
  const set = (patch: Partial<SectionMap["wifi"]>) => onChange({ ...content, ...patch });
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Redes</Label>
        <ListEditor
          items={content.networks}
          max={10}
          addLabel="Adicionar rede"
          emptyText="Nenhuma rede configurada. O hóspede poderá copiar a senha e conectar por QR code."
          createItem={() => ({ name: "", password: "" })}
          onChange={(networks) => set({ networks })}
          renderItem={(network, update) => (
            <div className="grid gap-2 sm:grid-cols-2">
              <Input value={network.name} maxLength={120} aria-label="Nome da rede" placeholder="Nome da rede" onChange={(event) => update({ ...network, name: event.target.value })} />
              <Input value={network.password} maxLength={120} aria-label="Senha" placeholder="Senha" onChange={(event) => update({ ...network, password: event.target.value })} />
            </div>
          )}
        />
      </div>
      <TextAreaField
        label="Informações gerais"
        value={content.notes}
        rows={3}
        max={4000}
        placeholder="Onde fica o roteador, o que fazer se a internet cair…"
        onChange={(notes) => set({ notes })}
      />
      <TextAreaField
        label="Dicas de conexão"
        value={content.tips}
        rows={3}
        max={4000}
        onChange={(tips) => set({ tips })}
      />
    </div>
  );
}

export function AmenitiesEditor({ content, onChange }: EditorProps<"amenities">) {
  const selected = new Set(content.items.map((item) => item.toLowerCase()));
  const custom = content.items.filter(
    (item) => !suggestedAmenities.some((suggestion) => suggestion.toLowerCase() === item.toLowerCase()),
  );

  function toggle(amenity: string) {
    onChange({
      items: selected.has(amenity.toLowerCase())
        ? content.items.filter((item) => item.toLowerCase() !== amenity.toLowerCase())
        : [...content.items, amenity],
    });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Comodidades comuns</Label>
        <div className="flex flex-wrap gap-1.5">
          {suggestedAmenities.map((amenity) => {
            const active = selected.has(amenity.toLowerCase());
            return (
              <button
                key={amenity}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(amenity)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition",
                  active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
                )}
              >
                {active ? <Check className="size-3" /> : <Plus className="size-3" />}
                {amenity}
              </button>
            );
          })}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Outras comodidades ({custom.length})</Label>
        <TagInput
          values={custom}
          placeholder="Ex.: Cafeteira Nespresso"
          onChange={(values) =>
            onChange({
              items: [
                ...content.items.filter((item) => !custom.includes(item)),
                ...values,
              ],
            })
          }
        />
      </div>
    </div>
  );
}

export function RulesEditor({ content, onChange }: EditorProps<"rules">) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {content.rules.filter((rule) => rule.text).length} regras
        </p>
        <AiButton
          task="rules"
          label="Sugerir regras com IA"
          onResult={({ rules }) => onChange({ rules: rules.map((text) => ({ text })) })}
        />
      </div>
      <ListEditor
        items={content.rules}
        max={100}
        addLabel="Adicionar regra"
        emptyText="Ex.: Proibido fumar dentro do imóvel."
        createItem={() => ({ text: "" })}
        onChange={(rules) => onChange({ rules })}
        renderItem={(rule, update, index) => (
          <Textarea
            value={rule.text}
            rows={2}
            maxLength={1000}
            aria-label={`Regra ${index + 1}`}
            placeholder="Descreva a regra"
            onChange={(event) => update({ text: event.target.value })}
          />
        )}
      />
    </div>
  );
}

export function EmergencyEditor({ content, onChange }: EditorProps<"emergency">) {
  return (
    <ListEditor
      items={content.contacts}
      max={30}
      addLabel="Adicionar contato"
      createItem={() => ({ name: "", phone: "" })}
      onChange={(contacts) => onChange({ contacts })}
      renderItem={(contact, update) => (
        <div className="grid gap-2 sm:grid-cols-[1fr_10rem]">
          <Input value={contact.name} maxLength={120} aria-label="Nome" placeholder="Ex.: Hospital mais próximo" onChange={(event) => update({ ...contact, name: event.target.value })} />
          <Input value={contact.phone} maxLength={60} aria-label="Telefone" placeholder="Telefone" inputMode="tel" onChange={(event) => update({ ...contact, phone: event.target.value })} />
        </div>
      )}
    />
  );
}

export function CheckinEditor({ content, onChange }: EditorProps<"checkin">) {
  const set = (patch: Partial<SectionMap["checkin"]>) => onChange({ ...content, ...patch });
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Check-in a partir das" value={content.checkInTime} max={60} placeholder="14:00" onChange={(checkInTime) => set({ checkInTime })} />
        <TextField label="Check-out até as" value={content.checkOutTime} max={60} placeholder="11:00" onChange={(checkOutTime) => set({ checkOutTime })} />
      </div>
      <TextAreaField
        label="Instruções de chegada"
        value={content.checkInInstructions}
        max={4000}
        placeholder="Como chegar, onde estacionar, como se identificar na portaria…"
        onChange={(checkInInstructions) => set({ checkInInstructions })}
      />
      <TextAreaField
        label="Chaves e acesso"
        value={content.keyLocation}
        rows={2}
        max={1000}
        placeholder="Ex.: Cofre ao lado da porta, código 1234"
        onChange={(keyLocation) => set({ keyLocation })}
      />
      <TextAreaField
        label="Instruções de saída"
        value={content.checkOutInstructions}
        max={4000}
        placeholder="Onde deixar as chaves, lixo, ar-condicionado desligado…"
        onChange={(checkOutInstructions) => set({ checkOutInstructions })}
      />
      <label className="flex items-center justify-between gap-3 rounded-lg border p-3">
        <span>
          <span className="block text-sm font-medium">Horários flexíveis</span>
          <span className="block text-xs text-muted-foreground">Avisa que é possível combinar outro horário</span>
        </span>
        <Switch checked={content.flexible} onCheckedChange={(flexible) => set({ flexible })} />
      </label>
    </div>
  );
}

export function InfoListEditor({ content, onChange }: EditorProps<"infoList">) {
  return (
    <div className="space-y-4">
      <TextAreaField
        label="Introdução"
        value={content.intro}
        rows={2}
        max={4000}
        onChange={(intro) => onChange({ ...content, intro })}
      />
      <ListEditor
        items={content.items}
        max={100}
        addLabel="Adicionar tópico"
        emptyText="Adicione tópicos com título e explicação."
        createItem={() => ({ title: "", text: "" })}
        onChange={(items) => onChange({ ...content, items })}
        renderItem={(item, update) => (
          <>
            <Input value={item.title} maxLength={120} aria-label="Título" placeholder="Título" onChange={(event) => update({ ...item, title: event.target.value })} />
            <Textarea value={item.text} rows={2} maxLength={2000} aria-label="Texto" placeholder="Detalhes" onChange={(event) => update({ ...item, text: event.target.value })} />
          </>
        )}
      />
    </div>
  );
}

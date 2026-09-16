"use client";

import type { SectionContent } from "@/lib/guide/sections";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AiButton, TagInput, TextAreaField } from "@/components/editor/fields";

type Content = SectionContent<"about">;

const counters = [
  { key: "guests", label: "Hóspedes" },
  { key: "bedrooms", label: "Quartos" },
  { key: "beds", label: "Camas" },
  { key: "bathrooms", label: "Banheiros" },
] as const;

export function AboutEditor({
  content,
  onChange,
}: {
  content: Content;
  onChange: (content: Content) => void;
}) {
  const set = (patch: Partial<Content>) => onChange({ ...content, ...patch });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {counters.map(({ key, label }) => (
          <div key={key} className="space-y-1.5">
            <Label htmlFor={`about-${key}`}>{label}</Label>
            <Input
              id={`about-${key}`}
              type="number"
              min={0}
              max={999}
              value={content[key]}
              onChange={(event) =>
                set({ [key]: Math.max(0, Math.min(999, Number(event.target.value) || 0)) })
              }
            />
          </div>
        ))}
      </div>

      <TextAreaField
        label="Descrição"
        value={content.description}
        rows={6}
        max={4000}
        placeholder="Apresente o imóvel: espaços, estilo, localização e o que o torna especial"
        onChange={(description) => set({ description })}
        action={<AiButton task="description" onResult={({ description }) => set({ description })} />}
      />

      <div className="space-y-1.5">
        <Label>Diferenciais</Label>
        <TagInput
          values={content.features}
          placeholder="Ex.: Vista para o mar"
          onChange={(features) => set({ features })}
        />
      </div>
    </div>
  );
}

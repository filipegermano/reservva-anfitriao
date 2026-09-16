"use client";

import type { SectionContent } from "@/lib/guide/sections";
import { contactTypeLabels, contactTypes } from "@/lib/guide/sections";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AiButton,
  ImageField,
  ListEditor,
  TextAreaField,
  TextField,
} from "@/components/editor/fields";

type Content = SectionContent<"host">;

const contactPlaceholders: Record<Content["contacts"][number]["type"], string> = {
  whatsapp: "(83) 99999-9999",
  phone: "(83) 3333-4444",
  email: "voce@email.com",
  instagram: "@seuperfil",
  site: "https://seusite.com.br",
};

export function HostEditor({
  content,
  onChange,
}: {
  content: Content;
  onChange: (content: Content) => void;
}) {
  const set = (patch: Partial<Content>) => onChange({ ...content, ...patch });

  return (
    <div className="space-y-5">
      <ImageField label="Foto do anfitrião" value={content.photoUrl} round onChange={(photoUrl) => set({ photoUrl })} />

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Nome" value={content.name} max={120} placeholder="Seu nome" onChange={(name) => set({ name })} />
        <TextField
          label="Título"
          value={content.title}
          max={120}
          placeholder="Ex.: Superhost, Anfitriã experiente"
          onChange={(title) => set({ title })}
        />
      </div>

      <TextAreaField
        label="Apresentação"
        value={content.bio}
        max={2000}
        placeholder="Conte um pouco sobre você e como pode ajudar o hóspede"
        onChange={(bio) => set({ bio })}
        action={<AiButton task="hostBio" onResult={({ bio }) => set({ bio })} />}
      />

      <div className="space-y-2">
        <Label>Formas de contato</Label>
        <ListEditor<Content["contacts"][number]>
          items={content.contacts}
          max={10}
          addLabel="Adicionar contato"
          emptyText="Nenhum contato ainda. O primeiro da lista aparece em destaque para o hóspede."
          createItem={() => ({ type: "whatsapp", value: "" })}
          onChange={(contacts) => set({ contacts })}
          renderItem={(contact, update) => (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select
                value={contact.type}
                onValueChange={(type) => update({ ...contact, type: type as typeof contact.type })}
              >
                <SelectTrigger className="sm:w-36" aria-label="Tipo de contato">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {contactTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {contactTypeLabels[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={contact.value}
                maxLength={300}
                aria-label="Contato"
                placeholder={contactPlaceholders[contact.type]}
                onChange={(event) => update({ ...contact, value: event.target.value })}
              />
            </div>
          )}
        />
      </div>

      <div className="space-y-2">
        <Label>Outros anfitriões e contatos</Label>
        <ListEditor
          items={content.cohosts}
          max={10}
          addLabel="Adicionar pessoa"
          emptyText="Coanfitriões, gestores, caseiros ou portaria."
          createItem={() => ({ name: "", role: "", phone: "" })}
          onChange={(cohosts) => set({ cohosts })}
          renderItem={(cohost, update) => (
            <div className="grid gap-2 sm:grid-cols-3">
              <Input value={cohost.name} maxLength={120} aria-label="Nome" placeholder="Nome" onChange={(event) => update({ ...cohost, name: event.target.value })} />
              <Input value={cohost.role} maxLength={120} aria-label="Função" placeholder="Função (ex.: Portaria)" onChange={(event) => update({ ...cohost, role: event.target.value })} />
              <Input value={cohost.phone} maxLength={60} aria-label="Telefone" placeholder="Telefone" onChange={(event) => update({ ...cohost, phone: event.target.value })} />
            </div>
          )}
        />
      </div>
    </div>
  );
}

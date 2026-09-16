"use client";

import { Star } from "lucide-react";

import type { SectionContent } from "@/lib/guide/sections";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { TextAreaField, TextField } from "@/components/editor/fields";

type Content = SectionContent<"feedback">;

export type ReceivedFeedback = {
  id: string;
  rating: number;
  comment: string | null;
  guestName: string | null;
  createdAt: string;
};

function SwitchRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border p-3">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}

export function FeedbackEditor({
  content,
  onChange,
  feedbacks,
}: {
  content: Content;
  onChange: (content: Content) => void;
  feedbacks: ReceivedFeedback[];
}) {
  const set = (patch: Partial<Content>) => onChange({ ...content, ...patch });
  const average =
    feedbacks.length > 0
      ? feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0) / feedbacks.length
      : 0;

  return (
    <div className="space-y-5">
      <TextField label="Título" value={content.heading} max={120} onChange={(heading) => set({ heading })} />
      <TextAreaField label="Descrição" value={content.description} rows={2} max={1000} onChange={(description) => set({ description })} />

      <div className="grid gap-2">
        <SwitchRow
          label="Receber avaliações no guia"
          description="O hóspede dá uma nota de 1 a 5 estrelas"
          checked={content.showRating}
          onChange={(showRating) => set({ showRating })}
        />
        <SwitchRow
          label="Permitir comentários"
          description="Campo de texto junto com a nota"
          checked={content.allowComments}
          onChange={(allowComments) => set({ allowComments })}
        />
      </div>

      <div className="space-y-3">
        <Label>Links para avaliar nas plataformas</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Airbnb" type="url" value={content.airbnbUrl} max={1000} placeholder="https://www.airbnb.com.br/rooms/…" onChange={(airbnbUrl) => set({ airbnbUrl })} />
          <TextField label="Booking.com" type="url" value={content.bookingUrl} max={1000} placeholder="https://www.booking.com/hotel/…" onChange={(bookingUrl) => set({ bookingUrl })} />
          <TextField label="Google" type="url" value={content.googleUrl} max={1000} placeholder="Link do Perfil da Empresa" onChange={(googleUrl) => set({ googleUrl })} />
          <TextField label="TripAdvisor" type="url" value={content.tripadvisorUrl} max={1000} onChange={(tripadvisorUrl) => set({ tripadvisorUrl })} />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Contato para feedback</Label>
        <div className="grid gap-3 sm:grid-cols-3">
          <TextField label="WhatsApp" value={content.whatsapp} max={60} onChange={(whatsapp) => set({ whatsapp })} />
          <TextField label="E-mail" type="email" value={content.email} max={200} onChange={(email) => set({ email })} />
          <TextField label="Telefone" value={content.phone} max={60} onChange={(phone) => set({ phone })} />
        </div>
      </div>

      <TextField label="Mensagem de incentivo" value={content.incentiveMessage} max={500} onChange={(incentiveMessage) => set({ incentiveMessage })} />
      <TextField label="Mensagem de agradecimento" value={content.thanksMessage} max={500} onChange={(thanksMessage) => set({ thanksMessage })} />

      <div className="space-y-2 rounded-lg border p-3">
        <div className="flex items-center justify-between">
          <Label>Avaliações recebidas</Label>
          {feedbacks.length > 0 && (
            <span className="flex items-center gap-1 text-sm font-medium">
              <Star className="size-4 fill-amber-400 text-amber-400" />
              {average.toFixed(1)} · {feedbacks.length}
            </span>
          )}
        </div>
        {feedbacks.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma avaliação recebida ainda.</p>
        ) : (
          <ul className="max-h-72 space-y-2 overflow-y-auto">
            {feedbacks.map((feedback) => (
              <li key={feedback.id} className="rounded-md bg-muted/40 p-2.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-amber-500" aria-label={`${feedback.rating} estrelas`}>
                    {"★".repeat(feedback.rating)}
                    <span className="text-muted-foreground/40">{"★".repeat(5 - feedback.rating)}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(feedback.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                {feedback.comment && <p className="mt-1">{feedback.comment}</p>}
                {feedback.guestName && <p className="mt-1 text-xs text-muted-foreground">— {feedback.guestName}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

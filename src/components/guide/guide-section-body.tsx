"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  BedDouble,
  Bath,
  Check,
  ExternalLink,
  Globe,
  AtSign,
  KeyRound,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Star,
  Users,
  DoorOpen,
} from "lucide-react";

import type { GuideData, GuideRecommendation, GuideSectionData } from "@/lib/guide/data";
import { mapsSearchUrl } from "@/lib/guide/data";
import { contactHref, externalUrl, imageSrc, phoneUrl } from "@/lib/guide/contacts";
import { recommendationsFor } from "@/lib/guide/presence";
import { contactTypeLabels, isInfoListType, type SectionContent } from "@/lib/guide/sections";
import {
  recommendationCategoryIcons,
  recommendationCategoryLabels,
} from "@/lib/recommendation-categories";
import {
  gButtonClass,
  GCard,
  GCopyRow,
  GHeading,
  GLabel,
  GMuted,
  GText,
} from "@/components/guide/guide-ui";
import { cn } from "@/lib/utils";

type BodyProps = {
  guide: GuideData;
  section: GuideSectionData;
  preview: boolean;
};

const contactIcons = {
  whatsapp: MessageCircle,
  phone: Phone,
  email: Mail,
  instagram: AtSign,
  site: Globe,
};

export function ContactButtons({ contacts }: { contacts: SectionContent<"host">["contacts"] }) {
  const valid = contacts.flatMap((contact) => {
    const href = contactHref(contact.type, contact.value);
    return href ? [{ ...contact, href }] : [];
  });
  if (valid.length === 0) return null;

  return (
    <div className="grid gap-2">
      {valid.map((contact, index) => {
        const Icon = contactIcons[contact.type];
        return (
          <a
            key={index}
            href={contact.href}
            target={contact.href.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            className={cn(gButtonClass(index === 0 ? "primary" : "outline"), "justify-start")}
          >
            <Icon className="size-4" />
            <span className="truncate">
              {contactTypeLabels[contact.type]} · {contact.value}
            </span>
          </a>
        );
      })}
    </div>
  );
}

function HostBody({ content }: { content: SectionContent<"host"> }) {
  const photo = imageSrc(content.photoUrl);
  return (
    <div className="space-y-4">
      <GCard className="flex flex-col items-center gap-2 text-center">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={content.name} className="size-24 rounded-full object-cover shadow" />
        ) : (
          <div className="flex size-24 items-center justify-center rounded-full bg-[var(--g-bg)] text-3xl font-semibold text-[var(--g-primary)]">
            {content.name.slice(0, 1).toUpperCase() || "?"}
          </div>
        )}
        {content.name && <GHeading className="text-xl">{content.name}</GHeading>}
        {content.title && (
          <span className="rounded-full bg-[var(--g-bg)] px-3 py-0.5 text-xs font-medium text-[var(--g-primary)]">
            {content.title}
          </span>
        )}
        {content.bio && <GText className="text-[var(--g-muted)]">{content.bio}</GText>}
      </GCard>

      <ContactButtons contacts={content.contacts} />

      {content.cohosts.some((cohost) => cohost.name) && (
        <GCard className="space-y-3">
          <GLabel>Outros contatos</GLabel>
          {content.cohosts
            .filter((cohost) => cohost.name)
            .map((cohost, index) => {
              const href = phoneUrl(cohost.phone);
              return (
                <div key={index} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">{cohost.name}</p>
                    {cohost.role && <GMuted>{cohost.role}</GMuted>}
                  </div>
                  {href && (
                    <a href={href} className={gButtonClass("outline")} aria-label={`Ligar para ${cohost.name}`}>
                      <Phone className="size-4" />
                    </a>
                  )}
                </div>
              );
            })}
        </GCard>
      )}
    </div>
  );
}

function AboutBody({ content }: { content: SectionContent<"about"> }) {
  const stats = [
    { icon: Users, value: content.guests, label: "hóspedes" },
    { icon: DoorOpen, value: content.bedrooms, label: content.bedrooms === 1 ? "quarto" : "quartos" },
    { icon: BedDouble, value: content.beds, label: content.beds === 1 ? "cama" : "camas" },
    { icon: Bath, value: content.bathrooms, label: content.bathrooms === 1 ? "banheiro" : "banheiros" },
  ].filter((stat) => stat.value > 0);

  return (
    <div className="space-y-4">
      {stats.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {stats.map(({ icon: Icon, value, label }) => (
            <GCard key={label} className="flex items-center gap-3 p-3">
              <Icon className="size-5 text-[var(--g-primary)]" />
              <p>
                <span className="text-lg font-semibold">{value}</span>{" "}
                <span className="text-sm text-[var(--g-muted)]">{label}</span>
              </p>
            </GCard>
          ))}
        </div>
      )}
      {content.description && (
        <GCard>
          <GText>{content.description}</GText>
        </GCard>
      )}
      {content.features.length > 0 && (
        <GCard className="space-y-2">
          <GLabel>Diferenciais</GLabel>
          <ul className="space-y-1.5">
            {content.features.map((feature, index) => (
              <li key={index} className="flex gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-[var(--g-primary)]" />
                {feature}
              </li>
            ))}
          </ul>
        </GCard>
      )}
    </div>
  );
}

function RoomsBody({ content }: { content: SectionContent<"rooms"> }) {
  return (
    <div className="space-y-4">
      {content.rooms
        .filter((room) => room.name || room.photos.length)
        .map((room, index) => {
          const photos = room.photos.map(imageSrc).filter((src): src is string => Boolean(src));
          return (
            <GCard key={index} className="space-y-3 overflow-hidden p-0">
              {photos.length > 0 && (
                <div className="flex snap-x snap-mandatory gap-1 overflow-x-auto">
                  {photos.map((src) => (
                    <a
                      key={src}
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn("aspect-[4/3] shrink-0 snap-start", photos.length > 1 ? "w-[85%]" : "w-full")}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={room.name} loading="lazy" className="size-full object-cover" />
                    </a>
                  ))}
                </div>
              )}
              <div className="space-y-1 px-4 pb-4">
                <GHeading className="text-base">{room.name}</GHeading>
                {room.description && <GMuted className="whitespace-pre-line">{room.description}</GMuted>}
                {photos.length > 1 && (
                  <p className="text-xs text-[var(--g-muted)]">{photos.length} fotos · deslize para ver</p>
                )}
              </div>
            </GCard>
          );
        })}
    </div>
  );
}

function wifiQrPayload(name: string, password: string) {
  const escape = (value: string) => value.replace(/([\\;,:"])/g, "\\$1");
  return `WIFI:T:${password ? "WPA" : "nopass"};S:${escape(name)};P:${escape(password)};;`;
}

function WifiQr({ name, password }: { name: string; password: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(wifiQrPayload(name, password), { margin: 1, width: 360 })
      .then((url) => active && setSrc(url))
      .catch(() => active && setSrc(null));
    return () => {
      active = false;
    };
  }, [name, password]);

  if (!src) return null;
  return (
    <div className="flex items-center gap-3 rounded-[calc(var(--g-radius)*0.75)] bg-[var(--g-bg)] p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={`QR code da rede ${name}`} className="size-24 rounded bg-white p-1" />
      <GMuted>Aponte a câmera de outro aparelho para conectar automaticamente.</GMuted>
    </div>
  );
}

function WifiBody({ content }: { content: SectionContent<"wifi"> }) {
  const networks = content.networks.filter((network) => network.name || network.password);
  return (
    <div className="space-y-4">
      {networks.map((network, index) => (
        <GCard key={index} className="space-y-2">
          {networks.length > 1 && <GLabel>Rede {index + 1}</GLabel>}
          {network.name && <GCopyRow label="Rede" value={network.name} />}
          {network.password && <GCopyRow label="Senha" value={network.password} />}
          {network.name && <WifiQr name={network.name} password={network.password} />}
        </GCard>
      ))}
      {content.notes && (
        <GCard>
          <GLabel className="mb-1">Informações</GLabel>
          <GText>{content.notes}</GText>
        </GCard>
      )}
      {content.tips && (
        <GCard>
          <GLabel className="mb-1">Dicas de conexão</GLabel>
          <GText>{content.tips}</GText>
        </GCard>
      )}
    </div>
  );
}

function AmenitiesBody({ content }: { content: SectionContent<"amenities"> }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {content.items.map((item) => (
        <div
          key={item}
          className="flex items-center gap-2 rounded-[calc(var(--g-radius)*0.75)] border border-[var(--g-border)] bg-[var(--g-surface)] px-3 py-2.5 text-sm"
        >
          <Check className="size-4 shrink-0 text-[var(--g-primary)]" />
          <span className="min-w-0">{item}</span>
        </div>
      ))}
    </div>
  );
}

function RulesBody({ content }: { content: SectionContent<"rules"> }) {
  return (
    <ol className="space-y-2">
      {content.rules
        .filter((rule) => rule.text)
        .map((rule, index) => (
          <li key={index}>
            <GCard className="flex gap-3 p-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--g-primary)] text-xs font-semibold text-[var(--g-primary-fg)]">
                {index + 1}
              </span>
              <GText className="pt-0.5">{rule.text}</GText>
            </GCard>
          </li>
        ))}
    </ol>
  );
}

function EmergencyBody({ content }: { content: SectionContent<"emergency"> }) {
  return (
    <div className="space-y-2">
      {content.contacts
        .filter((contact) => contact.phone)
        .map((contact, index) => {
          const href = phoneUrl(contact.phone);
          return (
            <GCard key={index} className="flex items-center justify-between gap-3 p-3">
              <div>
                <p className="font-medium">{contact.name}</p>
                <p className="text-xl font-semibold text-[var(--g-primary)]">{contact.phone}</p>
              </div>
              {href && (
                <a href={href} className={gButtonClass()}>
                  <Phone className="size-4" />
                  Ligar
                </a>
              )}
            </GCard>
          );
        })}
    </div>
  );
}

function CheckinBody({ content }: { content: SectionContent<"checkin"> }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Check-in", value: content.checkInTime, hint: "a partir das" },
          { label: "Check-out", value: content.checkOutTime, hint: "até as" },
        ].map((item) => (
          <GCard key={item.label} className="text-center">
            <GLabel>{item.label}</GLabel>
            <p className="mt-1 text-xs text-[var(--g-muted)]">{item.value ? item.hint : "—"}</p>
            <p className="text-2xl font-semibold">{item.value || "A combinar"}</p>
          </GCard>
        ))}
      </div>
      {content.flexible && (
        <GMuted className="text-center">
          Precisa de outro horário? Fale com o anfitrião — sempre que possível ajustamos.
        </GMuted>
      )}
      {content.keyLocation && (
        <GCard className="flex gap-3">
          <KeyRound className="size-5 shrink-0 text-[var(--g-primary)]" />
          <div>
            <GLabel>Chaves e acesso</GLabel>
            <GText className="mt-1">{content.keyLocation}</GText>
          </div>
        </GCard>
      )}
      {content.checkInInstructions && (
        <GCard>
          <GLabel className="mb-1">Na chegada</GLabel>
          <GText>{content.checkInInstructions}</GText>
        </GCard>
      )}
      {content.checkOutInstructions && (
        <GCard>
          <GLabel className="mb-1">Na saída</GLabel>
          <GText>{content.checkOutInstructions}</GText>
        </GCard>
      )}
    </div>
  );
}

function RecommendationList({ items }: { items: GuideRecommendation[] }) {
  const grouped = new Map<string, GuideRecommendation[]>();
  for (const item of items) grouped.set(item.category, [...(grouped.get(item.category) ?? []), item]);

  return (
    <div className="space-y-4">
      {[...grouped.entries()].map(([category, list]) => {
        const Icon = recommendationCategoryIcons[category as GuideRecommendation["category"]] ?? MapPin;
        return (
          <div key={category} className="space-y-2">
            <GLabel className="flex items-center gap-1.5">
              <Icon className="size-3.5" />
              {recommendationCategoryLabels[category as GuideRecommendation["category"]]}
            </GLabel>
            {list.map((item) => {
              const href = item.mapsUrl ? externalUrl(item.mapsUrl) : null;
              return (
                <GCard key={item.id} className="p-3">
                  <p className="font-medium">{item.name}</p>
                  {item.description && <GMuted className="mt-0.5">{item.description}</GMuted>}
                  {href && (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[var(--g-primary)]"
                    >
                      <MapPin className="size-3.5" /> Ver no mapa
                    </a>
                  )}
                </GCard>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

const nearbySearches = {
  local_tips: ["Mercados", "Farmácias", "Atrações turísticas", "Praias", "Padarias", "Postos de combustível"],
  restaurants: ["Restaurantes", "Cafés", "Bares", "Pizzarias", "Delivery"],
};

function NearbyBody({
  guide,
  type,
  intro,
}: {
  guide: GuideData;
  type: "local_tips" | "restaurants";
  intro: string;
}) {
  const items = recommendationsFor(type, guide.recommendations);
  const hasLocation = Boolean(
    guide.property.address || guide.property.city || guide.property.latitude != null,
  );

  return (
    <div className="space-y-4">
      {intro && (
        <GCard>
          <GText>{intro}</GText>
        </GCard>
      )}
      {items.length > 0 && (
        <div className="space-y-2">
          <GLabel>Indicações do anfitrião</GLabel>
          <RecommendationList items={items} />
        </div>
      )}
      {hasLocation && (
        <GCard className="space-y-3">
          <GLabel>Explorar por perto</GLabel>
          <div className="flex flex-wrap gap-2">
            {nearbySearches[type].map((query) => (
              <a
                key={query}
                href={mapsSearchUrl(query, guide.property)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-[var(--g-border)] px-3 py-1.5 text-sm"
              >
                {query}
                <ExternalLink className="size-3" />
              </a>
            ))}
          </div>
        </GCard>
      )}
    </div>
  );
}

function FeedbackBody({ guide, content, preview }: { guide: GuideData; content: SectionContent<"feedback">; preview: boolean }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const links = [
    { label: "Airbnb", url: content.airbnbUrl },
    { label: "Booking.com", url: content.bookingUrl },
    { label: "Google", url: content.googleUrl },
    { label: "TripAdvisor", url: content.tripadvisorUrl },
  ].flatMap((link) => {
    const href = externalUrl(link.url);
    return href ? [{ ...link, href }] : [];
  });

  const contacts = [
    { type: "whatsapp" as const, value: content.whatsapp },
    { type: "email" as const, value: content.email },
    { type: "phone" as const, value: content.phone },
  ];

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!rating || preview) return;
    setStatus("sending");
    const response = await fetch(`/api/guides/${guide.property.slug}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment, guestName: name }),
    }).catch(() => null);
    setStatus(response?.ok ? "sent" : "error");
  }

  return (
    <div className="space-y-4">
      <GCard className="text-center">
        {content.heading && <GHeading>{content.heading}</GHeading>}
        {content.description && <GMuted className="mt-1">{content.description}</GMuted>}
      </GCard>

      {content.showRating && (
        <GCard>
          {status === "sent" ? (
            <p className="py-4 text-center font-medium">{content.thanksMessage || "Obrigado!"}</p>
          ) : (
            <form className="space-y-3" onSubmit={submit}>
              <div className="flex justify-center gap-1" role="radiogroup" aria-label="Nota">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={rating === value}
                    aria-label={`${value} estrela${value > 1 ? "s" : ""}`}
                    onClick={() => setRating(value)}
                    className="p-1"
                  >
                    <Star
                      className={cn(
                        "size-8 transition",
                        value <= rating ? "fill-amber-400 text-amber-400" : "text-[var(--g-border)]",
                      )}
                    />
                  </button>
                ))}
              </div>
              {content.allowComments && (
                <>
                  <textarea
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                    maxLength={1000}
                    rows={3}
                    placeholder="Conte como foi sua estadia (opcional)"
                    className="w-full rounded-[calc(var(--g-radius)*0.75)] border border-[var(--g-border)] bg-[var(--g-bg)] p-3 text-sm outline-none focus:border-[var(--g-primary)]"
                  />
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={80}
                    placeholder="Seu nome (opcional)"
                    className="w-full rounded-[calc(var(--g-radius)*0.75)] border border-[var(--g-border)] bg-[var(--g-bg)] p-3 text-sm outline-none focus:border-[var(--g-primary)]"
                  />
                </>
              )}
              {status === "error" && (
                <p className="text-center text-sm text-red-600">Não foi possível enviar. Tente novamente.</p>
              )}
              <button
                type="submit"
                disabled={!rating || status === "sending" || preview}
                className={cn(gButtonClass(), "w-full")}
              >
                {preview ? "Envio desativado na pré-visualização" : status === "sending" ? "Enviando…" : "Enviar avaliação"}
              </button>
            </form>
          )}
        </GCard>
      )}

      {links.length > 0 && (
        <GCard className="space-y-3">
          {content.incentiveMessage && <p className="text-center text-sm font-medium">{content.incentiveMessage}</p>}
          <div className="grid gap-2">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={gButtonClass("outline")}
              >
                <Star className="size-4" />
                Avaliar no {link.label}
              </a>
            ))}
          </div>
        </GCard>
      )}

      {contacts.some((contact) => contact.value) && (
        <div className="space-y-2">
          <GLabel>Fale com a gente</GLabel>
          <ContactButtons contacts={contacts} />
        </div>
      )}
    </div>
  );
}

function InfoListBody({ content }: { content: SectionContent<"transport"> }) {
  return (
    <div className="space-y-3">
      {content.intro && (
        <GCard>
          <GText>{content.intro}</GText>
        </GCard>
      )}
      {content.items
        .filter((item) => item.title || item.text)
        .map((item, index) => (
          <GCard key={index}>
            {item.title && <GHeading className="text-base">{item.title}</GHeading>}
            {item.text && <GText className="mt-1 text-[var(--g-muted)]">{item.text}</GText>}
          </GCard>
        ))}
    </div>
  );
}

export function GuideSectionBody({ guide, section, preview }: BodyProps) {
  if (isInfoListType(section.type)) {
    return <InfoListBody content={section.content as SectionContent<"transport">} />;
  }

  switch (section.type) {
    case "host":
      return <HostBody content={section.content} />;
    case "about":
      return <AboutBody content={section.content} />;
    case "rooms":
      return <RoomsBody content={section.content} />;
    case "wifi":
      return <WifiBody content={section.content} />;
    case "amenities":
      return <AmenitiesBody content={section.content} />;
    case "rules":
      return <RulesBody content={section.content} />;
    case "emergency":
      return <EmergencyBody content={section.content} />;
    case "checkin":
      return <CheckinBody content={section.content} />;
    case "local_tips":
    case "restaurants":
      return <NearbyBody guide={guide} type={section.type} intro={section.content.intro} />;
    case "feedback":
      return <FeedbackBody guide={guide} content={section.content} preview={preview} />;
    default:
      return null;
  }
}

export function EmptySectionNotice() {
  return (
    <GCard className="text-center">
      <GMuted>Esta seção ainda está vazia. Preencha no editor para ela aparecer para os hóspedes.</GMuted>
    </GCard>
  );
}

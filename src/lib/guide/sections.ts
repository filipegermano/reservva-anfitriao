import { z } from "zod";

import { illustrationIds } from "@/components/guide/illustrations/ids";
import {
  Accessibility,
  BedDouble,
  Bus,
  CalendarDays,
  Clock,
  Crown,
  House,
  Info,
  ListChecks,
  MapPin,
  MessageSquareHeart,
  Mountain,
  ScrollText,
  ShieldCheck,
  Siren,
  Sofa,
  Store,
  User,
  Utensils,
  Wifi,
} from "lucide-react";

const text = (max = 4000) => z.string().trim().max(max).catch("");
const list = <T extends z.ZodType>(item: T, max = 100) => z.array(item).max(max).catch([]);

/** `illustration`: id de um desenho pronto (ver components/guide/illustrations). */
const infoItemSchema = z.object({
  title: text(120),
  text: text(2000),
  illustration: z.enum(illustrationIds).nullish().catch(null).default(null),
  /** Vídeo curto enviado pelo anfitrião (URL de /api/uploads). */
  video: text(1000),
});

/** Seções genéricas (Transporte, Segurança...) são uma lista de tópicos. */
const infoListSchema = z.object({ intro: text(), items: list(infoItemSchema) });

export const contactTypes = ["whatsapp", "phone", "email", "instagram", "site"] as const;

export const contactTypeLabels: Record<(typeof contactTypes)[number], string> = {
  whatsapp: "WhatsApp",
  phone: "Telefone",
  email: "E-mail",
  instagram: "Instagram",
  site: "Site",
};

const sectionSchemas = {
  host: z.object({
    name: text(120),
    title: text(120),
    bio: text(),
    photoUrl: text(1000),
    contacts: list(
      z.object({ type: z.enum(contactTypes).catch("whatsapp"), value: text(300) }),
      10,
    ),
    cohosts: list(z.object({ name: text(120), role: text(120), phone: text(60) }), 10),
  }),
  about: z.object({
    guests: z.coerce.number().int().min(0).max(999).catch(0),
    bedrooms: z.coerce.number().int().min(0).max(999).catch(0),
    beds: z.coerce.number().int().min(0).max(999).catch(0),
    bathrooms: z.coerce.number().int().min(0).max(999).catch(0),
    description: text(),
    features: list(text(200)),
  }),
  rooms: z.object({
    rooms: list(
      z.object({ name: text(120), description: text(2000), photos: list(text(1000), 30) }),
      40,
    ),
  }),
  wifi: z.object({
    networks: list(z.object({ name: text(120), password: text(120) }), 10),
    notes: text(),
    tips: text(),
  }),
  amenities: z.object({ items: list(text(120), 200) }),
  rules: z.object({ rules: list(z.object({ text: text(1000) })) }),
  emergency: z.object({ contacts: list(z.object({ name: text(120), phone: text(60) }), 30) }),
  checkin: z.object({
    checkInTime: text(60),
    checkOutTime: text(60),
    checkInInstructions: text(),
    checkOutInstructions: text(),
    keyLocation: text(1000),
    flexible: z.boolean().catch(false),
  }),
  local_tips: z.object({ intro: text() }),
  restaurants: z.object({ intro: text() }),
  feedback: z.object({
    heading: text(120),
    description: text(1000),
    showRating: z.boolean().catch(true),
    allowComments: z.boolean().catch(true),
    whatsapp: text(60),
    email: text(200),
    phone: text(60),
    airbnbUrl: text(1000),
    bookingUrl: text(1000),
    googleUrl: text(1000),
    tripadvisorUrl: text(1000),
    incentiveMessage: text(500),
    thanksMessage: text(500),
  }),
  transport: infoListSchema,
  instructions: infoListSchema,
  sofa_bed: infoListSchema,
  safety: infoListSchema,
  events: infoListSchema,
  activities: infoListSchema,
  services: infoListSchema,
  accessibility: infoListSchema,
} satisfies Record<string, z.ZodType>;

export type SectionType = keyof typeof sectionSchemas;
export type SectionContent<T extends SectionType = SectionType> = z.infer<
  (typeof sectionSchemas)[T]
>;

export const sectionTypes = Object.keys(sectionSchemas) as SectionType[];

export function isSectionType(value: string): value is SectionType {
  return value in sectionSchemas;
}

/** Normaliza o JSON salvo no banco, preenchendo o que estiver faltando. */
export function parseSectionContent<T extends SectionType>(
  type: T,
  raw: unknown,
): SectionContent<T> {
  const schema = sectionSchemas[type] as unknown as z.ZodType<SectionContent<T>>;
  const parsed = schema.safeParse(raw ?? {});
  return parsed.success ? parsed.data : (schema.parse({}) as SectionContent<T>);
}

/** Valida o conteúdo enviado pelo editor (erro se o formato for inválido). */
export function validateSectionContent(type: SectionType, raw: unknown) {
  return sectionSchemas[type].safeParse(raw);
}

type SectionMeta = {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Índice na paleta de cores dos cards do tema. */
  tone: number;
  defaultContent: () => SectionContent;
};

export const defaultEmergencyContacts = [
  { name: "Polícia Militar", phone: "190" },
  { name: "SAMU", phone: "192" },
  { name: "Corpo de Bombeiros", phone: "193" },
];

export const sectionMeta: Record<SectionType, SectionMeta> = {
  host: {
    label: "Anfitrião",
    description: "Quem recebe o hóspede e como falar com você",
    icon: User,
    tone: 0,
    defaultContent: () => parseSectionContent("host", {}),
  },
  amenities: {
    label: "Comodidades",
    description: "O que o imóvel oferece",
    icon: Crown,
    tone: 1,
    defaultContent: () => parseSectionContent("amenities", {}),
  },
  rules: {
    label: "Regras da Casa",
    description: "Combinados para uma boa estadia",
    icon: ScrollText,
    tone: 2,
    defaultContent: () => parseSectionContent("rules", {}),
  },
  about: {
    label: "Sobre a Casa",
    description: "Capacidade, descrição e diferenciais",
    icon: House,
    tone: 3,
    defaultContent: () => parseSectionContent("about", {}),
  },
  rooms: {
    label: "Ambientes",
    description: "Fotos e detalhes de cada cômodo",
    icon: BedDouble,
    tone: 4,
    defaultContent: () => parseSectionContent("rooms", {}),
  },
  wifi: {
    label: "Wi-Fi",
    description: "Redes, senhas e dicas de conexão",
    icon: Wifi,
    tone: 5,
    defaultContent: () =>
      parseSectionContent("wifi", {
        tips: "Procure a rede no seu dispositivo e digite a senha exatamente como mostrada. Se não conectar, aproxime-se do roteador ou reinicie o equipamento.",
      }),
  },
  emergency: {
    label: "Emergência",
    description: "Telefones úteis em caso de necessidade",
    icon: Siren,
    tone: 6,
    defaultContent: () =>
      parseSectionContent("emergency", { contacts: defaultEmergencyContacts }),
  },
  checkin: {
    label: "Check-in/Check-out",
    description: "Horários, chaves e instruções de chegada e saída",
    icon: Clock,
    tone: 7,
    defaultContent: () => parseSectionContent("checkin", {}),
  },
  local_tips: {
    label: "Dicas Locais",
    description: "Atrações, mercados, farmácias e mais",
    icon: MapPin,
    tone: 1,
    defaultContent: () => parseSectionContent("local_tips", {}),
  },
  restaurants: {
    label: "Restaurantes",
    description: "Onde comer por perto",
    icon: Utensils,
    tone: 2,
    defaultContent: () => parseSectionContent("restaurants", {}),
  },
  feedback: {
    label: "Avaliação",
    description: "Receba avaliações e incentive reviews",
    icon: MessageSquareHeart,
    tone: 0,
    defaultContent: () =>
      parseSectionContent("feedback", {
        heading: "Sua opinião é muito importante!",
        description: "Compartilhe sua experiência e nos ajude a melhorar cada vez mais.",
        incentiveMessage: "Se gostou da estadia, deixe uma avaliação! 🌟",
        thanksMessage: "Obrigado pela sua avaliação!",
      }),
  },
  transport: {
    label: "Transporte",
    description: "Como chegar e se locomover",
    icon: Bus,
    tone: 3,
    defaultContent: () => parseSectionContent("transport", {}),
  },
  instructions: {
    label: "Instruções",
    description: "Como usar equipamentos da casa",
    icon: ListChecks,
    tone: 4,
    defaultContent: () => parseSectionContent("instructions", {}),
  },
  sofa_bed: {
    label: "Sofá-cama",
    description: "Como abrir o sofá-cama, passo a passo",
    icon: Sofa,
    tone: 6,
    // Já nasce com a ilustração: é o conteúdo inteiro da seção.
    defaultContent: () =>
      parseSectionContent("sofa_bed", { items: [{ illustration: "sofa_bed" }] }),
  },
  safety: {
    label: "Segurança",
    description: "Dispositivos e orientações de segurança",
    icon: ShieldCheck,
    tone: 5,
    defaultContent: () => parseSectionContent("safety", {}),
  },
  events: {
    label: "Eventos",
    description: "Agenda e acontecimentos da região",
    icon: CalendarDays,
    tone: 6,
    defaultContent: () => parseSectionContent("events", {}),
  },
  activities: {
    label: "Atividades Locais",
    description: "Passeios e experiências",
    icon: Mountain,
    tone: 7,
    defaultContent: () => parseSectionContent("activities", {}),
  },
  services: {
    label: "Serviços Próximos",
    description: "Lavanderia, academia, bancos...",
    icon: Store,
    tone: 1,
    defaultContent: () => parseSectionContent("services", {}),
  },
  accessibility: {
    label: "Acessibilidade",
    description: "Recursos de acessibilidade do imóvel",
    icon: Accessibility,
    tone: 2,
    defaultContent: () => parseSectionContent("accessibility", {}),
  },
};

/** Ícone genérico para o card fixo de informações básicas no editor. */
export const basicInfoIcon = Info;

export const infoListSectionTypes = [
  "transport",
  "instructions",
  "sofa_bed",
  "safety",
  "events",
  "activities",
  "services",
  "accessibility",
] as const satisfies readonly SectionType[];

export type InfoListSectionType = (typeof infoListSectionTypes)[number];

export function isInfoListType(type: SectionType): type is InfoListSectionType {
  return (infoListSectionTypes as readonly string[]).includes(type);
}

/** Ordem sugerida ao criar um guia novo. */
export const defaultSectionOrder: SectionType[] = [
  "host",
  "amenities",
  "rules",
  "about",
  "rooms",
  "wifi",
  "emergency",
  "checkin",
  "local_tips",
  "restaurants",
  "feedback",
];

export const propertyTypes = [
  "Apartamento",
  "Casa",
  "Studio",
  "Loft",
  "Chalé",
  "Sítio",
  "Pousada",
  "Hotel",
  "Outro",
] as const;

/** Comodidades pré-definidas oferecidas no editor. */
export const suggestedAmenities = [
  "Wi-Fi",
  "TV",
  "Cozinha equipada",
  "Ar-condicionado",
  "Lareira",
  "Piscina",
  "Varanda",
  "Estacionamento",
  "Máquina de lavar",
  "Secadora",
  "Churrasqueira",
  "Elevador",
  "Permitido animais",
  "Adequado para crianças",
  "Máquina de café",
  "Banheira",
  "Academia",
  "Ventilador",
  "Secador de cabelo",
  "Acesso à praia",
];

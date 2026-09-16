import { z } from "zod";

import type { GuideData } from "@/lib/guide/data";

export const posterSizes = {
  A6: { width: 298, height: 420 },
  A5: { width: 420, height: 595 },
  A4: { width: 595, height: 842 },
  A3: { width: 842, height: 1191 },
  A2: { width: 1191, height: 1684 },
  A1: { width: 1684, height: 2384 },
} as const;

export type PosterSize = keyof typeof posterSizes;

export type PosterTemplate = {
  id: string;
  name: string;
  description: string;
  background: string;
  surface: string;
  foreground: string;
  muted: string;
  accent: string;
  accentForeground: string;
  headingFont: "Helvetica-Bold" | "Times-Bold";
  bodyFont: "Helvetica" | "Times-Roman";
  /** Faixa colorida atrás do título. */
  banner: boolean;
};

export const posterTemplates: PosterTemplate[] = [
  {
    id: "minimalista",
    name: "Minimalista",
    description: "Preto e branco, direto ao ponto",
    background: "#ffffff",
    surface: "#f4f4f4",
    foreground: "#111111",
    muted: "#6b6b6b",
    accent: "#111111",
    accentForeground: "#ffffff",
    headingFont: "Helvetica-Bold",
    bodyFont: "Helvetica",
    banner: false,
  },
  {
    id: "moderno",
    name: "Moderno",
    description: "Faixa colorida e cards arredondados",
    background: "#f6f5fb",
    surface: "#ffffff",
    foreground: "#1d1b2e",
    muted: "#6b6880",
    accent: "#6d4ae8",
    accentForeground: "#ffffff",
    headingFont: "Helvetica-Bold",
    bodyFont: "Helvetica",
    banner: true,
  },
  {
    id: "tropical",
    name: "Tropical",
    description: "Mar e areia, para casas de praia",
    background: "#fbf6ec",
    surface: "#ffffff",
    foreground: "#123b3a",
    muted: "#5b7d7a",
    accent: "#0f9d8f",
    accentForeground: "#ffffff",
    headingFont: "Helvetica-Bold",
    bodyFont: "Helvetica",
    banner: true,
  },
  {
    id: "salvia",
    name: "Verde sálvia",
    description: "Verde suave e natural, leve e acolhedor",
    background: "#f3f5f0",
    surface: "#ffffff",
    foreground: "#26332a",
    muted: "#6b786d",
    accent: "#5f7d61",
    accentForeground: "#ffffff",
    headingFont: "Helvetica-Bold",
    bodyFont: "Helvetica",
    banner: true,
  },
  {
    id: "rustico",
    name: "Rústico",
    description: "Tons terrosos e tipografia clássica",
    background: "#f5efe6",
    surface: "#fffaf3",
    foreground: "#3a2a1d",
    muted: "#7d6a58",
    accent: "#8a5a2b",
    accentForeground: "#fffaf3",
    headingFont: "Times-Bold",
    bodyFont: "Times-Roman",
    banner: false,
  },
  {
    id: "elegante",
    name: "Elegante",
    description: "Fundo escuro com detalhes dourados",
    background: "#111214",
    surface: "#1b1c20",
    foreground: "#f3efe6",
    muted: "#a19d93",
    accent: "#c9a45c",
    accentForeground: "#161616",
    headingFont: "Times-Bold",
    bodyFont: "Times-Roman",
    banner: false,
  },
];

export const posterLanguages = {
  pt: {
    label: "Português",
    eyebrow: "Bem-vindo(a)",
    wifi: "Wi-Fi",
    network: "Rede",
    password: "Senha",
    checkIn: "Check-in",
    checkOut: "Check-out",
    from: "a partir das",
    until: "até as",
    rules: "Regras da casa",
    contact: "Contato",
    scan: "Escaneie para acessar o guia completo",
    scanDetail: "Wi-Fi, check-in, regras, dicas da região e muito mais",
    footer: "Guia digital de boas-vindas",
  },
  en: {
    label: "English",
    eyebrow: "Welcome",
    wifi: "Wi-Fi",
    network: "Network",
    password: "Password",
    checkIn: "Check-in",
    checkOut: "Check-out",
    from: "from",
    until: "until",
    rules: "House rules",
    contact: "Contact",
    scan: "Scan to open the full guest guide",
    scanDetail: "Wi-Fi, check-in, house rules, local tips and more",
    footer: "Digital welcome guide",
  },
  es: {
    label: "Español",
    eyebrow: "Bienvenido(a)",
    wifi: "Wi-Fi",
    network: "Red",
    password: "Contraseña",
    checkIn: "Check-in",
    checkOut: "Check-out",
    from: "desde las",
    until: "hasta las",
    rules: "Normas de la casa",
    contact: "Contacto",
    scan: "Escanea para ver la guía completa",
    scanDetail: "Wi-Fi, check-in, normas, consejos locales y más",
    footer: "Guía digital de bienvenida",
  },
} as const;

export type PosterLanguage = keyof typeof posterLanguages;

export const posterOptionsSchema = z.object({
  template: z
    .string()
    .refine((id) => posterTemplates.some((template) => template.id === id))
    .catch("moderno"),
  size: z.enum(Object.keys(posterSizes) as [PosterSize, ...PosterSize[]]).catch("A4"),
  lang: z.enum(Object.keys(posterLanguages) as [PosterLanguage, ...PosterLanguage[]]).catch("pt"),
  showRules: z
    .enum(["0", "1"])
    .transform((value) => value === "1")
    .catch(true),
  showWifi: z
    .enum(["0", "1"])
    .transform((value) => value === "1")
    .catch(true),
});

export type PosterOptions = z.infer<typeof posterOptionsSchema>;

/** Dados que o cartaz usa, extraídos das seções ativas do guia. */
export type PosterContent = {
  name: string;
  welcomeMessage: string;
  city: string;
  wifi: { name: string; password: string } | null;
  checkInTime: string;
  checkOutTime: string;
  contact: string;
  rules: string[];
};

function truncate(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}

export function posterContent({ property, sections }: GuideData): PosterContent {
  const enabled = sections.filter((section) => section.enabled);
  const find = <T extends (typeof enabled)[number]["type"]>(type: T) =>
    enabled.find((section) => section.type === type) as
      | Extract<(typeof enabled)[number], { type: T }>
      | undefined;

  const network = find("wifi")?.content.networks.find((item) => item.name || item.password);
  const checkin = find("checkin")?.content;
  const host = find("host")?.content;
  const contact = host?.contacts.find((item) => item.type === "whatsapp" || item.type === "phone");

  return {
    name: property.name,
    welcomeMessage: property.welcomeMessage ?? "",
    city: property.city ?? "",
    wifi: network ?? null,
    checkInTime: checkin?.checkInTime ?? "",
    checkOutTime: checkin?.checkOutTime ?? "",
    contact: contact ? [host?.name, contact.value].filter(Boolean).join(" · ") : "",
    rules: (find("rules")?.content.rules ?? [])
      .map((rule) => truncate(rule.text, 90))
      .filter(Boolean)
      .slice(0, 5),
  };
}

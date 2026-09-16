import type { contactTypes } from "@/lib/guide/sections";

type ContactType = (typeof contactTypes)[number];

function digits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Número de WhatsApp em formato internacional (assume Brasil sem DDI). */
export function whatsappNumber(value: string): string {
  const number = digits(value);
  if (!number) return "";
  return number.length <= 11 ? `55${number}` : number;
}

export function whatsappUrl(value: string, text?: string): string | null {
  const number = whatsappNumber(value);
  if (!number) return null;
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${number}${query}`;
}

export function phoneUrl(value: string): string | null {
  const cleaned = value.replace(/[^\d+]/g, "");
  return cleaned ? `tel:${cleaned}` : null;
}

function safeWebUrl(value: string): string | null {
  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(candidate);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function contactHref(type: ContactType, value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  switch (type) {
    case "whatsapp":
      return whatsappUrl(trimmed);
    case "phone":
      return phoneUrl(trimmed);
    case "email":
      return /^[^\s@]+@[^\s@]+$/.test(trimmed) ? `mailto:${trimmed}` : null;
    case "instagram": {
      if (/instagram\.com/i.test(trimmed)) return safeWebUrl(trimmed);
      const handle = trimmed.replace(/^@/, "");
      return /^[\w.]+$/.test(handle) ? `https://instagram.com/${handle}` : null;
    }
    case "site":
      return safeWebUrl(trimmed);
  }
}

/** Só permite links http(s) vindos do conteúdo do anfitrião. */
export function externalUrl(value: string): string | null {
  return value.trim() ? safeWebUrl(value.trim()) : null;
}

/** Imagens aceitas no guia: uploads do próprio app ou links http(s). */
export function imageSrc(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.startsWith("/api/uploads/")) return value;
  return /^https?:\/\//i.test(value) ? value : null;
}

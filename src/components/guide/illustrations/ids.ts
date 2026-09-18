/**
 * Ilustrações prontas que o anfitrião pode anexar a um tópico das seções de
 * lista (Instruções, Segurança...). Fica separado do componente porque o
 * schema das seções roda no servidor e não deve puxar React.
 */
export const illustrationIds = ["sofa_bed"] as const;

export type IllustrationId = (typeof illustrationIds)[number];

/** Rótulo mostrado ao anfitrião no editor. */
export const illustrationLabels: Record<IllustrationId, string> = {
  sofa_bed: "Sofá-cama: como abrir",
};

export function isIllustrationId(value: string): value is IllustrationId {
  return (illustrationIds as readonly string[]).includes(value);
}

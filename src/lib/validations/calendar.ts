import { z } from "zod";

import { calendarColors } from "@/lib/calendar/colors";

const feedName = z.string().trim().min(2, "Dê um nome para o calendário").max(80);
const feedColor = z.enum(calendarColors.map((color) => color.id) as [string, ...string[]]);
const propertyId = z
  .string()
  .trim()
  .max(40)
  .nullable()
  .optional()
  .transform((value) => value || null);

export const createCalendarSchema = z.object({
  name: feedName,
  url: z
    .string()
    .trim()
    .max(2000)
    // Links "webcal://" são o mesmo arquivo servido por https.
    .transform((value) => value.replace(/^webcals?:\/\//i, "https://"))
    .pipe(z.url({ protocol: /^https$/, error: "Cole o link https do calendário (.ics)" })),
  color: feedColor.optional(),
  propertyId,
});
export type CreateCalendarInput = z.infer<typeof createCalendarSchema>;

export const updateCalendarSchema = z.object({
  name: feedName.optional(),
  color: feedColor.optional(),
  propertyId,
});

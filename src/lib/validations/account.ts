import { z } from "zod";

export const inviteSchema = z.object({
  /** Só um apelido para o dono lembrar de quem é o convite. */
  label: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((value) => value || null),
});

export const accountNameSchema = z.object({
  name: z.string().trim().min(2, "Dê um nome para a conta").max(80),
});

export const activeAccountSchema = z.object({
  accountId: z.string().trim().min(1).max(40),
});

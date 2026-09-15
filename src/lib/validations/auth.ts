import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido"),
  password: z.string().min(1, "Informe sua senha"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome completo"),
  email: z.string().trim().toLowerCase().email("Informe um e-mail válido"),
  password: z
    .string()
    .min(8, "A senha deve ter pelo menos 8 caracteres"),
});

export type RegisterInput = z.infer<typeof registerSchema>;

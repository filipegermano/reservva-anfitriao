import { findInvite } from "@/lib/invites";

/**
 * Cadastro aberto ao público. Desligado por padrão: só abre com
 * REGISTRATION_ENABLED=true (ou 1). Convites de equipe seguem funcionando
 * mesmo com o cadastro fechado — ver allowSignup.
 */
export function isRegistrationEnabled(): boolean {
  const value = process.env.REGISTRATION_ENABLED?.trim().toLowerCase();
  return value === "true" || value === "1";
}

/** Se esta pessoa pode criar conta: cadastro aberto ou convite válido em mãos. */
export async function allowSignup(inviteToken?: string | null): Promise<boolean> {
  if (isRegistrationEnabled()) return true;
  if (!inviteToken) return false;
  return (await findInvite(inviteToken)).status === "valido";
}

import { notFound } from "next/navigation";

import { allowSignup } from "@/lib/registration";
import { RegisterForm } from "./register-form";

type PageProps = { searchParams: Promise<{ convite?: string }> };

export default async function RegisterPage({ searchParams }: PageProps) {
  // Chegando por um convite, a conta criada já entra na equipe que convidou —
  // e o convite vale mesmo com o cadastro público fechado.
  const { convite } = await searchParams;

  if (!(await allowSignup(convite))) {
    notFound();
  }

  return <RegisterForm inviteToken={convite ?? null} />;
}

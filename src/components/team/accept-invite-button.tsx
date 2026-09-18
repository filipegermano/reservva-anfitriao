"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function AcceptInviteButton({ token, accountName }: { token: string; accountName: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function accept() {
    setSaving(true);
    const response = await fetch(`/api/invites/${encodeURIComponent(token)}/accept`, {
      method: "POST",
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setSaving(false);
      toast.error(payload.error ?? "Não foi possível aceitar o convite");
      return;
    }

    toast.success(`Você entrou em ${accountName}`);
    router.push("/app");
    router.refresh();
  }

  return (
    <Button className="w-full" onClick={accept} disabled={saving}>
      {saving && <Loader2 className="size-4 animate-spin" />}
      Entrar em {accountName}
    </Button>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { AccountOption } from "@/lib/account";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AccountSwitcher({
  accounts,
  currentId,
}: {
  accounts: AccountOption[];
  currentId: string;
}) {
  const router = useRouter();
  const [switching, setSwitching] = useState(false);
  const current = accounts.find((account) => account.id === currentId);

  async function select(accountId: string) {
    if (accountId === currentId) return;
    setSwitching(true);
    const response = await fetch("/api/accounts/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId }),
    });
    setSwitching(false);
    if (!response.ok) {
      toast.error("Não foi possível trocar de conta");
      return;
    }
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="max-w-52" disabled={switching}>
          {switching ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ChevronsUpDown className="size-4 opacity-60" />
          )}
          <span className="truncate">{current?.name ?? "Conta"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Suas contas</DropdownMenuLabel>
        {accounts.map((account) => (
          <DropdownMenuItem key={account.id} onClick={() => select(account.id)}>
            <Check className={account.id === currentId ? "size-4" : "size-4 opacity-0"} />
            <span className="truncate">{account.name}</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {account.role === "OWNER" ? "Dono" : "Membro"}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

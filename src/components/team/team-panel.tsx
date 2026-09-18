"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Link2, Loader2, LogOut, Pencil, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Member = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: "OWNER" | "MEMBER";
  createdAt: string;
};

type Invite = {
  id: string;
  label: string | null;
  expiresAt: string;
  expired: boolean;
  createdAt: string;
};

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

export function TeamPanel({
  accountName,
  isOwner,
  currentUserId,
  members,
  invites,
}: {
  accountName: string;
  isOwner: boolean;
  currentUserId: string;
  members: Member[];
  invites: Invite[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [removing, setRemoving] = useState<Member | null>(null);

  async function removeMember(member: Member) {
    setBusy(member.id);
    const response = await fetch(`/api/accounts/members/${member.id}`, { method: "DELETE" });
    const payload = await response.json().catch(() => ({}));
    setBusy(null);
    setRemoving(null);

    if (!response.ok) {
      toast.error(payload.error ?? "Não foi possível remover");
      return;
    }
    toast.success(payload.left ? "Você saiu da conta" : `${member.name} foi removido da conta`);
    if (payload.left) router.push("/app");
    router.refresh();
  }

  async function revokeInvite(invite: Invite) {
    setBusy(invite.id);
    const response = await fetch(`/api/accounts/invites/${invite.id}`, { method: "DELETE" });
    setBusy(null);
    if (!response.ok) {
      toast.error("Não foi possível revogar o convite");
      return;
    }
    toast.success("Convite revogado");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            {accountName}
            {isOwner && (
              <Button variant="ghost" size="icon" aria-label="Renomear conta" onClick={() => setRenameOpen(true)}>
                <Pencil className="size-4" />
              </Button>
            )}
          </h1>
          <p className="text-muted-foreground">
            Todo mundo desta conta vê e edita os mesmos guias, cartazes e calendários.
          </p>
        </div>
        {isOwner && (
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="size-4" />
            Convidar pessoa
          </Button>
        )}
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Pessoas com acesso</h2>
        <div className="space-y-2">
          {members.map((member) => {
            const isSelf = member.userId === currentUserId;
            const canRemove = member.role !== "OWNER" && (isOwner || isSelf);
            return (
              <div key={member.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {member.name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-40 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    {member.name}
                    {isSelf && <span className="text-xs text-muted-foreground">(você)</span>}
                    <Badge variant={member.role === "OWNER" ? "default" : "secondary"}>
                      {member.role === "OWNER" ? "Dono" : "Membro"}
                    </Badge>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {member.email} · entrou em {formatDate(member.createdAt)}
                  </p>
                </div>
                {canRemove && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy === member.id}
                    onClick={() => setRemoving(member)}
                  >
                    {isSelf ? <LogOut className="size-4" /> : <Trash2 className="size-4 text-destructive" />}
                    {isSelf ? "Sair da conta" : "Remover"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {isOwner && (
        <section className="space-y-3">
          <h2 className="font-semibold">Convites pendentes</h2>
          {invites.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                <Link2 className="size-8 text-muted-foreground" />
                <div>
                  <p className="font-medium">Nenhum convite aberto</p>
                  <p className="text-sm text-muted-foreground">
                    Gere um link, mande por WhatsApp e a pessoa entra na conta por ele.
                  </p>
                </div>
                <Button variant="outline" onClick={() => setInviteOpen(true)}>
                  <UserPlus className="size-4" />
                  Convidar pessoa
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {invites.map((invite) => {
                return (
                  <div key={invite.id} className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3">
                    <Link2 className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-40 flex-1">
                      <p className="font-medium">{invite.label ?? "Convite sem apelido"}</p>
                      <p className="text-xs text-muted-foreground">
                        Criado em {formatDate(invite.createdAt)} ·{" "}
                        {invite.expired ? "expirado" : `válido até ${formatDate(invite.expiresAt)}`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy === invite.id}
                      onClick={() => revokeInvite(invite)}
                    >
                      {busy === invite.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4 text-destructive" />
                      )}
                      Revogar
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Cada link serve para uma pessoa e vale por 7 dias. Quem entra pode criar e editar guias
            e calendários; convidar, remover pessoas e excluir guias continuam só com você.
          </p>
        </section>
      )}

      {inviteOpen && <InviteDialog onClose={() => setInviteOpen(false)} />}
      {renameOpen && <RenameDialog current={accountName} onClose={() => setRenameOpen(false)} />}

      <Dialog open={!!removing} onOpenChange={(open) => !open && setRemoving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {removing?.userId === currentUserId
                ? "Sair desta conta?"
                : `Remover ${removing?.name} da conta?`}
            </DialogTitle>
            <DialogDescription>
              {removing?.userId === currentUserId
                ? "Você perde o acesso aos guias e calendários desta conta. Para voltar, precisa de um novo convite."
                : "A pessoa perde o acesso aos guias e calendários desta conta. Os guias continuam como estão."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              variant="destructive"
              disabled={busy === removing?.id}
              onClick={() => removing && removeMember(removing)}
            >
              {removing?.userId === currentUserId ? "Sair" : "Remover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InviteDialog({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function create(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    setSaving(true);
    const response = await fetch("/api/accounts/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    const payload = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      toast.error(payload.error ?? "Não foi possível criar o convite");
      return;
    }
    setUrl(payload.url);
    router.refresh();
  }

  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copiado");
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {url ? (
          <>
            <DialogHeader>
              <DialogTitle>Link do convite</DialogTitle>
              <DialogDescription>
                Copie agora e mande para a pessoa: por segurança, o link não é mostrado de novo. Se
                perder, revogue este convite e gere outro.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2">
              <Input value={url} readOnly onFocus={(event) => event.target.select()} />
              <Button type="button" onClick={copy}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                Copiar
              </Button>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={create} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Convidar pessoa</DialogTitle>
              <DialogDescription>
                Geramos um link de uso único, válido por 7 dias. Quem abrir entra nesta conta e
                passa a ver os mesmos guias e calendários.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="invite-label">Para quem é? (opcional)</Label>
              <Input
                id="invite-label"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder="Ex.: Ana — recepção"
                maxLength={80}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="size-4 animate-spin" />}
                Gerar link
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RenameDialog({ current, onClose }: { current: string; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(current);
  const [saving, setSaving] = useState(false);

  async function save(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    setSaving(true);
    const response = await fetch("/api/accounts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    const payload = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      toast.error(payload.error ?? "Não foi possível salvar");
      return;
    }
    onClose();
    router.refresh();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={save} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Nome da conta</DialogTitle>
            <DialogDescription>
              É o nome que aparece no topo e no seletor de contas.
            </DialogDescription>
          </DialogHeader>
          <Input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

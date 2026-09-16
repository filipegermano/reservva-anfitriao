"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Primitivas visuais do guia do hóspede. As cores vêm das variáveis CSS do
 * tema (`--g-*`), aplicadas na raiz do guia.
 */
export function GCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-[var(--g-radius)] border border-[var(--g-border)] bg-[var(--g-surface)] p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]",
        className,
      )}
      {...props}
    />
  );
}

export function GHeading({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn("font-[family-name:var(--g-heading)] text-lg font-semibold leading-tight", className)}
      {...props}
    />
  );
}

export function GMuted({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-sm text-[var(--g-muted)]", className)} {...props} />;
}

export function GLabel({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "text-[11px] font-semibold tracking-wider text-[var(--g-primary)] uppercase",
        className,
      )}
      {...props}
    />
  );
}

export function GButton({
  className,
  variant = "primary",
  ...props
}: React.ComponentProps<"button"> & { variant?: "primary" | "outline" }) {
  return (
    <button
      type="button"
      className={cn(gButtonClass(variant), className)}
      {...props}
    />
  );
}

export function gButtonClass(variant: "primary" | "outline" = "primary") {
  return cn(
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-[calc(var(--g-radius)*0.75)] px-4 py-2 text-sm font-semibold transition active:scale-[0.98] disabled:opacity-60",
    variant === "primary"
      ? "bg-[var(--g-primary)] text-[var(--g-primary-fg)] hover:opacity-90"
      : "border border-[var(--g-border)] bg-[var(--g-surface)] text-[var(--g-fg)] hover:bg-[var(--g-bg)]",
  );
}

/** Texto com quebras de linha preservadas. */
export function GText({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p className={cn("text-sm leading-relaxed whitespace-pre-line", className)} {...props} />
  );
}

export function GCopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard indisponível (ex.: http): o hóspede pode copiar manualmente
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-[calc(var(--g-radius)*0.75)] bg-[var(--g-bg)] px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[11px] text-[var(--g-muted)] uppercase">{label}</p>
        <p className="font-mono text-base font-semibold break-all select-all">{value}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copiar ${label.toLowerCase()}`}
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--g-surface)] text-[var(--g-primary)] shadow-sm"
      >
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}

export function GIconBadge({
  icon: Icon,
  background,
  foreground,
  size = "md",
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  background: string;
  foreground: string;
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[calc(var(--g-radius)*0.7)]",
        size === "lg" ? "size-12" : "size-10",
        className,
      )}
      style={{ background, color: foreground }}
    >
      <Icon className={size === "lg" ? "size-6" : "size-5"} />
    </div>
  );
}

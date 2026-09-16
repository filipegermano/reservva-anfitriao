"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

/** Checkbox acessível simples (input nativo estilizado). */
export function Checkbox({
  checked,
  onChange,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}) {
  return (
    <span className={cn("relative mt-0.5 inline-flex size-4 shrink-0", className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer size-4 cursor-pointer appearance-none rounded border border-input bg-background checked:border-primary checked:bg-primary focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
      />
      <Check className="pointer-events-none absolute inset-0 m-auto hidden size-3 text-primary-foreground peer-checked:block" />
    </span>
  );
}

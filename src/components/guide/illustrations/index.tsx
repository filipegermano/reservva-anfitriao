"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

import { cn } from "@/lib/utils";
import { useGuideStrings } from "@/components/guide/guide-language";
import { isIllustrationId } from "@/components/guide/illustrations/ids";
import { SofaBedScene, sofaBedSteps, type SofaBedStep } from "@/components/guide/illustrations/sofa-bed";

/**
 * O hóspede vê o desenho animado, com os passos escritos embaixo; quem prefere
 * menos movimento vê os quatro quadros parados.
 */

const STEP_MS = 2200;
/** Pausa extra com a cama aberta antes de recomeçar. */
const HOLD_MS = 1400;

export function GuideIllustration({ id }: { id: string }) {
  if (!isIllustrationId(id)) return null;
  return <SofaBedIllustration />;
}

function SofaBedIllustration() {
  const t = useGuideStrings();
  const steps = t.illustrations.sofaBed.steps;
  const [playing, setPlaying] = useState(true);
  const [step, setStep] = useState<SofaBedStep>(0);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced || !playing) return;
    const delay = step === sofaBedSteps ? HOLD_MS : STEP_MS;
    const timer = setTimeout(() => {
      setStep((current) => ((current === sofaBedSteps ? 0 : current + 1) as SofaBedStep));
    }, delay);
    return () => clearTimeout(timer);
  }, [playing, reduced, step]);

  if (reduced) return <SofaBedPanels captions={steps} />;

  /** Passo em andamento: no fim da volta, o texto do último passo continua. */
  const current = Math.min(step, sofaBedSteps - 1);

  return (
    <figure className="space-y-3">
      <div className="relative overflow-hidden rounded-[calc(var(--g-radius)*0.75)] bg-[var(--g-bg)] p-2">
        <SofaBedScene
          step={step}
          className="w-full text-[var(--g-fg)]"
          title={t.illustrations.sofaBed.title}
        />
        <button
          type="button"
          onClick={() => setPlaying((value) => !value)}
          aria-label={playing ? t.illustrations.pause : t.illustrations.play}
          className="absolute right-2 bottom-2 flex size-8 items-center justify-center rounded-full bg-[var(--g-surface)] text-[var(--g-primary)] shadow-sm"
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>
      </div>
      <ol className="space-y-1.5">
        {steps.map((text, index) => (
          <li
            key={index}
            className={cn(
              "flex items-start gap-2 text-sm transition-opacity",
              index === current ? "opacity-100" : "opacity-45",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                index === current
                  ? "bg-[var(--g-primary)] text-[var(--g-primary-fg)]"
                  : "bg-[var(--g-bg)] text-[var(--g-muted)]",
              )}
            >
              {index + 1}
            </span>
            <span className="leading-snug">{text}</span>
          </li>
        ))}
      </ol>
    </figure>
  );
}

/** Os quatro passos lado a lado, sem movimento. */
export function SofaBedPanels({ captions }: { captions: readonly string[] }) {
  return (
    <ol className="grid grid-cols-2 gap-2">
      {captions.map((text, index) => (
        <li
          key={index}
          className="space-y-1 rounded-[calc(var(--g-radius)*0.75)] bg-[var(--g-bg)] p-2"
        >
          <SofaBedScene
            step={index as SofaBedStep}
            idPrefix={`sofa-${index}`}
            className="w-full text-[var(--g-fg)]"
          />
          <p className="flex items-start gap-1.5 text-xs leading-snug">
            <span className="font-semibold text-[var(--g-primary)]">{index + 1}.</span>
            <span>{text}</span>
          </p>
        </li>
      ))}
    </ol>
  );
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  const query = useRef<MediaQueryList | null>(null);

  useEffect(() => {
    query.current = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.current.matches);
    const listener = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.current.addEventListener("change", listener);
    return () => query.current?.removeEventListener("change", listener);
  }, []);

  return reduced;
}

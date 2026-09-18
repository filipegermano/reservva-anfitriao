import { SofaBedScene, type SofaBedStep } from "@/components/guide/illustrations/sofa-bed";

/**
 * Versão para imprimir: os quatro passos em uma folha só. O anfitrião imprime
 * pelo navegador (a página já vem com o CSS de impressão) ou salva em PDF.
 */

const ink = "#1f2023";
const paper = "#ffffff";
const shade = "#f1f1ef";

export function SofaBedSheet({
  title,
  captions,
}: {
  title: string;
  captions: readonly string[];
}) {
  return (
    <div style={{ color: ink, background: paper }} className="mx-auto max-w-3xl p-8">
      <h1 className="mb-6 text-3xl font-bold">{title}</h1>
      <ol className="grid grid-cols-2 gap-4">
        {captions.slice(0, 4).map((caption, index) => (
          <li
            key={index}
            style={{ background: shade }}
            className="break-inside-avoid rounded-2xl border border-[#e2e2df] p-4"
          >
            <SofaBedScene step={index as SofaBedStep} idPrefix={`sheet-${index}`} className="w-full" />
            <p className="mt-2 flex items-start gap-2 text-base leading-snug">
              <span
                style={{ background: ink, color: paper }}
                className="flex size-6 shrink-0 items-center justify-center rounded-full text-sm font-bold"
              >
                {index + 1}
              </span>
              <span>{caption}</span>
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

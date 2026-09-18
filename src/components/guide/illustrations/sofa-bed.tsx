/**
 * Ilustração do sofá-cama: o mesmo desenho serve para a animação do guia e
 * para os painéis estáticos (impressão e PDF). O sofá fica à direita e a cama
 * se abre para a esquerda, então os quatro passos cabem em um só quadro.
 *
 * Estados (`step`): 0 fechado · 1 sem as almofadas do encosto · 2 sem os
 * assentos · 3 base de ripas puxada · 4 colchão aberto.
 */

export const sofaBedSteps = 4;

/** Quadro em que cada passo termina — o passo N sai do estado N-1 para o N. */
export type SofaBedStep = 0 | 1 | 2 | 3 | 4;

const viewBox = "0 0 320 200";

/** Cores: o desenho herda a cor do texto e usa o tom do tema nas setas. */
const stroke = "currentColor";
const surface = "var(--g-surface, #ffffff)";
const shade = "var(--g-bg, #f1f1ef)";
const accent = "var(--g-primary, #2a2b2e)";

const line = { fill: "none", stroke, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const solid = { fill: surface, stroke, strokeWidth: 2, strokeLinejoin: "round" } as const;
const filled = { fill: shade, stroke, strokeWidth: 2, strokeLinejoin: "round" } as const;

/** Move e some ao sair de cena. */
function gone(hidden: boolean, dy = -26) {
  return {
    opacity: hidden ? 0 : 1,
    transform: hidden ? `translateY(${dy}px)` : "translateY(0)",
  };
}

function Arrow({
  d,
  hidden,
  markerId,
}: {
  d: string;
  hidden: boolean;
  markerId: string;
}) {
  return (
    <path
      d={d}
      {...line}
      stroke={accent}
      strokeWidth={2.5}
      strokeDasharray="0"
      markerEnd={`url(#${markerId})`}
      style={{ opacity: hidden ? 0 : 1, transition: "opacity .3s ease" }}
    />
  );
}

/**
 * O desenho em si. `step` define o estado e `showArrow` liga a seta da ação
 * que vem a seguir (nos painéis estáticos, a seta mostra o que fazer).
 */
export function SofaBedScene({
  step,
  showArrow = true,
  idPrefix = "sofa",
  className,
  title,
  ...position
}: {
  step: SofaBedStep;
  showArrow?: boolean;
  idPrefix?: string;
  className?: string;
  title?: string;
  /** Posição e tamanho, usados quando a cena entra dentro de outro SVG. */
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}) {
  const markerId = `${idPrefix}-arrowhead`;
  const backGone = step >= 1;
  const seatGone = step >= 2;
  const slatsOut = step >= 3;
  const mattressOpen = step >= 4;

  // Transições só valem na animação; nos painéis o estado já nasce pronto.
  const move = { transition: "transform .9s cubic-bezier(.4,0,.2,1), opacity .5s ease" };

  return (
    <svg
      viewBox={viewBox}
      className={className}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      {...position}
    >
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 9 5 L 0 9 z" fill={accent} />
        </marker>
      </defs>

      {/* chão */}
      <path d="M 16 176 H 304" {...line} strokeWidth={1.5} opacity={0.35} />

      {/* corpo do sofá */}
      <rect x="150" y="124" width="146" height="42" rx="7" {...filled} />
      <rect x="156" y="166" width="10" height="10" rx="2" {...solid} />
      <rect x="280" y="166" width="10" height="10" rx="2" {...solid} />
      <rect x="172" y="58" width="102" height="68" rx="7" {...filled} />
      <rect x="150" y="78" width="24" height="88" rx="8" {...solid} />
      <rect x="272" y="78" width="24" height="88" rx="8" {...solid} />

      {/*
        Base de ripas: sai para a frente e para a esquerda, passando na frente
        do sofá — é assim que se lê "puxar para perto de você" em um desenho
        plano.
      */}
      <g
        style={{
          ...move,
          // Recolhida, some: desenhada na frente do sofá, apareceria "através" dele.
          opacity: slatsOut ? 1 : 0,
          transform: slatsOut ? "translate(0, 0)" : "translate(108px, -24px)",
        }}
      >
        <rect x="46" y="134" width="132" height="24" rx="4" {...filled} />
        {[64, 82, 100, 118, 136, 154].map((x) => (
          <path key={x} d={`M ${x} 138 V 154`} {...line} strokeWidth={1.5} opacity={0.5} />
        ))}
        <rect x="52" y="158" width="9" height="18" rx="3" {...filled} />
        <rect x="158" y="158" width="9" height="18" rx="3" {...filled} />
      </g>

      {/* colchão: metade sobre o assento e metade que gira para a base */}
      <g style={{ ...move, opacity: seatGone ? 1 : 0 }}>
        <rect x="174" y="96" width="96" height="16" rx="5" {...solid} />
        <g
          style={{
            ...move,
            transformOrigin: "174px 104px",
            transform: mattressOpen ? "translate(-4px, 22px) rotate(0deg)" : "rotate(180deg)",
          }}
        >
          <rect x="78" y="96" width="96" height="16" rx="5" {...solid} />
          <path d="M 96 100 V 108 M 120 100 V 108 M 144 100 V 108" {...line} strokeWidth={1.5} opacity={0.4} />
        </g>
      </g>

      {/* assentos */}
      <g style={{ ...move, ...gone(seatGone) }}>
        <rect x="176" y="104" width="46" height="20" rx="6" {...solid} />
        <rect x="224" y="104" width="46" height="20" rx="6" {...solid} />
      </g>

      {/* almofadas do encosto */}
      <g style={{ ...move, ...gone(backGone) }}>
        <rect x="176" y="62" width="46" height="42" rx="7" {...solid} />
        <rect x="224" y="62" width="46" height="42" rx="7" {...solid} />
      </g>

      {/* setas da ação seguinte */}
      {showArrow && (
        <>
          <Arrow d="M 246 54 V 26" hidden={step !== 0} markerId={markerId} />
          <Arrow d="M 246 96 V 44" hidden={step !== 1} markerId={markerId} />
          <Arrow d="M 166 140 L 70 168" hidden={step !== 2} markerId={markerId} />
          <Arrow
            d="M 258 84 C 236 44, 116 48, 92 110"
            hidden={step !== 3}
            markerId={markerId}
          />
        </>
      )}
    </svg>
  );
}

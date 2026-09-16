"use client";

import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  ArrowLeft,
  ChevronRight,
  CircleHelp,
  Home,
  MapPin,
  MoreHorizontal,
  Phone,
  Search,
  Share2,
  Siren,
} from "lucide-react";

import type { GuideData, GuideSectionData } from "@/lib/guide/data";
import { mapsPlaceUrl } from "@/lib/guide/data";
import { imageSrc } from "@/lib/guide/contacts";
import { searchSections, sectionHasContent } from "@/lib/guide/presence";
import { sectionMeta } from "@/lib/guide/sections";
import { getTheme, homeTileColors, themeStyle, tileColors } from "@/lib/guide/themes";
import { cn } from "@/lib/utils";
import {
  ContactButtons,
  EmptySectionNotice,
  GuideSectionBody,
} from "@/components/guide/guide-section-body";
import {
  gButtonClass,
  GCard,
  GHeading,
  GIconBadge,
  GLabel,
  GMuted,
  GText,
} from "@/components/guide/guide-ui";

type View =
  | { kind: "cover" }
  | { kind: "home" }
  | { kind: "section"; type: GuideSectionData["type"] }
  | { kind: "contact" }
  | { kind: "search" }
  | { kind: "help" }
  | { kind: "more" };

type GuestGuideProps = {
  guide: GuideData;
  /** Pré-visualização no editor: mostra seções vazias e não mexe na URL. */
  preview?: boolean;
  /** Seção aberta no preview (acompanha a seção em edição). */
  focusSection?: GuideSectionData["type"] | null;
};

function viewFromHash(hash: string, guide: GuideData): View | null {
  const value = hash.replace(/^#/, "");
  if (!value) return null;
  if (value === "inicio") return { kind: "home" };
  if (["contato", "buscar", "ajuda", "mais"].includes(value)) {
    return {
      kind: ({ contato: "contact", buscar: "search", ajuda: "help", mais: "more" } as const)[
        value as "contato" | "buscar" | "ajuda" | "mais"
      ],
    };
  }
  const type = value.replace(/^secao-/, "");
  const section = guide.sections.find((item) => item.type === type);
  return section ? { kind: "section", type: section.type } : null;
}

function hashFromView(view: View): string {
  switch (view.kind) {
    case "cover":
      return "";
    case "home":
      return "#inicio";
    case "section":
      return `#secao-${view.type}`;
    case "contact":
      return "#contato";
    case "search":
      return "#buscar";
    case "help":
      return "#ajuda";
    case "more":
      return "#mais";
  }
}

// O guia público guarda a tela atual no hash da URL, para o botão "voltar"
// do celular navegar entre as telas do guia.
const hashListeners = new Set<() => void>();

function subscribeToHash(listener: () => void) {
  hashListeners.add(listener);
  window.addEventListener("popstate", listener);
  window.addEventListener("hashchange", listener);
  return () => {
    hashListeners.delete(listener);
    window.removeEventListener("popstate", listener);
    window.removeEventListener("hashchange", listener);
  };
}

function pushHash(hash: string) {
  window.history.pushState(null, "", hash || window.location.pathname + window.location.search);
  hashListeners.forEach((listener) => listener());
}

export function GuestGuide({ guide, preview = false, focusSection = null }: GuestGuideProps) {
  const { property } = guide;
  const theme = getTheme(property.theme);
  const rootRef = useRef<HTMLDivElement>(null);

  const defaultView: View = property.showCover ? { kind: "cover" } : { kind: "home" };

  const hash = useSyncExternalStore(
    subscribeToHash,
    () => window.location.hash,
    () => "",
  );

  // No editor a navegação é local e acompanha a seção que está sendo editada.
  const focusView = (): View => (focusSection ? { kind: "section", type: focusSection } : defaultView);
  const [previewView, setPreviewView] = useState<View>(focusView);
  const [lastFocus, setLastFocus] = useState(focusSection);
  if (preview && focusSection !== lastFocus) {
    setLastFocus(focusSection);
    setPreviewView(focusView());
  }

  const view: View = preview ? previewView : (viewFromHash(hash, guide) ?? defaultView);

  const visibleSections = useMemo(
    () =>
      guide.sections.filter(
        (section) => section.enabled && (preview || sectionHasContent(section)),
      ),
    [guide.sections, preview],
  );

  const navigate = useCallback(
    (next: View) => {
      if (preview) {
        setPreviewView(next);
        // No editor o guia rola dentro da moldura do celular, não na página.
        rootRef.current?.parentElement?.scrollTo({ top: 0 });
      } else {
        pushHash(hashFromView(next));
        window.scrollTo({ top: 0 });
      }
    },
    [preview],
  );

  const host = guide.sections.find((section) => section.type === "host" && section.enabled);
  const emergency = visibleSections.find((section) => section.type === "emergency");
  const cover = imageSrc(property.coverImageUrl);

  let screen: React.ReactNode;

  if (view.kind === "cover") {
    screen = (
      <div className="relative flex min-h-[inherit] flex-1 flex-col justify-end overflow-hidden text-white">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="absolute inset-0 size-full object-cover" style={{ filter: theme.coverFilter }} />
        ) : (
          <div className="absolute inset-0" style={{ background: theme.headerGradient }} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
        <div className="relative space-y-4 p-6 pb-10 text-center">
          <p className="text-xs font-semibold tracking-[0.3em] uppercase opacity-90">Boas-vindas</p>
          <h1 className="font-[family-name:var(--g-heading)] text-3xl leading-tight font-bold">
            {property.name}
          </h1>
          {property.welcomeMessage && <p className="text-base opacity-90">{property.welcomeMessage}</p>}
          <button
            type="button"
            onClick={() => navigate({ kind: "home" })}
            className="w-full rounded-full bg-white px-6 py-3.5 text-base font-semibold text-neutral-900 shadow-lg transition active:scale-[0.98]"
          >
            Explorar Guia
          </button>
        </div>
      </div>
    );
  } else if (view.kind === "home") {
    const mapUrl = mapsPlaceUrl(property);
    screen = (
      <div>
        <div className="relative h-52 overflow-hidden text-white">
          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="absolute inset-0 size-full object-cover" style={{ filter: theme.coverFilter }} />
          ) : (
            <div className="absolute inset-0" style={{ background: theme.headerGradient }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-black/5" />
          <div className="absolute inset-x-0 bottom-0 space-y-1 p-5">
            {property.propertyType && (
              <span className="inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-medium backdrop-blur">
                {property.propertyType}
                {property.city ? ` · ${property.city}` : ""}
              </span>
            )}
            <h1 className="font-[family-name:var(--g-heading)] text-2xl leading-tight font-bold">
              {property.name}
            </h1>
            {property.welcomeMessage && <p className="text-sm opacity-90">{property.welcomeMessage}</p>}
          </div>
        </div>

        <div className="space-y-4 p-4">
          {property.shortDescription && <GText className="text-[var(--g-muted)]">{property.shortDescription}</GText>}

          {visibleSections.length === 0 ? (
            <GCard className="text-center">
              <GMuted>Este guia ainda está sendo preparado.</GMuted>
            </GCard>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {visibleSections.map((section, index) => {
                const meta = sectionMeta[section.type];
                const colors = homeTileColors(theme, {
                  tone: meta.tone,
                  index,
                  featured: section.type === "wifi",
                });
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => navigate({ kind: "section", type: section.type })}
                    className={cn(
                      "flex min-h-28 flex-col items-center justify-center gap-2 rounded-[var(--g-radius)] p-3 text-center transition active:scale-[0.97]",
                      theme.tileBorder && "border border-[var(--g-border)]",
                    )}
                    style={{
                      background: colors.background,
                      color: colors.foreground,
                      ...(theme.tileBorder && colors === theme.featuredTile ? { borderColor: colors.background } : {}),
                    }}
                  >
                    <meta.icon className="size-7" />
                    <span className="text-sm leading-tight font-semibold">{section.title}</span>
                  </button>
                );
              })}
            </div>
          )}

          {property.address && (
            <GCard className="flex items-center gap-3">
              <MapPin className="size-5 shrink-0 text-[var(--g-primary)]" />
              <div className="min-w-0 flex-1">
                <GLabel>Endereço</GLabel>
                <p className="text-sm">{property.address}</p>
              </div>
              {mapUrl && (
                <a href={mapUrl} target="_blank" rel="noopener noreferrer" className={gButtonClass("outline")}>
                  Mapa
                </a>
              )}
            </GCard>
          )}
        </div>
      </div>
    );
  } else if (view.kind === "section") {
    const section = guide.sections.find((item) => item.type === view.type);
    if (!section) {
      screen = null;
    } else {
      const meta = sectionMeta[section.type];
      const empty = !sectionHasContent(section);
      screen = (
        <div>
          <div className="relative px-4 pt-4 pb-6 text-white" style={{ background: theme.headerGradient }}>
            <button
              type="button"
              onClick={() => navigate({ kind: "home" })}
              aria-label="Voltar ao início"
              className="flex size-9 items-center justify-center rounded-full bg-white/20 backdrop-blur"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div className="mt-3 flex flex-col items-center gap-2 text-center">
              <GIconBadge
                icon={meta.icon}
                background="rgb(255 255 255 / 0.14)"
                foreground="#fff"
                size="lg"
                className="border border-white/20"
              />
              <h1 className="font-[family-name:var(--g-heading)] text-xl font-bold">{section.title}</h1>
              <p className="text-sm opacity-85">{meta.description}</p>
            </div>
          </div>
          <div className="-mt-3 rounded-t-[var(--g-radius)] bg-[var(--g-bg)] p-4">
            {empty ? (
              <EmptySectionNotice />
            ) : (
              <GuideSectionBody guide={guide} section={section} preview={preview} />
            )}
          </div>
        </div>
      );
    }
  } else if (view.kind === "contact") {
    const mapUrl = mapsPlaceUrl(property);
    screen = (
      <PanelScreen title="Contato" subtitle="Fale com o anfitrião" onBack={() => navigate({ kind: "home" })}>
        {host?.type === "host" && (host.content.name || host.content.contacts.length > 0) ? (
          <>
            <GCard className="flex items-center gap-3">
              {imageSrc(host.content.photoUrl) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageSrc(host.content.photoUrl)!} alt="" className="size-14 rounded-full object-cover" />
              )}
              <div>
                <GHeading className="text-base">{host.content.name}</GHeading>
                {host.content.title && <GMuted>{host.content.title}</GMuted>}
              </div>
            </GCard>
            <ContactButtons contacts={host.content.contacts} />
            {host.content.contacts.every((contact) => !contact.value) && (
              <GMuted className="text-center">Nenhuma forma de contato disponível.</GMuted>
            )}
          </>
        ) : (
          <GMuted className="text-center">Nenhuma forma de contato disponível.</GMuted>
        )}
        {property.address && (
          <GCard>
            <GLabel>Endereço do imóvel</GLabel>
            <p className="mt-1 text-sm">{property.address}</p>
            {mapUrl && (
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className={cn(gButtonClass("outline"), "mt-3 w-full")}>
                <MapPin className="size-4" /> Abrir no mapa
              </a>
            )}
          </GCard>
        )}
      </PanelScreen>
    );
  } else if (view.kind === "search") {
    screen = (
      <SearchScreen
        guide={guide}
        sections={visibleSections}
        onBack={() => navigate({ kind: "home" })}
        onOpen={(type) => navigate({ kind: "section", type })}
      />
    );
  } else if (view.kind === "help") {
    screen = (
      <PanelScreen title="Ajuda" subtitle="Como usar este guia" onBack={() => navigate({ kind: "home" })}>
        {[
          ["Navegue pelas seções", "Toque nos cards coloridos da página inicial para ver cada informação da sua estadia."],
          ["Use a busca", "Toque na lupa do menu inferior para encontrar qualquer informação rapidamente (ex.: senha, check-out)."],
          ["Volte ao início", "Use o botão Início do menu inferior para voltar à página principal a qualquer momento."],
          ["Salve o guia", "Adicione esta página aos favoritos ou à tela inicial do celular para acessar sempre que precisar."],
        ].map(([title, text], index) => (
          <GCard key={title} className="flex gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--g-primary)] text-xs font-semibold text-[var(--g-primary-fg)]">
              {index + 1}
            </span>
            <div>
              <p className="font-medium">{title}</p>
              <GMuted>{text}</GMuted>
            </div>
          </GCard>
        ))}
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className={gButtonClass("outline")} onClick={() => navigate({ kind: "contact" })}>
            <Phone className="size-4" /> Contato
          </button>
          {emergency && (
            <button
              type="button"
              className={gButtonClass("outline")}
              onClick={() => navigate({ kind: "section", type: "emergency" })}
            >
              <Siren className="size-4" /> Emergência
            </button>
          )}
        </div>
      </PanelScreen>
    );
  } else {
    screen = (
      <PanelScreen title="Mais" subtitle="Todas as seções do guia" onBack={() => navigate({ kind: "home" })}>
        <GCard className="divide-y divide-[var(--g-border)] p-0">
          {visibleSections.map((section) => {
            const meta = sectionMeta[section.type];
            const colors = tileColors(theme, meta.tone);
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => navigate({ kind: "section", type: section.type })}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <GIconBadge icon={meta.icon} background={colors.background} foreground={colors.foreground} />
                <span className="flex-1 font-medium">{section.title}</span>
                <ChevronRight className="size-4 text-[var(--g-muted)]" />
              </button>
            );
          })}
        </GCard>
        <ShareButton title={property.name} disabled={preview} />
      </PanelScreen>
    );
  }

  const showNav = view.kind !== "cover";
  const navItems = [
    { kind: "home" as const, label: "Início", icon: Home },
    { kind: "contact" as const, label: "Contato", icon: Phone },
    { kind: "search" as const, label: "Buscar", icon: Search },
    { kind: "help" as const, label: "Ajuda", icon: CircleHelp },
    { kind: "more" as const, label: "Mais", icon: MoreHorizontal },
  ];

  return (
    <div
      ref={rootRef}
      style={themeStyle(theme)}
      className="flex min-h-[inherit] flex-col font-[family-name:var(--font-sans)]"
    >
      <main className="flex min-h-[inherit] flex-1 flex-col pb-2">{screen}</main>

      {showNav && (
        <nav
          aria-label="Navegação do guia"
          className="sticky bottom-0 z-10 grid grid-cols-5 border-t border-[var(--g-border)] bg-[var(--g-surface)]/95 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur"
        >
          {navItems.map((item) => {
            const active = view.kind === item.kind;
            if (item.kind === "search") {
              return (
                <button
                  key={item.kind}
                  type="button"
                  onClick={() => navigate({ kind: "search" })}
                  className="flex flex-col items-center gap-0.5 text-[11px] font-medium"
                >
                  <span className="-mt-5 flex size-12 items-center justify-center rounded-full border-4 border-[var(--g-bg)] bg-[var(--g-primary)] text-[var(--g-primary-fg)] shadow-lg">
                    <item.icon className="size-5" />
                  </span>
                  {item.label}
                </button>
              );
            }
            return (
              <button
                key={item.kind}
                type="button"
                onClick={() => navigate({ kind: item.kind })}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-1 text-[11px] font-medium",
                  active ? "text-[var(--g-primary)]" : "text-[var(--g-muted)]",
                )}
              >
                <item.icon className="size-5" />
                {item.label}
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}

function PanelScreen({
  title,
  subtitle,
  onBack,
  children,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-3 border-b border-[var(--g-border)] bg-[var(--g-surface)] px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar ao início"
          className="flex size-9 items-center justify-center rounded-full bg-[var(--g-bg)]"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div>
          <GHeading className="text-base">{title}</GHeading>
          <GMuted className="text-xs">{subtitle}</GMuted>
        </div>
      </div>
      <div className="space-y-3 p-4">{children}</div>
    </div>
  );
}

function SearchScreen({
  guide,
  sections,
  onBack,
  onOpen,
}: {
  guide: GuideData;
  sections: GuideSectionData[];
  onBack: () => void;
  onOpen: (type: GuideSectionData["type"]) => void;
}) {
  const [query, setQuery] = useState("");
  const results = searchSections(sections, guide.recommendations, query);
  const suggestions = ["Wi-Fi", "Senha", "Check-out", "Regras", "Estacionamento"];

  return (
    <PanelScreen title="Buscar" subtitle="Encontre qualquer informação" onBack={onBack}>
      <label className="flex items-center gap-2 rounded-full border border-[var(--g-border)] bg-[var(--g-surface)] px-4 py-2.5">
        <Search className="size-4 text-[var(--g-muted)]" />
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ex.: senha do wi-fi"
          className="flex-1 bg-transparent text-sm outline-none"
        />
      </label>

      {query.trim().length < 2 ? (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setQuery(suggestion)}
              className="rounded-full bg-[var(--g-surface)] px-3 py-1.5 text-sm"
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : results.length === 0 ? (
        <GMuted className="text-center">Nada encontrado para “{query}”.</GMuted>
      ) : (
        results.map(({ section, snippet }) => (
          <button key={section.id} type="button" onClick={() => onOpen(section.type)} className="w-full text-left">
            <GCard className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{section.title}</p>
                {snippet && <GMuted className="truncate">{snippet}</GMuted>}
              </div>
              <ChevronRight className="size-4 text-[var(--g-muted)]" />
            </GCard>
          </button>
        ))
      )}
    </PanelScreen>
  );
}

function ShareButton({ title, disabled }: { title: string; disabled: boolean }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href.split("#")[0];
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => null);
      return;
    }
    await navigator.clipboard.writeText(url).catch(() => null);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" onClick={share} disabled={disabled} className={cn(gButtonClass("outline"), "w-full")}>
      <Share2 className="size-4" />
      {copied ? "Link copiado!" : "Compartilhar guia"}
    </button>
  );
}

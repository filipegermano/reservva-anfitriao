/**
 * Temas do guia digital. Cada tema define as cores do guia do hóspede e a
 * paleta dos cards de seção; o layout é o mesmo, muda a "cara".
 */
export type GuideTheme = {
  id: string;
  name: string;
  description: string;
  /** Fundo da página. */
  background: string;
  /** Superfície dos cards e painéis. */
  surface: string;
  foreground: string;
  muted: string;
  border: string;
  primary: string;
  primaryForeground: string;
  /** Cabeçalho das páginas de seção. */
  headerGradient: string;
  /** Fonte dos títulos (variável CSS definida no layout raiz). */
  headingFont: string;
  radius: string;
  /** Cores de fundo/ícone dos cards de seção, em rodízio. */
  tiles: { background: string; foreground: string }[];
  /**
   * "tone": cada tipo de seção tem sua cor. "checker": as cores alternam em
   * xadrez pela posição do card na grade (visual monocromático).
   */
  tileMode?: "tone" | "checker";
  /** Card em destaque na tela inicial (usado no Wi-Fi, a seção mais procurada). */
  featuredTile?: { background: string; foreground: string };
  /** Borda fina nos cards da tela inicial. */
  tileBorder?: boolean;
  /** Filtro aplicado às fotos de capa (ex.: dessaturar). */
  coverFilter?: string;
};

const displayFont = "var(--font-heading), ui-serif, Georgia, serif";
const sansFont = "var(--font-sans), ui-sans-serif, system-ui, sans-serif";

export const guideThemes: GuideTheme[] = [
  {
    id: "grafite",
    name: "Grafite",
    description: "Monocromático, com bordas suaves",
    background: "#f6f6f5",
    surface: "#ffffff",
    foreground: "#1f2023",
    muted: "#76777b",
    border: "#e5e5e3",
    primary: "#2a2b2e",
    primaryForeground: "#ffffff",
    headerGradient: "#2a2b2e",
    headingFont: sansFont,
    radius: "1.25rem",
    tiles: [
      { background: "#ffffff", foreground: "#2a2b2e" },
      { background: "#ececeb", foreground: "#2a2b2e" },
    ],
    tileMode: "checker",
    featuredTile: { background: "#2a2b2e", foreground: "#ffffff" },
    tileBorder: true,
    coverFilter: "saturate(0.6)",
  },
  {
    id: "salvia",
    name: "Verde sálvia",
    description: "Verde suave e natural, com bordas leves",
    background: "#f3f5f0",
    surface: "#ffffff",
    foreground: "#26332a",
    muted: "#6b786d",
    border: "#dde4d8",
    primary: "#5f7d61",
    primaryForeground: "#ffffff",
    headerGradient: "linear-gradient(135deg, #5f7d61 0%, #87a287 100%)",
    headingFont: sansFont,
    radius: "1.25rem",
    tiles: [
      { background: "#ffffff", foreground: "#4d6a50" },
      { background: "#e6ece2", foreground: "#4d6a50" },
    ],
    tileMode: "checker",
    featuredTile: { background: "#5f7d61", foreground: "#ffffff" },
    tileBorder: true,
  },
  {
    id: "moderno",
    name: "Moderno",
    description: "Cores vivas e cards arredondados",
    background: "#f6f5fb",
    surface: "#ffffff",
    foreground: "#1d1b2e",
    muted: "#6b6880",
    border: "#e6e3f0",
    primary: "#6d4ae8",
    primaryForeground: "#ffffff",
    headerGradient: "linear-gradient(135deg, #6d4ae8 0%, #3f7cf0 100%)",
    headingFont: sansFont,
    radius: "1.25rem",
    tiles: [
      { background: "#efe8ff", foreground: "#6d4ae8" },
      { background: "#fff4cf", foreground: "#b8860b" },
      { background: "#ffe7dc", foreground: "#d4572a" },
      { background: "#dff5e6", foreground: "#1f8a4c" },
      { background: "#e0edff", foreground: "#2f64d6" },
      { background: "#dff6f7", foreground: "#128593" },
      { background: "#ffe3e8", foreground: "#cf3456" },
      { background: "#ece9f5", foreground: "#4c4766" },
    ],
  },
  {
    id: "elegante",
    name: "Elegante",
    description: "Fundo escuro com detalhes dourados",
    background: "#111214",
    surface: "#1b1c20",
    foreground: "#f3efe6",
    muted: "#a19d93",
    border: "#2c2d33",
    primary: "#c9a45c",
    primaryForeground: "#161616",
    headerGradient: "linear-gradient(135deg, #26272c 0%, #111214 100%)",
    headingFont: displayFont,
    radius: "0.75rem",
    tiles: [{ background: "#26272c", foreground: "#c9a45c" }],
  },
  {
    id: "tropical",
    name: "Tropical",
    description: "Tons de mar e areia, ideal para praia",
    background: "#f3faf8",
    surface: "#ffffff",
    foreground: "#123b3a",
    muted: "#5b7d7a",
    border: "#d4ebe6",
    primary: "#0f9d8f",
    primaryForeground: "#ffffff",
    headerGradient: "linear-gradient(135deg, #0f9d8f 0%, #f2a65a 100%)",
    headingFont: sansFont,
    radius: "1.5rem",
    tiles: [
      { background: "#d9f3ee", foreground: "#0f7f74" },
      { background: "#ffe9d2", foreground: "#c46a1c" },
      { background: "#dcefff", foreground: "#2371b8" },
      { background: "#fde2e0", foreground: "#c2453b" },
    ],
  },
  {
    id: "rustico",
    name: "Rústico",
    description: "Terrosos e aconchegantes, para campo e serra",
    background: "#f5efe6",
    surface: "#fffaf3",
    foreground: "#3a2a1d",
    muted: "#7d6a58",
    border: "#e5d8c5",
    primary: "#8a5a2b",
    primaryForeground: "#fffaf3",
    headerGradient: "linear-gradient(135deg, #8a5a2b 0%, #5b6b3a 100%)",
    headingFont: displayFont,
    radius: "0.9rem",
    tiles: [
      { background: "#efe0cc", foreground: "#8a5a2b" },
      { background: "#e3e8d3", foreground: "#5b6b3a" },
      { background: "#f3dccf", foreground: "#a24f2f" },
    ],
  },
  {
    id: "minimalista",
    name: "Minimalista",
    description: "Preto e branco, limpo e direto",
    background: "#fafafa",
    surface: "#ffffff",
    foreground: "#111111",
    muted: "#6b6b6b",
    border: "#e5e5e5",
    primary: "#111111",
    primaryForeground: "#ffffff",
    headerGradient: "linear-gradient(135deg, #111111 0%, #3a3a3a 100%)",
    headingFont: sansFont,
    radius: "0.5rem",
    tiles: [{ background: "#f1f1f1", foreground: "#111111" }],
  },
  {
    id: "boutique",
    name: "Boutique Editorial",
    description: "Tipografia de revista e tons de vinho",
    background: "#fbf7f4",
    surface: "#ffffff",
    foreground: "#2b1a1f",
    muted: "#826a70",
    border: "#eddfe0",
    primary: "#7b2d43",
    primaryForeground: "#ffffff",
    headerGradient: "linear-gradient(135deg, #7b2d43 0%, #c77d5b 100%)",
    headingFont: displayFont,
    radius: "0.25rem",
    tiles: [
      { background: "#f5e4e8", foreground: "#7b2d43" },
      { background: "#f7e9df", foreground: "#a45a37" },
    ],
  },
];

export const defaultThemeId = guideThemes[0].id;

export function getTheme(id: string | null | undefined): GuideTheme {
  return guideThemes.find((theme) => theme.id === id) ?? guideThemes[0];
}

export function isThemeId(id: string): boolean {
  return guideThemes.some((theme) => theme.id === id);
}

export function tileColors(theme: GuideTheme, tone: number) {
  return theme.tiles[tone % theme.tiles.length];
}

/** Cores do card na tela inicial, considerando destaque e modo do tema. */
export function homeTileColors(
  theme: GuideTheme,
  { tone, index, featured }: { tone: number; index: number; featured: boolean },
) {
  if (featured && theme.featuredTile) return theme.featuredTile;
  if (theme.tileMode === "checker") {
    const row = Math.floor(index / 2);
    return theme.tiles[(row + index) % theme.tiles.length];
  }
  return tileColors(theme, tone);
}

/** Variáveis CSS aplicadas na raiz do guia do hóspede. */
export function themeStyle(theme: GuideTheme): React.CSSProperties {
  return {
    "--g-bg": theme.background,
    "--g-surface": theme.surface,
    "--g-fg": theme.foreground,
    "--g-muted": theme.muted,
    "--g-border": theme.border,
    "--g-primary": theme.primary,
    "--g-primary-fg": theme.primaryForeground,
    "--g-header": theme.headerGradient,
    "--g-heading": theme.headingFont,
    "--g-radius": theme.radius,
    background: theme.background,
    color: theme.foreground,
  } as React.CSSProperties;
}

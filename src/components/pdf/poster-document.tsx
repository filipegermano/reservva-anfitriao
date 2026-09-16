import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import {
  posterLanguages,
  posterSizes,
  type PosterContent,
  type PosterLanguage,
  type PosterSize,
  type PosterTemplate,
} from "@/lib/poster";

// Sem hifenização automática: o padrão quebra nomes como "cobertu-ra" e
// acrescenta traços nos links (que são quebrados à mão, ver `wrapUrl`).
Font.registerHyphenationCallback((word) => [word]);

/**
 * Quebra o link em linhas que caibam em `maxChars`, preferindo cortar depois
 * de "/", "-" ou ".".
 */
export function wrapUrl(url: string, maxChars: number): string {
  const text = url.replace(/^https?:\/\//, "");
  const pieces = text.split(/(?<=[/.-])/).flatMap((piece) =>
    piece.length <= maxChars ? [piece] : (piece.match(new RegExp(`.{1,${maxChars}}`, "g")) ?? []),
  );
  const lines: string[] = [];
  let current = "";
  for (const piece of pieces) {
    if (current && current.length + piece.length > maxChars) {
      lines.push(current);
      current = "";
    }
    current += piece;
  }
  if (current) lines.push(current);
  return lines.join("\n");
}

/** QR code impresso menor que ~1,7 cm fica difícil de escanear. */
const MIN_QR_SIZE = 48;

type PosterDocumentProps = {
  content: PosterContent;
  template: PosterTemplate;
  size: PosterSize;
  lang: PosterLanguage;
  showWifi: boolean;
  showRules: boolean;
  showContact: boolean;
  guideUrl: string;
  qrCodeDataUrl: string;
  /** Foto de capa já convertida (data URI JPEG); sem ela, só a faixa de cor. */
  coverImage?: string | null;
  /** Nível de compactação (0 = normal); ver `posterDensityLevels`. */
  density?: number;
};

/**
 * Níveis de compactação, do mais espaçoso ao mais denso. A rota tenta cada
 * nível até o cartaz caber em uma página: primeiro aperta espaços, QR code e
 * fontes, e só no fim reduz a quantidade e o tamanho das regras.
 */
export const posterDensityLevels = [
  { space: 1, font: 1, qr: 1, maxRules: 8, ruleChars: 220, welcome: true, footer: true },
  { space: 0.8, font: 0.95, qr: 0.85, maxRules: 8, ruleChars: 220, welcome: true, footer: true },
  { space: 0.65, font: 0.9, qr: 0.75, maxRules: 8, ruleChars: 220, welcome: false, footer: false },
  { space: 0.55, font: 0.85, qr: 0.7, maxRules: 8, ruleChars: 220, welcome: false, footer: false },
  { space: 0.5, font: 0.8, qr: 0.65, maxRules: 8, ruleChars: 160, welcome: false, footer: false },
  { space: 0.45, font: 0.8, qr: 0.6, maxRules: 6, ruleChars: 130, welcome: false, footer: false },
  { space: 0.45, font: 0.8, qr: 0.6, maxRules: 5, ruleChars: 110, welcome: false, footer: false },
  { space: 0.45, font: 0.8, qr: 0.6, maxRules: 4, ruleChars: 90, welcome: false, footer: false },
  { space: 0.45, font: 0.8, qr: 0.6, maxRules: 3, ruleChars: 80, welcome: false, footer: false },
] as const;

type Density = (typeof posterDensityLevels)[number];

function truncate(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}

/** Escalas a partir do A4: espaçamento (`s`), larguras (`w`) e fontes (`f`). */
function posterMetrics(size: PosterSize, density: Density) {
  const k = posterSizes[size].width / posterSizes.A4.width;
  return {
    // Espaçamentos encolhem com o nível de compactação; larguras fixas usam `w`.
    s: (value: number) => value * k * density.space,
    w: (value: number) => value * k,
    // Em formatos pequenos (A6) o texto não encolhe na mesma proporção, para
    // continuar legível impresso.
    f: (value: number) => value * Math.max(k, 0.72) * density.font,
  };
}

function qrSize(size: PosterSize, density: Density) {
  return Math.max(posterMetrics(size, density).w(120) * density.qr, MIN_QR_SIZE);
}

/** Quantos caracteres do link cabem por linha ao lado do QR code. */
function urlCharsPerLine(size: PosterSize, density: Density) {
  const { s, f } = posterMetrics(size, density);
  const textWidth =
    posterSizes[size].width - 2 * s(40) - 2 * s(16) - (qrSize(size, density) + 2 * s(6)) - s(18);
  // Largura média de um caractere em Helvetica, com folga.
  return Math.max(12, Math.floor(textWidth / (f(8.5) * 0.56)));
}

/** Os estilos são pensados em A4 e escalados para os outros tamanhos. */
function createStyles(
  template: PosterTemplate,
  size: PosterSize,
  titleLength: number,
  withImage: boolean,
  density: Density,
) {
  const { s, w, f } = posterMetrics(size, density);
  const titleSize = titleLength > 48 ? 26 : titleLength > 28 ? 32 : 40;

  return StyleSheet.create({
    page: {
      backgroundColor: template.background,
      color: template.foreground,
      fontFamily: template.bodyFont,
      padding: s(40),
      display: "flex",
      flexDirection: "column",
    },
    header: withImage
      ? {
          position: "relative",
          overflow: "hidden",
          alignItems: "center",
          paddingTop: s(size === "A6" ? 56 : 90),
          paddingBottom: s(24),
          paddingHorizontal: s(24),
          borderRadius: w(18),
          backgroundColor: template.accent,
          color: "#ffffff",
        }
      : {
          alignItems: "center",
          paddingVertical: s(template.banner ? 28 : 16),
          paddingHorizontal: s(24),
          borderRadius: w(18),
          backgroundColor: template.banner ? template.accent : "transparent",
          color: template.banner ? template.accentForeground : template.foreground,
        },
    headerImage: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      objectFit: "cover",
    },
    headerShade: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "#000000",
      opacity: 0.45,
    },
    eyebrow: {
      fontSize: f(12),
      letterSpacing: s(4),
      textTransform: "uppercase",
      opacity: 0.85,
    },
    title: {
      fontFamily: template.headingFont,
      // O título já é grande: acompanha a escala do papel.
      fontSize: w(titleSize) * density.font,
      textAlign: "center",
      marginTop: s(8),
      lineHeight: 1.15,
    },
    city: {
      fontSize: f(11),
      marginTop: s(6),
      opacity: 0.8,
    },
    divider: {
      width: w(60),
      height: w(2),
      marginTop: s(14),
      backgroundColor: withImage || template.banner ? "#ffffff" : template.accent,
    },
    message: {
      fontSize: f(13),
      textAlign: "center",
      color: template.muted,
      marginTop: s(18),
      marginHorizontal: s(30),
      lineHeight: 1.5,
    },
    grid: {
      display: "flex",
      flexDirection: "row",
      flexWrap: "wrap",
      gap: s(10),
      marginTop: s(20),
    },
    card: {
      flexGrow: 1,
      flexBasis: w(150),
      backgroundColor: template.surface,
      borderRadius: w(12),
      padding: s(12),
      borderWidth: w(1),
      borderColor: template.background === "#ffffff" ? "#e5e5e5" : template.surface,
    },
    label: {
      fontSize: f(8.5),
      letterSpacing: s(1.5),
      textTransform: "uppercase",
      color: template.accent,
      fontFamily: template.headingFont,
    },
    value: {
      fontSize: f(13),
      fontFamily: template.headingFont,
      marginTop: s(4),
    },
    detail: {
      fontSize: f(9.5),
      color: template.muted,
      marginTop: s(2),
    },
    rules: {
      marginTop: s(16),
      backgroundColor: template.surface,
      borderRadius: w(12),
      padding: s(14),
    },
    rule: {
      display: "flex",
      flexDirection: "row",
      marginTop: s(6),
    },
    bullet: {
      width: w(12),
      fontSize: f(10.5),
      color: template.accent,
    },
    ruleText: {
      flex: 1,
      fontSize: f(10.5),
      lineHeight: 1.35,
    },
    qrSection: {
      marginTop: "auto",
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: s(18),
      padding: s(16),
      borderRadius: w(16),
      backgroundColor: template.accent,
      color: template.accentForeground,
    },
    qrFrame: {
      backgroundColor: "#ffffff",
      borderRadius: w(10),
      padding: s(6),
    },
    qrImage: {
      width: qrSize(size, density),
      height: qrSize(size, density),
    },
    qrTexts: {
      flex: 1,
    },
    qrTitle: {
      fontFamily: template.headingFont,
      fontSize: f(16),
      lineHeight: 1.25,
    },
    qrDetail: {
      fontSize: f(10),
      marginTop: s(6),
      opacity: 0.85,
    },
    qrUrl: {
      fontSize: f(8.5),
      marginTop: s(8),
      opacity: 0.75,
    },
    footer: {
      fontSize: f(8),
      textAlign: "center",
      color: template.muted,
      marginTop: s(10),
    },
  });
}

export function PosterDocument({
  content,
  template,
  size,
  lang,
  showWifi,
  showRules,
  guideUrl,
  qrCodeDataUrl,
  coverImage,
  showContact,
  density = 0,
}: PosterDocumentProps) {
  const t = posterLanguages[lang];
  const level = posterDensityLevels[Math.min(density, posterDensityLevels.length - 1)];
  const styles = createStyles(template, size, content.name.length, Boolean(coverImage), level);
  // A6 tem pouco espaço: nunca mostra a mensagem de boas-vindas.
  const compact = size === "A6";
  const wifi = showWifi ? content.wifi : null;
  const contact = showContact ? content.contact : "";
  const rules = showRules
    ? content.rules.slice(0, level.maxRules).map((rule) => truncate(rule, level.ruleChars))
    : [];

  return (
    <Document title={`Cartaz — ${content.name}`}>
      <Page size={size} style={styles.page}>
        <View style={styles.header}>
          {coverImage ? (
            <>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={coverImage} style={styles.headerImage} />
              <View style={styles.headerShade} />
            </>
          ) : null}
          <Text style={styles.eyebrow}>{t.eyebrow}</Text>
          <Text style={styles.title}>{content.name}</Text>
          {content.city ? <Text style={styles.city}>{content.city}</Text> : null}
          <View style={styles.divider} />
        </View>

        {content.welcomeMessage && !compact && level.welcome ? (
          <Text style={styles.message}>{content.welcomeMessage}</Text>
        ) : null}

        <View style={styles.grid}>
          {wifi ? (
            <View style={styles.card}>
              <Text style={styles.label}>{t.wifi}</Text>
              {wifi.name ? <Text style={styles.value}>{wifi.name}</Text> : null}
              {wifi.password ? (
                <Text style={styles.detail}>
                  {t.password}: {wifi.password}
                </Text>
              ) : null}
            </View>
          ) : null}
          {content.checkInTime ? (
            <View style={styles.card}>
              <Text style={styles.label}>{t.checkIn}</Text>
              <Text style={styles.value}>{content.checkInTime}</Text>
              <Text style={styles.detail}>{t.from}</Text>
            </View>
          ) : null}
          {content.checkOutTime ? (
            <View style={styles.card}>
              <Text style={styles.label}>{t.checkOut}</Text>
              <Text style={styles.value}>{content.checkOutTime}</Text>
              <Text style={styles.detail}>{t.until}</Text>
            </View>
          ) : null}
          {contact ? (
            <View style={styles.card}>
              <Text style={styles.label}>{t.contact}</Text>
              <Text style={styles.value}>{contact}</Text>
            </View>
          ) : null}
        </View>

        {rules.length > 0 ? (
          <View style={styles.rules}>
            <Text style={styles.label}>{t.rules}</Text>
            {rules.map((rule, index) => (
              <View key={index} style={styles.rule}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.ruleText}>{rule}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.qrSection}>
          <View style={styles.qrFrame}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={qrCodeDataUrl} style={styles.qrImage} />
          </View>
          <View style={styles.qrTexts}>
            <Text style={styles.qrTitle}>{t.scan}</Text>
            <Text style={styles.qrDetail}>{t.scanDetail}</Text>
            <Text style={styles.qrUrl}>{wrapUrl(guideUrl, urlCharsPerLine(size, level))}</Text>
          </View>
        </View>

        {level.footer ? <Text style={styles.footer}>{t.footer}</Text> : null}
      </Page>
    </Document>
  );
}

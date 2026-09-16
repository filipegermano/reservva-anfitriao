import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import {
  posterLanguages,
  posterSizes,
  type PosterContent,
  type PosterLanguage,
  type PosterSize,
  type PosterTemplate,
} from "@/lib/poster";

type PosterDocumentProps = {
  content: PosterContent;
  template: PosterTemplate;
  size: PosterSize;
  lang: PosterLanguage;
  showWifi: boolean;
  showRules: boolean;
  guideUrl: string;
  qrCodeDataUrl: string;
  /** Foto de capa já convertida (data URI JPEG); sem ela, só a faixa de cor. */
  coverImage?: string | null;
};

/** Os estilos são pensados em A4 e escalados para os outros tamanhos. */
function createStyles(
  template: PosterTemplate,
  size: PosterSize,
  titleLength: number,
  withImage: boolean,
) {
  const k = posterSizes[size].width / posterSizes.A4.width;
  const s = (value: number) => value * k;
  // Em formatos pequenos (A6) o texto não encolhe na mesma proporção, para
  // continuar legível impresso.
  const f = (value: number) => value * Math.max(k, 0.72);
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
          borderRadius: s(18),
          backgroundColor: template.accent,
          color: "#ffffff",
        }
      : {
          alignItems: "center",
          paddingVertical: s(template.banner ? 28 : 16),
          paddingHorizontal: s(24),
          borderRadius: s(18),
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
      fontSize: s(titleSize),
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
      width: s(60),
      height: s(2),
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
      flexBasis: s(150),
      backgroundColor: template.surface,
      borderRadius: s(12),
      padding: s(12),
      borderWidth: s(1),
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
      borderRadius: s(12),
      padding: s(14),
    },
    rule: {
      display: "flex",
      flexDirection: "row",
      marginTop: s(6),
    },
    bullet: {
      width: s(12),
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
      borderRadius: s(16),
      backgroundColor: template.accent,
      color: template.accentForeground,
    },
    qrFrame: {
      backgroundColor: "#ffffff",
      borderRadius: s(10),
      padding: s(6),
    },
    qrImage: {
      width: s(120),
      height: s(120),
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
}: PosterDocumentProps) {
  const t = posterLanguages[lang];
  const styles = createStyles(template, size, content.name.length, Boolean(coverImage));
  // A6 tem pouco espaço: menos regras e sem a mensagem de boas-vindas.
  const compact = size === "A6";
  const wifi = showWifi ? content.wifi : null;
  const maxRules = compact ? (coverImage ? 2 : 3) : coverImage ? 4 : 5;
  const rules = showRules ? content.rules.slice(0, maxRules) : [];

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

        {content.welcomeMessage && lang === "pt" && !compact ? (
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
          {content.contact ? (
            <View style={styles.card}>
              <Text style={styles.label}>{t.contact}</Text>
              <Text style={styles.value}>{content.contact}</Text>
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
            <Text style={styles.qrUrl}>{guideUrl}</Text>
          </View>
        </View>

        <Text style={styles.footer}>{t.footer}</Text>
      </Page>
    </Document>
  );
}

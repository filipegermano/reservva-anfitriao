import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { Property } from "@/generated/prisma/client";

const styles = StyleSheet.create({
  page: {
    padding: 56,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    height: "100%",
    fontFamily: "Helvetica",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
  },
  eyebrow: {
    fontSize: 12,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  title: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },
  address: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
  },
  body: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 20,
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    color: "#374151",
    maxWidth: 360,
    lineHeight: 1.5,
  },
  qrFrame: {
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
  },
  qrImage: {
    width: 220,
    height: 220,
  },
  helper: {
    fontSize: 11,
    color: "#6b7280",
    textAlign: "center",
  },
  wifiBox: {
    display: "flex",
    flexDirection: "row",
    gap: 24,
    marginTop: 8,
  },
  wifiItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  wifiLabel: {
    fontSize: 9,
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  wifiValue: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
  },
  footer: {
    fontSize: 10,
    color: "#9ca3af",
  },
});

export function PosterDocument({
  property,
  guideUrl,
  qrCodeDataUrl,
}: {
  property: Property;
  guideUrl: string;
  qrCodeDataUrl: string;
}) {
  return (
    <Document title={`Cartaz — ${property.name}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Bem-vindo(a)</Text>
          <Text style={styles.title}>{property.name}</Text>
          {property.address ? <Text style={styles.address}>{property.address}</Text> : null}
        </View>

        <View style={styles.body}>
          <Text style={styles.message}>
            {property.welcomeMessage ??
              "Escaneie o QR code abaixo para acessar o guia completo do hóspede: Wi-Fi, horários de check-in e check-out, regras da casa e dicas da região."}
          </Text>

          <View style={styles.qrFrame}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={qrCodeDataUrl} style={styles.qrImage} />
          </View>

          <Text style={styles.helper}>{guideUrl}</Text>

          {(property.wifiName || property.wifiPassword) && (
            <View style={styles.wifiBox}>
              {property.wifiName && (
                <View style={styles.wifiItem}>
                  <Text style={styles.wifiLabel}>Wi-Fi</Text>
                  <Text style={styles.wifiValue}>{property.wifiName}</Text>
                </View>
              )}
              {property.wifiPassword && (
                <View style={styles.wifiItem}>
                  <Text style={styles.wifiLabel}>Senha</Text>
                  <Text style={styles.wifiValue}>{property.wifiPassword}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <Text style={styles.footer}>Guia digital criado com Reservva Anfitrião</Text>
      </Page>
    </Document>
  );
}

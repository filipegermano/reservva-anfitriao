import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

import { Providers } from "@/components/providers";

const bodyFont = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const headingFont = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: "variable",
  axes: ["opsz", "SOFT"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Reservva Anfitrião — cartazes e guias digitais para hóspedes",
  description:
    "Crie cartazes de boas-vindas e guias digitais profissionais para o seu Airbnb, pousada ou temporada — sem precisar saber design.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${bodyFont.variable} ${headingFont.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

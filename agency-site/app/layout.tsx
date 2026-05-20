import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mcsite.vercel.app"),
  title: {
    default: "MCSite — Refonte de sites web pour restaurants & commerces en Afrique",
    template: "%s | MCSite",
  },
  description:
    "On refait votre site en 7 jours. Plus de réservations WhatsApp, plus de visibilité Google, plus de clients. Cible : restaurants, hôtels, commerces locaux en Afrique francophone.",
  keywords: [
    "refonte site web Afrique",
    "site restaurant Cameroun",
    "site web Côte d'Ivoire",
    "création site Douala",
    "site web Dakar",
    "agence web francophone",
  ],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    title: "MCSite — Votre site refait en 7 jours",
    description:
      "Refonte rapide de sites web pour restaurants, hôtels et commerces en Afrique francophone.",
    siteName: "MCSite",
  },
  twitter: {
    card: "summary_large_image",
    title: "MCSite — Votre site refait en 7 jours",
    description:
      "Refonte rapide de sites web pour restaurants, hôtels et commerces en Afrique francophone.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}

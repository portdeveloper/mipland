import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import MipNav from "@/components/MipNav";
import MipChat from "@/components/MipChat";
import SelectionTooltip from "@/components/SelectionTooltip";
import LanguageBanner from "@/components/LanguageBanner";
import GlobalFooter from "@/components/GlobalFooter";
import { LanguageProvider } from "@/i18n/LanguageContext";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://mipland.com"
  ),
  title: {
    default: "MIP Land",
    template: "%s | MIP Land",
  },
  description: "Interactive explainers for Monad Improvement Proposals",
  openGraph: {
    siteName: "MIP Land",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable} antialiased`}
    >
      <body className="min-h-screen">
        <LanguageProvider>
          <LanguageBanner />
          <MipNav />
          {children}
          <GlobalFooter />
          <MipChat />
          <SelectionTooltip />
        </LanguageProvider>
      </body>
    </html>
  );
}

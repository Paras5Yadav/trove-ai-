import type { Metadata } from "next";
import { IBM_Plex_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import "@/lib/env"; // Validates environment variables on startup
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";
import { Analytics } from "@vercel/analytics/react";
import { I18nProvider } from "@/components/I18nProvider";
import { Footer } from "@/components/Footer";

const ibmPlexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ['300', '400', '500', '600'], variable: "--font-ibm-plex" });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ['400', '500', '600', '700', '800', '900'], style: ['normal', 'italic'], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "Trove | The Sovereign Exchange",
  description: "Upload your photos, videos, and everyday data to get paid.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          ibmPlexMono.variable,
          playfair.variable,
          "antialiased min-h-screen font-mono"
        )}
      >
        <I18nProvider>
          <Navbar />
          {children}
          <Footer />
        </I18nProvider>
        <Analytics />
      </body>
    </html>
  );
}

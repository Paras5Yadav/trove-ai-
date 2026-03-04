import type { Metadata } from "next";
import { Cormorant_Garamond, Fraunces, Epilogue, Fira_Code } from "next/font/google";
import "./globals.css";
import "@/lib/env";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

const epilogue = Epilogue({
  variable: "--font-epilogue",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Trove AI | Monetize Reality",
  description: "Upload everyday photos, videos, and recordings. AI companies need real-world data—and they'll pay you for it.",
};

import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${cormorant.variable} ${fraunces.variable} ${epilogue.variable} ${firaCode.variable} antialiased bg-moss text-cream font-epilogue`}
      >
        <div className="noise-overlay" aria-hidden="true" />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}

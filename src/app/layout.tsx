import type { Metadata } from "next";
import { IBM_Plex_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
        <header className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex items-center justify-between pointer-events-none">
          <div className="text-xl font-bold tracking-tighter opacity-80 pointer-events-auto">
            <Link href="/">TROVE</Link>
          </div>
          <nav className="flex items-center gap-6 text-sm font-medium tracking-wide uppercase opacity-60 pointer-events-auto">
            <Link href="/" className="hover:opacity-100 transition-opacity">Home</Link>
            <Link href="/dashboard" className="hover:opacity-100 transition-opacity">Dashboard</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}

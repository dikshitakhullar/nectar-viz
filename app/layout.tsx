import type { Metadata } from "next";
import { Cormorant_Garamond, Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { PostHogProvider } from "./providers";
import { AuthProvider } from "./components/auth-provider";
import { BottomNav } from "./components/bottom-nav";
import { UserMenu } from "./components/user-menu";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hanken",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nectar Visualizer",
  description: "See how luxury lighting looks in your room — powered by AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${cormorant.variable} ${hanken.variable} ${plexMono.variable}`}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="bg-bg text-neutral-100 min-h-screen antialiased">
        {/* Liquid flowing background */}
        <div className="liquid-bg">
          <div className="liquid-orb-1" />
          <div className="liquid-orb-2" />
        </div>

        {/* Grain texture overlay */}
        <div className="grain-overlay" />

        {/* Content */}
        <PostHogProvider>
        <AuthProvider>
        <div className="relative z-10">
          <header className="px-5 py-4 bg-bg/60 backdrop-blur-xl sticky top-0 z-40">
            <div className="max-w-lg md:max-w-3xl lg:max-w-4xl mx-auto flex items-baseline justify-between">
              <div>
                <h1 className="text-lg font-light tracking-[0.25em] uppercase text-neutral-200">
                  Nectar
                </h1>
                <p className="text-[10px] tracking-[0.2em] uppercase text-gold mt-0.5 animate-subtle-pulse">
                  Visualizer
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[10px] tracking-widest uppercase text-neutral-600">
                  for Delhi Brass
                </span>
                <UserMenu />
              </div>
            </div>
            <div className="gold-line mt-3" />
          </header>

          <main className="max-w-lg md:max-w-3xl lg:max-w-4xl mx-auto px-5 md:px-8 py-8 pb-28">
            {children}
          </main>

          <BottomNav />
        </div>
        </AuthProvider>
        </PostHogProvider>
        <Analytics />
      </body>
    </html>
  );
}

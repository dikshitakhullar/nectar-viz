import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { PostHogProvider } from "./providers";
import { BottomNav } from "./components/bottom-nav";

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
    <html lang="en" className="dark">
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
        <div className="relative z-10">
          <header className="px-5 py-4 bg-bg/60 backdrop-blur-xl sticky top-0 z-40">
            <div className="max-w-lg mx-auto flex items-baseline justify-between">
              <div>
                <h1 className="text-lg font-light tracking-[0.25em] uppercase text-neutral-200">
                  Nectar
                </h1>
                <p className="text-[10px] tracking-[0.2em] uppercase text-gold mt-0.5 animate-subtle-pulse">
                  Visualizer
                </p>
              </div>
              <span className="text-[10px] tracking-widest uppercase text-neutral-600">
                for Delhi Brass
              </span>
            </div>
            <div className="gold-line mt-3" />
          </header>

          <main className="max-w-lg mx-auto px-5 py-8 pb-28">
            {children}
          </main>

          <BottomNav />
        </div>
        </PostHogProvider>
        <Analytics />
      </body>
    </html>
  );
}

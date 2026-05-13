import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Delhi Brass — Room Visualizer",
  description: "See how Delhi Brass lighting looks in your room",
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
      <body className="bg-[#0a0a0a] text-neutral-100 min-h-screen antialiased">
        {/* Liquid flowing background */}
        <div className="liquid-bg">
          <div className="liquid-orb-1" />
          <div className="liquid-orb-2" />
        </div>

        {/* Grain texture overlay */}
        <div className="grain-overlay" />

        {/* Content */}
        <div className="relative z-10">
          <header className="px-5 py-4 bg-[#0a0a0a]/60 backdrop-blur-xl sticky top-0 z-40">
            <div className="max-w-lg mx-auto flex items-baseline justify-between">
              <div>
                <h1 className="text-lg font-light tracking-[0.25em] uppercase text-neutral-200">
                  Delhi Brass
                </h1>
                <p className="text-[10px] tracking-[0.2em] uppercase text-[#c9a84c] mt-0.5 animate-subtle-pulse">
                  Room Visualizer
                </p>
              </div>
              <span className="text-[10px] tracking-widest uppercase text-neutral-600">
                Est. 1949
              </span>
            </div>
            <div className="gold-line mt-3" />
          </header>

          <main className="max-w-lg mx-auto px-5 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

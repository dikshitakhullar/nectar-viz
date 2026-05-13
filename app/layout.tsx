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
      <body className="bg-neutral-950 text-neutral-100 min-h-screen antialiased">
        <header className="px-5 py-4 border-b border-neutral-800/50 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-40">
          <h1 className="text-lg font-light tracking-[0.2em] uppercase text-neutral-200">Delhi Brass</h1>
          <p className="text-[11px] tracking-[0.15em] uppercase text-amber-500/80 mt-0.5">Room Visualizer</p>
        </header>
        <main className="max-w-lg mx-auto px-5 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}

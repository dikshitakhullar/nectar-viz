import { HomeContent } from "./components/home-content";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Brand wordmark — page-level, not the doc-level <h1> (that lives in app/layout.tsx). */}
      <section className="pt-10 pb-4">
        <p className="text-center font-serif text-base text-gold tracking-[0.18em] uppercase font-light">
          Nectar
        </p>
      </section>

      {/* Pitch headline */}
      <section className="px-5">
        <p className="text-center font-serif text-[26px] leading-[1.25] font-light text-neutral-200">
          Find products
          <br />
          tailored to your space.
        </p>

        {/* Gold divider */}
        <div className="w-14 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mt-6" />
      </section>

      {/* Cards + room banner (client component reads sessionStorage) */}
      <HomeContent />
    </div>
  );
}

import { RoomBanner } from "./components/room-banner";
import { UploadCallout } from "./components/upload-callout";

export default function ProductPage() {
  return (
    <div className="space-y-10 animate-fade-in-up py-12">
      {/* Intro */}
      <div className="text-center">
        <h2 className="text-xl font-extralight tracking-wide text-neutral-200">
          See It In Your Room
        </h2>
        <p className="text-sm text-neutral-500 mt-2 max-w-sm mx-auto leading-relaxed">
          Pick a light, upload your room, see it in your space.
        </p>
        <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mt-4" />
      </div>

      {/* Upload callout — only renders when NO room is in sessionStorage */}
      <UploadCallout />

      {/* Room banner — only renders when a room IS in sessionStorage */}
      <RoomBanner />

      {/* Atmospheric footer mark — fills the negative space without adding a CTA */}
      <div className="flex items-center justify-center gap-4 pt-6">
        <div className="h-[1px] flex-1 max-w-[80px] bg-gradient-to-r from-transparent to-gold/30" />
        <span className="text-gold/60 text-xs">✦</span>
        <div className="h-[1px] flex-1 max-w-[80px] bg-gradient-to-l from-transparent to-gold/30" />
      </div>
      <p className="text-center text-[11px] text-neutral-600 uppercase tracking-widest -mt-6">
        Every product, finally visible in your space.
      </p>
    </div>
  );
}

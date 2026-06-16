"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { getAllProducts, getProductTypes } from "@/lib/catalog";
import type { Product, ProductType } from "@/lib/types";

interface CatalogModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (productSlug: string) => void;
  /** Pre-seed the type filter when the modal opens. Null = show all. */
  initialTypeFilter?: ProductType | null;
}

export function CatalogModal({ open, onClose, onSelect, initialTypeFilter }: CatalogModalProps) {
  const [typeFilter, setTypeFilter] = useState<ProductType | null>(null);
  const [mounted, setMounted] = useState(false);

  // Portal to document.body so the modal escapes any transformed ancestor
  // (e.g. animate-fade-in-up on the upload page would otherwise re-anchor
  // `position: fixed` to that ancestor instead of the viewport).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const types = useMemo(() => getProductTypes(), []);
  const allProducts = useMemo(() => getAllProducts(), []);
  const products = useMemo(
    () =>
      typeFilter
        ? allProducts.filter((p) => p.category === typeFilter)
        : allProducts,
    [allProducts, typeFilter],
  );

  // Seed filter from initialTypeFilter each time the modal opens — prop→state
  // sync, the canonical setState-in-effect pattern.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (open) setTypeFilter(initialTypeFilter ?? null);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, initialTypeFilter]);

  // Body scroll lock + ESC handler — only active while open.
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-stretch md:items-center md:justify-center bg-black/85 backdrop-blur-md animate-catalog-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="catalog-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col w-full h-full md:h-[85vh] md:max-h-[85vh] md:max-w-5xl md:w-[92vw] bg-surface md:rounded-3xl md:border md:border-gold/20 md:shadow-[0_30px_100px_rgba(0,0,0,0.8),0_0_0_1px_rgba(201,168,76,0.06)] overflow-hidden animate-catalog-modal"
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur-xl border-b border-white/[0.08]">
          <div className="flex items-start justify-between gap-4 px-5 py-4 pt-[max(1rem,env(safe-area-inset-top))] md:px-7 md:py-5">
            <div className="min-w-0">
              <h2
                id="catalog-modal-title"
                className="text-lg md:text-xl font-light tracking-wide text-neutral-200"
              >
                Browse the catalog
              </h2>
              <p className="text-[11px] text-neutral-500 mt-1 uppercase tracking-wider">
                {products.length} products · Tap to visualize
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close catalog"
              className="shrink-0 -mr-2 -mt-1 flex items-center justify-center w-11 h-11 rounded-full text-neutral-400 hover:text-neutral-100 hover:bg-white/[0.05] transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-6 md:px-7 md:py-7">
          {/* Type filter chips */}
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5 md:-mx-7 md:px-7 scrollbar-hide">
            <button
              type="button"
              onClick={() => setTypeFilter(null)}
              className={`shrink-0 px-5 py-2.5 rounded-full text-xs tracking-wider uppercase border transition-all duration-300 ${
                !typeFilter
                  ? "bg-gold text-black border-gold scale-[1.04]"
                  : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
              }`}
              style={{ minHeight: "unset", minWidth: "unset" }}
            >
              All
            </button>
            {types.map((type) => {
              const isActive = typeFilter === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTypeFilter(type)}
                  className={`shrink-0 px-5 py-2.5 rounded-full text-xs tracking-wider uppercase border transition-all duration-300 ${
                    isActive
                      ? "bg-gold text-black border-gold scale-[1.04]"
                      : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
                  }`}
                  style={{ minHeight: "unset", minWidth: "unset" }}
                >
                  {type.replace("_", " ")}
                </button>
              );
            })}
          </div>

          {/* Product grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 mt-6">
            {products.map((product) => (
              <CatalogCard
                key={product.slug}
                product={product}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function CatalogCard({
  product,
  onSelect,
}: {
  product: Product;
  onSelect: (slug: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(product.slug)}
      className="group block text-left bg-neutral-900/50 rounded-2xl border border-neutral-800/50 overflow-hidden transition-all duration-300 hover:border-gold/30 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(201,168,76,0.08)] focus:outline-none focus-visible:border-gold/50"
      style={{ minHeight: "44px", minWidth: "44px" }}
    >
      <div className="aspect-square relative bg-neutral-900 overflow-hidden">
        <Image
          src={product.imagePath}
          alt={product.name}
          fill
          className="object-contain p-3 transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 768px) 50vw, 200px"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="p-4 border-t border-neutral-800/30">
        <p className="font-light text-[15px] text-neutral-200 tracking-wide">
          {product.name}
        </p>
        <p className="text-[11px] text-neutral-600 mt-1 uppercase tracking-wider">
          {product.category.replace("_", " ")}
          {product.material ? ` · ${product.material}` : ""}
        </p>
      </div>
    </button>
  );
}

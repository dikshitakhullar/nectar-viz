import { getAllProducts, getProductTypes } from "@/lib/catalog";
import { Product, ProductType } from "@/lib/types";
import Image from "next/image";
import Link from "next/link";

function TypeFilter({
  types,
  selected,
}: {
  types: ProductType[];
  selected?: string;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
      <Link
        href="/"
        className={`shrink-0 px-4 py-1.5 rounded-full text-xs tracking-wider uppercase border transition-all duration-300 ${
          !selected
            ? "bg-[#c9a84c] text-black border-[#c9a84c]"
            : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
        }`}
      >
        All
      </Link>
      {types.map((type) => (
        <Link
          key={type}
          href={`/?type=${type}`}
          className={`shrink-0 px-4 py-1.5 rounded-full text-xs tracking-wider uppercase border transition-all duration-300 ${
            selected === type
              ? "bg-[#c9a84c] text-black border-[#c9a84c]"
              : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
          }`}
        >
          {type.replace("_", " ")}
        </Link>
      ))}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/upload?product=${product.slug}`}
      className="group block bg-neutral-900/50 rounded-xl border border-neutral-800/50 overflow-hidden transition-all duration-300 hover:border-[#c9a84c]/30 hover:shadow-[0_0_30px_rgba(201,168,76,0.05)]"
    >
      <div className="aspect-square relative bg-neutral-900 overflow-hidden">
        <Image
          src={product.imagePath}
          alt={product.name}
          fill
          className="object-contain p-3 transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 200px"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#c9a84c]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="p-3 border-t border-neutral-800/30">
        <p className="font-light text-sm text-neutral-200 tracking-wide">{product.name}</p>
        <p className="text-[11px] text-neutral-500 mt-0.5 uppercase tracking-wider">
          {product.type.replace("_", " ")} · {product.material}
        </p>
      </div>
    </Link>
  );
}

export default async function ProductPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const typeFilter = params.type as ProductType | undefined;
  const types = getProductTypes();
  const allProducts = getAllProducts();
  const products = typeFilter
    ? allProducts.filter((p) => p.type === typeFilter)
    : allProducts;

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Intro */}
      <div className="text-center py-4">
        <h2 className="text-2xl font-extralight tracking-wide text-neutral-200">
          See It In Your Room
        </h2>
        <p className="text-sm text-neutral-500 mt-2 max-w-sm mx-auto leading-relaxed">
          Pick a light from our collection — or let AI choose for you — upload a photo of your room, and see a realistic render in seconds.
        </p>
        <div className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent mx-auto mt-4" />
      </div>

      {/* Header */}
      <div>
        <div className="w-12 h-[1px] bg-gradient-to-r from-[#c9a84c] to-transparent mb-4" />
        <h2 className="text-lg font-extralight tracking-wide text-neutral-200">
          Browse Collection
        </h2>
        <p className="text-sm text-neutral-500 mt-1">
          {products.length} products · Tap to visualize in your room
        </p>
      </div>

      {/* AI Choose option */}
      <Link
        href="/upload?mode=ai"
        className="block bg-gradient-to-r from-[#c9a84c]/10 to-transparent rounded-xl border border-[#c9a84c]/20 p-4 hover:border-[#c9a84c]/40 transition-all duration-300 group"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/30 flex items-center justify-center shrink-0 group-hover:bg-[#c9a84c]/20 transition-colors">
            <span className="text-[#c9a84c] text-lg">✦</span>
          </div>
          <div>
            <p className="text-sm font-light text-neutral-200 tracking-wide">
              Let AI Choose For You
            </p>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Upload your room & tell us the vibe — we&apos;ll pick the 3 best options
            </p>
          </div>
        </div>
      </Link>

      {/* Type filters */}
      <TypeFilter types={types} selected={typeFilter} />

      {/* Product grid */}
      <div className="grid grid-cols-2 gap-3">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}

"use client";

import type { ProductListResponse } from "@/types/product";
import Image from "next/image";
import Link from "next/link";

type Props = {
  categories: { id: number; name: string }[];
  products: ProductListResponse | null;
};

export default function HomeShopBelow({ categories, products }: Props) {
  const hasProducts = products?.content && products.content.length > 0;

  return (
    <div className="space-y-12 pb-16 pt-4 sm:space-y-16 sm:pb-20">
      <section className="grid grid-cols-2 gap-4 border-y border-stone-200/80 py-8 sm:grid-cols-4 sm:gap-6 sm:py-10">
        {[
          { t: "Secure checkout", d: "Encrypted payments" },
          { t: "Fast delivery", d: "Quick dispatch" },
          { t: "Easy returns", d: "7-day policy" },
          { t: "Seller verified", d: "Trusted partners" },
        ].map((item) => (
          <div key={item.t} className="text-center sm:text-left">
            <p className="text-sm font-semibold text-stone-900">{item.t}</p>
            <p className="mt-1 text-xs text-stone-500">{item.d}</p>
          </div>
        ))}
      </section>

      {categories.length > 0 && (
        <section>
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="section-eyebrow">Browse</p>
              <h2 className="section-title m-0">Shop by category</h2>
            </div>
            <Link href="/products" className="hidden text-sm font-medium text-teal-800 hover:underline sm:inline">
              View all →
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.slice(0, 12).map((c) => (
              <Link
                key={c.id}
                href={`/products?categoryId=${c.id}`}
                className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-sm transition hover:border-teal-700 hover:text-teal-800"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="section-eyebrow">Just in</p>
            <h2 className="section-title m-0">New arrivals</h2>
          </div>
          <Link href="/products" className="text-sm font-medium text-teal-800 hover:underline">
            Shop everything →
          </Link>
        </div>
        {hasProducts ? (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products!.content.slice(0, 8).map((p) => (
              <li key={p.id}>
                <Link href={`/products/${p.id}`} className="group market-product-card block">
                  {p.imageUrl ? (
                    <span className="relative block aspect-[4/5] w-full overflow-hidden bg-stone-100">
                      <Image
                        src={p.imageUrl}
                        alt={p.name}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        unoptimized
                      />
                    </span>
                  ) : (
                    <div className="flex aspect-[4/5] items-center justify-center bg-stone-100 text-sm text-stone-400">
                      No image
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="line-clamp-2 text-sm font-medium leading-snug text-stone-900">{p.name}</h3>
                    <p className="mt-2 text-base font-semibold text-stone-900">₩{p.price.toLocaleString()}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-3xl border border-dashed border-stone-200 bg-white px-8 py-16 text-center shadow-sm">
            <p className="text-lg font-medium text-stone-800">We&apos;re stocking the shelves</p>
            <p className="mt-2 text-sm text-stone-500">Check back soon or become a seller.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/products" className="btn-primary">
                Browse shop
              </Link>
              <Link href="/signup" className="btn-secondary">
                Start selling
              </Link>
            </div>
          </div>
        )}
        {hasProducts && (
          <div className="mt-10 text-center">
            <Link href="/products" className="btn-secondary">
              Load more products
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

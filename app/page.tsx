import { Suspense } from "react";
import { Navbar } from "./components/Navbar";
import { SearchHero } from "./components/SearchHero";
import { FeaturedPropertyCard } from "./components/FeaturedPropertyCard";
import { MarketPropertyCard } from "./components/MarketPropertyCard";
import { Pagination } from "./components/Pagination";
import { getFeaturedProperties, getMarketProperties } from "./lib/properties";

interface HomeProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  // Both fetches run server-side — no client round-trips
  const [featuredProperties, { properties: marketProperties, totalPages, total }] =
    await Promise.all([
      getFeaturedProperties(),
      getMarketProperties(page),
    ]);

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <SearchHero />

        {/* Featured Collection */}
        <section className="mb-16">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-light text-nordic-dark dark:text-white">Featured Collections</h2>
              <p className="text-nordic-muted mt-1 text-sm">Curated properties for the discerning eye.</p>
            </div>
            <a className="hidden sm:flex items-center gap-1 text-sm font-medium text-mosque hover:opacity-70 transition-opacity" href="#">
              View all <span className="material-icons text-sm">arrow_forward</span>
            </a>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {featuredProperties.map((property) => (
              <FeaturedPropertyCard key={property.id} property={property} />
            ))}
          </div>
        </section>

        {/* New in Market — paginated */}
        <section>
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-light text-nordic-dark dark:text-white">New in Market</h2>
              <p className="text-nordic-muted mt-1 text-sm">
                Fresh opportunities — {total} properties available.
              </p>
            </div>
            <div className="hidden md:flex bg-white dark:bg-white/5 p-1 rounded-lg">
              <button className="px-4 py-1.5 rounded-md text-sm font-medium bg-nordic-dark text-white shadow-sm">All</button>
              <button className="px-4 py-1.5 rounded-md text-sm font-medium text-nordic-muted hover:text-nordic-dark dark:hover:text-white">Buy</button>
              <button className="px-4 py-1.5 rounded-md text-sm font-medium text-nordic-muted hover:text-nordic-dark dark:hover:text-white">Rent</button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {marketProperties.map((property) => (
              <MarketPropertyCard key={property.id} property={property} />
            ))}
          </div>

          {/* Server-side pagination — uses URL search params (?page=N) */}
          <Suspense>
            <Pagination currentPage={page} totalPages={totalPages} />
          </Suspense>
        </section>
      </main>
    </>
  );
}

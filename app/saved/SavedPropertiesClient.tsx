"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Property } from "../lib/types";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { useLanguage } from "../i18n/LanguageContext";
import { MarketPropertyCard } from "../components/MarketPropertyCard";

interface SavedPropertiesClientProps {
  initialProperties: Property[];
}

type ListingFilter = "all" | "sale" | "rent";

export function SavedPropertiesClient({ initialProperties }: SavedPropertiesClientProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { savedIds, initialized } = useFavorites();
  const { dict } = useLanguage();

  const [searchQuery, setSearchQuery] = useState("");
  const [listingFilter, setListingFilter] = useState<ListingFilter>("all");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login?redirectTo=/saved");
    }
  }, [authLoading, user, router]);

  // Avoid hydration flash: keep SSR list intact until FavoritesContext finishes loading
  const activeSavedProperties = useMemo(() => {
    if (!initialized) {
      return initialProperties;
    }
    return initialProperties.filter((property) => savedIds.has(property.id));
  }, [initialProperties, initialized, savedIds]);

  const trimmedQuery = searchQuery.trim();

  const filteredProperties = useMemo(() => {
    const normalizedQuery = trimmedQuery.toLowerCase();
    return activeSavedProperties.filter((property) => {
      if (listingFilter !== "all" && property.listing_type !== listingFilter) {
        return false;
      }
      if (normalizedQuery && !property.title.toLowerCase().includes(normalizedQuery)) {
        return false;
      }
      return true;
    });
  }, [activeSavedProperties, listingFilter, trimmedQuery]);

  const subtitleText =
    activeSavedProperties.length === 1
      ? dict.saved.subtitleSingle
      : dict.saved.subtitle.replace("{count}", String(activeSavedProperties.length));

  const hasActiveSearchOrTab = trimmedQuery.length > 0 || listingFilter !== "all";

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-light text-nordic-dark dark:text-white">
            {dict.saved.title}
          </h1>
          <p className="text-nordic-muted mt-1 text-sm">{subtitleText}</p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-mosque hover:opacity-80 transition-opacity self-start md:self-auto"
        >
          <span className="material-icons text-base">arrow_back</span>
          <span>{dict.saved.backToExplore}</span>
        </Link>
      </div>

      {activeSavedProperties.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
          <div className="relative flex-1 max-w-md group">
            <span className="material-icons absolute left-3.5 top-1/2 -translate-y-1/2 text-nordic-muted group-focus-within:text-mosque transition-colors text-xl pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={dict.saved.searchPlaceholder}
              aria-label={dict.saved.searchPlaceholder}
              className="w-full pl-11 pr-10 py-3 rounded-xl border border-nordic-dark/10 dark:border-white/10 bg-white dark:bg-white/5 text-nordic-dark dark:text-white placeholder-nordic-muted/60 focus:outline-none focus:ring-2 focus:ring-mosque transition-all text-sm shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label={dict.saved.clearSearch}
                title={dict.saved.clearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full text-nordic-muted hover:text-nordic-dark dark:hover:text-white hover:bg-nordic-dark/5 dark:hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center"
              >
                <span className="material-icons text-lg">close</span>
              </button>
            )}
          </div>

          <div className="flex bg-white dark:bg-white/5 p-1 rounded-lg border border-nordic-dark/5 dark:border-white/10 self-start sm:self-auto">
            {(
              [
                { key: "all", label: dict.saved.tabs.all },
                { key: "sale", label: dict.saved.tabs.buy },
                { key: "rent", label: dict.saved.tabs.rent },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setListingFilter(tab.key)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${
                  listingFilter === tab.key
                    ? "bg-nordic-dark text-white shadow-sm"
                    : "text-nordic-muted hover:text-nordic-dark dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeSavedProperties.length === 0 ? (
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-nordic-dark/5 dark:border-white/10 p-12 text-center max-w-xl mx-auto mt-8 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-mosque/10 text-mosque flex items-center justify-center mx-auto mb-5">
            <span className="material-icons text-3xl">favorite_border</span>
          </div>
          <h2 className="text-xl font-medium text-nordic-dark dark:text-white mb-2">
            {dict.saved.emptyTitle}
          </h2>
          <p className="text-sm text-nordic-muted dark:text-gray-400 mb-6 leading-relaxed">
            {dict.saved.emptySubtitle}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-mosque hover:bg-mosque/90 text-white font-medium text-sm transition-colors shadow-lg shadow-mosque/20"
          >
            <span>{dict.saved.backToExplore}</span>
            <span className="material-icons text-base">arrow_forward</span>
          </Link>
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-nordic-dark/5 dark:border-white/10 p-12 text-center max-w-xl mx-auto mt-8 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-nordic-dark/5 dark:bg-white/10 text-nordic-muted flex items-center justify-center mx-auto mb-5">
            <span className="material-icons text-3xl">search_off</span>
          </div>
          <h2 className="text-xl font-medium text-nordic-dark dark:text-white mb-2">
            {dict.saved.noResultsTitle}
          </h2>
          <p className="text-sm text-nordic-muted dark:text-gray-400 mb-6 leading-relaxed">
            {trimmedQuery
              ? dict.saved.noResultsSubtitle.replace("{query}", trimmedQuery)
              : dict.saved.emptySubtitle}
          </p>
          {hasActiveSearchOrTab && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setListingFilter("all");
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-nordic-dark text-white hover:opacity-90 font-medium text-sm transition-opacity cursor-pointer"
            >
              <span>{dict.saved.clearSearch}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProperties.map((property) => (
            <MarketPropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </main>
  );
}

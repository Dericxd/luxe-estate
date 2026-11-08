"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchFiltersModal } from "./SearchFiltersModal";
import { useLanguage } from "../i18n/LanguageContext";

const HERO_FILTER_TYPES = ["All", "House", "Apartment", "Villa", "Penthouse"] as const;

export const SearchBarWithFilters = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dict } = useLanguage();
  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (searchValue.trim()) {
      params.set("search", searchValue.trim());
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`/?${params.toString()}`);
  };

  const currentType = searchParams.get("type") || "All";

  const handleTypeSelect = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (type === "All") {
      params.delete("type");
    } else {
      params.set("type", type);
    }
    params.set("page", "1");
    router.push(`/?${params.toString()}`);
  };

  return (
    <>
      <div className="relative group max-w-2xl mx-auto">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <span className="material-icons text-nordic-muted text-2xl group-focus-within:text-mosque transition-colors">
            search
          </span>
        </div>
        <input
          className="block w-full pl-12 pr-4 py-4 rounded-xl border-none bg-white dark:bg-white/5 text-nordic-dark dark:text-white shadow-soft placeholder-nordic-muted/60 focus:ring-2 focus:ring-mosque focus:bg-white dark:focus:bg-white/10 transition-all text-lg"
          placeholder={dict.hero.searchPlaceholder}
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button 
          onClick={handleSearch}
          className="absolute inset-y-2 right-2 px-6 bg-mosque hover:bg-mosque/90 text-white font-medium rounded-lg transition-colors flex items-center justify-center shadow-lg shadow-mosque/20"
        >
          {dict.hero.searchButton}
        </button>
      </div>

      <div className="flex items-center justify-center gap-3 overflow-x-auto hide-scroll py-2 px-4 -mx-4">
        {HERO_FILTER_TYPES.map((typeKey) => (
          <button
            key={typeKey}
            onClick={() => handleTypeSelect(typeKey)}
            className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all ${
              currentType === typeKey
                ? "bg-nordic-dark text-white shadow-lg shadow-nordic-dark/10 hover:-translate-y-0.5"
                : "bg-white dark:bg-white/5 border border-nordic-dark/5 text-nordic-muted hover:text-nordic-dark hover:border-mosque/50 hover:bg-mosque/5"
            }`}
          >
            {dict.hero.types[typeKey]}
          </button>
        ))}
        
        <div className="w-px h-6 bg-nordic-dark/10 mx-2"></div>
        
        <button 
          onClick={() => setIsFiltersModalOpen(true)}
          className="whitespace-nowrap flex items-center gap-1 px-4 py-2 rounded-full text-nordic-dark dark:text-white font-medium text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <span className="material-icons text-base">tune</span> {dict.hero.filtersButton}
        </button>
      </div>

      <SearchFiltersModal 
        isOpen={isFiltersModalOpen} 
        onClose={() => setIsFiltersModalOpen(false)} 
        initialSearch={searchValue}
      />
    </>
  );
};

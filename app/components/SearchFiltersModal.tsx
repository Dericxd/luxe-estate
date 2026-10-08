"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface SearchFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSearch?: string;
}

export const SearchFiltersModal = ({ isOpen, onClose, initialSearch = "" }: SearchFiltersModalProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize state from URL params or defaults
  const [location, setLocation] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [propertyType, setPropertyType] = useState("Any Type");
  const [beds, setBeds] = useState(0);
  const [baths, setBaths] = useState(0);

  // Sync state with URL when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocation(initialSearch || searchParams.get("search") || "");
      setMinPrice(searchParams.get("minPrice") || "");
      setMaxPrice(searchParams.get("maxPrice") || "");
      setPropertyType(searchParams.get("type") || "Any Type");
      setBeds(parseInt(searchParams.get("beds") || "0", 10));
      setBaths(parseInt(searchParams.get("baths") || "0", 10));
    }
  }, [isOpen, initialSearch, searchParams]);

  if (!isOpen) return null;

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (location.trim()) params.set("search", location.trim());
    else params.delete("search");

    if (minPrice) params.set("minPrice", minPrice);
    else params.delete("minPrice");

    if (maxPrice) params.set("maxPrice", maxPrice);
    else params.delete("maxPrice");

    if (propertyType && propertyType !== "Any Type") params.set("type", propertyType);
    else params.delete("type");

    if (beds > 0) params.set("beds", beds.toString());
    else params.delete("beds");

    if (baths > 0) params.set("baths", baths.toString());
    else params.delete("baths");

    // Reset to page 1 on new search
    params.set("page", "1");

    router.push(`/?${params.toString()}`);
    onClose();
  };

  const handleClearFilters = () => {
    setLocation("");
    setMinPrice("");
    setMaxPrice("");
    setPropertyType("Any Type");
    setBeds(0);
    setBaths(0);
    router.push("/");
    onClose();
  };

  return (
    <>
      {/* Modal Overlay */}
      <div 
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Main Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <main className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] pointer-events-auto">
          {/* Header */}
          <header className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-900 sticky top-0 z-30">
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Filters</h1>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
            >
              <span className="material-icons">close</span>
            </button>
          </header>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-8 space-y-10" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {/* Section 1: Location */}
            <section>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Location</label>
              <div className="relative group">
                <span className="material-icons absolute left-4 top-3.5 text-gray-400 group-focus-within:text-mosque transition-colors">location_on</span>
                <input 
                  className="w-full pl-12 pr-4 py-3 bg-[#f5f8f6] dark:bg-gray-800 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-mosque focus:bg-white dark:focus:bg-gray-800 transition-all shadow-sm" 
                  placeholder="City, neighborhood, or address" 
                  type="text" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </section>

            {/* Section 2: Price Range */}
            <section>
              <div className="flex justify-between items-end mb-4">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price Range</label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#f5f8f6] dark:bg-gray-800 p-3 rounded-lg border border-transparent focus-within:border-mosque/30 transition-colors">
                  <label className="block text-[10px] text-gray-500 uppercase font-medium mb-1">Min Price</label>
                  <div className="flex items-center">
                    <span className="text-gray-400 mr-1">$</span>
                    <input 
                      className="w-full bg-transparent border-0 p-0 text-gray-900 dark:text-white font-medium focus:ring-0 text-sm" 
                      type="number" 
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                  </div>
                </div>
                <div className="bg-[#f5f8f6] dark:bg-gray-800 p-3 rounded-lg border border-transparent focus-within:border-mosque/30 transition-colors">
                  <label className="block text-[10px] text-gray-500 uppercase font-medium mb-1">Max Price</label>
                  <div className="flex items-center">
                    <span className="text-gray-400 mr-1">$</span>
                    <input 
                      className="w-full bg-transparent border-0 p-0 text-gray-900 dark:text-white font-medium focus:ring-0 text-sm" 
                      type="number" 
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Property Details */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Property Type */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Property Type</label>
                <div className="relative">
                  <select 
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className="w-full bg-[#f5f8f6] dark:bg-gray-800 border-0 rounded-lg py-3 pl-4 pr-10 text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-mosque cursor-pointer"
                  >
                    <option value="Any Type">Any Type</option>
                    <option value="House">House</option>
                    <option value="Apartment">Apartment</option>
                    <option value="Condo">Condo</option>
                    <option value="Villa">Villa</option>
                    <option value="Penthouse">Penthouse</option>
                  </select>
                  <span className="material-icons absolute right-3 top-3 text-gray-400 pointer-events-none">expand_more</span>
                </div>
              </div>

              {/* Rooms */}
              <div className="space-y-4">
                {/* Beds */}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Bedrooms</span>
                  <div className="flex items-center space-x-3 bg-[#f5f8f6] dark:bg-gray-800 rounded-full p-1">
                    <button 
                      onClick={() => setBeds(Math.max(0, beds - 1))}
                      className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-gray-500 hover:text-mosque disabled:opacity-50 transition-colors"
                    >
                      <span className="material-icons text-base">remove</span>
                    </button>
                    <span className="text-sm font-semibold w-4 text-center">{beds > 0 ? `${beds}+` : 'Any'}</span>
                    <button 
                      onClick={() => setBeds(beds + 1)}
                      className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-mosque hover:bg-mosque hover:text-white transition-colors"
                    >
                      <span className="material-icons text-base">add</span>
                    </button>
                  </div>
                </div>

                {/* Baths */}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Bathrooms</span>
                  <div className="flex items-center space-x-3 bg-[#f5f8f6] dark:bg-gray-800 rounded-full p-1">
                    <button 
                      onClick={() => setBaths(Math.max(0, baths - 1))}
                      className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-gray-500 hover:text-mosque transition-colors"
                    >
                      <span className="material-icons text-base">remove</span>
                    </button>
                    <span className="text-sm font-semibold w-4 text-center">{baths > 0 ? `${baths}+` : 'Any'}</span>
                    <button 
                      onClick={() => setBaths(baths + 1)}
                      className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-mosque hover:bg-mosque hover:text-white transition-colors"
                    >
                      <span className="material-icons text-base">add</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Section 4: Amenities (UI Only - visually appealing) */}
            <section>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Amenities & Features</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <label className="cursor-pointer group relative">
                  <input type="checkbox" className="peer sr-only" />
                  <div className="h-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm flex items-center justify-center gap-2 transition-all hover:border-gray-300 dark:hover:border-gray-600 peer-checked:border-mosque peer-checked:bg-mosque/5 peer-checked:text-mosque">
                    <span className="material-icons text-lg text-gray-400 group-hover:text-gray-500 peer-checked:text-mosque">pool</span>
                    Pool
                  </div>
                </label>
                <label className="cursor-pointer group">
                  <input type="checkbox" className="peer sr-only" />
                  <div className="h-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm flex items-center justify-center gap-2 transition-all hover:border-gray-300 dark:hover:border-gray-600 peer-checked:border-mosque peer-checked:bg-mosque/5 peer-checked:text-mosque">
                    <span className="material-icons text-lg text-gray-400 group-hover:text-gray-500 peer-checked:text-mosque">fitness_center</span>
                    Gym
                  </div>
                </label>
                <label className="cursor-pointer group">
                  <input type="checkbox" className="peer sr-only" />
                  <div className="h-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm flex items-center justify-center gap-2 transition-all hover:border-gray-300 dark:hover:border-gray-600 peer-checked:border-mosque peer-checked:bg-mosque/5 peer-checked:text-mosque">
                    <span className="material-icons text-lg text-gray-400 group-hover:text-gray-500 peer-checked:text-mosque">local_parking</span>
                    Parking
                  </div>
                </label>
              </div>
            </section>
          </div>

          {/* Footer */}
          <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-8 py-6 sticky bottom-0 z-30 flex items-center justify-between">
            <button 
              onClick={handleClearFilters}
              className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors underline decoration-gray-300 underline-offset-4"
            >
              Clear all filters
            </button>
            <button 
              onClick={handleApplyFilters}
              className="bg-mosque hover:bg-mosque/90 text-white px-8 py-3 rounded-lg font-medium shadow-lg shadow-mosque/30 transition-all hover:shadow-mosque/40 flex items-center gap-2 transform active:scale-95"
            >
              Show Results
              <span className="material-icons text-sm">arrow_forward</span>
            </button>
          </footer>
        </main>
      </div>
    </>
  );
};

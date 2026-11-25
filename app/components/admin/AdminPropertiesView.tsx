"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Property } from "../../lib/types";
import { supabase } from "../../lib/supabase";
import { useLanguage } from "../../i18n/LanguageContext";

interface AdminPropertiesViewProps {
  initialProperties: Property[];
}

const ITEMS_PER_PAGE = 6;

export const AdminPropertiesView = ({ initialProperties }: AdminPropertiesViewProps) => {
  const { dict } = useLanguage();
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "sale" | "rent" | "featured">("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const stats = useMemo(() => {
    const total = properties.length;
    const activeSale = properties.filter((p) => p.listing_type === "sale").length;
    const rentOrFeatured = properties.filter(
      (p) => p.listing_type === "rent" || p.is_featured
    ).length;
    return { total, activeSale, rentOrFeatured };
  }, [properties]);

  const filteredProperties = useMemo(() => {
    const q = search.trim().toLowerCase();
    return properties.filter((prop) => {
      const matchesSearch =
        q === "" ||
        prop.title.toLowerCase().includes(q) ||
        prop.location.toLowerCase().includes(q) ||
        (prop.tag && prop.tag.toLowerCase().includes(q));

      const matchesFilter =
        statusFilter === "all" ||
        (statusFilter === "sale" && prop.listing_type === "sale") ||
        (statusFilter === "rent" && prop.listing_type === "rent") ||
        (statusFilter === "featured" && prop.is_featured);

      return matchesSearch && matchesFilter;
    });
  }, [properties, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProperties.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);

  const paginatedProperties = useMemo(() => {
    const start = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredProperties.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProperties, safePage]);

  const handleToggleFeatured = async (prop: Property) => {
    try {
      setBusyId(prop.id);
      const nextFeatured = !prop.is_featured;
      const { error } = await supabase
        .from("properties")
        .update({ is_featured: nextFeatured })
        .eq("id", prop.id);

      if (error) throw error;

      setProperties((prev) =>
        prev.map((item) =>
          item.id === prop.id ? { ...item, is_featured: nextFeatured } : item
        )
      );
      showToast(
        nextFeatured
          ? `"${prop.title}" marcada como destacada`
          : `"${prop.title}" removida de destacadas`
      );
    } catch (err) {
      console.error("[AdminPropertiesView] Error toggling featured:", err);
      showToast("No se pudo actualizar la propiedad");
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteProperty = async (prop: Property) => {
    if (!window.confirm(`¿Eliminar "${prop.title}"? Esta acción no se puede deshacer.`)) return;
    try {
      setBusyId(prop.id);
      const { error } = await supabase.from("properties").delete().eq("id", prop.id);

      if (error) throw error;

      setProperties((prev) => prev.filter((item) => item.id !== prop.id));
      showToast(`Propiedad "${prop.title}" eliminada`);
    } catch (err) {
      console.error("[AdminPropertiesView] Error deleting property:", err);
      showToast("Error al eliminar la propiedad");
    } finally {
      setBusyId(null);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(price);

  return (
    <div className="space-y-8 animate-fade-in">
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 bg-nordic text-white px-5 py-3 rounded-xl shadow-soft-hover flex items-center gap-3 text-sm"
        >
          <span className="material-icons text-mosque text-lg">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-nordic dark:text-white tracking-tight">
            {dict.admin.properties.title}
          </h2>
          <p className="text-nordic/60 dark:text-gray-400 mt-1 text-sm">
            {dict.admin.properties.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <span className="material-icons absolute inset-y-0 left-3 flex items-center text-nordic/40 text-lg pointer-events-none">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={dict.admin.properties.searchPlaceholder}
              aria-label={dict.admin.properties.searchPlaceholder}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-nordic/10 dark:border-white/10 bg-white dark:bg-[#152e2a] text-nordic dark:text-white text-sm shadow-soft focus:ring-2 focus:ring-mosque focus:outline-none transition-all"
            />
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setFilterOpen((prev) => !prev)}
              aria-expanded={filterOpen}
              className={`bg-white dark:bg-[#152e2a] border px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm inline-flex items-center gap-2 cursor-pointer ${statusFilter !== "all"
                  ? "border-mosque text-mosque"
                  : "border-nordic/10 dark:border-white/10 text-nordic dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                }`}
            >
              <span className="material-icons text-base">filter_list</span>
              <span>{dict.admin.properties.filter}</span>
            </button>

            {filterOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-[#152e2a] shadow-soft-hover border border-nordic/10 dark:border-white/10 py-1.5 z-40">
                {(
                  [
                    { key: "all", label: dict.home.tabs.all },
                    { key: "sale", label: dict.admin.properties.status.active },
                    { key: "rent", label: dict.admin.properties.status.pending },
                    { key: "featured", label: dict.admin.properties.status.featured },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => {
                      setStatusFilter(option.key);
                      setFilterOpen(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-4 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${statusFilter === option.key
                        ? "bg-mosque/10 text-mosque font-bold"
                        : "text-nordic dark:text-gray-200 hover:bg-hint-green/30 dark:hover:bg-white/5"
                      }`}
                  >
                    <span>{option.label}</span>
                    {statusFilter === option.key && (
                      <span className="material-icons text-sm text-mosque">check</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="bg-mosque hover:bg-mosque/90 text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-md shadow-mosque/20 transition-all transform hover:-translate-y-0.5 inline-flex items-center gap-2 cursor-pointer"
          >
            <span className="material-icons text-base">add</span>
            <span>{dict.admin.properties.addProperty}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#152e2a] p-5 rounded-xl border border-mosque/10 dark:border-white/10 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-nordic/60 dark:text-gray-400">
              {dict.admin.properties.totalListings}
            </p>
            <p className="text-2xl font-bold text-nordic dark:text-white mt-1">{stats.total}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-mosque/10 flex items-center justify-center text-mosque">
            <span className="material-icons">apartment</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#152e2a] p-5 rounded-xl border border-mosque/10 dark:border-white/10 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-nordic/60 dark:text-gray-400">
              {dict.admin.properties.activeProperties}
            </p>
            <p className="text-2xl font-bold text-nordic dark:text-white mt-1">{stats.activeSale}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-hint-green flex items-center justify-center text-mosque">
            <span className="material-icons">check_circle</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#152e2a] p-5 rounded-xl border border-mosque/10 dark:border-white/10 shadow-soft flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-nordic/60 dark:text-gray-400">
              {dict.admin.properties.pendingSale}
            </p>
            <p className="text-2xl font-bold text-nordic dark:text-white mt-1">
              {stats.rentOrFeatured}
            </p>
          </div>
          <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <span className="material-icons">stars</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#152e2a] rounded-xl shadow-soft border border-nordic/10 dark:border-white/10 overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-nordic/[0.02] dark:bg-white/[0.02] border-b border-nordic/10 dark:border-white/10 text-xs font-semibold text-nordic/50 dark:text-gray-400 uppercase tracking-wider">
          <div className="col-span-6">{dict.admin.properties.tableHeaders.details}</div>
          <div className="col-span-2">{dict.admin.properties.tableHeaders.price}</div>
          <div className="col-span-2">{dict.admin.properties.tableHeaders.status}</div>
          <div className="col-span-2 text-right">{dict.admin.properties.tableHeaders.actions}</div>
        </div>

        {paginatedProperties.length === 0 ? (
          <div className="p-12 text-center text-nordic/50 dark:text-gray-400">
            <span className="material-icons text-4xl mb-2 text-nordic/30">domain_disabled</span>
            <p className="text-sm">No se encontraron propiedades con los filtros actuales.</p>
          </div>
        ) : (
          <div className="divide-y divide-nordic/5 dark:divide-white/5">
            {paginatedProperties.map((prop) => {
              const coverImage =
                prop.images?.[0] ||
                "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800";
              const detailHref = `/properties/${prop.slug || prop.id}`;
              const isBusy = busyId === prop.id;

              return (
                <div
                  key={prop.id}
                  className="group grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 hover:bg-background-light/60 dark:hover:bg-white/[0.03] transition-colors items-center"
                >
                  <div className="col-span-12 md:col-span-6 flex gap-4 items-center">
                    <Link
                      href={detailHref}
                      className="relative h-20 w-28 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800 block"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={prop.title}
                        src={coverImage}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </Link>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={detailHref}
                          className="text-base sm:text-lg font-bold text-nordic dark:text-white group-hover:text-mosque transition-colors truncate block"
                        >
                          {prop.title}
                        </Link>
                        {prop.is_featured && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-hint-green text-mosque">
                            {dict.admin.properties.status.featured}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-nordic/60 dark:text-gray-400 truncate">
                        {prop.location}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-nordic/50 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <span className="material-icons text-[14px]">bed</span> {prop.beds}{" "}
                          {dict.admin.properties.beds}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                        <span className="flex items-center gap-1">
                          <span className="material-icons text-[14px]">bathtub</span> {prop.baths}{" "}
                          {dict.admin.properties.baths}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                        <span>{prop.area}</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-6 md:col-span-2">
                    <div className="text-base font-semibold text-nordic dark:text-gray-200">
                      {formatPrice(prop.price)}
                    </div>
                    <div className="text-xs text-nordic/50 dark:text-gray-400">
                      {prop.price_label}
                    </div>
                  </div>

                  <div className="col-span-6 md:col-span-2">
                    {prop.listing_type === "sale" ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-hint-green text-mosque border border-mosque/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-mosque mr-1.5" />
                        {dict.admin.properties.status.active}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5" />
                        {dict.admin.properties.status.pending}
                      </span>
                    )}
                  </div>

                  <div className="col-span-12 md:col-span-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleToggleFeatured(prop)}
                      title={dict.admin.properties.status.featured}
                      aria-label={dict.admin.properties.status.featured}
                      className={`p-2 rounded-lg transition-all cursor-pointer disabled:opacity-50 ${prop.is_featured
                          ? "text-mosque bg-hint-green/60 hover:bg-hint-green"
                          : "text-gray-400 hover:text-mosque hover:bg-hint-green/30"
                        }`}
                    >
                      <span className="material-icons text-xl">
                        {prop.is_featured ? "star" : "star_border"}
                      </span>
                    </button>

                    <Link
                      href={detailHref}
                      title={dict.admin.properties.viewDetail}
                      aria-label={dict.admin.properties.viewDetail}
                      className="p-2 rounded-lg text-gray-400 hover:text-mosque hover:bg-hint-green/30 transition-all"
                    >
                      <span className="material-icons text-xl">open_in_new</span>
                    </Link>

                    <button
                      type="button"
                      disabled={isBusy}
                      title={dict.admin.properties.edit}
                      aria-label={dict.admin.properties.edit}
                      className="p-2 rounded-lg text-gray-400 hover:text-mosque hover:bg-hint-green/30 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <span className="material-icons text-xl">edit</span>
                    </button>

                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleDeleteProperty(prop)}
                      title={dict.admin.properties.delete}
                      aria-label={dict.admin.properties.delete}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <span className="material-icons text-xl">delete_outline</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="px-6 py-4 border-t border-nordic/10 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-nordic/[0.02] dark:bg-white/[0.02]">
          <div className="text-sm text-nordic/60 dark:text-gray-400">
            Mostrando{" "}
            <span className="font-semibold text-nordic dark:text-white">
              {filteredProperties.length === 0 ? 0 : (safePage - 1) * ITEMS_PER_PAGE + 1}
            </span>{" "}
            a{" "}
            <span className="font-semibold text-nordic dark:text-white">
              {Math.min(safePage * ITEMS_PER_PAGE, filteredProperties.length)}
            </span>{" "}
            de{" "}
            <span className="font-semibold text-nordic dark:text-white">
              {filteredProperties.length}
            </span>{" "}
            propiedades
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3.5 py-1.5 text-xs font-medium border border-nordic/15 dark:border-white/15 rounded-lg text-nordic dark:text-gray-200 hover:bg-white dark:hover:bg-white/10 disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {dict.pagination.previousPage}
            </button>
            <span className="text-xs font-semibold text-nordic dark:text-gray-300 px-2">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3.5 py-1.5 text-xs font-medium border border-nordic/15 dark:border-white/15 rounded-lg text-nordic dark:text-gray-200 hover:bg-white dark:hover:bg-white/10 disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {dict.pagination.nextPage}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


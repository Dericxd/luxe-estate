"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "../Navbar";
import { PropertyMapWrapper } from "../PropertyMapWrapper";
import { Property, PropertyStatus } from "../../lib/types";
import { supabase } from "../../lib/supabase";
import {
  deletePropertyImagesByUrls,
  isSupabasePropertyImageUrl,
  uploadPropertyImage,
} from "../../lib/storage";
import { useLanguage } from "../../i18n/LanguageContext";

interface PropertyFormProps {
  mode: "create" | "edit";
  initialProperty?: Property;
}

type FormStatusValue = "for-sale" | "for-rent" | "sold";

const PROPERTY_TYPES = [
  "Apartment",
  "House",
  "Villa",
  "Condo",
  "Penthouse",
  "Commercial",
] as const;

const AMENITY_OPTIONS = [
  "Swimming Pool",
  "Garden",
  "Air Conditioning",
  "Smart Home",
  "Gym",
  "EV Charging",
] as const;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function formatPriceLabel(price: number, listingType: "sale" | "rent"): string {
  if (!Number.isFinite(price) || price <= 0) return "";
  if (listingType === "rent") {
    return `$${Math.round(price).toLocaleString("en-US")}/mo`;
  }
  if (price >= 1_000_000) {
    const millions = price / 1_000_000;
    return `$${millions.toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (price >= 1_000) {
    const thousands = Math.round(price / 1_000);
    return `$${thousands}k`;
  }
  return `$${Math.round(price).toLocaleString("en-US")}`;
}

function parseAreaValue(rawArea?: string): { numeric: string; unit: "m²" | "sqft" } {
  if (!rawArea) return { numeric: "", unit: "m²" };
  const unit: "m²" | "sqft" = rawArea.toLowerCase().includes("sqft") ? "sqft" : "m²";
  const match = rawArea.match(/[\d,.]+/);
  return {
    numeric: match ? match[0].replace(/,/g, "") : "",
    unit,
  };
}

function getInitialFormStatus(prop?: Property): FormStatusValue {
  if (!prop) return "for-sale";
  if (prop.status === "sold") return "sold";
  return prop.listing_type === "rent" ? "for-rent" : "for-sale";
}

export const PropertyForm = ({ mode, initialProperty }: PropertyFormProps) => {
  const router = useRouter();
  const { dict } = useLanguage();
  const t = dict.admin.propertyForm;

  const parsedArea = useMemo(() => parseAreaValue(initialProperty?.area), [initialProperty?.area]);

  const [title, setTitle] = useState(initialProperty?.title ?? "");
  const [price, setPrice] = useState<string>(
    initialProperty?.price ? String(initialProperty.price) : ""
  );
  const [formStatus, setFormStatus] = useState<FormStatusValue>(
    getInitialFormStatus(initialProperty)
  );
  const [propertyType, setPropertyType] = useState<string>(
    initialProperty?.tag && PROPERTY_TYPES.includes(initialProperty.tag as (typeof PROPERTY_TYPES)[number])
      ? initialProperty.tag
      : "Apartment"
  );
  const [priceLabelOverride, setPriceLabelOverride] = useState<string | null>(
    initialProperty?.price_label ?? null
  );
  const [slugOverride, setSlugOverride] = useState<string | null>(
    initialProperty?.slug ?? null
  );
  const [isFeatured, setIsFeatured] = useState<boolean>(initialProperty?.is_featured ?? false);

  const effectivePriceLabel = useMemo(() => {
    if (priceLabelOverride !== null) return priceLabelOverride;
    const numericPrice = Number(price);
    const listingType: "sale" | "rent" = formStatus === "for-rent" ? "rent" : "sale";
    return formatPriceLabel(numericPrice, listingType);
  }, [priceLabelOverride, price, formStatus]);

  const effectiveSlug = useMemo(() => {
    if (slugOverride !== null) return slugOverride;
    return slugify(title);
  }, [slugOverride, title]);

  const [description, setDescription] = useState(initialProperty?.description ?? "");
  const [location, setLocation] = useState(initialProperty?.location ?? "");
  const [debouncedLocation, setDebouncedLocation] = useState(initialProperty?.location ?? "");

  const [areaNumeric, setAreaNumeric] = useState(parsedArea.numeric);
  const [areaUnit] = useState<"m²" | "sqft">(parsedArea.unit);
  const [yearBuilt, setYearBuilt] = useState<string>(
    initialProperty?.year_built ? String(initialProperty.year_built) : ""
  );
  const [beds, setBeds] = useState<number>(initialProperty?.beds ?? 3);
  const [baths, setBaths] = useState<number>(initialProperty?.baths ?? 2);
  const [parking, setParking] = useState<number>(initialProperty?.parking ?? 1);
  const [amenities, setAmenities] = useState<string[]>(
    initialProperty?.amenities ?? (mode === "create" ? ["Garden"] : [])
  );

  const [images, setImages] = useState<string[]>(initialProperty?.images ?? []);
  const [pendingDeleteUrls, setPendingDeleteUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [savingMode, setSavingMode] = useState<"publish" | "draft" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const storageFolder = useMemo(() => {
    if (initialProperty?.id) return initialProperty.id;
    const base = slugify(title);
    return base || "new-property";
  }, [initialProperty?.id, title]);

  // Debounce location for live map preview
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedLocation(location);
    }, 500);
    return () => clearTimeout(timer);
  }, [location]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleAmenity = (amenity: string) => {
    setAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((item) => item !== amenity) : [...prev, amenity]
    );
  };

  const applyTextareaFormat = (format: "bold" | "italic" | "list") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = description.slice(start, end);
    let replacement = selected;

    if (format === "bold") {
      replacement = `**${selected || "texto en negrita"}**`;
    } else if (format === "italic") {
      replacement = `*${selected || "texto en cursiva"}*`;
    } else if (format === "list") {
      const lines = (selected || "Característica destacada").split("\n");
      replacement = lines.map((line) => (line.startsWith("- ") ? line : `- ${line}`)).join("\n");
    }

    const nextValue = (
      description.slice(0, start) +
      replacement +
      description.slice(end)
    ).slice(0, 2000);

    setDescription(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursor = Math.min(start + replacement.length, 2000);
      textarea.setSelectionRange(cursor, cursor);
    });
  };

  const handleUploadFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setErrorMessage(null);
    setUploadingImages(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of fileArray) {
        const publicUrl = await uploadPropertyImage(file, storageFolder);
        uploadedUrls.push(publicUrl);
      }
      setImages((prev) => [...prev, ...uploadedUrls]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al subir las imágenes a Supabase Storage.";
      setErrorMessage(message);
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleReplaceImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || replacingIndex === null) return;

    const targetIndex = replacingIndex;
    const previousUrl = images[targetIndex];
    setErrorMessage(null);
    setUploadingImages(true);

    try {
      const newUrl = await uploadPropertyImage(file, storageFolder);
      setImages((prev) => prev.map((img, idx) => (idx === targetIndex ? newUrl : img)));
      if (previousUrl && isSupabasePropertyImageUrl(previousUrl)) {
        setPendingDeleteUrls((prev) => [...prev, previousUrl]);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al reemplazar la imagen en Supabase Storage.";
      setErrorMessage(message);
    } finally {
      setUploadingImages(false);
      setReplacingIndex(null);
      if (replaceInputRef.current) {
        replaceInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    const urlToRemove = images[index];
    setImages((prev) => prev.filter((_, idx) => idx !== index));
    if (urlToRemove && isSupabasePropertyImageUrl(urlToRemove)) {
      setPendingDeleteUrls((prev) => [...prev, urlToRemove]);
    }
  };

  const handleSetMainImage = (index: number) => {
    if (index <= 0 || index >= images.length) return;
    setImages((prev) => {
      const next = [...prev];
      const [chosen] = next.splice(index, 1);
      next.unshift(chosen);
      return next;
    });
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      void handleUploadFiles(e.dataTransfer.files);
    }
  };

  const handleSave = async (saveAsDraft: boolean) => {
    setErrorMessage(null);

    const trimmedTitle = title.trim();
    const numericPrice = Number(price);
    const trimmedLocation = location.trim();

    if (!trimmedTitle || !Number.isFinite(numericPrice) || numericPrice <= 0 || !trimmedLocation) {
      setErrorMessage(t.messages.validationError);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const listingType: "sale" | "rent" = formStatus === "for-rent" ? "rent" : "sale";
    const resolvedStatus: PropertyStatus = saveAsDraft
      ? "draft"
      : formStatus === "sold"
        ? "sold"
        : "published";

    const computedPriceLabel =
      effectivePriceLabel.trim() || formatPriceLabel(numericPrice, listingType);
    const computedArea = areaNumeric.trim()
      ? `${areaNumeric.trim()} ${areaUnit}`
      : "0 m²";
    const computedSlug =
      (effectiveSlug.trim() ? slugify(effectiveSlug) : slugify(trimmedTitle)) || null;
    const parsedYear = yearBuilt.trim() ? parseInt(yearBuilt.trim(), 10) : null;

    const payload = {
      title: trimmedTitle,
      location: trimmedLocation,
      price: numericPrice,
      price_label: computedPriceLabel,
      listing_type: listingType,
      beds,
      baths,
      parking,
      area: computedArea,
      year_built: Number.isFinite(parsedYear) ? parsedYear : null,
      description: description.trim() || null,
      amenities,
      images,
      slug: computedSlug,
      tag: propertyType,
      tag_color: initialProperty?.tag_color ?? "gray",
      is_featured: isFeatured,
      status: resolvedStatus,
    };

    setSavingMode(saveAsDraft ? "draft" : "publish");
    try {
      if (mode === "create") {
        const { error } = await supabase.from("properties").insert(payload);
        if (error) throw error;
      } else if (initialProperty?.id) {
        const { error } = await supabase
          .from("properties")
          .update(payload)
          .eq("id", initialProperty.id);
        if (error) throw error;
      }

      if (pendingDeleteUrls.length > 0) {
        await deletePropertyImagesByUrls(pendingDeleteUrls);
        setPendingDeleteUrls([]);
      }

      showToast(
        saveAsDraft
          ? t.messages.draftSaved
          : mode === "create"
            ? t.messages.createdSuccess
            : t.messages.updatedSuccess
      );

      setTimeout(() => {
        router.push("/admin");
        router.refresh();
      }, 600);
    } catch (err) {
      console.error("[PropertyForm] Error saving property:", err);
      const message =
        err && typeof err === "object" && "message" in err && typeof err.message === "string"
          ? err.message
          : "No se pudo guardar la propiedad. Verifica los permisos en Supabase.";
      setErrorMessage(message);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSavingMode(null);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void handleSave(false);
  };

  const isBusy = savingMode !== null || uploadingImages;

  return (
    <div className="min-h-screen flex flex-col bg-clear-day dark:bg-background-dark text-nordic dark:text-gray-100 selection:bg-hint-green selection:text-nordic">
      <Navbar />

      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 bg-nordic text-white px-5 py-3 rounded-xl shadow-soft-hover flex items-center gap-3 text-sm font-sf-pro"
        >
          <span className="material-icons text-hint-green text-lg">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 dark:border-white/10 pb-8">
          <div className="space-y-4">
            <nav aria-label="Breadcrumb" className="flex">
              <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 font-medium font-sf-pro">
                <li>
                  <Link href="/admin" className="hover:text-mosque transition-colors">
                    {t.breadcrumbProperties}
                  </Link>
                </li>
                <li>
                  <span className="material-icons text-xs text-gray-400">chevron_right</span>
                </li>
                <li aria-current="page" className="text-nordic dark:text-white">
                  {mode === "create" ? t.breadcrumbAddNew : t.breadcrumbEdit}
                </li>
              </ol>
            </nav>

            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-nordic dark:text-white tracking-tight mb-2 font-sf-pro">
                {mode === "create" ? t.createTitle : t.editTitle}
              </h1>
              <p className="text-base text-gray-500 dark:text-gray-400 max-w-2xl font-normal font-sf-pro">
                {mode === "create" ? t.createSubtitle : t.editSubtitle}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              disabled={isBusy}
              onClick={() => void handleSave(true)}
              className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-[#152e2a] text-nordic dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors font-medium font-sf-pro text-sm cursor-pointer disabled:opacity-50"
            >
              {savingMode === "draft" ? t.saving : t.saveDraft}
            </button>
            <button
              type="submit"
              form="property-form"
              disabled={isBusy}
              className="px-5 py-2.5 rounded-lg bg-mosque hover:bg-nordic text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 font-sf-pro text-sm cursor-pointer disabled:opacity-50"
            >
              <span className="material-icons text-sm">save</span>
              {savingMode === "publish"
                ? t.saving
                : mode === "create"
                  ? t.saveProperty
                  : t.updateProperty}
            </button>
          </div>
        </header>

        {errorMessage && (
          <div
            role="alert"
            className="mb-8 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 px-5 py-4 text-sm text-red-700 dark:text-red-300 flex items-start gap-3 font-sf-pro"
          >
            <span className="material-icons text-red-500 text-lg mt-0.5">error_outline</span>
            <div className="flex-1">{errorMessage}</div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-600 cursor-pointer"
              aria-label="Cerrar error"
            >
              <span className="material-icons text-base">close</span>
            </button>
          </div>
        )}

        <form
          id="property-form"
          onSubmit={handleSubmit}
          className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start pb-20 md:pb-0"
        >
          {/* Left Column (8 cols) */}
          <div className="xl:col-span-8 space-y-8">
            {/* Basic Information */}
            <div className="bg-white dark:bg-[#152e2a] rounded-xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
              <div className="px-8 py-6 border-b border-hint-green/30 dark:border-white/10 flex items-center gap-3 bg-gradient-to-r from-hint-green/10 to-transparent">
                <div className="w-8 h-8 rounded-full bg-hint-green flex items-center justify-center text-nordic">
                  <span className="material-icons text-lg">info</span>
                </div>
                <h2 className="text-xl font-bold text-nordic dark:text-white font-sf-pro">
                  {t.sections.basicInfo}
                </h2>
              </div>

              <div className="p-8 space-y-6">
                <div className="group">
                  <label
                    className="block text-sm font-medium text-nordic dark:text-gray-200 mb-1.5 font-sf-pro"
                    htmlFor="title"
                  >
                    {t.fields.title} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t.fields.titlePlaceholder}
                    className="w-full text-base px-4 py-2.5 rounded-md border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0f231f] text-nordic dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque focus:outline-none transition-all font-sf-pro"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label
                      className="block text-sm font-medium text-nordic dark:text-gray-200 mb-1.5 font-sf-pro"
                      htmlFor="price"
                    >
                      {t.fields.price} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-sf-pro text-sm">
                        $
                      </span>
                      <input
                        id="price"
                        type="number"
                        min={0}
                        step="any"
                        required
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-7 pr-4 py-2.5 rounded-md border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0f231f] text-nordic dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque focus:outline-none transition-all text-base font-medium font-sf-pro"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium text-nordic dark:text-gray-200 mb-1.5 font-sf-pro"
                      htmlFor="status"
                    >
                      {t.fields.status}
                    </label>
                    <select
                      id="status"
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as FormStatusValue)}
                      className="w-full px-4 py-2.5 rounded-md border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0f231f] text-nordic dark:text-white focus:ring-1 focus:ring-mosque focus:border-mosque focus:outline-none transition-all text-base font-sf-pro cursor-pointer"
                    >
                      <option value="for-sale">{t.statuses.forSale}</option>
                      <option value="for-rent">{t.statuses.forRent}</option>
                      <option value="sold">{t.statuses.sold}</option>
                    </select>
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium text-nordic dark:text-gray-200 mb-1.5 font-sf-pro"
                      htmlFor="type"
                    >
                      {t.fields.propertyType}
                    </label>
                    <select
                      id="type"
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-md border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0f231f] text-nordic dark:text-white focus:ring-1 focus:ring-mosque focus:border-mosque focus:outline-none transition-all text-base font-sf-pro cursor-pointer"
                    >
                      {PROPERTY_TYPES.map((typeKey) => (
                        <option key={typeKey} value={typeKey}>
                          {t.types[typeKey]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Additional fields aligned with the database model */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-gray-100 dark:border-white/10">
                  <div>
                    <label
                      className="block text-sm font-medium text-nordic dark:text-gray-200 mb-1.5 font-sf-pro"
                      htmlFor="price_label"
                    >
                      {t.fields.priceLabel}
                    </label>
                    <input
                      id="price_label"
                      type="text"
                      value={effectivePriceLabel}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPriceLabelOverride(val.trim().length > 0 ? val : null);
                      }}
                      placeholder={t.fields.priceLabelPlaceholder}
                      className="w-full text-sm px-4 py-2.5 rounded-md border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0f231f] text-nordic dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque focus:outline-none transition-all font-sf-pro"
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium text-nordic dark:text-gray-200 mb-1.5 font-sf-pro"
                      htmlFor="slug"
                    >
                      {t.fields.slug}
                    </label>
                    <input
                      id="slug"
                      type="text"
                      value={effectiveSlug}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSlugOverride(val.trim().length > 0 ? val : null);
                      }}
                      placeholder={t.fields.slugPlaceholder}
                      className="w-full text-sm px-4 py-2.5 rounded-md border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0f231f] text-nordic dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque focus:outline-none transition-all font-sf-pro"
                    />
                  </div>
                </div>

                <label className="flex items-start gap-3 cursor-pointer group pt-1">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-mosque text-mosque border-gray-300 rounded focus:ring-mosque cursor-pointer"
                  />
                  <div>
                    <span className="block text-sm font-medium text-nordic dark:text-gray-200 font-sf-pro group-hover:text-mosque transition-colors">
                      {t.fields.featured}
                    </span>
                    <span className="block text-xs text-gray-400 font-sf-pro">
                      {t.fields.featuredHint}
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-[#152e2a] rounded-xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
              <div className="px-8 py-6 border-b border-hint-green/30 dark:border-white/10 flex items-center gap-3 bg-gradient-to-r from-hint-green/10 to-transparent">
                <div className="w-8 h-8 rounded-full bg-hint-green flex items-center justify-center text-nordic">
                  <span className="material-icons text-lg">description</span>
                </div>
                <h2 className="text-xl font-bold text-nordic dark:text-white font-sf-pro">
                  {t.sections.description}
                </h2>
              </div>

              <div className="p-8">
                <div className="mb-3 flex gap-2 border-b border-gray-100 dark:border-white/10 pb-2">
                  <button
                    type="button"
                    onClick={() => applyTextareaFormat("bold")}
                    title="Bold"
                    className="p-1.5 text-gray-400 hover:text-nordic dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 rounded transition-colors cursor-pointer"
                  >
                    <span className="material-icons text-lg">format_bold</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTextareaFormat("italic")}
                    title="Italic"
                    className="p-1.5 text-gray-400 hover:text-nordic dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 rounded transition-colors cursor-pointer"
                  >
                    <span className="material-icons text-lg">format_italic</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTextareaFormat("list")}
                    title="Bullet list"
                    className="p-1.5 text-gray-400 hover:text-nordic dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 rounded transition-colors cursor-pointer"
                  >
                    <span className="material-icons text-lg">format_list_bulleted</span>
                  </button>
                </div>

                <textarea
                  ref={textareaRef}
                  id="description"
                  maxLength={2000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t.fields.descriptionPlaceholder}
                  className="w-full px-4 py-3 rounded-md border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0f231f] text-nordic dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque focus:outline-none transition-all text-base font-sf-pro leading-relaxed resize-y min-h-[200px]"
                />
                <div className="mt-2 text-right text-xs text-gray-400 font-sf-pro">
                  {description.length} / 2000 {t.fields.characters}
                </div>
              </div>
            </div>

            {/* Gallery (Supabase Storage) */}
            <div className="bg-white dark:bg-[#152e2a] rounded-xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
              <div className="px-8 py-6 border-b border-hint-green/30 dark:border-white/10 flex justify-between items-center bg-gradient-to-r from-hint-green/10 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-hint-green flex items-center justify-center text-nordic">
                    <span className="material-icons text-lg">image</span>
                  </div>
                  <h2 className="text-xl font-bold text-nordic dark:text-white font-sf-pro">
                    {t.sections.gallery}
                  </h2>
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-300 bg-gray-100 dark:bg-white/10 px-2 py-1 rounded font-sf-pro">
                  JPG, PNG, WEBP
                </span>
              </div>

              <div className="p-8">
                <input
                  ref={replaceInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleReplaceImageFile}
                  className="hidden"
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer group ${
                    dragActive
                      ? "border-mosque bg-hint-green/20"
                      : "border-gray-300 dark:border-white/20 bg-gray-50/50 dark:bg-white/[0.02] hover:bg-hint-green/10 hover:border-mosque/40"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    disabled={uploadingImages}
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      if (e.target.files) {
                        void handleUploadFiles(e.target.files);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-wait"
                  />
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 bg-white dark:bg-[#0f231f] rounded-full flex items-center justify-center shadow-sm text-mosque group-hover:scale-110 transition-transform duration-300">
                      <span className="material-icons text-2xl">
                        {uploadingImages ? "hourglass_top" : "cloud_upload"}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-base font-medium text-nordic dark:text-white font-sf-pro">
                        {uploadingImages ? t.gallery.uploading : t.gallery.dropzoneTitle}
                      </p>
                      <p className="text-xs text-gray-400 font-sf-pro">
                        {t.gallery.dropzoneHint}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                  {images.map((imgUrl, index) => (
                    <div
                      key={`${imgUrl}-${index}`}
                      className="aspect-square rounded-lg overflow-hidden relative group shadow-sm bg-gray-100 dark:bg-white/5"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={`${title || "Property"} ${index + 1}`}
                        src={imgUrl}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-nordic/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          title={t.gallery.remove}
                          aria-label={t.gallery.remove}
                          className="w-8 h-8 rounded-full bg-white text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <span className="material-icons text-sm">delete</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReplacingIndex(index);
                            replaceInputRef.current?.click();
                          }}
                          title={t.gallery.replace}
                          aria-label={t.gallery.replace}
                          className="w-8 h-8 rounded-full bg-white text-nordic hover:bg-gray-50 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <span className="material-icons text-sm">edit</span>
                        </button>
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => handleSetMainImage(index)}
                            title={t.gallery.setMain}
                            aria-label={t.gallery.setMain}
                            className="w-8 h-8 rounded-full bg-white text-mosque hover:bg-hint-green/40 flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <span className="material-icons text-sm">star</span>
                          </button>
                        )}
                      </div>
                      {index === 0 && (
                        <span className="absolute top-2 left-2 bg-mosque text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm font-sf-pro uppercase tracking-wider">
                          {t.gallery.mainBadge}
                        </span>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    disabled={uploadingImages}
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-lg border border-dashed border-gray-300 dark:border-white/20 flex flex-col items-center justify-center text-gray-400 hover:text-mosque hover:border-mosque hover:bg-hint-green/20 transition-all group cursor-pointer disabled:opacity-50"
                  >
                    <span className="material-icons group-hover:scale-110 transition-transform">
                      add
                    </span>
                    <span className="text-xs mt-1 font-medium font-sf-pro">
                      {t.gallery.addMore}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (4 cols) */}
          <div className="xl:col-span-4 space-y-8">
            {/* Location */}
            <div className="bg-white dark:bg-[#152e2a] rounded-xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
              <div className="px-6 py-4 border-b border-hint-green/30 dark:border-white/10 flex items-center gap-3 bg-gradient-to-r from-hint-green/10 to-transparent">
                <div className="w-8 h-8 rounded-full bg-hint-green flex items-center justify-center text-nordic">
                  <span className="material-icons text-lg">place</span>
                </div>
                <h2 className="text-lg font-bold text-nordic dark:text-white font-sf-pro">
                  {t.sections.location}
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium text-nordic dark:text-gray-200 mb-1.5 font-sf-pro"
                    htmlFor="location"
                  >
                    {t.fields.address} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="location"
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={t.fields.addressPlaceholder}
                    className="w-full px-4 py-2.5 rounded-md border border-gray-200 dark:border-white/15 bg-white dark:bg-[#0f231f] text-nordic dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-mosque focus:border-mosque focus:outline-none transition-all text-sm font-sf-pro"
                  />
                </div>

                <div className="relative h-48 w-full rounded-lg overflow-hidden bg-gray-100 dark:bg-[#0f231f] border border-gray-200 dark:border-white/15 group z-0">
                  {debouncedLocation.trim().length > 2 ? (
                    <PropertyMapWrapper location={debouncedLocation} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-clear-day to-hint-green/30 dark:from-[#0f231f] dark:to-[#152e2a]">
                      <span className="material-icons text-5xl text-mosque/20">public</span>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 pointer-events-none z-[400]">
                    <span className="bg-white/90 dark:bg-[#152e2a]/90 text-nordic dark:text-white px-3 py-1.5 rounded shadow-sm backdrop-blur-sm text-xs font-bold font-sf-pro flex items-center gap-1">
                      <span className="material-icons text-sm text-mosque">map</span>
                      {t.fields.mapPreview}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="bg-white dark:bg-[#152e2a] rounded-xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden sticky top-24">
              <div className="px-6 py-4 border-b border-hint-green/30 dark:border-white/10 flex items-center gap-3 bg-gradient-to-r from-hint-green/10 to-transparent">
                <div className="w-8 h-8 rounded-full bg-hint-green flex items-center justify-center text-nordic">
                  <span className="material-icons text-lg">straighten</span>
                </div>
                <h2 className="text-lg font-bold text-nordic dark:text-white font-sf-pro">
                  {t.sections.details}
                </h2>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <label
                      className="text-xs text-gray-500 dark:text-gray-400 font-medium font-sf-pro mb-1 block"
                      htmlFor="area"
                    >
                      {areaUnit === "sqft" ? "Area (sqft)" : t.fields.area}
                    </label>
                    <input
                      id="area"
                      type="number"
                      min={0}
                      value={areaNumeric}
                      onChange={(e) => setAreaNumeric(e.target.value)}
                      placeholder="0"
                      className="w-full text-left px-3 py-2 rounded border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-[#0f231f] text-nordic dark:text-white focus:bg-white dark:focus:bg-[#0f231f] focus:ring-1 focus:ring-mosque focus:border-mosque focus:outline-none transition-all font-sf-pro text-sm"
                    />
                  </div>

                  <div className="group">
                    <label
                      className="text-xs text-gray-500 dark:text-gray-400 font-medium font-sf-pro mb-1 block"
                      htmlFor="year"
                    >
                      {t.fields.yearBuilt}
                    </label>
                    <input
                      id="year"
                      type="number"
                      min={1800}
                      max={2100}
                      value={yearBuilt}
                      onChange={(e) => setYearBuilt(e.target.value)}
                      placeholder="YYYY"
                      className="w-full text-left px-3 py-2 rounded border border-gray-200 dark:border-white/15 bg-gray-50 dark:bg-[#0f231f] text-nordic dark:text-white focus:bg-white dark:focus:bg-[#0f231f] focus:ring-1 focus:ring-mosque focus:border-mosque focus:outline-none transition-all font-sf-pro text-sm"
                    />
                  </div>
                </div>

                <hr className="border-gray-100 dark:border-white/10" />

                <div className="space-y-4">
                  {/* Bedrooms */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-nordic dark:text-gray-200 font-sf-pro flex items-center gap-2">
                      <span className="material-icons text-gray-400 text-sm">bed</span>
                      {t.fields.bedrooms}
                    </label>
                    <div className="flex items-center border border-gray-200 dark:border-white/15 rounded-md overflow-hidden bg-white dark:bg-[#0f231f] shadow-sm">
                      <button
                        type="button"
                        onClick={() => setBeds((prev) => Math.max(0, prev - 1))}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 transition-colors border-r border-gray-100 dark:border-white/10 cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="text"
                        readOnly
                        value={beds}
                        aria-label={t.fields.bedrooms}
                        className="w-10 text-center border-none bg-transparent text-nordic dark:text-white p-0 focus:ring-0 focus:outline-none text-sm font-medium font-sf-pro"
                      />
                      <button
                        type="button"
                        onClick={() => setBeds((prev) => prev + 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 transition-colors border-l border-gray-100 dark:border-white/10 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Bathrooms */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-nordic dark:text-gray-200 font-sf-pro flex items-center gap-2">
                      <span className="material-icons text-gray-400 text-sm">shower</span>
                      {t.fields.bathrooms}
                    </label>
                    <div className="flex items-center border border-gray-200 dark:border-white/15 rounded-md overflow-hidden bg-white dark:bg-[#0f231f] shadow-sm">
                      <button
                        type="button"
                        onClick={() => setBaths((prev) => Math.max(0, prev - 1))}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 transition-colors border-r border-gray-100 dark:border-white/10 cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="text"
                        readOnly
                        value={baths}
                        aria-label={t.fields.bathrooms}
                        className="w-10 text-center border-none bg-transparent text-nordic dark:text-white p-0 focus:ring-0 focus:outline-none text-sm font-medium font-sf-pro"
                      />
                      <button
                        type="button"
                        onClick={() => setBaths((prev) => prev + 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 transition-colors border-l border-gray-100 dark:border-white/10 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Parking */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-nordic dark:text-gray-200 font-sf-pro flex items-center gap-2">
                      <span className="material-icons text-gray-400 text-sm">directions_car</span>
                      {t.fields.parking}
                    </label>
                    <div className="flex items-center border border-gray-200 dark:border-white/15 rounded-md overflow-hidden bg-white dark:bg-[#0f231f] shadow-sm">
                      <button
                        type="button"
                        onClick={() => setParking((prev) => Math.max(0, prev - 1))}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 transition-colors border-r border-gray-100 dark:border-white/10 cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="text"
                        readOnly
                        value={parking}
                        aria-label={t.fields.parking}
                        className="w-10 text-center border-none bg-transparent text-nordic dark:text-white p-0 focus:ring-0 focus:outline-none text-sm font-medium font-sf-pro"
                      />
                      <button
                        type="button"
                        onClick={() => setParking((prev) => prev + 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 transition-colors border-l border-gray-100 dark:border-white/10 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-100 dark:border-white/10" />

                <div>
                  <h3 className="font-bold mb-3 font-sf-pro uppercase tracking-wider text-xs text-gray-500 dark:text-gray-400">
                    {t.fields.amenities}
                  </h3>
                  <div className="space-y-2">
                    {AMENITY_OPTIONS.map((amenity) => {
                      const checked = amenities.includes(amenity);
                      return (
                        <label
                          key={amenity}
                          className="flex items-center gap-2.5 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleAmenity(amenity)}
                            className="w-4 h-4 accent-mosque text-mosque border-gray-300 rounded focus:ring-mosque cursor-pointer"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300 font-sf-pro group-hover:text-nordic dark:group-hover:text-white transition-colors">
                            {t.amenities[amenity]}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Fixed Bottom Action Bar */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-[#152e2a] border-t border-gray-200 dark:border-white/10 shadow-xl md:hidden z-40 flex gap-3">
            <Link
              href="/admin"
              className="flex-1 py-3 rounded-lg border border-gray-300 dark:border-white/15 bg-white dark:bg-[#0f231f] text-nordic dark:text-gray-200 font-medium font-sf-pro text-center"
            >
              {t.cancel}
            </Link>
            <button
              type="submit"
              disabled={isBusy}
              className="flex-1 py-3 rounded-lg bg-mosque text-white font-medium font-sf-pro flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {savingMode ? t.saving : t.save}
            </button>
          </div>
        </form>
      </main>

      <footer className="bg-white dark:bg-[#152e2a] border-t border-gray-100 dark:border-white/10 py-8 mt-12 mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-gray-400 font-sf-pro">
          © {new Date().getFullYear()} LuxeEstate Real Estate Inc. All rights reserved. <br />
          <span className="mt-2 block text-gray-300 dark:text-gray-500">
            Designed for modern agencies.
          </span>
        </div>
      </footer>
    </div>
  );
};

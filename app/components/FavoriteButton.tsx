"use client";

import React from "react";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { useLanguage } from "../i18n/LanguageContext";

interface FavoriteButtonProps {
  propertyId: string;
  size?: "sm" | "md";
  className?: string;
}

export function FavoriteButton({
  propertyId,
  size = "md",
  className = "",
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const { isSaved, isPending, toggleFavorite } = useFavorites();
  const { dict } = useLanguage();

  const saved = isSaved(propertyId);
  const pending = isPending(propertyId);

  const label = !user
    ? dict.propertyCard.signInToSave
    : saved
      ? dict.propertyCard.removeSavedProperty
      : dict.propertyCard.saveProperty;

  const sizeClasses = size === "sm" ? "w-9 h-9" : "w-10 h-10";
  const iconClasses = size === "sm" ? "text-lg leading-none" : "text-xl";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggleFavorite(propertyId);
      }}
      disabled={pending}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      className={`${sizeClasses} rounded-full backdrop-blur-sm flex items-center justify-center transition-all cursor-pointer disabled:opacity-60 ${
        saved
          ? "bg-white/95 dark:bg-black/70 text-rose-500 hover:bg-rose-500 hover:text-white shadow-sm"
          : "bg-white/90 dark:bg-black/60 text-nordic-dark dark:text-white hover:bg-mosque hover:text-white dark:hover:text-white"
      } ${className}`}
    >
      <span className={`material-icons ${iconClasses}`}>
        {saved ? "favorite" : "favorite_border"}
      </span>
    </button>
  );
}

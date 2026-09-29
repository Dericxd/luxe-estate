"use client";

import { useState } from "react";
import { Property } from "../lib/types";

export const FeaturedPropertyCard = ({ property }: { property: Property }) => {
  const images = property.images && property.images.length > 0
    ? property.images
    : [property.image_url];

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="group relative rounded-xl overflow-hidden shadow-soft bg-white dark:bg-white/5 cursor-pointer">
      <div className="aspect-[4/3] w-full overflow-hidden relative">
        <img
          alt={`${property.title} - image ${currentImageIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          src={images[currentImageIndex]}
        />

        {/* Tag badge */}
        <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-nordic-dark dark:text-white pointer-events-none">
          {property.tag}
        </div>

        {/* Favorite button */}
        <button 
          onClick={(e) => e.stopPropagation()} 
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center text-nordic-dark dark:text-white hover:bg-mosque hover:text-white dark:hover:text-white transition-all z-10"
        >
          <span className="material-icons text-xl">favorite_border</span>
        </button>

        {/* Multi-image carousel navigation arrows (visible when more than 1 image) */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevImage}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <span className="material-icons text-lg">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={nextImage}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <span className="material-icons text-lg">chevron_right</span>
            </button>

            {/* Image dots indicator */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(idx);
                  }}
                  aria-label={`Go to photo ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentImageIndex
                      ? "w-5 bg-white shadow-sm"
                      : "w-1.5 bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>

            {/* Photo counter badge */}
            <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
              <span className="material-icons text-[12px]">photo_camera</span>
              {currentImageIndex + 1}/{images.length}
            </div>
          </>
        )}

        {property.tag === "Exclusive" && images.length <= 1 && (
          <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent opacity-60 pointer-events-none"></div>
        )}
      </div>

      <div className="p-6 relative">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-xl font-medium text-nordic-dark dark:text-white group-hover:text-mosque transition-colors">
              {property.title}
            </h3>
            <p className="text-nordic-muted text-sm flex items-center gap-1 mt-1">
              <span className="material-icons text-sm">place</span> {property.location}
            </p>
          </div>
          <span className="text-xl font-semibold text-mosque dark:text-primary">
            {property.price_label}
          </span>
        </div>
        <div className="flex items-center gap-6 mt-6 pt-6 border-t border-nordic-dark/5 dark:border-white/10">
          <div className="flex items-center gap-2 text-nordic-muted text-sm">
            <span className="material-icons text-lg">king_bed</span> {property.beds} Beds
          </div>
          <div className="flex items-center gap-2 text-nordic-muted text-sm">
            <span className="material-icons text-lg">bathtub</span> {property.baths} Baths
          </div>
          <div className="flex items-center gap-2 text-nordic-muted text-sm">
            <span className="material-icons text-lg">square_foot</span> {property.area}
          </div>
        </div>
      </div>
    </div>
  );
};

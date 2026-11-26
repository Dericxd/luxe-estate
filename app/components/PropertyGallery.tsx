"use client";

import { useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { FavoriteButton } from "./FavoriteButton";

interface PropertyGalleryProps {
  propertyId: string;
  images: string[];
  title: string;
}

export const PropertyGallery = ({ propertyId, images, title }: PropertyGalleryProps) => {
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const { dict } = useLanguage();

  if (!images || images.length === 0) return null;

  return (
    <div className="lg:col-span-8 space-y-4">
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl shadow-sm group">
        <img 
          alt={`${title} - Main Image`} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
          src={images[mainImageIndex]} 
        />
        <div className="absolute top-4 left-4 flex gap-2">
          <span className="bg-mosque text-white text-xs font-medium px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
            {dict.propertyDetail.premiumBadge}
          </span>
        </div>
        <FavoriteButton
          propertyId={propertyId}
          size="md"
          className="absolute top-4 right-4 z-10 shadow-sm"
        />
        {images.length > 1 && (
          <button className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-nordic px-4 py-2 rounded-lg text-sm font-medium shadow-lg backdrop-blur transition-all flex items-center gap-2">
            <span className="material-icons text-sm">grid_view</span>
            {dict.propertyDetail.viewAllPhotos}
          </button>
        )}
      </div>
      
      {images.length > 1 && (
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x">
          {images.map((img, idx) => (
            <div 
              key={idx}
              onClick={() => setMainImageIndex(idx)}
              className={`flex-none w-48 aspect-[4/3] rounded-lg overflow-hidden cursor-pointer transition-opacity snap-start ${mainImageIndex === idx ? 'ring-2 ring-mosque ring-offset-2 ring-offset-clear-day dark:ring-offset-background-dark opacity-100' : 'opacity-70 hover:opacity-100'}`}
            >
              <img alt={`${title} thumbnail ${idx + 1}`} className="w-full h-full object-cover" src={img} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

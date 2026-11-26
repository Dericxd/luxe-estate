"use client";

import Link from "next/link";
import { Property } from "../lib/types";
import { useLanguage } from "../i18n/LanguageContext";
import { FavoriteButton } from "./FavoriteButton";

export const MarketPropertyCard = ({ property }: { property: Property }) => {
  const { dict } = useLanguage();
  const propertyHref = property.slug ? `/properties/${property.slug}` : `/properties/${property.id}`;
  const localizedTag =
    (dict.propertyCard.tags as Record<string, string>)[property.tag] ?? property.tag;

  return (
    <Link
      href={propertyHref}
      className="block bg-white dark:bg-white/5 rounded-xl overflow-hidden shadow-card hover:shadow-soft transition-all duration-300 group cursor-pointer h-full flex flex-col"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          src={property.images[0]}
        />
        <FavoriteButton
          propertyId={property.id}
          size="sm"
          className="absolute top-3 right-3 z-10"
        />
        <div
          className={`absolute bottom-3 left-3 text-white text-xs font-bold px-2 py-1 rounded ${property.tag_color ?? 'bg-nordic-dark/90'}`}
        >
          {localizedTag}
        </div>
      </div>
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-baseline mb-2">
          <h3 className="font-bold text-lg text-nordic-dark dark:text-white">
            {property.listing_type === 'rent' ? (
               <>
                 {property.price_label.split('/mo')[0]}
                 <span className="text-sm font-normal text-nordic-muted">{dict.propertyCard.perMonth}</span>
               </>
            ) : property.price_label}
          </h3>
        </div>
        <h4 className="text-nordic-dark dark:text-gray-200 font-medium truncate mb-1">
          {property.title}
        </h4>
        <p className="text-nordic-muted text-xs mb-4">{property.location}</p>
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-1 text-nordic-muted text-xs">
            <span className="material-icons text-sm text-mosque/80">king_bed</span> {property.beds}
          </div>
          <div className="flex items-center gap-1 text-nordic-muted text-xs">
            <span className="material-icons text-sm text-mosque/80">bathtub</span> {property.baths}
          </div>
          <div className="flex items-center gap-1 text-nordic-muted text-xs">
            <span className="material-icons text-sm text-mosque/80">square_foot</span> {property.area}
          </div>
        </div>
      </div>
    </Link>
  );
};

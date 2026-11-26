"use client";

import dynamic from "next/dynamic";

const PropertyMap = dynamic(() => import("./PropertyMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-100 dark:bg-white/5 animate-pulse rounded-lg"></div>
});

interface PropertyMapWrapperProps {
  location: string;
  latitude?: number | null;
  longitude?: number | null;
}

export const PropertyMapWrapper = ({ location, latitude, longitude }: PropertyMapWrapperProps) => {
  return <PropertyMap location={location} latitude={latitude} longitude={longitude} />;
};

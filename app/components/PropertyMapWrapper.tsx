"use client";

import dynamic from "next/dynamic";

const PropertyMap = dynamic(() => import("./PropertyMap"), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-100 dark:bg-white/5 animate-pulse rounded-lg"></div>
});

interface PropertyMapWrapperProps {
  location: string;
}

export const PropertyMapWrapper = ({ location }: PropertyMapWrapperProps) => {
  return <PropertyMap location={location} />;
};

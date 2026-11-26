"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix leaflet marker icon issue in Next.js
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

interface PropertyMapProps {
  location: string;
  latitude?: number | null;
  longitude?: number | null;
}

export default function PropertyMap({ location, latitude, longitude }: PropertyMapProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-full h-full bg-slate-100 dark:bg-white/5 animate-pulse rounded-lg"></div>;
  }

  // We don't have exact lat/lng in the db, so we mock a location for demonstration
  // In a real app, geocoding would be used to get coordinates from the location string
  const hasCoords =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);
  const defaultPosition: [number, number] = hasCoords
    ? [latitude as number, longitude as number]
    : [37.4419, -122.1430]; // Palo Alto (fallback)

  return (
    <MapContainer 
      key={`${defaultPosition[0]},${defaultPosition[1]}`}
      center={defaultPosition} 
      zoom={13} 
      scrollWheelZoom={false}
      className="w-full h-full z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={defaultPosition} icon={icon}>
        <Popup>
          {location}
        </Popup>
      </Marker>
    </MapContainer>
  );
}

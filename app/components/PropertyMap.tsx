"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const DEFAULT_FALLBACK_POSITION: [number, number] = [37.4419, -122.143];

function createPinIcon(interactive: boolean): L.DivIcon {
  const pulseRing = interactive
    ? `<span style="position:absolute;inset:-4px;border-radius:9999px;background:rgba(0,102,85,0.22);pointer-events:none;"></span>`
    : "";

  return L.divIcon({
    className: "luxe-leaflet-pin",
    html: `
      <div style="position:relative;width:32px;height:40px;display:flex;align-items:center;justify-content:center;${interactive ? "cursor:grab;" : ""}">
        ${pulseRing}
        <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 4px 8px rgba(25,50,47,0.32));">
          <path d="M16 0C7.16344 0 0 7.16344 0 16C0 27.5 16 40 16 40C16 40 32 27.5 32 16C32 7.16344 24.8366 0 16 0Z" fill="#006655"/>
          <circle cx="16" cy="15.5" r="6.5" fill="#FFFFFF"/>
          <circle cx="16" cy="15.5" r="3" fill="#19322F"/>
        </svg>
      </div>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -36],
  });
}

function roundCoordinate(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

interface MapControllerProps {
  position: [number, number];
  interactive: boolean;
  onCoordinatesChange?: (lat: number, lng: number) => void;
}

function MapController({ position, interactive, onCoordinatesChange }: MapControllerProps) {
  const map = useMap();
  const isFirstRender = useRef(true);
  const lastPositionRef = useRef<[number, number]>(position);

  useMapEvents({
    click(e) {
      if (!interactive || !onCoordinatesChange) return;
      onCoordinatesChange(roundCoordinate(e.latlng.lat), roundCoordinate(e.latlng.lng));
    },
  });

  useEffect(() => {
    const [prevLat, prevLng] = lastPositionRef.current;
    const [nextLat, nextLng] = position;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      lastPositionRef.current = position;
      return;
    }

    if (Math.abs(prevLat - nextLat) > 1e-7 || Math.abs(prevLng - nextLng) > 1e-7) {
      lastPositionRef.current = position;
      map.flyTo(position, Math.max(map.getZoom(), 14), { duration: 0.65 });
    }
  }, [map, position]);

  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => {
      map.invalidateSize({ pan: false });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return null;
}

export interface PropertyMapProps {
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  interactive?: boolean;
  onCoordinatesChange?: (lat: number, lng: number) => void;
}

export default function PropertyMap({
  location,
  latitude,
  longitude,
  interactive = false,
  onCoordinatesChange,
}: PropertyMapProps) {
  const icon = useMemo(() => createPinIcon(interactive), [interactive]);

  const hasCoords =
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  const position: [number, number] = hasCoords
    ? [latitude, longitude]
    : DEFAULT_FALLBACK_POSITION;

  return (
    <MapContainer
      center={position}
      zoom={hasCoords ? 15 : 13}
      scrollWheelZoom={interactive}
      className="w-full h-full z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController
        position={position}
        interactive={interactive}
        onCoordinatesChange={onCoordinatesChange}
      />
      <Marker
        position={position}
        icon={icon}
        draggable={interactive}
        eventHandlers={
          interactive && onCoordinatesChange
            ? {
                dragend: (event) => {
                  const latLng = event.target.getLatLng();
                  onCoordinatesChange(
                    roundCoordinate(latLng.lat),
                    roundCoordinate(latLng.lng)
                  );
                },
              }
            : undefined
        }
      >
        {location.trim() && <Popup>{location}</Popup>}
      </Marker>
    </MapContainer>
  );
}

"use client";

import type { MapMarker } from "@/lib/map-types";
import type { RouteStop } from "@/lib/route-stops";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { useEffect } from "react";
import "leaflet/dist/leaflet.css";

const amberIcon = L.divIcon({
  className: "",
  html: '<div style="width:16px;height:16px;border-radius:50%;background:#f59e0b;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const convoyIcon = L.divIcon({
  className: "convoy-pulse-marker",
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#f59e0b;border:2px solid #fff;box-shadow:0 0 0 4px rgba(245, 158, 11,0.35);animation:convoyPulse 1.5s ease-in-out infinite"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const parkingIcon = (color = "#a78bfa") =>
  L.divIcon({
    className: "",
    html: `<div style="width:18px;height:18px;border-radius:4px;background:${color};border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#18181b;box-shadow:0 2px 6px rgba(0,0,0,0.4)">P</div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

const dynoIcon = (hp?: number | null) =>
  L.divIcon({
    className: "",
    html: `<div style="min-width:36px;padding:4px 6px;border-radius:8px;background:#dc2626;border:2px solid #fff;text-align:center;font-size:10px;font-weight:800;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.4)">${hp ? `${Math.round(hp)}hp` : "DYNO"}</div>`,
    iconSize: [40, 24],
    iconAnchor: [20, 12],
  });

const shopIcon = L.divIcon({
  className: "",
  html: '<div style="width:18px;height:18px;border-radius:50%;background:#22c55e;border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff">âœ“</div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const eventIcon = L.divIcon({
  className: "",
  html: '<div style="width:14px;height:14px;border-radius:3px;background:#fafafa;border:2px solid #f59e0b;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const userIcon = L.divIcon({
  className: "",
  html: '<div style="width:18px;height:18px;border-radius:50%;background:#38bdf8;border:3px solid #fff;box-shadow:0 0 0 2px rgba(56,189,248,0.45),0 2px 8px rgba(0,0,0,0.35)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const searchPinIcon = L.divIcon({
  className: "",
  html: `<div style="position:relative;width:28px;height:36px">
    <div style="position:absolute;left:50%;top:0;transform:translateX(-50%);width:22px;height:22px;background:#ea4335;border:2px solid #fff;border-radius:50% 50% 50% 0;transform:translateX(-50%) rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>
    <div style="position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:8px;height:8px;background:rgba(234,67,53,0.35);border-radius:50%"></div>
  </div>`,
  iconSize: [28, 36],
  iconAnchor: [14, 34],
});

type CruiseRoute = { id: string; title: string; points: RouteStop[] };

type Props = {
  markers: MapMarker[];
  routes?: CruiseRoute[];
  center: [number, number];
  zoom?: number;
  userLocation?: { lat: number; lng: number } | null;
  onMapClick?: (lat: number, lng: number) => void;
  onMarkerClick?: (markerId: string) => void;
  selectedId?: string | null;
  searchPin?: { lat: number; lng: number; label?: string } | null;
};

function ClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapRecenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { animate: true, duration: 1.1 });
  }, [map, center, zoom]);
  return null;
}

export default function MeetMapInner({
  markers,
  routes = [],
  center,
  zoom = 5,
  userLocation,
  onMapClick,
  onMarkerClick,
  selectedId,
  searchPin,
}: Props) {
  return (
    <MapContainer center={center} zoom={zoom} className="h-full w-full" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <MapRecenter center={center} zoom={zoom} />
      {onMapClick ? <ClickHandler onMapClick={onMapClick} /> : null}
      {searchPin ? (
        <Marker position={[searchPin.lat, searchPin.lng]} icon={searchPinIcon} zIndexOffset={2000}>
          <Popup>
            <p className="text-sm font-semibold text-zinc-900">{searchPin.label ?? "Selected location"}</p>
          </Popup>
        </Marker>
      ) : null}
      {userLocation ? (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} zIndexOffset={1000}>
          <Popup>
            <p className="text-sm font-medium text-zinc-900">You are here</p>
          </Popup>
        </Marker>
      ) : null}
      {routes.map((route) =>
        route.points.length > 1 ? (
          <Polyline
            key={route.id}
            positions={route.points.map((p) => [p.lat, p.lng] as [number, number])}
            pathOptions={{ color: "#f59e0b", weight: 4, opacity: 0.85 }}
          />
        ) : null,
      )}
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.latitude, marker.longitude]}
          icon={
            marker.type === "dyno"
              ? dynoIcon(marker.dynoHp)
              : marker.type === "shop"
                ? shopIcon
                : marker.type === "convoy"
              ? convoyIcon
              : marker.type === "parking"
                ? parkingIcon(marker.color ?? "#a78bfa")
                : marker.type === "event"
                  ? eventIcon
                  : amberIcon
          }
          opacity={selectedId && selectedId !== marker.id && marker.type === "event" ? 0.45 : 1}
          zIndexOffset={marker.type === "convoy" ? 500 : marker.type === "parking" ? 300 : 0}
          eventHandlers={onMarkerClick ? { click: () => onMarkerClick(marker.id) } : undefined}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold text-zinc-900">{marker.title}</p>
              {marker.subtitle ? <p className="text-xs text-zinc-600">{marker.subtitle}</p> : null}
              {marker.description ? <p className="mt-1 text-xs text-zinc-700">{marker.description}</p> : null}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

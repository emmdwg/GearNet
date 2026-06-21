"use client";

import type { MapMarker } from "@/lib/map-types";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const amberIcon = L.divIcon({
  className: "",
  html: '<div style="width:16px;height:16px;border-radius:50%;background:#f59e0b;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const eventIcon = L.divIcon({
  className: "",
  html: '<div style="width:14px;height:14px;border-radius:3px;background:#fafafa;border:2px solid #f59e0b;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

type Props = {
  markers: MapMarker[];
  center: [number, number];
  zoom?: number;
  onMapClick?: (lat: number, lng: number) => void;
  selectedId?: string | null;
};

function ClickHandler({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MeetMapInner({ markers, center, zoom = 5, onMapClick, selectedId }: Props) {
  return (
    <MapContainer center={center} zoom={zoom} className="h-full w-full rounded-xl" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {onMapClick ? <ClickHandler onMapClick={onMapClick} /> : null}
      {markers.map((marker) => (
        <Marker
          key={marker.id}
          position={[marker.latitude, marker.longitude]}
          icon={marker.type === "event" ? eventIcon : amberIcon}
          opacity={selectedId && selectedId !== marker.id ? 0.45 : 1}
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

"use client";

import type { MarketplaceListing } from "@/lib/types";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { useEffect, useState } from "react";
import Link from "next/link";
import "leaflet/dist/leaflet.css";

const listingIcon = L.divIcon({
  className: "",
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#f59e0b;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const shopIcon = L.divIcon({
  className: "",
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#22c55e;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

type VerifiedShop = {
  id: string;
  username: string;
  displayName: string;
  latitude: number;
  longitude: number;
  location: string;
};

type Props = {
  listings: MarketplaceListing[];
  center: [number, number];
  zoom?: number;
  showVerifiedShops?: boolean;
};

function MapRecenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

export default function MarketplaceMapInner({ listings, center, zoom = 11, showVerifiedShops = true }: Props) {
  const mappable = listings.filter((l) => l.latitude != null && l.longitude != null);
  const [shops, setShops] = useState<VerifiedShop[]>([]);

  useEffect(() => {
    if (!showVerifiedShops) {
      setShops([]);
      return;
    }
    fetch("/api/shops/verified-map")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setShops(Array.isArray(data) ? data : []))
      .catch(() => setShops([]));
  }, [showVerifiedShops]);

  return (
    <MapContainer center={center} zoom={zoom} className="h-full w-full rounded-xl" scrollWheelZoom>
      <TileLayer
        attribution='&copy; OpenStreetMap &copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <MapRecenter center={center} zoom={zoom} />
      {mappable.map((listing) => (
        <Marker
          key={listing.id}
          position={[listing.latitude!, listing.longitude!]}
          icon={listingIcon}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold text-zinc-900">{listing.title}</p>
              <p className="text-xs text-zinc-600">${(listing.price / 100).toFixed(0)} Â· {listing.location}</p>
              <Link href={`/marketplace/${listing.id}`} className="mt-2 inline-block text-xs font-semibold text-amber-600 hover:underline">
                View listing
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
      {showVerifiedShops
        ? shops.map((shop) => (
            <Marker key={`shop-${shop.id}`} position={[shop.latitude, shop.longitude]} icon={shopIcon}>
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold text-zinc-900">{shop.displayName}</p>
                  <p className="text-xs text-zinc-600">Verified shop Â· {shop.location}</p>
                  <Link href={`/profile/${shop.username}`} className="mt-2 inline-block text-xs font-semibold text-emerald-600 hover:underline">
                    View shop
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))
        : null}
    </MapContainer>
  );
}

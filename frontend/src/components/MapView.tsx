import { useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Circle,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { useAppStore } from '../store/useAppStore';
import { haversineDistance } from '../lib/geoUtils';
import { DEFAULT_MAP_ZOOM } from '../constants';

// Custom user location marker
const userIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:24px;height:24px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:rgba(59,130,246,0.3);" class="pulse-marker"></div>
      <div style="position:absolute;top:4px;left:4px;width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// POI marker colors by type
const poiColors: Record<string, string> = {
  tourism: '#ef4444',
  historic: '#a855f7',
  worship: '#f59e0b',
  natural: '#22c55e',
  leisure: '#06b6d4',
  other: '#6b7280',
};

function createPOIIcon(type: string) {
  const color = poiColors[type] || poiColors.other;
  return L.divIcon({
    className: '',
    html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

// Component to auto-follow user position
function MapFollower() {
  const map = useMap();
  const location = useAppStore((s) => s.location);
  const isFollowing = useRef(true);

  useEffect(() => {
    const onDrag = () => {
      isFollowing.current = false;
    };
    map.on('dragstart', onDrag);
    return () => {
      map.off('dragstart', onDrag);
    };
  }, [map]);

  useEffect(() => {
    if (location && isFollowing.current) {
      map.setView([location.latitude, location.longitude], map.getZoom(), {
        animate: true,
      });
    }
  }, [location, map]);

  return null;
}

export function MapView() {
  const location = useAppStore((s) => s.location);
  const pois = useAppStore((s) => s.pois);
  const searchRadius = useAppStore((s) => s.settings.searchRadiusMeters);
  const mapRef = useRef<L.Map | null>(null);

  if (!location) return null;

  const center: [number, number] = [location.latitude, location.longitude];

  return (
    <div className="relative flex-1 min-h-0">
      <MapContainer
        center={center}
        zoom={DEFAULT_MAP_ZOOM}
        className="h-full w-full"
        zoomControl={false}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapFollower />

        {/* User position */}
        <Marker position={center} icon={userIcon} />

        {/* Search radius circle */}
        <Circle
          center={center}
          radius={searchRadius}
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.05,
            weight: 1,
            dashArray: '5, 5',
          }}
        />

        {/* POI markers */}
        {pois.map((poi) => {
          const dist = haversineDistance(
            { latitude: location.latitude, longitude: location.longitude },
            { latitude: poi.latitude, longitude: poi.longitude }
          );
          if (dist > searchRadius) return null;

          return (
            <Marker
              key={poi.id}
              position={[poi.latitude, poi.longitude]}
              icon={createPOIIcon(poi.type)}
            >
              <Popup>
                <div className="text-sm">
                  <strong>{poi.name}</strong>
                  <br />
                  <span className="text-gray-500">{poi.subType}</span>
                  <br />
                  <span>{Math.round(dist)}m</span>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Re-center button */}
      <button
        onClick={() => {
          mapRef.current?.setView(center, DEFAULT_MAP_ZOOM, { animate: true });
        }}
        className="absolute bottom-3 right-3 z-[1000] rounded-full bg-white p-2 shadow-lg hover:bg-gray-100 transition"
        aria-label="現在地に戻る"
      >
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  );
}

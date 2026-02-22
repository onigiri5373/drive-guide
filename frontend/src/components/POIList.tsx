import { useAppStore } from '../store/useAppStore';
import { haversineDistance } from '../lib/geoUtils';
import { calculateBearing, getRelativeDirection } from '../lib/bearing';
import { formatDistance } from '../lib/geoUtils';
import { DirectionBadge } from './DirectionBadge';
import type { POI } from '../types/geo';

interface Props {
  onNarrate: (poi: POI) => void;
}

const typeLabels: Record<string, string> = {
  tourism: '観光',
  historic: '歴史',
  worship: '寺社',
  natural: '自然',
  leisure: '公園',
  other: 'その他',
};

export function POIList({ onNarrate }: Props) {
  const location = useAppStore((s) => s.location);
  const pois = useAppStore((s) => s.pois);
  const searchRadius = useAppStore((s) => s.settings.searchRadiusMeters);
  const isNarrating = useAppStore((s) => s.isNarrating);

  if (!location) return null;

  const enriched = pois
    .map((poi) => {
      const distance = haversineDistance(
        { latitude: location.latitude, longitude: location.longitude },
        { latitude: poi.latitude, longitude: poi.longitude }
      );
      const bearing = location.heading != null
        ? calculateBearing(
            { latitude: location.latitude, longitude: location.longitude },
            { latitude: poi.latitude, longitude: poi.longitude }
          )
        : null;
      const direction =
        bearing != null && location.heading != null
          ? getRelativeDirection(location.heading, bearing)
          : null;
      return { poi, distance, direction };
    })
    .filter((e) => e.distance <= searchRadius)
    .sort((a, b) => a.distance - b.distance);

  if (enriched.length === 0) {
    return (
      <div className="px-4 py-3 text-sm text-gray-400 text-center">
        周辺にスポットが見つかりません
      </div>
    );
  }

  return (
    <div className="overflow-y-auto max-h-48">
      {enriched.map(({ poi, distance, direction }) => (
        <button
          key={poi.id}
          onClick={() => onNarrate(poi)}
          disabled={isNarrating}
          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 active:bg-gray-100 transition text-left border-b border-gray-50 disabled:opacity-50"
        >
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">
            {typeLabels[poi.type]?.[0] || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{poi.name}</p>
            <p className="text-xs text-gray-400">{typeLabels[poi.type] || poi.type}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {direction && <DirectionBadge direction={direction} size="sm" />}
            <span className="text-xs text-gray-500">{formatDistance(distance)}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

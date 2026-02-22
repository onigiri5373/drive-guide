import { useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { calculateBearing, getRelativeDirection } from '../lib/bearing';
import { haversineDistance } from '../lib/geoUtils';
import { requestNarration } from '../lib/apiClient';
import { NARRATION_COOLDOWN } from '../constants';
import type { POI } from '../types/geo';

export function useGuide() {
  const location = useAppStore((s) => s.location);
  const pois = useAppStore((s) => s.pois);
  const settings = useAppStore((s) => s.settings);
  const isNarrating = useAppStore((s) => s.isNarrating);
  const lastNarrationTime = useAppStore((s) => s.lastNarrationTime);
  const setNarration = useAppStore((s) => s.setNarration);
  const setIsNarrating = useAppStore((s) => s.setIsNarrating);
  const markPOINarrated = useAppStore((s) => s.markPOINarrated);
  const isPoiNarrated = useAppStore((s) => s.isPoiNarrated);
  const cleanExpiredNarrated = useAppStore((s) => s.cleanExpiredNarrated);

  // Narrate a specific POI
  const narratePOI = useCallback(
    async (poi: POI) => {
      if (!location || location.heading == null) return;
      if (isNarrating) return;

      const distance = haversineDistance(
        { latitude: location.latitude, longitude: location.longitude },
        { latitude: poi.latitude, longitude: poi.longitude }
      );

      const bearing = calculateBearing(
        { latitude: location.latitude, longitude: location.longitude },
        { latitude: poi.latitude, longitude: poi.longitude }
      );

      const direction = getRelativeDirection(location.heading, bearing);

      setIsNarrating(true);

      try {
        const result = await requestNarration({
          poiName: poi.name,
          poiType: poi.type,
          poiSubType: poi.subType,
          distance: Math.round(distance),
          direction,
          speed: location.speed,
          latitude: location.latitude,
          longitude: location.longitude,
        });

        markPOINarrated(poi.id);

        setNarration({
          id: `${poi.id}-${Date.now()}`,
          poiId: poi.id,
          poiName: poi.name,
          narration: result.narration,
          direction,
          distance: Math.round(distance),
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('Narration request failed:', err);
      } finally {
        setIsNarrating(false);
      }
    },
    [location, isNarrating, setIsNarrating, setNarration, markPOINarrated]
  );

  // Auto-narrate effect
  useEffect(() => {
    if (!settings.autoNarrate) return;
    if (!location || location.heading == null) return;
    if (isNarrating) return;

    // Cooldown check
    if (Date.now() - lastNarrationTime < NARRATION_COOLDOWN) return;

    // Clean expired narrated POIs
    cleanExpiredNarrated();

    // Find best candidate: closest un-narrated POI in front/left/right
    const candidates = pois
      .map((poi) => {
        const distance = haversineDistance(
          { latitude: location.latitude, longitude: location.longitude },
          { latitude: poi.latitude, longitude: poi.longitude }
        );
        const bearing = calculateBearing(
          { latitude: location.latitude, longitude: location.longitude },
          { latitude: poi.latitude, longitude: poi.longitude }
        );
        const direction = getRelativeDirection(location.heading!, bearing);
        return { poi, distance, direction };
      })
      .filter(
        (c) =>
          c.direction !== 'behind' &&
          c.distance <= settings.searchRadiusMeters &&
          !isPoiNarrated(c.poi.id)
      )
      .sort((a, b) => a.distance - b.distance);

    if (candidates.length === 0) return;

    const best = candidates[0];
    narratePOI(best.poi);
  }, [
    location,
    pois,
    settings.autoNarrate,
    settings.searchRadiusMeters,
    isNarrating,
    lastNarrationTime,
    narratePOI,
    cleanExpiredNarrated,
    isPoiNarrated,
  ]);

  return { narratePOI };
}

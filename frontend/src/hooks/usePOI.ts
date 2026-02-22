import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { fetchPOIs } from '../lib/overpass';
import { haversineDistance, toGeohash } from '../lib/geoUtils';
import { getCachedPOIs, setCachedPOIs } from '../lib/poiCache';
import {
  POI_QUERY_MOVEMENT_THRESHOLD,
  POI_QUERY_RATE_LIMIT,
} from '../constants';
import type { LatLng } from '../types/geo';

export function usePOI() {
  const location = useAppStore((s) => s.location);
  const searchRadius = useAppStore((s) => s.settings.searchRadiusMeters);
  const setPOIs = useAppStore((s) => s.setPOIs);
  const setPOIsLoading = useAppStore((s) => s.setPOIsLoading);

  const lastQueryCenter = useRef<LatLng | null>(null);
  const lastQueryTime = useRef<number>(0);
  const isQuerying = useRef(false);

  useEffect(() => {
    if (!location) return;

    const now = Date.now();

    // Rate limit check
    if (now - lastQueryTime.current < POI_QUERY_RATE_LIMIT) return;

    // Movement threshold check
    if (lastQueryCenter.current) {
      const dist = haversineDistance(lastQueryCenter.current, {
        latitude: location.latitude,
        longitude: location.longitude,
      });
      if (dist < POI_QUERY_MOVEMENT_THRESHOLD) return;
    }

    // Don't overlap queries
    if (isQuerying.current) return;

    const queryPOIs = async () => {
      isQuerying.current = true;
      setPOIsLoading(true);

      try {
        // Check cache first
        const geohash = toGeohash(location.latitude, location.longitude);
        const cached = getCachedPOIs(geohash);

        if (cached) {
          setPOIs(cached);
          lastQueryCenter.current = {
            latitude: location.latitude,
            longitude: location.longitude,
          };
          lastQueryTime.current = now;
          setPOIsLoading(false);
          isQuerying.current = false;
          return;
        }

        // Query with larger radius for buffer
        const queryRadius = Math.max(searchRadius * 2, 2000);
        const pois = await fetchPOIs(
          location.latitude,
          location.longitude,
          queryRadius
        );

        setCachedPOIs(geohash, pois);
        setPOIs(pois);

        lastQueryCenter.current = {
          latitude: location.latitude,
          longitude: location.longitude,
        };
        lastQueryTime.current = Date.now();
      } catch (err) {
        console.error('POI query failed:', err);
      } finally {
        setPOIsLoading(false);
        isQuerying.current = false;
      }
    };

    queryPOIs();
  }, [location, searchRadius, setPOIs, setPOIsLoading]);
}

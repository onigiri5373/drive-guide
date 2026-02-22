import type { POI } from '../types/geo';
import { POI_CACHE_TTL, POI_CACHE_MAX_ENTRIES } from '../constants';

interface CacheEntry {
  pois: POI[];
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

export function getCachedPOIs(geohash: string): POI[] | null {
  const entry = cache.get(geohash);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > POI_CACHE_TTL) {
    cache.delete(geohash);
    return null;
  }

  return entry.pois;
}

export function setCachedPOIs(geohash: string, pois: POI[]): void {
  // Evict oldest entries if cache is full
  if (cache.size >= POI_CACHE_MAX_ENTRIES) {
    let oldestKey = '';
    let oldestTime = Infinity;
    for (const [key, entry] of cache) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }
    if (oldestKey) cache.delete(oldestKey);
  }

  cache.set(geohash, { pois, timestamp: Date.now() });
}

export function clearCache(): void {
  cache.clear();
}

export const DEFAULT_SEARCH_RADIUS = 1000; // meters
export const POI_QUERY_MOVEMENT_THRESHOLD = 300; // meters - re-query after moving this far
export const POI_QUERY_RATE_LIMIT = 10_000; // ms - minimum between Overpass queries
export const NARRATION_COOLDOWN = 30_000; // ms - minimum between narrations
export const NARRATED_POI_EXPIRY = 5 * 60_000; // ms - forget narrated POI after 5 min
export const POI_CACHE_TTL = 5 * 60_000; // ms
export const POI_CACHE_MAX_ENTRIES = 50;
export const GPS_ACCURACY_THRESHOLD = 100; // meters - ignore readings worse than this
export const DEFAULT_SPEECH_RATE = 0.9;
export const DEFAULT_MAP_ZOOM = 15;
// In dev: use Vite proxy '/api'. In prod: use VITE_API_URL env variable
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

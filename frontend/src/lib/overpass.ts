import type { POI, POIType } from '../types/geo';

// Multiple Overpass API endpoints for failover
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

function buildQuery(lat: number, lon: number, radius: number): string {
  return `
[out:json][timeout:10];
(
  node["tourism"~"attraction|museum|viewpoint|artwork|information|hotel"](around:${radius},${lat},${lon});
  node["historic"~"castle|monument|memorial|ruins|archaeological_site"](around:${radius},${lat},${lon});
  node["amenity"="place_of_worship"](around:${radius},${lat},${lon});
  node["natural"~"peak|cliff|beach|hot_spring"](around:${radius},${lat},${lon});
  node["leisure"~"park|garden"](around:${radius},${lat},${lon});
  way["tourism"~"attraction|museum|viewpoint"](around:${radius},${lat},${lon});
  way["historic"~"castle|monument|memorial|ruins"](around:${radius},${lat},${lon});
  way["amenity"="place_of_worship"](around:${radius},${lat},${lon});
  way["leisure"~"park|garden"](around:${radius},${lat},${lon});
);
out center body;
`.trim();
}

function classifyType(tags: Record<string, string>): { type: POIType; subType: string } {
  if (tags.tourism) return { type: 'tourism', subType: tags.tourism };
  if (tags.historic) return { type: 'historic', subType: tags.historic };
  if (tags.amenity === 'place_of_worship') return { type: 'worship', subType: tags.religion || 'shrine' };
  if (tags.natural) return { type: 'natural', subType: tags.natural };
  if (tags.leisure) return { type: 'leisure', subType: tags.leisure };
  return { type: 'other', subType: 'unknown' };
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

// Hardcoded POIs for Tokyo Tower demo route area
const DEMO_POIS: POI[] = [
  { id: 'demo-1', name: '東京タワー', type: 'tourism', subType: 'attraction', latitude: 35.6586, longitude: 139.7454 },
  { id: 'demo-2', name: '増上寺', type: 'worship', subType: 'temple', latitude: 35.6578, longitude: 139.7517 },
  { id: 'demo-3', name: '芝公園', type: 'leisure', subType: 'park', latitude: 35.6553, longitude: 139.7494 },
  { id: 'demo-4', name: '芝東照宮', type: 'worship', subType: 'shrine', latitude: 35.6563, longitude: 139.7498 },
  { id: 'demo-5', name: '赤羽橋', type: 'historic', subType: 'monument', latitude: 35.6545, longitude: 139.7442 },
  { id: 'demo-6', name: '東京プリンスホテル', type: 'tourism', subType: 'hotel', latitude: 35.6567, longitude: 139.7487 },
  { id: 'demo-7', name: '旧台徳院霊廟惣門', type: 'historic', subType: 'memorial', latitude: 35.6569, longitude: 139.7509 },
  { id: 'demo-8', name: '六本木ヒルズ', type: 'tourism', subType: 'attraction', latitude: 35.6605, longitude: 139.7292 },
  { id: 'demo-9', name: '麻布十番商店街', type: 'tourism', subType: 'attraction', latitude: 35.6546, longitude: 139.7369 },
  { id: 'demo-10', name: '愛宕神社', type: 'worship', subType: 'shrine', latitude: 35.6612, longitude: 139.7494 },
  { id: 'demo-11', name: '日比谷神社', type: 'worship', subType: 'shrine', latitude: 35.6603, longitude: 139.7558 },
  { id: 'demo-12', name: '浜離宮恩賜庭園', type: 'leisure', subType: 'garden', latitude: 35.6594, longitude: 139.7636 },
  { id: 'demo-13', name: '芝丸山古墳', type: 'historic', subType: 'archaeological_site', latitude: 35.6558, longitude: 139.7490 },
  { id: 'demo-14', name: 'けやき坂通り', type: 'tourism', subType: 'attraction', latitude: 35.6598, longitude: 139.7300 },
  { id: 'demo-15', name: '三田春日神社', type: 'worship', subType: 'shrine', latitude: 35.6508, longitude: 139.7446 },
];

async function fetchFromEndpoint(
  endpoint: string,
  query: string,
  signal?: AbortSignal
): Promise<Response> {
  return fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
    signal,
  });
}

export async function fetchPOIs(
  lat: number,
  lon: number,
  radius: number
): Promise<POI[]> {
  const query = buildQuery(lat, lon, radius);

  // Try each endpoint with failover
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetchFromEndpoint(endpoint, query, controller.signal);
      clearTimeout(timeoutId);

      if (!response.ok) continue; // Try next endpoint

      const data = await response.json();
      const elements: OverpassElement[] = data.elements || [];

      const pois: POI[] = [];
      const seen = new Set<string>();

      for (const el of elements) {
        const tags = el.tags || {};
        const name = tags.name || tags['name:ja'] || tags['name:en'];
        if (!name) continue;

        const elLat = el.lat ?? el.center?.lat;
        const elLon = el.lon ?? el.center?.lon;
        if (elLat == null || elLon == null) continue;

        const key = `${name}-${elLat.toFixed(4)}-${elLon.toFixed(4)}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const { type, subType } = classifyType(tags);

        pois.push({
          id: `${el.type}-${el.id}`,
          name,
          type,
          subType,
          latitude: elLat,
          longitude: elLon,
        });
      }

      return pois;
    } catch {
      // Try next endpoint
      continue;
    }
  }

  // All endpoints failed - use demo POIs if in Tokyo area
  console.warn('All Overpass endpoints failed, using demo POIs');
  return getDemoPOIs(lat, lon, radius);
}

function getDemoPOIs(lat: number, lon: number, radius: number): POI[] {
  // Filter demo POIs within the search radius
  return DEMO_POIS.filter((poi) => {
    const R = 6371000;
    const dLat = ((poi.latitude - lat) * Math.PI) / 180;
    const dLon = ((poi.longitude - lon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat * Math.PI) / 180) *
        Math.cos((poi.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return dist <= radius;
  });
}

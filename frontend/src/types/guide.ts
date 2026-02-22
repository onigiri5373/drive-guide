import type { RelativeDirection } from './geo';

export interface NarrationEntry {
  id: string;
  poiId: string;
  poiName: string;
  narration: string;
  direction: RelativeDirection;
  distance: number;
  timestamp: number;
}

export interface NarrationRequest {
  poiName: string;
  poiType: string;
  poiSubType: string;
  distance: number;
  direction: RelativeDirection;
  speed: number | null;
  latitude: number;
  longitude: number;
}

export interface NarrationResponse {
  narration: string;
}

export interface NarrateRequest {
  poiName: string;
  poiType: string;
  poiSubType: string;
  distance: number;
  direction: 'left' | 'right' | 'ahead' | 'behind';
  speed: number | null;
  latitude: number;
  longitude: number;
}

export interface NarrateResponse {
  narration: string;
}

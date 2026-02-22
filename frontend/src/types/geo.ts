export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  heading: number | null;
  speed: number | null;
  accuracy: number;
  timestamp: number;
}

export type RelativeDirection = 'left' | 'right' | 'ahead' | 'behind';

export type POIType =
  | 'tourism'
  | 'historic'
  | 'worship'
  | 'natural'
  | 'leisure'
  | 'other';

export interface POI {
  id: string;
  name: string;
  type: POIType;
  subType: string;
  latitude: number;
  longitude: number;
  distance?: number;
  direction?: RelativeDirection;
}

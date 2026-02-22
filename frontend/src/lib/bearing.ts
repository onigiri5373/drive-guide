import type { LatLng, RelativeDirection } from '../types/geo';

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

export function calculateBearing(from: LatLng, to: LatLng): number {
  const lat1 = from.latitude * DEG_TO_RAD;
  const lat2 = to.latitude * DEG_TO_RAD;
  const dLon = (to.longitude - from.longitude) * DEG_TO_RAD;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const bearing = Math.atan2(y, x) * RAD_TO_DEG;

  return (bearing + 360) % 360;
}

export function getRelativeDirection(
  userHeading: number,
  bearingToPOI: number
): RelativeDirection {
  let relative = (bearingToPOI - userHeading + 360) % 360;

  if (relative <= 30 || relative >= 330) return 'ahead';
  if (relative > 30 && relative < 150) return 'right';
  if (relative >= 210 && relative < 330) return 'left';
  return 'behind';
}

// Smooth heading using exponential moving average
export function smoothHeading(
  previousHeadings: number[],
  newHeading: number
): number {
  if (previousHeadings.length === 0) return newHeading;

  // Convert to radians and use circular mean
  let sinSum = 0;
  let cosSum = 0;
  const all = [...previousHeadings.slice(-4), newHeading];

  for (const h of all) {
    sinSum += Math.sin(h * DEG_TO_RAD);
    cosSum += Math.cos(h * DEG_TO_RAD);
  }

  const avgRad = Math.atan2(sinSum / all.length, cosSum / all.length);
  return (avgRad * RAD_TO_DEG + 360) % 360;
}

// Compute heading from two consecutive positions
// Requires pre-computed distance to avoid circular dependency
export function computeHeadingFromPositions(
  prev: LatLng,
  curr: LatLng,
  distance: number
): number | null {
  if (distance < 5) return null;
  return calculateBearing(prev, curr);
}

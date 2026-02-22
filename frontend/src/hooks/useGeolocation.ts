import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { calculateBearing } from '../lib/bearing';
import { haversineDistance } from '../lib/geoUtils';
import { startMockGeolocation, stopMockGeolocation } from '../lib/mockGeo';
import type { LatLng } from '../types/geo';
import { GPS_ACCURACY_THRESHOLD } from '../constants';

export function useGeolocation() {
  const setLocation = useAppStore((s) => s.setLocation);
  const setLocationError = useAppStore((s) => s.setLocationError);
  const prevPosition = useRef<LatLng | null>(null);
  const headingHistory = useRef<number[]>([]);

  const processPosition = useCallback(
    (position: GeolocationPosition) => {
      const { latitude, longitude, heading, speed, accuracy } = position.coords;

      if (accuracy > GPS_ACCURACY_THRESHOLD) return;

      let computedHeading = heading;

      if (computedHeading == null && prevPosition.current) {
        const dist = haversineDistance(prevPosition.current, { latitude, longitude });
        if (dist >= 5) {
          computedHeading = calculateBearing(prevPosition.current, { latitude, longitude });
        }
      }

      if (computedHeading != null) {
        headingHistory.current.push(computedHeading);
        if (headingHistory.current.length > 5) {
          headingHistory.current = headingHistory.current.slice(-5);
        }
        let sinSum = 0, cosSum = 0;
        for (const h of headingHistory.current) {
          sinSum += Math.sin((h * Math.PI) / 180);
          cosSum += Math.cos((h * Math.PI) / 180);
        }
        computedHeading =
          ((Math.atan2(sinSum, cosSum) * 180) / Math.PI + 360) % 360;
      }

      prevPosition.current = { latitude, longitude };

      setLocation({
        latitude,
        longitude,
        heading: computedHeading,
        speed: speed,
        accuracy,
        timestamp: position.timestamp,
      });
    },
    [setLocation]
  );

  // Start real GPS tracking
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      processPosition,
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('位置情報の許可が必要です。デモモードをお試しください。');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('GPS信号が取得できません。デモモードをお試しください。');
            break;
          case error.TIMEOUT:
            setLocationError('GPS信号の取得がタイムアウトしました。デモモードをお試しください。');
            break;
          default:
            setLocationError('位置情報の取得に失敗しました。');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [setLocationError, processPosition]);

  // Start mock GPS (demo mode)
  const startDemo = useCallback(() => {
    setLocationError(null);
    startMockGeolocation(processPosition);
  }, [processPosition, setLocationError]);

  const stopDemo = useCallback(() => {
    stopMockGeolocation();
  }, []);

  return { startDemo, stopDemo };
}

import { useGeolocation } from './hooks/useGeolocation';
import { usePOI } from './hooks/usePOI';
import { useGuide } from './hooks/useGuide';
import { useAppStore } from './store/useAppStore';
import { StatusBar } from './components/StatusBar';
import { MapView } from './components/MapView';
import { GuidePanel } from './components/GuidePanel';
import { LoadingOverlay } from './components/LoadingOverlay';
import { SettingsDrawer } from './components/SettingsDrawer';
import { useEffect } from 'react';

function App() {
  const { startDemo } = useGeolocation();
  usePOI();
  const { narratePOI } = useGuide();

  const location = useAppStore((s) => s.location);
  const locationError = useAppStore((s) => s.locationError);

  // Request Wake Lock to prevent screen from sleeping
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch {
        // Wake Lock not supported or denied
      }
    };

    requestWakeLock();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      wakeLock?.release();
    };
  }, []);

  // Show loading/error overlay until GPS fix
  if (!location) {
    return <LoadingOverlay error={locationError} onStartDemo={startDemo} />;
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <StatusBar />
      <MapView />
      <GuidePanel onNarrate={narratePOI} />
      <SettingsDrawer />
    </div>
  );
}

export default App;

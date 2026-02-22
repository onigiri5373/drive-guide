import { useAppStore } from '../store/useAppStore';

export function StatusBar() {
  const location = useAppStore((s) => s.location);
  const poisLoading = useAppStore((s) => s.poisLoading);
  const isNarrating = useAppStore((s) => s.isNarrating);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);

  const accuracy = location?.accuracy ?? 0;
  const speed = location?.speed ?? 0;
  const heading = location?.heading ?? null;

  const gpsQuality =
    accuracy < 20 ? 'good' : accuracy < 50 ? 'fair' : 'poor';
  const gpsColor = {
    good: 'text-green-400',
    fair: 'text-yellow-400',
    poor: 'text-red-400',
  }[gpsQuality];

  const speedKmh = speed != null ? Math.round(speed * 3.6) : 0;

  const headingLabel = heading != null ? `${Math.round(heading)}°` : '--';

  return (
    <div className="flex items-center justify-between bg-gray-900 text-white px-3 py-2 text-xs safe-top">
      <div className="flex items-center gap-3">
        {/* GPS status */}
        <span className={`flex items-center gap-1 ${gpsColor}`}>
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
              clipRule="evenodd"
            />
          </svg>
          {Math.round(accuracy)}m
        </span>

        {/* Speed */}
        <span className="text-gray-300">{speedKmh} km/h</span>

        {/* Heading */}
        <span className="text-gray-300">🧭 {headingLabel}</span>
      </div>

      <div className="flex items-center gap-2">
        {poisLoading && (
          <span className="text-sky-400 animate-pulse">POI検索中...</span>
        )}
        {isNarrating && (
          <span className="text-amber-400 animate-pulse">案内生成中...</span>
        )}

        {/* Settings button */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="p-1 rounded hover:bg-gray-700 transition"
          aria-label="設定"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

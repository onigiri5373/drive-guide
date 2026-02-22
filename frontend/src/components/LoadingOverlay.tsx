interface Props {
  error?: string | null;
  onStartDemo: () => void;
}

export function LoadingOverlay({ error, onStartDemo }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-sky-600 to-sky-800 text-white">
      <div className="mb-6 text-6xl">🚗</div>
      <h1 className="text-2xl font-bold mb-1">Drive Guide</h1>
      <p className="text-sm opacity-70 mb-8">ドライブ中の観光ガイドアプリ</p>

      {error ? (
        <>
          <p className="text-base font-medium mb-2">⚠️ {error}</p>
          <div className="flex flex-col gap-3 mt-4">
            <button
              onClick={onStartDemo}
              className="rounded-full bg-white text-sky-700 px-8 py-3 text-sm font-bold shadow-lg hover:bg-sky-50 transition"
            >
              🗺️ デモモードで体験する
            </button>
            <p className="text-xs opacity-60 text-center max-w-xs">
              東京タワー周辺のドライブを模擬体験できます
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-full bg-white/20 px-6 py-2 text-sm font-medium backdrop-blur hover:bg-white/30 transition"
            >
              🔄 GPS再取得
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-base mb-2">GPS信号を取得中...</p>
          <p className="text-sm opacity-70 mb-6">位置情報の許可をお願いします</p>
          <div className="flex gap-1 mb-8">
            <div className="h-2 w-2 rounded-full bg-white animate-bounce [animation-delay:0ms]" />
            <div className="h-2 w-2 rounded-full bg-white animate-bounce [animation-delay:150ms]" />
            <div className="h-2 w-2 rounded-full bg-white animate-bounce [animation-delay:300ms]" />
          </div>
          <div className="border-t border-white/20 pt-4">
            <button
              onClick={onStartDemo}
              className="rounded-full bg-white/20 px-6 py-2 text-sm font-medium backdrop-blur hover:bg-white/30 transition"
            >
              🗺️ GPSなしでデモ体験
            </button>
          </div>
        </>
      )}
    </div>
  );
}

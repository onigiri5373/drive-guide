import { useAppStore } from '../store/useAppStore';
import { useSpeech } from '../hooks/useSpeech';

export function SettingsDrawer() {
  const settingsOpen = useAppStore((s) => s.settingsOpen);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const resetNarrated = useAppStore((s) => s.resetNarrated);
  const { voices } = useSpeech();

  if (!settingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => setSettingsOpen(false)}
      />

      {/* Drawer */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl max-h-[80vh] overflow-y-auto animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center py-2">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        <div className="px-6 pb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">設定</h2>

          {/* TTS toggle */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">音声読み上げ</p>
              <p className="text-xs text-gray-500">ガイド文を音声で読み上げます</p>
            </div>
            <button
              onClick={() => updateSettings({ ttsEnabled: !settings.ttsEnabled })}
              className={`relative w-12 h-7 rounded-full transition ${
                settings.ttsEnabled ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                  settings.ttsEnabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Auto-narrate toggle */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-900">自動案内</p>
              <p className="text-xs text-gray-500">スポットに近づくと自動でガイドします</p>
            </div>
            <button
              onClick={() => updateSettings({ autoNarrate: !settings.autoNarrate })}
              className={`relative w-12 h-7 rounded-full transition ${
                settings.autoNarrate ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                  settings.autoNarrate ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Search radius */}
          <div className="py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900 mb-2">検索半径</p>
            <div className="flex gap-2">
              {[500, 1000, 2000].map((r) => (
                <button
                  key={r}
                  onClick={() => updateSettings({ searchRadiusMeters: r })}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                    settings.searchRadiusMeters === r
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {r >= 1000 ? `${r / 1000}km` : `${r}m`}
                </button>
              ))}
            </div>
          </div>

          {/* Speech rate */}
          {settings.ttsEnabled && (
            <div className="py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900 mb-2">
                読み上げ速度: {settings.speechRate.toFixed(1)}x
              </p>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={settings.speechRate}
                onChange={(e) => updateSettings({ speechRate: parseFloat(e.target.value) })}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>ゆっくり</span>
                <span>ふつう</span>
                <span>はやい</span>
              </div>
            </div>
          )}

          {/* Voice selection */}
          {settings.ttsEnabled && voices.length > 0 && (
            <div className="py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900 mb-2">音声</p>
              <select
                value={settings.voiceURI || ''}
                onChange={(e) => updateSettings({ voiceURI: e.target.value || null })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">自動選択</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reset narrated */}
          <div className="py-3">
            <button
              onClick={() => {
                resetNarrated();
                setSettingsOpen(false);
              }}
              className="w-full rounded-lg bg-gray-100 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
            >
              案内履歴をリセット
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={() => setSettingsOpen(false)}
            className="w-full rounded-lg bg-blue-500 py-3 text-sm font-bold text-white hover:bg-blue-600 transition"
          >
            閉じる
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

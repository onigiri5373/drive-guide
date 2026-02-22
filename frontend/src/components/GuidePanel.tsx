import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useSpeech } from '../hooks/useSpeech';
import { DirectionBadge } from './DirectionBadge';
import { POIList } from './POIList';
import { formatDistance } from '../lib/geoUtils';
import type { POI } from '../types/geo';

interface Props {
  onNarrate: (poi: POI) => void;
}

export function GuidePanel({ onNarrate }: Props) {
  const [tab, setTab] = useState<'guide' | 'spots'>('guide');
  const currentNarration = useAppStore((s) => s.currentNarration);
  const narrationHistory = useAppStore((s) => s.narrationHistory);
  const isNarrating = useAppStore((s) => s.isNarrating);
  const ttsEnabled = useAppStore((s) => s.settings.ttsEnabled);
  const updateSettings = useAppStore((s) => s.updateSettings);

  const { speak, stop, isSpeaking } = useSpeech();

  // Auto-speak new narrations
  useEffect(() => {
    if (currentNarration && ttsEnabled) {
      speak(currentNarration.narration);
    }
  }, [currentNarration, ttsEnabled, speak]);

  // Switch to guide tab when new narration arrives
  useEffect(() => {
    if (currentNarration) setTab('guide');
  }, [currentNarration]);

  return (
    <div className="bg-white border-t border-gray-200 flex flex-col" style={{ height: '40%', minHeight: '200px' }}>
      {/* Tab header */}
      <div className="flex items-center bg-gray-50 border-b border-gray-100">
        <button
          onClick={() => setTab('guide')}
          className={`flex-1 py-2 text-sm font-bold text-center transition border-b-2 ${
            tab === 'guide'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-400 border-transparent hover:text-gray-600'
          }`}
        >
          🎙️ ガイド
          {isNarrating && (
            <span className="ml-1 text-xs text-amber-600 animate-pulse">生成中...</span>
          )}
        </button>
        <button
          onClick={() => setTab('spots')}
          className={`flex-1 py-2 text-sm font-bold text-center transition border-b-2 ${
            tab === 'spots'
              ? 'text-blue-600 border-blue-600'
              : 'text-gray-400 border-transparent hover:text-gray-600'
          }`}
        >
          📍 スポット一覧
        </button>

        {/* TTS toggle */}
        <button
          onClick={() => {
            if (isSpeaking) stop();
            updateSettings({ ttsEnabled: !ttsEnabled });
          }}
          className={`mx-2 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
            ttsEnabled
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {ttsEnabled ? '🔊' : '🔇'}
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'guide' ? (
          <div className="px-4 py-3">
            {currentNarration ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DirectionBadge direction={currentNarration.direction} />
                  <span className="font-bold text-gray-900">{currentNarration.poiName}</span>
                  <span className="text-xs text-gray-400">
                    {formatDistance(currentNarration.distance)}
                  </span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {currentNarration.narration}
                </p>

                {!isSpeaking && (
                  <button
                    onClick={() => speak(currentNarration.narration)}
                    className="text-xs text-blue-600 hover:text-blue-800 transition"
                  >
                    🔊 もう一度読み上げる
                  </button>
                )}
                {isSpeaking && (
                  <button
                    onClick={stop}
                    className="text-xs text-red-600 hover:text-red-800 transition"
                  >
                    ⏹ 読み上げ停止
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm py-8">
                <p className="text-2xl mb-2">🚗</p>
                <p>ドライブを始めると、</p>
                <p>周辺の観光スポットを案内します</p>
              </div>
            )}

            {narrationHistory.length > 1 && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-2">案内履歴</p>
                {narrationHistory.slice(1, 5).map((entry) => (
                  <div
                    key={entry.id}
                    className="mb-2 rounded-lg bg-gray-50 p-2 text-xs text-gray-600"
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <DirectionBadge direction={entry.direction} size="sm" />
                      <span className="font-medium">{entry.poiName}</span>
                    </div>
                    <p className="line-clamp-2">{entry.narration}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <POIList onNarrate={onNarrate} />
        )}
      </div>
    </div>
  );
}

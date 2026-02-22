import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';

export function useSpeech() {
  const settings = useAppStore((s) => s.settings);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const allVoices = speechSynthesis.getVoices();
      const jaVoices = allVoices.filter((v) => v.lang.startsWith('ja'));
      setVoices(jaVoices.length > 0 ? jaVoices : allVoices);
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);
    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (!settings.ttsEnabled) return;

      // Cancel any ongoing speech
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = settings.speechRate;

      // Select voice
      if (settings.voiceURI) {
        const selected = voices.find((v) => v.voiceURI === settings.voiceURI);
        if (selected) utterance.voice = selected;
      } else {
        // Prefer Japanese voice
        const jaVoice = voices.find((v) => v.lang.startsWith('ja'));
        if (jaVoice) utterance.voice = jaVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
    },
    [settings.ttsEnabled, settings.speechRate, settings.voiceURI, voices]
  );

  const stop = useCallback(() => {
    speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking, voices };
}

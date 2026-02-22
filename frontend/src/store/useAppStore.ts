import { create } from 'zustand';
import type { LocationData, POI } from '../types/geo';
import type { NarrationEntry } from '../types/guide';
import { DEFAULT_SEARCH_RADIUS, DEFAULT_SPEECH_RATE } from '../constants';

interface AppSettings {
  ttsEnabled: boolean;
  autoNarrate: boolean;
  searchRadiusMeters: number;
  speechRate: number;
  voiceURI: string | null;
}

interface AppState {
  // Location
  location: LocationData | null;
  locationError: string | null;

  // POIs
  pois: POI[];
  poisLoading: boolean;

  // Guide
  currentNarration: NarrationEntry | null;
  narrationHistory: NarrationEntry[];
  narratedPOIIds: Map<string, number>; // poiId -> timestamp
  isNarrating: boolean;
  lastNarrationTime: number;

  // Settings
  settings: AppSettings;
  settingsOpen: boolean;

  // Actions
  setLocation: (loc: LocationData) => void;
  setLocationError: (err: string | null) => void;
  setPOIs: (pois: POI[]) => void;
  setPOIsLoading: (loading: boolean) => void;
  setNarration: (entry: NarrationEntry) => void;
  setIsNarrating: (narrating: boolean) => void;
  markPOINarrated: (poiId: string) => void;
  isPoiNarrated: (poiId: string) => boolean;
  cleanExpiredNarrated: () => void;
  updateSettings: (partial: Partial<AppSettings>) => void;
  setSettingsOpen: (open: boolean) => void;
  resetNarrated: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  location: null,
  locationError: null,
  pois: [],
  poisLoading: false,
  currentNarration: null,
  narrationHistory: [],
  narratedPOIIds: new Map(),
  isNarrating: false,
  lastNarrationTime: 0,
  settings: {
    ttsEnabled: true,
    autoNarrate: true,
    searchRadiusMeters: DEFAULT_SEARCH_RADIUS,
    speechRate: DEFAULT_SPEECH_RATE,
    voiceURI: null,
  },
  settingsOpen: false,

  setLocation: (loc) => set({ location: loc, locationError: null }),
  setLocationError: (err) => set({ locationError: err }),
  setPOIs: (pois) => set({ pois }),
  setPOIsLoading: (loading) => set({ poisLoading: loading }),
  setNarration: (entry) =>
    set((state) => ({
      currentNarration: entry,
      narrationHistory: [entry, ...state.narrationHistory].slice(0, 20),
      lastNarrationTime: Date.now(),
    })),
  setIsNarrating: (narrating) => set({ isNarrating: narrating }),
  markPOINarrated: (poiId) =>
    set((state) => {
      const next = new Map(state.narratedPOIIds);
      next.set(poiId, Date.now());
      return { narratedPOIIds: next };
    }),
  isPoiNarrated: (poiId) => {
    const ts = get().narratedPOIIds.get(poiId);
    if (!ts) return false;
    return Date.now() - ts < 5 * 60_000;
  },
  cleanExpiredNarrated: () =>
    set((state) => {
      const now = Date.now();
      const next = new Map<string, number>();
      for (const [id, ts] of state.narratedPOIIds) {
        if (now - ts < 5 * 60_000) next.set(id, ts);
      }
      return { narratedPOIIds: next };
    }),
  updateSettings: (partial) =>
    set((state) => ({ settings: { ...state.settings, ...partial } })),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  resetNarrated: () => set({ narratedPOIIds: new Map() }),
}));

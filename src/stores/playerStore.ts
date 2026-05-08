// =============================================
// Player Store — Estado do player de mídia
// =============================================
import { create } from 'zustand';
import type { LocalMediaItem } from '../types';

interface PlayerState {
  // Estado de reprodução
  playlist: LocalMediaItem[];
  currentIndex: number;
  currentItem: LocalMediaItem | null;
  isPlaying: boolean;

  // Sync status
  isSyncing: boolean;
  syncProgress: number; // 0-100
  lastSyncAt: string | null;

  // Ações
  setPlaylist: (items: LocalMediaItem[]) => void;
  playNext: () => void;
  playPrevious: () => void;
  setCurrentIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setSyncStatus: (syncing: boolean, progress?: number) => void;
  setLastSyncAt: (timestamp: string) => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  playlist: [],
  currentIndex: 0,
  currentItem: null,
  isPlaying: false,
  isSyncing: false,
  syncProgress: 0,
  lastSyncAt: null,

  setPlaylist: (items: LocalMediaItem[]) => {
    set({
      playlist: items,
      currentIndex: 0,
      currentItem: items.length > 0 ? items[0] : null,
      isPlaying: items.length > 0,
    });
  },

  playNext: () => {
    const { playlist, currentIndex } = get();
    if (playlist.length === 0) return;

    const nextIndex = (currentIndex + 1) % playlist.length; // Loop infinito
    set({
      currentIndex: nextIndex,
      currentItem: playlist[nextIndex],
    });
  },

  playPrevious: () => {
    const { playlist, currentIndex } = get();
    if (playlist.length === 0) return;

    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    set({
      currentIndex: prevIndex,
      currentItem: playlist[prevIndex],
    });
  },

  setCurrentIndex: (index: number) => {
    const { playlist } = get();
    if (index >= 0 && index < playlist.length) {
      set({
        currentIndex: index,
        currentItem: playlist[index],
      });
    }
  },

  setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),

  setSyncStatus: (syncing: boolean, progress?: number) => {
    set({
      isSyncing: syncing,
      syncProgress: progress ?? (syncing ? 0 : 100),
    });
  },

  setLastSyncAt: (timestamp: string) => set({ lastSyncAt: timestamp }),

  reset: () => {
    set({
      playlist: [],
      currentIndex: 0,
      currentItem: null,
      isPlaying: false,
      isSyncing: false,
      syncProgress: 0,
    });
  },
}));

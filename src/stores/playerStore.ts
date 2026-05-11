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
    const { playlist, currentIndex } = get();
    
    // Verificar se a playlist mudou de verdade antes de resetar o index
    const idsString = items.map(i => i.id).join(',');
    const currentIdsString = playlist.map(i => i.id).join(',');
    
    if (idsString === currentIdsString) {
      // Mesma playlist, apenas atualiza os dados dos itens (ex: progress)
      set({ playlist: items });
      return;
    }

    // Playlist nova ou mudou a ordem, reseta para o início
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

    const nextIndex = (currentIndex + 1) % playlist.length;
    set({
      currentIndex: nextIndex,
      currentItem: playlist[nextIndex],
      isPlaying: true,
    });
  },

  playPrevious: () => {
    const { playlist, currentIndex } = get();
    if (playlist.length === 0) return;

    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    set({
      currentIndex: prevIndex,
      currentItem: playlist[prevIndex],
      isPlaying: true,
    });
  },

  setCurrentIndex: (index: number) => {
    const { playlist } = get();
    if (index >= 0 && index < playlist.length) {
      set({
        currentIndex: index,
        currentItem: playlist[index],
        isPlaying: true,
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

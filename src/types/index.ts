// =============================================
// Tipos centrais da aplicação Mídia Indoor Player
// =============================================

// --- Entidades do Banco ---

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface User {
  id: string;
  org_id: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
  name?: string;
  created_at: string;
}

export interface Terminal {
  id: string;
  org_id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'syncing';
  is_active: boolean;
  device_info?: Record<string, unknown>;
  last_sync_at: string | null;
  created_at: string;
}

export interface MediaFile {
  id: string;
  org_id: string;
  name: string;
  file_path: string;
  file_type: 'video/mp4' | 'image/jpeg' | 'image/png' | 'image/webp';
  file_size: number;
  duration_seconds: number | null; // null para imagens
  checksum: string;
  version: number;
  created_at: string;
}

export interface Playlist {
  id: string;
  terminal_id: string;
  name: string;
  is_active: boolean;
  version: number;
  updated_at: string;
  created_at: string;
}

export interface PlaylistItem {
  id: string;
  playlist_id: string;
  media_id: string;
  order: number;
  duration_override: number | null; // para imagens (em segundos)
  created_at: string;
  // Joins
  media?: MediaFile;
}

export interface TerminalLog {
  id: string;
  terminal_id: string;
  event_type: 'sync' | 'playback_start' | 'playback_end' | 'error' | 'heartbeat';
  metadata?: Record<string, unknown>;
  created_at: string;
}

// --- Tipos Locais (Cache / Manifesto) ---

export type MediaDownloadStatus = 'pending' | 'downloading' | 'ready' | 'error';

export interface LocalMediaItem {
  id: string;
  remoteUrl: string;
  localPath: string;
  checksum: string;
  fileSize: number;
  fileType: string;
  order: number;
  durationSeconds: number | null;
  durationOverride: number | null;
  status: MediaDownloadStatus;
  downloadProgress: number;
}

export interface LocalManifest {
  terminalId: string;
  playlistId: string;
  playlistVersion: number;
  lastSyncAt: string;
  items: LocalMediaItem[];
}

// --- Tipos de Navegação ---

export type PlayerMode = 'video' | 'image';

export interface PlayerState {
  isPlaying: boolean;
  currentIndex: number;
  currentItem: LocalMediaItem | null;
  playlist: LocalMediaItem[];
  mode: PlayerMode;
}

// --- Sync ---

export interface SyncResult {
  success: boolean;
  newItems: number;
  removedItems: number;
  updatedItems: number;
  errors: string[];
}

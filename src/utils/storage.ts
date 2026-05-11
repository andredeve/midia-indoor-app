// =============================================
// Helpers de Storage (AsyncStorage para Expo Go)
// =============================================
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LocalManifest } from '../types';

// ---- Chaves de Storage ----
const KEYS = {
  MANIFEST: (terminalId: string) => `manifest:${terminalId}`,
  SELECTED_TERMINAL: 'selected_terminal_id',
  LAST_SYNC: 'last_sync_timestamp',
  DEVICE_ID: 'device_id',
} as const;

// ---- Manifesto Local ----

export async function getLocalManifest(terminalId: string): Promise<LocalManifest | null> {
  try {
    const data = await AsyncStorage.getItem(KEYS.MANIFEST(terminalId));
    if (!data) return null;
    return JSON.parse(data) as LocalManifest;
  } catch {
    return null;
  }
}

export async function setLocalManifest(terminalId: string, manifest: LocalManifest): Promise<void> {
  if (!terminalId || !manifest) return;
  await AsyncStorage.setItem(KEYS.MANIFEST(terminalId), JSON.stringify(manifest));
}

export async function deleteLocalManifest(terminalId: string): Promise<void> {
  if (!terminalId) return;
  await AsyncStorage.removeItem(KEYS.MANIFEST(terminalId));
}

// ---- Terminal Selecionado ----

export async function getSelectedTerminalId(): Promise<string | null> {
  return await AsyncStorage.getItem(KEYS.SELECTED_TERMINAL);
}

export async function setSelectedTerminalId(terminalId: string): Promise<void> {
  if (!terminalId) {
    await AsyncStorage.removeItem(KEYS.SELECTED_TERMINAL);
    return;
  }
  await AsyncStorage.setItem(KEYS.SELECTED_TERMINAL, terminalId);
}

// ---- Device ID ----

export async function getDeviceId(): Promise<string | null> {
  return await AsyncStorage.getItem(KEYS.DEVICE_ID);
}

export async function setDeviceId(id: string): Promise<void> {
  if (!id) return;
  await AsyncStorage.setItem(KEYS.DEVICE_ID, id);
}

// ---- Último Sync ----

export async function getLastSyncTimestamp(): Promise<number> {
  try {
    const data = await AsyncStorage.getItem(KEYS.LAST_SYNC);
    return data ? parseInt(data, 10) : 0;
  } catch {
    return 0;
  }
}

export async function setLastSyncTimestamp(timestamp: number): Promise<void> {
  const val = (timestamp || 0).toString();
  await AsyncStorage.setItem(KEYS.LAST_SYNC, val);
}

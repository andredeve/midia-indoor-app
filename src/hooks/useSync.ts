// =============================================
// Hook useSync — Sincronização de terminal
// =============================================
import { useState, useCallback, useRef, useEffect } from 'react';
import { syncTerminal } from '../services/syncEngine';
import { getReadyItems } from '../services/mediaCache';
import { usePlayerStore } from '../stores/playerStore';
import { useNetworkStatus } from './useNetworkStatus';
import type { SyncResult } from '../types';

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos

interface UseSyncReturn {
  isSyncing: boolean;
  syncMessage: string;
  syncProgress: number;
  lastResult: SyncResult | null;
  triggerSync: () => Promise<void>;
}

export function useSync(terminalId: string | null): UseSyncReturn {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { isConnected } = useNetworkStatus();
  const setPlaylist = usePlayerStore((s) => s.setPlaylist);

  const triggerSync = useCallback(async () => {
    if (!terminalId || isSyncing) return;

    setIsSyncing(true);
    setSyncMessage('Iniciando sincronização...');
    setSyncProgress(0);

    try {
      const result = await syncTerminal(terminalId, (message, progress) => {
        setSyncMessage(message);
        setSyncProgress(progress);
      });

      setLastResult(result);

      // Atualizar playlist do player com itens prontos
      const readyItems = await getReadyItems(terminalId);
      if (readyItems.length > 0) {
        setPlaylist(readyItems);
      }
    } catch (error) {
      console.error('[useSync] Erro:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [terminalId, isSyncing, setPlaylist]);

  // Sync automático periódico
  useEffect(() => {
    if (!terminalId) return;

    // Sync inicial
    triggerSync();

    // Configurar sync periódico
    syncIntervalRef.current = setInterval(() => {
      if (isConnected) {
        triggerSync();
      }
    }, SYNC_INTERVAL_MS);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [terminalId]);

  return {
    isSyncing,
    syncMessage,
    syncProgress,
    lastResult,
    triggerSync,
  };
}

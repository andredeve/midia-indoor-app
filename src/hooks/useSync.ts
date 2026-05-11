// =============================================
// Hook useSync — Sincronização de terminal em tempo real
// =============================================
import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { syncTerminal } from '../services/syncEngine';
import { getReadyItems } from '../services/mediaCache';
import { usePlayerStore } from '../stores/playerStore';
import { useNetworkStatus } from './useNetworkStatus';
import type { SyncResult } from '../types';

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // Backup: check a cada 5 minutos

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
  const isSyncingRef = useRef(false);
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { isConnected } = useNetworkStatus();
  const setPlaylist = usePlayerStore((s) => s.setPlaylist);

  const triggerSync = useCallback(async () => {
    if (!terminalId || isSyncingRef.current) return;

    isSyncingRef.current = true;
    setIsSyncing(true);
    setSyncMessage('Sincronizando...');
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
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [terminalId, setPlaylist]);

  // Sincronização em Tempo Real (Realtime)
  useEffect(() => {
    if (!terminalId || !isConnected) return;

    // Canal para ouvir mudanças na tabela de playlists vinculadas a este terminal
    const channel = supabase
      .channel(`sync-terminal-${terminalId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'playlists',
          filter: `terminal_id=eq.${terminalId}`,
        },
        () => {
          triggerSync();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [terminalId, isConnected]); // triggerSync removido daqui para evitar loops

  // Sync automático periódico (Fallback se o Realtime falhar)
  useEffect(() => {
    if (!terminalId) return;

    // Sync inicial ao carregar
    triggerSync();

    syncIntervalRef.current = setInterval(() => {
      if (isConnected) {
        console.log('[useSync] Executando sync periódico de rotina');
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

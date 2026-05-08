// =============================================
// Player Screen — Reprodução de mídia por terminal
// =============================================
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import VideoPlayer from '../../src/components/VideoPlayer';
import DownloadProgress from '../../src/components/DownloadProgress';
import { useSync } from '../../src/hooks/useSync';
import { usePlayerStore } from '../../src/stores/playerStore';
import { startHeartbeat, stopHeartbeat } from '../../src/services/heartbeat';
import { getReadyItems } from '../../src/services/mediaCache';

export default function PlayerScreen() {
  const { id: terminalId } = useLocalSearchParams<{ id: string }>();
  const { isSyncing, syncMessage, syncProgress } = useSync(terminalId ?? null);
  const { playlist, setPlaylist } = usePlayerStore();

  useEffect(() => {
    if (!terminalId) return;

    // Função assíncrona para carregar cache inicial
    const loadInitialCache = async () => {
      const cachedItems = await getReadyItems(terminalId);
      if (cachedItems.length > 0) {
        setPlaylist(cachedItems);
      }
    };

    loadInitialCache();

    // Iniciar heartbeat
    startHeartbeat(terminalId);

    return () => {
      stopHeartbeat();
    };
  }, [terminalId]);

  const hasContent = playlist.length > 0;
  const isInitialSync = isSyncing && !hasContent;

  return (
    <View style={styles.container}>
      {/* Player de vídeo */}
      {hasContent && <VideoPlayer />}

      {/* Overlay de download durante sync inicial */}
      <DownloadProgress
        message={syncMessage}
        progress={syncProgress}
        isVisible={isInitialSync}
      />

      {/* Tela preta quando sem conteúdo e não sincronizando */}
      {!hasContent && !isSyncing && <View style={styles.blackScreen} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  blackScreen: {
    flex: 1,
    backgroundColor: '#000000',
  },
});

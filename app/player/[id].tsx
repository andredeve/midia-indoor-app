import React, { useEffect } from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { useTerminalStore } from '../../src/stores/terminalStore';
import { useSync } from '../../src/hooks/useSync';
import { useHeartbeat } from '../../src/hooks/useHeartbeat';
import VideoPlayer from '../../src/components/VideoPlayer';
import SyncStatusBarComponent from '../../src/components/SyncStatusBar';
import DownloadProgress from '../../src/components/DownloadProgress';

console.log('[PlayerScreen] Componentes carregados:', { SyncStatusBarComponent, VideoPlayer });

export default function PlayerScreen() {
  const { id } = useLocalSearchParams();
  const terminalId = typeof id === 'string' ? id : null;
  const { selectTerminal } = useTerminalStore();
  
  const { isSyncing, syncMessage, syncProgress } = useSync(terminalId);
  
  // Ativar Heartbeat (log de atividade)
  useHeartbeat(terminalId);

  useEffect(() => {
    if (terminalId) {
      selectTerminal(terminalId);
    }
  }, [terminalId, selectTerminal]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar hidden />
      
      {/* Player Principal */}
      <VideoPlayer />

      {/* Overlay de Sincronização */}
      <SyncStatusBarComponent isSyncing={isSyncing} message={syncMessage} />
      
      {/* Barra de Download (aparece quando está baixando mídias) */}
      {isSyncing && syncProgress > 0 && syncProgress < 100 && (
        <View style={styles.downloadOverlay}>
          <DownloadProgress 
            progress={syncProgress} 
            message={syncMessage} 
            isVisible={true}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  downloadOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    zIndex: 100,
  }
});

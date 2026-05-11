// =============================================
// VideoPlayer — Componente de reprodução de vídeo
// =============================================
import React, { useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, Image, Platform, Text, ActivityIndicator } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { usePlayer } from '../hooks/usePlayer';
import { usePlayerStore } from '../stores/playerStore';
import { useTerminalStore } from '../stores/terminalStore';
import { supabase } from '../services/supabase';

export default function VideoPlayer() {
  const videoRef = useRef<Video>(null);
  const { selectedTerminalId } = useTerminalStore();
  const { playlist } = usePlayerStore();
  const {
    currentItem,
    totalItems,
    isPlaying,
    isVideo,
    isImage,
    onVideoEnd,
    onError,
  } = usePlayer();

  // Log de métricas de reprodução
  useEffect(() => {
    if (currentItem && selectedTerminalId && isPlaying) {
      const logPlayback = async () => {
        try {
          await supabase.from('terminal_logs').insert({
            terminal_id: selectedTerminalId,
            event_type: 'playback_start',
            metadata: {
              media_id: currentItem.id,
              media_name: currentItem.name,
              file_type: currentItem.fileType,
              timestamp: new Date().toISOString()
            }
          });
        } catch (error) {
          console.error('[VideoPlayer] Erro ao logar métrica:', error);
        }
      };
      
      logPlayback();
    }
  }, [currentItem?.id, selectedTerminalId, isPlaying]);

  const handleVideoEnd = useCallback(() => {
    onVideoEnd();
  }, [onVideoEnd]);

  const handleError = useCallback(
    (error: any) => {
      const message = typeof error === 'string' ? error : 'Erro na reprodução';
      
      // Apenas registra o erro no log e pula silenciosamente
      console.log(`[VideoPlayer] Erro detectado (${message}). Pulando para o próximo...`);
      onError(message);
    },
    [onError]
  );

  if (playlist.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#d4ff00" />
        <Text style={styles.loadingText}>Carregando playlist...</Text>
      </View>
    );
  }

  if (!currentItem) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#d4ff00" />
      </View>
    );
  }

  const isWeb = Platform.OS === 'web';
  const sourceUri = isWeb ? currentItem.remoteUrl : currentItem.localPath;

  // Renderizar imagem
  if (isImage) {
    return (
      <View style={styles.container}>
        <Image
          key={currentItem.id}
          source={{ uri: sourceUri }}
          style={styles.media}
          resizeMode="cover"
        />
      </View>
    );
  }

  // Renderizar vídeo
  if (isVideo) {
    return (
      <View style={styles.container}>
        <Video
          ref={videoRef}
          key={currentItem.id}
          source={{ uri: sourceUri }}
          style={styles.media}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isPlaying}
          isLooping={totalItems === 1}
          useNativeControls={false}
          onPlaybackStatusUpdate={(status: any) => {
            if (status.didJustFinish && !status.isLooping) {
              handleVideoEnd();
            }
            if (status.error) {
              handleError(status.error);
            }
          }}
        />
      </View>
    );
  }

  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  media: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
});

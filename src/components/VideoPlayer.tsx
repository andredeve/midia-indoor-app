// =============================================
// VideoPlayer — Componente de reprodução de vídeo
// =============================================
import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, Image, Platform } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { usePlayer } from '../hooks/usePlayer';

export default function VideoPlayer() {
  const videoRef = useRef<any>(null);
  const {
    currentItem,
    isPlaying,
    isVideo,
    isImage,
    onVideoEnd,
    onError,
  } = usePlayer();

  const handleVideoEnd = useCallback(() => {
    onVideoEnd();
  }, [onVideoEnd]);

  const handleError = useCallback(
    (error: any) => {
      const message = typeof error === 'string' ? error : 'Erro na reprodução';
      onError(message);
    },
    [onError]
  );

  if (!currentItem) {
    return <View style={styles.container} />;
  }

  const isWeb = Platform.OS === 'web';
  const sourceUri = isWeb ? currentItem.remoteUrl : currentItem.localPath;

  // Renderizar imagem estática
  if (isImage) {
    return (
      <View style={styles.container}>
        <Image
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
          source={{ uri: sourceUri }}
          style={styles.media}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isPlaying}
          isLooping={false}
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

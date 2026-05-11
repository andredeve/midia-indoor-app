// =============================================
// Hook usePlayer — Controle de reprodução
// =============================================
import { useCallback, useRef, useEffect } from 'react';
import { usePlayerStore } from '../stores/playerStore';
import type { LocalMediaItem } from '../types';

const DEFAULT_IMAGE_DURATION = 10; // segundos para exibir imagens

interface UsePlayerReturn {
  currentItem: LocalMediaItem | null;
  currentIndex: number;
  totalItems: number;
  isPlaying: boolean;
  isVideo: boolean;
  isImage: boolean;
  imageDuration: number;
  onVideoEnd: () => void;
  onImageTimerEnd: () => void;
  onError: (error: string) => void;
}

export function usePlayer(): UsePlayerReturn {
  const {
    currentItem,
    currentIndex,
    playlist,
    isPlaying,
    playNext,
  } = usePlayerStore();

  const imageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProcessingEnd = useRef(false);

  const isVideo = currentItem?.fileType?.startsWith('video/') ?? false;
  const isImage = currentItem?.fileType?.startsWith('image/') ?? false;

  const imageDuration =
    currentItem?.durationOverride ??
    currentItem?.durationSeconds ??
    DEFAULT_IMAGE_DURATION;

  const onVideoEnd = useCallback(() => {
    if (isProcessingEnd.current) return;
    isProcessingEnd.current = true;
    
    console.log(`[Player] >>> Vídeo finalizado. Pulando do index ${currentIndex} para o próximo...`);
    playNext();
    
    // Pequeno delay para evitar múltiplas chamadas no mesmo evento de fim
    setTimeout(() => {
      isProcessingEnd.current = false;
    }, 500);
  }, [currentIndex, playNext]);

  const onImageTimerEnd = useCallback(() => {
    console.log(`[Player] >>> Timer de imagem (${imageDuration}s) expirou. Pulando index ${currentIndex}`);
    playNext();
  }, [currentIndex, playNext, imageDuration]);

  const onError = useCallback(
    (error: string) => {
      console.error(`[Player] !!! Erro no item ${currentIndex}:`, error);
      // Em caso de erro, tenta pular para o próximo para não travar a playlist
      setTimeout(playNext, 1000);
    },
    [currentIndex, playNext]
  );

  // Timer automático para imagens
  useEffect(() => {
    if (imageTimerRef.current) {
      clearTimeout(imageTimerRef.current);
      imageTimerRef.current = null;
    }

    if (isImage && isPlaying && currentItem) {
      imageTimerRef.current = setTimeout(() => {
        onImageTimerEnd();
      }, imageDuration * 1000);
    }

    return () => {
      if (imageTimerRef.current) {
        clearTimeout(imageTimerRef.current);
      }
    };
  }, [isImage, isPlaying, currentItem, imageDuration, onImageTimerEnd]);

  return {
    currentItem,
    currentIndex,
    totalItems: playlist.length,
    isPlaying,
    isVideo,
    isImage,
    imageDuration,
    onVideoEnd,
    onImageTimerEnd,
    onError,
  };
}

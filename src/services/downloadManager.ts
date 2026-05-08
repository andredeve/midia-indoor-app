// =============================================
// Download Manager — Gerenciador de downloads
// =============================================
import { File, Directory, Paths } from 'expo-file-system';
import { ensureMediaDirectory, getLocalMediaPath, updateItemStatus } from './mediaCache';
import type { LocalMediaItem } from '../types';
import { Platform } from 'react-native';

export interface DownloadCallbacks {
  onProgress?: (mediaId: string, progress: number) => void;
  onComplete?: (mediaId: string, localPath: string) => void;
  onError?: (mediaId: string, error: string) => void;
}

const isWeb = Platform.OS === 'web';

// Diretório de mídia
function getMediaDirectory(): Directory {
  if (isWeb) return {} as any;
  return new Directory(Paths.document, 'media');
}

/**
 * Faz download de um arquivo de mídia usando a nova API expo-file-system
 */
export async function downloadMedia(
  terminalId: string,
  item: LocalMediaItem,
  callbacks?: DownloadCallbacks
): Promise<string | null> {
  try {
    if (isWeb) {
      await updateItemStatus(terminalId, item.id, 'ready', 100);
      callbacks?.onComplete?.(item.id, item.remoteUrl);
      callbacks?.onProgress?.(item.id, 100);
      return item.remoteUrl;
    }

    ensureMediaDirectory();

    const extension = item.fileType.split('/')[1] || 'mp4';
    const fileName = `${item.id}.${extension}`;
    const mediaDir = getMediaDirectory();

    // Atualizar status para downloading
    await updateItemStatus(terminalId, item.id, 'downloading', 0);
    callbacks?.onProgress?.(item.id, 0);

    // Usar File.downloadFileAsync para baixar
    const downloadedFile = await File.downloadFileAsync(
      item.remoteUrl,
      mediaDir,
      { idempotent: true }
    );

    if (downloadedFile && downloadedFile.exists) {
      // Renomear para o nome correto (baseado no ID)
      const targetFile = new File(mediaDir, fileName);
      if (!targetFile.exists) {
        downloadedFile.move(targetFile);
      } else {
        // Arquivo já existe com o nome correto — remover o temporário
        if (downloadedFile.uri !== targetFile.uri) {
          downloadedFile.delete();
        }
      }
      const localPath = targetFile.uri;
      await updateItemStatus(terminalId, item.id, 'ready', 100);
      callbacks?.onComplete?.(item.id, localPath);
      callbacks?.onProgress?.(item.id, 100);
      console.log(`[Download] Concluído: ${item.id} -> ${localPath}`);
      return localPath;
    }

    throw new Error('Download retornou sem arquivo');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    await updateItemStatus(terminalId, item.id, 'error', 0);
    callbacks?.onError?.(item.id, errorMessage);
    console.error(`[Download] Erro: ${item.id} - ${errorMessage}`);
    return null;
  }
}

/**
 * Faz download de múltiplos arquivos em sequência
 */
export async function downloadPlaylist(
  terminalId: string,
  items: LocalMediaItem[],
  callbacks?: DownloadCallbacks & {
    onOverallProgress?: (completed: number, total: number) => void;
  }
): Promise<{ success: string[]; failed: string[] }> {
  const success: string[] = [];
  const failed: string[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (item.status === 'ready') {
      success.push(item.id);
      callbacks?.onOverallProgress?.(i + 1, items.length);
      continue;
    }

    const result = await downloadMedia(terminalId, item, callbacks);

    if (result) {
      success.push(item.id);
    } else {
      failed.push(item.id);
    }

    callbacks?.onOverallProgress?.(i + 1, items.length);
  }

  return { success, failed };
}

let activeDownloadsCount = 0;

export function getActiveDownloadsCount(): number {
  return activeDownloadsCount;
}

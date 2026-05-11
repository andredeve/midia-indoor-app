// =============================================
// Media Cache — Gerenciamento de cache local
// =============================================
import { Paths, File, Directory } from 'expo-file-system';
import { getLocalManifest, setLocalManifest, deleteLocalManifest } from '../utils/storage';
import type { LocalManifest, LocalMediaItem } from '../types';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

// Diretório base para armazenamento de mídia
const MEDIA_DIR_NAME = 'media';

/**
 * Retorna o diretório de mídia
 */
function getMediaDirectory(): Directory {
  if (isWeb) return {} as any;
  return new Directory(Paths.document, MEDIA_DIR_NAME);
}

/**
 * Garante que o diretório de mídia existe
 */
export function ensureMediaDirectory(): void {
  if (isWeb) return;
  const mediaDir = getMediaDirectory();
  if (!mediaDir.exists) {
    mediaDir.create();
  }
}

/**
 * Gera o caminho local para um arquivo de mídia baseado no seu ID
 */
export function getLocalMediaPath(mediaId: string, fileType: string): string {
  if (isWeb) return '';
  const extension = fileType.split('/')[1] || 'mp4';
  const file = new File(getMediaDirectory(), `${mediaId}.${extension}`);
  return file.uri;
}

/**
 * Verifica se um arquivo de mídia existe localmente
 */
export function mediaExistsLocally(localPath: string): boolean {
  if (isWeb) return true;
  try {
    const file = new File(localPath);
    return file.exists;
  } catch {
    return false;
  }
}

/**
 * Retorna apenas os itens prontos para reprodução
 */
export async function getReadyItems(terminalId: string): Promise<LocalMediaItem[]> {
  const manifest = await getLocalManifest(terminalId);
  if (!manifest) return [];
  
  return manifest.items
    .filter((item) => {
      // Forçar a inclusão se o arquivo físico existir, mesmo que o status no manifesto esteja bugado
      const exists = mediaExistsLocally(item.localPath);
      
      if (item.status === 'ready' || exists) {
        return true;
      }
      return false;
    })
    .sort((a, b) => a.order - b.order);
}

/**
 * Salva/atualiza o manifesto local de um terminal
 */
export async function saveManifest(terminalId: string, manifest: LocalManifest): Promise<void> {
  await setLocalManifest(terminalId, manifest);
}

/**
 * Outros métodos omitidos para brevidade (permanecem iguais)
 */
export async function getManifest(terminalId: string) { return getLocalManifest(terminalId); }
export async function updateItemStatus(terminalId: string, mediaId: string, status: any, progress?: number) {
  const manifest = await getLocalManifest(terminalId);
  if (!manifest) return;
  const updatedItems = manifest.items.map(item => item.id === mediaId ? { ...item, status, downloadProgress: progress ?? item.downloadProgress } : item);
  await setLocalManifest(terminalId, { ...manifest, items: updatedItems });
}
export function deleteMediaFile(localPath: string) { if (!isWeb) { const f = new File(localPath); if (f.exists) f.delete(); } }
export async function clearTerminalCache(terminalId: string) { const m = await getLocalManifest(terminalId); if (m) { for (const i of m.items) deleteMediaFile(i.localPath); } await deleteLocalManifest(terminalId); }

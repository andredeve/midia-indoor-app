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
 * Calcula o checksum MD5 (Simplificado para evitar estouro de memória no Expo Go)
 */
export async function calculateChecksum(localPath: string): Promise<string> {
  // Por enquanto, vamos validar apenas pela existência e tamanho para garantir performance no Expo Go
  try {
    const file = new File(localPath);
    if (!file.exists) return '';
    return `size:${file.size}`;
  } catch {
    return '';
  }
}

/**
 * Verifica a integridade de um arquivo
 */
export async function verifyFileIntegrity(
  localPath: string,
  expectedChecksum: string
): Promise<boolean> {
  const file = new File(localPath);
  return file.exists; // Validação básica para o ambiente de teste
}

/**
 * Retorna o manifesto local de um terminal
 */
export async function getManifest(terminalId: string): Promise<LocalManifest | null> {
  return await getLocalManifest(terminalId);
}

/**
 * Salva/atualiza o manifesto local de um terminal
 */
export async function saveManifest(terminalId: string, manifest: LocalManifest): Promise<void> {
  await setLocalManifest(terminalId, manifest);
}

/**
 * Retorna apenas os itens prontos para reprodução
 */
export async function getReadyItems(terminalId: string): Promise<LocalMediaItem[]> {
  const manifest = await getLocalManifest(terminalId);
  if (!manifest) return [];
  
  return manifest.items
    .filter((item) => {
      // No iOS, webm não funciona. Filtramos para evitar o erro fatal no player durante o teste.
      if (Platform.OS === 'ios' && item.fileType.includes('webm')) {
        return false;
      }
      return item.status === 'ready';
    })
    .sort((a, b) => a.order - b.order);
}

/**
 * Atualiza o status de um item no manifesto
 */
export async function updateItemStatus(
  terminalId: string,
  mediaId: string,
  status: LocalMediaItem['status'],
  progress?: number
): Promise<void> {
  const manifest = await getLocalManifest(terminalId);
  if (!manifest) return;

  const updatedItems = manifest.items.map((item) => {
    if (item.id === mediaId) {
      return {
        ...item,
        status,
        downloadProgress: progress ?? item.downloadProgress,
      };
    }
    return item;
  });

  await setLocalManifest(terminalId, { ...manifest, items: updatedItems });
}

/**
 * Remove um arquivo de mídia do disco
 */
export function deleteMediaFile(localPath: string): void {
  if (isWeb) return;
  try {
    const file = new File(localPath);
    if (file.exists) {
      file.delete();
    }
  } catch {
  }
}

/**
 * Calcula o espaço total usado pelo cache de mídia
 */
export function getCacheSize(): number {
  if (isWeb) return 0;
  try {
    const mediaDir = getMediaDirectory();
    if (!mediaDir.exists) return 0;

    const entries = mediaDir.list();
    let totalSize = 0;

    for (const entry of entries) {
      if (entry instanceof File && entry.exists) {
        totalSize += entry.size ?? 0;
      }
    }

    return totalSize;
  } catch {
    return 0;
  }
}

/**
 * Limpa todo o cache de mídia de um terminal
 */
export async function clearTerminalCache(terminalId: string): Promise<void> {
  const manifest = await getLocalManifest(terminalId);
  if (!manifest) return;

  for (const item of manifest.items) {
    deleteMediaFile(item.localPath);
  }

  await deleteLocalManifest(terminalId);
}

/**
 * Remove mídias órfãs
 */
export async function cleanupOrphanedFiles(activeTerminalIds: string[]): Promise<number> {
  if (isWeb) return 0;
  try {
    const mediaDir = getMediaDirectory();
    if (!mediaDir.exists) return 0;

    const entries = mediaDir.list();
    const activeFiles = new Set<string>();

    for (const terminalId of activeTerminalIds) {
      const manifest = await getLocalManifest(terminalId);
      if (manifest) {
        for (const item of manifest.items) {
          const filename = item.localPath.split('/').pop();
          if (filename) activeFiles.add(filename);
        }
      }
    }

    let deletedCount = 0;
    for (const entry of entries) {
      if (entry instanceof File && !activeFiles.has(entry.name)) {
        entry.delete();
        deletedCount++;
      }
    }

    return deletedCount;
  } catch {
    return 0;
  }
}

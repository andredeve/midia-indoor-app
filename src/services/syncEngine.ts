// =============================================
// Sync Engine — Motor de sincronização
// =============================================
import { supabase } from './supabase';
import {
  getManifest,
  saveManifest,
  getLocalMediaPath,
  mediaExistsLocally,
  deleteMediaFile,
  ensureMediaDirectory,
} from './mediaCache';
import { downloadPlaylist } from './downloadManager';
import { setLastSyncTimestamp } from '../utils/storage';
import type {
  LocalManifest,
  LocalMediaItem,
  PlaylistItem,
  SyncResult,
} from '../types';

/**
 * Executa a sincronização completa de um terminal
 */
export async function syncTerminal(
  terminalId: string,
  onProgress?: (message: string, progress: number) => void
): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    newItems: 0,
    removedItems: 0,
    updatedItems: 0,
    errors: [],
  };

  try {
    onProgress?.('Verificando playlist...', 5);

    // 1. Buscar playlist ativa do terminal
    const { data: playlists, error: playlistError } = await supabase
      .from('playlists')
      .select('*')
      .eq('terminal_id', terminalId)
      .eq('is_active', true)
      .limit(1)
      .single();

    if (playlistError || !playlists) {
      result.errors.push('Nenhuma playlist ativa encontrada');
      return result;
    }

    const playlist = playlists;
    const localManifest = await getManifest(terminalId);

    // 2. Verificar se precisa sincronizar (comparar versões)
    if (localManifest && localManifest.playlistVersion === playlist.version) {
      // Verificar se todos os arquivos locais ainda existem
      let allFilesExist = true;
      for (const item of localManifest.items) {
        if (item.status === 'ready') {
          const exists = mediaExistsLocally(item.localPath);
          if (!exists) {
            allFilesExist = false;
            break;
          }
        }
      }

      if (allFilesExist) {
        onProgress?.('Tudo sincronizado!', 100);
        result.success = true;
        return result;
      }
    }

    onProgress?.('Buscando mídias...', 15);

    // 3. Buscar itens da playlist com dados de mídia
    const { data: playlistItems, error: itemsError } = await supabase
      .from('playlist_items')
      .select(`
        *,
        media:media_files(*)
      `)
      .eq('playlist_id', playlist.id)
      .order('order', { ascending: true });

    if (itemsError || !playlistItems) {
      result.errors.push('Erro ao buscar itens da playlist');
      return result;
    }

    onProgress?.('Comparando com cache local...', 25);

    // 4. Gerar URLs assinadas e mapear itens
    ensureMediaDirectory();
    const remoteItems: LocalMediaItem[] = [];

    for (const item of playlistItems as (PlaylistItem & { media: any })[]) {
      if (!item.media) continue;

      // Gerar URL assinada para download (válida por 1h)
      const { data: signedUrl } = await supabase.storage
        .from('media')
        .createSignedUrl(item.media.file_path, 3600);

      const localPath = getLocalMediaPath(item.media.id, item.media.file_type);
      const existsLocally = mediaExistsLocally(localPath);

      remoteItems.push({
        id: item.media.id,
        remoteUrl: signedUrl?.signedUrl ?? '',
        localPath,
        checksum: item.media.checksum,
        fileSize: item.media.file_size,
        fileType: item.media.file_type,
        order: item.order,
        durationSeconds: item.media.duration_seconds,
        durationOverride: item.duration_override,
        status: existsLocally ? 'ready' : 'pending',
        downloadProgress: existsLocally ? 100 : 0,
      });
    }

    // 5. Identificar mídias removidas
    if (localManifest) {
      const remoteIds = new Set(remoteItems.map((i) => i.id));
      const removedItems = localManifest.items.filter((i) => !remoteIds.has(i.id));

      for (const removed of removedItems) {
        deleteMediaFile(removed.localPath);
        result.removedItems++;
      }
    }

    // 6. Identificar novas mídias para download
    const itemsToDownload = remoteItems.filter((i) => i.status === 'pending');
    result.newItems = itemsToDownload.length;

    onProgress?.(`Baixando ${itemsToDownload.length} mídias...`, 35);

    // 7. Salvar manifesto inicial (com status pending)
    const newManifest: LocalManifest = {
      terminalId,
      playlistId: playlist.id,
      playlistVersion: playlist.version,
      lastSyncAt: new Date().toISOString(),
      items: remoteItems,
    };
    await saveManifest(terminalId, newManifest);

    // 8. Fazer downloads
    if (itemsToDownload.length > 0) {
      const downloadResult = await downloadPlaylist(terminalId, itemsToDownload, {
        onOverallProgress: (completed, total) => {
          const progress = 35 + Math.round((completed / total) * 60);
          onProgress?.(`Baixando ${completed}/${total}...`, progress);
        },
      });

      if (downloadResult.failed.length > 0) {
        result.errors.push(
          `Falha no download de ${downloadResult.failed.length} arquivo(s)`
        );
      }
    }

    // 9. Atualizar manifesto final
    const finalManifest = await getManifest(terminalId);
    if (finalManifest) {
      finalManifest.lastSyncAt = new Date().toISOString();
      await saveManifest(terminalId, finalManifest);
    }

    // 10. Registrar timestamp de sync
    await setLastSyncTimestamp(Date.now());

    // 11. Enviar log de sync para o servidor
    try {
      await supabase.from('terminal_logs').insert({
        terminal_id: terminalId,
        event_type: 'sync',
        metadata: {
          playlist_version: playlist.version,
          new_items: result.newItems,
          removed_items: result.removedItems,
          errors: result.errors,
        },
      });
    } catch {
      // Não crítico
    }

    onProgress?.('Sincronização concluída!', 100);
    result.success = result.errors.length === 0;
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro de sincronização';
    result.errors.push(message);
    console.error('[SyncEngine]', message);
    return result;
  }
}

/**
 * Envia heartbeat para o servidor (monitoramento)
 */
export async function sendHeartbeat(terminalId: string): Promise<void> {
  try {
    await supabase
      .from('terminals')
      .update({
        status: 'online',
        last_sync_at: new Date().toISOString(),
      })
      .eq('id', terminalId);

    await supabase.from('terminal_logs').insert({
      terminal_id: terminalId,
      event_type: 'heartbeat',
      metadata: { timestamp: new Date().toISOString() },
    });
  } catch {
    // Ignorar se offline
  }
}

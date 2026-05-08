// =============================================
// Heartbeat Service — Monitoramento de terminais
// =============================================
import { sendHeartbeat } from './syncEngine';

let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

const HEARTBEAT_INTERVAL_MS = 60_000; // 60 segundos

/**
 * Inicia o envio periódico de heartbeat
 */
export function startHeartbeat(terminalId: string): void {
  stopHeartbeat(); // Limpar intervalo anterior se existir

  // Enviar imediatamente
  sendHeartbeat(terminalId);

  // Configurar intervalo
  heartbeatInterval = setInterval(() => {
    sendHeartbeat(terminalId);
  }, HEARTBEAT_INTERVAL_MS);

  console.log(`[Heartbeat] Iniciado para terminal: ${terminalId}`);
}

/**
 * Para o envio de heartbeat
 */
export function stopHeartbeat(): void {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
    console.log('[Heartbeat] Parado');
  }
}

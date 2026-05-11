// =============================================
// Hook useHeartbeat — Monitoramento de terminal
// =============================================
import { useEffect, useRef } from 'react';
import { supabase } from '../services/supabase';

const HEARTBEAT_INTERVAL_MS = 60 * 1000; // 1 minuto

export function useHeartbeat(terminalId: string | null) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sendHeartbeat = async () => {
    if (!terminalId) return;

    try {
      await supabase.from('terminal_logs').insert({
        terminal_id: terminalId,
        event_type: 'heartbeat',
        metadata: {
          timestamp: new Date().toISOString(),
          app_version: '1.0.0'
        }
      });
      // console.log('[Heartbeat] Enviado com sucesso');
    } catch (error) {
      console.error('[Heartbeat] Erro ao enviar:', error);
    }
  };

  useEffect(() => {
    if (!terminalId) return;

    // Enviar primeiro heartbeat imediatamente
    sendHeartbeat();

    // Configurar intervalo
    timerRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [terminalId]);
}

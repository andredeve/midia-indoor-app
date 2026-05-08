// =============================================
// Terminal Store — Gerenciamento de terminais
// =============================================
import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { setSelectedTerminalId } from '../utils/storage';
import type { Terminal } from '../types';

interface TerminalState {
  terminals: Terminal[];
  selectedTerminal: Terminal | null;
  isLoading: boolean;
  error: string | null;

  // Ações
  fetchTerminals: () => Promise<void>;
  selectTerminal: (terminal: Terminal) => Promise<void>;
  clearSelection: () => void;
}

export const useTerminalStore = create<TerminalState>((set) => ({
  terminals: [],
  selectedTerminal: null,
  isLoading: false,
  error: null,

  fetchTerminals: async () => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('terminals')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        set({ error: error.message, isLoading: false });
        return;
      }

      set({
        terminals: (data as Terminal[]) ?? [],
        isLoading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao buscar terminais';
      set({ error: message, isLoading: false });
    }
  },

  selectTerminal: async (terminal: Terminal) => {
    await setSelectedTerminalId(terminal.id);
    set({ selectedTerminal: terminal });
  },

  clearSelection: () => {
    set({ selectedTerminal: null });
  },
}));

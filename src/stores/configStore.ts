// =============================================
// Config Store — Gerenciamento de Servidor
// =============================================
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ConfigState {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isConfigured: boolean;
  isLoading: boolean;
  
  // Ações
  loadConfig: () => Promise<void>;
  setConfig: (url: string, key: string) => Promise<void>;
  resetConfig: () => Promise<void>;
}

const DEFAULT_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://prlhdjpzflgjtlmknhps.supabase.co';
const DEFAULT_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybGhkanB6ZmxnanRsbWtuaHBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNjIxMjMsImV4cCI6MjA5MzgzODEyM30.Xu2q_acI-Ow3kzJl0jFGdqnuCiRu4vjtpa-eaQBVU0c';

export const useConfigStore = create<ConfigState>((set) => ({
  supabaseUrl: DEFAULT_URL,
  supabaseAnonKey: DEFAULT_KEY,
  isConfigured: !!(DEFAULT_URL && DEFAULT_KEY),
  isLoading: true,

  loadConfig: async () => {
    try {
      const storedUrl = await AsyncStorage.getItem('@supabase_url');
      const storedKey = await AsyncStorage.getItem('@supabase_key');
      
      if (storedUrl && storedKey) {
        set({ 
          supabaseUrl: storedUrl, 
          supabaseAnonKey: storedKey, 
          isConfigured: true,
          isLoading: false 
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('[ConfigStore] Erro ao carregar config:', error);
      set({ isLoading: false });
    }
  },

  setConfig: async (url: string, key: string) => {
    try {
      await AsyncStorage.setItem('@supabase_url', url);
      await AsyncStorage.setItem('@supabase_key', key);
      set({ supabaseUrl: url, supabaseAnonKey: key, isConfigured: true });
    } catch (error) {
      console.error('[ConfigStore] Erro ao salvar config:', error);
      throw error;
    }
  },

  resetConfig: async () => {
    try {
      await AsyncStorage.removeItem('@supabase_url');
      await AsyncStorage.removeItem('@supabase_key');
      set({ 
        supabaseUrl: DEFAULT_URL, 
        supabaseAnonKey: DEFAULT_KEY, 
        isConfigured: !!(DEFAULT_URL && DEFAULT_KEY) 
      });
    } catch (error) {
      console.error('[ConfigStore] Erro ao resetar config:', error);
    }
  }
}));

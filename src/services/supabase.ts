// =============================================
// Configuração do cliente Supabase (Dinâmico)
// =============================================
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Adaptador de storage compatível com Supabase Auth usando AsyncStorage
const asyncStorageAdapter = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

let supabaseInstance: SupabaseClient | null = null;

/**
 * Inicializa ou retorna a instância atual do Supabase
 */
export const getSupabase = (customUrl?: string, customKey?: string): SupabaseClient => {
  const url = customUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://prlhdjpzflgjtlmknhps.supabase.co';
  const key = customKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBybGhkanB6ZmxnanRsbWtuaHBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNjIxMjMsImV4cCI6MjA5MzgzODEyM30.Xu2q_acI-Ow3kzJl0jFGdqnuCiRu4vjtpa-eaQBVU0c';

  // Se for uma nova configuração ou não houver instância, cria uma nova
  if (customUrl || !supabaseInstance) {
    supabaseInstance = createClient(url, key, {
      auth: {
        storage: asyncStorageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }

  return supabaseInstance;
};

// Exportamos um wrapper que delega as chamadas para a instância atual
export const supabase = {
  get auth() {
    return getSupabase().auth;
  },
  get storage() {
    return getSupabase().storage;
  },
  from(table: string) {
    return getSupabase().from(table);
  },
  rpc(name: string, args?: any) {
    return getSupabase().rpc(name, args);
  },
  channel(name: string, opts?: any) {
    return getSupabase().channel(name, opts);
  },
  removeChannel(channel: any) {
    return getSupabase().removeChannel(channel);
  },
  removeAllChannels() {
    return getSupabase().removeAllChannels();
  }
} as unknown as SupabaseClient;

export default supabase;

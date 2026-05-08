// =============================================
// Auth Store — Gerenciamento de autenticação
// =============================================
import { create } from 'zustand';
import { supabase } from '../services/supabase';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  session: { access_token: string } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Ações
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // Buscar perfil do usuário
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        set({
          session: { access_token: session.access_token },
          user: profile as User | null,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false, isAuthenticated: false });
      }
    } catch {
      // Se offline mas tem sessão cached, manter autenticado
      set({ isLoading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        set({ error: error.message, isLoading: false });
        return false;
      }

      if (data.session) {
        // Buscar perfil do usuário
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.session.user.id)
          .single();

        set({
          session: { access_token: data.session.access_token },
          user: profile as User | null,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      }

      set({ isLoading: false });
      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer login';
      set({ error: message, isLoading: false });
      return false;
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignorar erro se offline
    }
    set({
      user: null,
      session: null,
      isAuthenticated: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));

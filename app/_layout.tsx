// =============================================
// Layout Raiz — Providers e inicialização
// =============================================
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../src/stores/authStore';
import { useConfigStore } from '../src/stores/configStore';
import { getSupabase } from '../src/services/supabase';

export default function RootLayout() {
  const { loadConfig, isLoading: isConfigLoading, supabaseUrl, supabaseAnonKey } = useConfigStore();
  const { initialize, isLoading: isAuthLoading } = useAuthStore();
  const [hasInitialized, setHasInitialized] = React.useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    const init = async () => {
      if (!isConfigLoading && !hasInitialized) {
        // 1. Configura o cliente Supabase com a URL/Key do storage
        getSupabase(supabaseUrl, supabaseAnonKey);
        
        // 2. Inicializa a sessão de autenticação
        await initialize();
        
        // 3. Marca como pronto para liberar a navegação
        setHasInitialized(true);
      }
    };
    init();
  }, [isConfigLoading, supabaseUrl, supabaseAnonKey, hasInitialized]);

  // Se estiver carregando config ou auth, mostra tela de loading e NÃO monta o resto do app
  if (isConfigLoading || isAuthLoading || !hasInitialized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#d4ff00" />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <StatusBar style="light" hidden={true} translucent={true} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000000' },
          animation: 'fade',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
});

// =============================================
// Terminals — Listagem de terminais
// =============================================
import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/stores/authStore';
import { useTerminalStore } from '../src/stores/terminalStore';
import { useNetworkStatus } from '../src/hooks/useNetworkStatus';
import TerminalCard from '../src/components/TerminalCard';
import SyncStatusBarComponent from '../src/components/SyncStatusBar';
import type { Terminal } from '../src/types';

console.log('[TerminalsScreen] Componentes carregados:', { SyncStatusBarComponent, TerminalCard });

export default function TerminalsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();
  const {
    terminals,
    isLoading,
    error,
    fetchTerminals,
    selectTerminal,
  } = useTerminalStore();
  const { isConnected } = useNetworkStatus();

  useEffect(() => {
    fetchTerminals();
  }, []);

  const handleSelectTerminal = (terminal: Terminal) => {
    selectTerminal(terminal);
    router.push(`/player/${terminal.id}`);
  };

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  const renderEmptyState = () => {
    if (isLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="tv-outline" size={48} color="#64748b" />
        </View>
        <Text style={styles.emptyTitle}>Nenhum terminal encontrado</Text>
        <Text style={styles.emptySubtitle}>
          {isConnected
            ? 'Cadastre terminais no painel administrativo'
            : 'Sem conexão com a internet'}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchTerminals}
        >
          <Ionicons name="refresh" size={18} color="#d4ff00" />
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Terminais</Text>
            <Text style={styles.headerSubtitle}>
              {terminals.length} terminal{terminals.length !== 1 ? 'is' : ''} ativo{terminals.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Indicador de conexão */}
          <View style={[styles.connectionDot, { backgroundColor: isConnected ? '#22c55e' : '#ef4444' }]} />

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={22} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Status de sync */}
      <SyncStatusBarComponent
        isSyncing={false}
        message=""
      />

      {/* Erro */}
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color="#fca5a5" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Lista de terminais */}
      <FlatList
        data={terminals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TerminalCard
            terminal={item}
            onPress={handleSelectTerminal}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchTerminals}
            tintColor="#d4ff00"
            colors={['#d4ff00']}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />

      {/* Loading overlay */}
      {isLoading && terminals.length === 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#d4ff00" />
          <Text style={styles.loadingText}>Carregando terminais...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#111111',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d4ff00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000000',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f1f5f9',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  logoutButton: {
    padding: 8,
  },
  // Error
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d1212',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
    flex: 1,
  },
  // List
  listContent: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#222222',
  },
  retryText: {
    color: '#d4ff00',
    fontSize: 14,
    fontWeight: '600',
  },
  // Loading
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 12,
  },
});

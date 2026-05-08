// =============================================
// TerminalCard — Card de terminal na listagem
// =============================================
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Terminal } from '../types';

interface TerminalCardProps {
  terminal: Terminal;
  onPress: (terminal: Terminal) => void;
}

const STATUS_COLORS = {
  online: '#22c55e',
  offline: '#ef4444',
  syncing: '#f59e0b',
} as const;

const STATUS_LABELS = {
  online: 'Online',
  offline: 'Offline',
  syncing: 'Sincronizando',
} as const;

export default function TerminalCard({ terminal, onPress }: TerminalCardProps) {
  const statusColor = STATUS_COLORS[terminal.status] || STATUS_COLORS.offline;
  const statusLabel = STATUS_LABELS[terminal.status] || 'Desconhecido';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(terminal)}
      activeOpacity={0.7}
    >
      {/* Ícone do terminal */}
      <View style={styles.iconContainer}>
        <Ionicons name="tv-outline" size={32} color="#a78bfa" />
      </View>

      {/* Informações */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {terminal.name}
        </Text>
        <Text style={styles.location} numberOfLines={1}>
          <Ionicons name="location-outline" size={12} color="#94a3b8" />
          {'  '}
          {terminal.location || 'Sem localização'}
        </Text>

        {terminal.last_sync_at && (
          <Text style={styles.syncText}>
            Último sync: {new Date(terminal.last_sync_at).toLocaleDateString('pt-BR')}
          </Text>
        )}
      </View>

      {/* Status */}
      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusText, { color: statusColor }]}>
          {statusLabel}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={20}
          color="#64748b"
          style={styles.chevron}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1b2e',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2d2a3e',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#2d2a3e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  location: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 2,
  },
  syncText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  statusContainer: {
    alignItems: 'center',
    marginLeft: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  chevron: {
    marginTop: 8,
  },
});

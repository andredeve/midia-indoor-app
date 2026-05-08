// =============================================
// SyncStatusBar — Barra de status de sincronização
// =============================================
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SyncStatusBarProps {
  isSyncing: boolean;
  message: string;
  progress: number;
  isConnected: boolean;
}

export default function SyncStatusBar({
  isSyncing,
  message,
  progress,
  isConnected,
}: SyncStatusBarProps) {
  if (!isSyncing && isConnected) return null;

  return (
    <View style={[styles.container, !isConnected && styles.offlineContainer]}>
      {!isConnected ? (
        <>
          <Ionicons name="cloud-offline-outline" size={16} color="#f59e0b" />
          <Text style={styles.offlineText}>Modo Offline</Text>
        </>
      ) : (
        <>
          <ActivityIndicator size="small" color="#a78bfa" />
          <Text style={styles.text}>{message}</Text>
          {progress > 0 && progress < 100 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBg}>
                <View
                  style={[styles.progressFill, { width: `${progress}%` }]}
                />
              </View>
              <Text style={styles.progressText}>{progress}%</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1b2e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2d2a3e',
    gap: 10,
  },
  offlineContainer: {
    backgroundColor: '#2d1f0e',
    borderBottomColor: '#4a3520',
  },
  text: {
    color: '#c4b5fd',
    fontSize: 13,
    flex: 1,
  },
  offlineText: {
    color: '#f59e0b',
    fontSize: 13,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBg: {
    width: 80,
    height: 4,
    backgroundColor: '#2d2a3e',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#a78bfa',
    borderRadius: 2,
  },
  progressText: {
    color: '#94a3b8',
    fontSize: 11,
  },
});

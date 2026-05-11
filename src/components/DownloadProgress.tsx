// =============================================
// DownloadProgress — Overlay de progresso de download
// =============================================
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DownloadProgressProps {
  message: string;
  progress: number;
  isVisible: boolean;
}

export default function DownloadProgress({
  message,
  progress,
  isVisible,
}: DownloadProgressProps) {
  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        {/* Ícone animado */}
        <View style={styles.iconCircle}>
          {progress < 100 ? (
            <ActivityIndicator size="large" color="#d4ff00" />
          ) : (
            <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
          )}
        </View>

        {/* Mensagem */}
        <Text style={styles.message}>{message}</Text>

        {/* Barra de progresso */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBg}>
            <View
              style={[styles.progressBarFill, { width: `${progress}%` }]}
            />
          </View>
          <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        </View>

        {/* Dica */}
        <Text style={styles.hint}>
          {progress < 100
            ? 'Aguarde, baixando mídias...'
            : 'Pronto! Iniciando reprodução...'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 15, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  card: {
    backgroundColor: '#111111',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '80%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#222222',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
    textAlign: 'center',
    marginBottom: 20,
  },
  progressBarContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: '#222222',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#d4ff00',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#d4ff00',
    minWidth: 40,
    textAlign: 'right',
  },
  hint: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
});

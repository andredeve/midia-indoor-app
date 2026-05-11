// =============================================
// SyncStatusBar — Desativado (Visual limpo)
// =============================================
import React from 'react';

interface SyncStatusBarProps {
  isSyncing: boolean;
  message: string;
}

export default function SyncStatusBar(_props: SyncStatusBarProps) {
  // Retorna null para não exibir barras de erro, offline ou sincronização na tela
  return null;
}

// =============================================
// Index — Redirect baseado em autenticação
// =============================================
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';

export default function Index() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      router.replace('/terminals');
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading]);

  return null;
}

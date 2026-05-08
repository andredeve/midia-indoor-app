// =============================================
// Login — Tela de autenticação
// =============================================
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/stores/authStore';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;

    const success = await signIn(email.trim(), password);
    if (success) {
      router.replace('/terminals');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        {/* Logo / Branding */}
        <View style={styles.brandContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="play-circle" size={48} color="#a78bfa" />
          </View>
          <Text style={styles.brandName}>Mídia Indoor</Text>
          <Text style={styles.brandSubtitle}>Player de Conteúdo</Text>
        </View>

        {/* Formulário */}
        <View style={styles.form}>
          {/* Campo Email */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#64748b"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (error) clearError();
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          {/* Campo Senha */}
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor="#64748b"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (error) clearError();
              }}
              secureTextEntry={!showPassword}
              editable={!isLoading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#64748b"
              />
            </TouchableOpacity>
          </View>

          {/* Erro */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Botão Login */}
          <TouchableOpacity
            style={[
              styles.loginButton,
              (!email.trim() || !password.trim()) && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={isLoading || !email.trim() || !password.trim()}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text style={styles.loginButtonText}>Entrar</Text>
                <Ionicons name="arrow-forward" size={20} color="#ffffff" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Mídia Indoor Player v1.0.0
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  // Branding
  brandContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#1e1b2e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#2d2a3e',
  },
  brandName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f1f5f9',
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  // Form
  form: {
    width: '100%',
    maxWidth: 400,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1b2e',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2d2a3e',
    marginBottom: 14,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 54,
    fontSize: 16,
    color: '#f1f5f9',
  },
  eyeButton: {
    padding: 8,
  },
  // Error
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d1212',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
    flex: 1,
  },
  // Button
  loginButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#7c3aed',
    borderRadius: 14,
    height: 54,
    gap: 8,
    marginTop: 4,
  },
  loginButtonDisabled: {
    backgroundColor: '#3b2070',
    opacity: 0.6,
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 24,
    fontSize: 12,
    color: '#475569',
  },
});

// =============================================
// Login — Tela de autenticação
// =============================================
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/stores/authStore';
import { useConfigStore } from '../src/stores/configStore';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isLoading, error, clearError } = useAuthStore();
  const { supabaseUrl, supabaseAnonKey, setConfig, resetConfig } = useConfigStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Estado para Modal de Configurações
  const [showSettings, setShowSettings] = useState(false);
  const [tempUrl, setTempUrl] = useState(supabaseUrl);
  const [tempKey, setTempKey] = useState(supabaseAnonKey);

  useEffect(() => {
    setTempUrl(supabaseUrl);
    setTempKey(supabaseAnonKey);
  }, [supabaseUrl, supabaseAnonKey]);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;

    const success = await signIn(email.trim(), password);
    if (success) {
      router.replace('/terminals');
    }
  };

  const handleSaveConfig = async () => {
    if (!tempUrl.trim() || !tempKey.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos do servidor.');
      return;
    }

    try {
      await setConfig(tempUrl.trim(), tempKey.trim());
      setShowSettings(false);
      Alert.alert('Sucesso', 'Configuração do servidor atualizada!');
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível salvar a configuração.');
    }
  };

  const handleResetConfig = async () => {
    await resetConfig();
    setShowSettings(false);
    Alert.alert('Resetado', 'Configuração voltou ao padrão do sistema.');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        {/* Botão de Configurações (Engrenagem) */}
        <TouchableOpacity 
          style={styles.settingsButton} 
          onPress={() => setShowSettings(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={24} color="#64748b" />
        </TouchableOpacity>

        {/* Logo / Branding */}
        <View style={styles.brandContainer}>
          <Image 
            source={require('../assets/logo.png')} 
            style={{ width: 220, height: 80, resizeMode: 'contain' }} 
          />
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
              <ActivityIndicator color="#000000" />
            ) : (
              <>
                <Text style={styles.loginButtonText}>Entrar</Text>
                <Ionicons name="arrow-forward" size={20} color="#000000" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          GYM PLAY Mídia v1.0.0
        </Text>

        {/* Modal de Configurações do Servidor */}
        <Modal
          visible={showSettings}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowSettings(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Configurar Servidor</Text>
                <TouchableOpacity onPress={() => setShowSettings(false)}>
                  <Ionicons name="close" size={24} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalLabel}>Supabase URL</Text>
              <View style={styles.modalInputContainer}>
                <TextInput
                  style={styles.modalInput}
                  value={tempUrl}
                  onChangeText={setTempUrl}
                  placeholder="https://abc.supabase.co"
                  placeholderTextColor="#475569"
                  autoCapitalize="none"
                />
              </View>

              <Text style={styles.modalLabel}>Supabase Anon Key</Text>
              <View style={styles.modalInputContainer}>
                <TextInput
                  style={styles.modalInput}
                  value={tempKey}
                  onChangeText={setTempKey}
                  placeholder="eyJhbGci..."
                  placeholderTextColor="#475569"
                  autoCapitalize="none"
                  multiline={true}
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSaveConfig}>
                <Text style={styles.saveButtonText}>Salvar Configuração</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.resetButton} onPress={handleResetConfig}>
                <Text style={styles.resetButtonText}>Resetar para Padrão</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
    backgroundColor: '#111111',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#222222',
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
    backgroundColor: '#111111',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#222222',
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
    backgroundColor: '#d4ff00',
    borderRadius: 14,
    height: 54,
    gap: 8,
    marginTop: 4,
  },
  loginButtonDisabled: {
    backgroundColor: '#d4ff00',
    opacity: 0.3,
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#000000',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 24,
    fontSize: 12,
    color: '#475569',
  },
  settingsButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 10,
    zIndex: 10,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#111111',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    borderWidth: 1,
    borderColor: '#222222',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  modalLabel: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 8,
    marginTop: 12,
  },
  modalInputContainer: {
    backgroundColor: '#000000',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222222',
    paddingHorizontal: 12,
  },
  modalInput: {
    height: 48,
    color: '#f1f5f9',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#d4ff00',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
  },
  resetButton: {
    marginTop: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  resetButtonText: {
    color: '#64748b',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

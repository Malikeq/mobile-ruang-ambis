import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Animated, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail]     = useState('');
  const [password, setPass]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [showPass, setShowPass] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Email dan password wajib diisi.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      // Always go to dashboard — _layout only routes on cold boot
      router.replace('/(tabs)');
    } catch (e: any) {
      const raw: string = e?.message ?? '';
      if (raw.toLowerCase().includes('network') || raw.toLowerCase().includes('fetch')) {
        setError('Tidak bisa terhubung ke server.\nPastikan backend berjalan dengan --host=0.0.0.0');
      } else if (raw.toLowerCase().includes('401') || raw.toLowerCase().includes('unauthorized') || raw.toLowerCase().includes('invalid')) {
        setError('Email atau password salah. Coba lagi.');
      } else {
        setError(raw || 'Login gagal. Coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.glowBlue} />
      <View style={styles.glowGold} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>← Kembali</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.logoMark}>
              <Text style={styles.logoEmoji}>🎯</Text>
            </View>
            <Text style={styles.title}>Selamat Datang{'\n'}Kembali! 👋</Text>
            <Text style={styles.subtitle}>Lanjutkan perjalanan belajarmu</Text>
          </View>

          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️  {error}</Text>
            </View>
          )}

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="email@gmail.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.field}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Password</Text>
                <TouchableOpacity>
                  <Text style={styles.forgotText}>Lupa password?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.passWrap}>
                <TextInput
                  style={[styles.input, { flex: 1, borderWidth: 0 }]}
                  value={password}
                  onChangeText={setPass}
                  placeholder="Password kamu"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPass}
                />
                <TouchableOpacity onPress={() => setShowPass(v => !v)} style={styles.eyeBtn}>
                  <Text style={styles.eyeText}>{showPass ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnLoading]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Masuk  →</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>belum punya akun?</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => router.push('/auth/register')}
          >
            <Text style={styles.registerBtnText}>Daftar Gratis</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  glowBlue: {
    position: 'absolute', top: -80, left: -80,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: Colors.primary + '12',
  },
  glowGold: {
    position: 'absolute', bottom: 100, right: -60,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: Colors.secondary + '10',
  },
  scroll: {
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 48,
  },
  backBtn: { marginBottom: Spacing.lg },
  backText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '500' },
  header: { alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xl },
  logoMark: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45, shadowRadius: 20, elevation: 12,
    marginBottom: Spacing.sm,
  },
  logoEmoji: { fontSize: 34 },
  title: {
    color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: '800',
    letterSpacing: -0.4, textAlign: 'center', lineHeight: 36,
  },
  subtitle: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center' },
  errorBox: {
    backgroundColor: Colors.error + '20', borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.error + '50',
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  errorText: { color: Colors.error, fontSize: FontSize.sm },
  form: { gap: Spacing.md },
  field: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600', marginLeft: 2 },
  forgotText: { color: Colors.primaryLight, fontSize: FontSize.xs, fontWeight: '600' },
  input: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    color: Colors.textPrimary, fontSize: FontSize.base,
  },
  passWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingLeft: Spacing.md,
  },
  eyeBtn: { paddingHorizontal: Spacing.md, paddingVertical: 14 },
  eyeText: { fontSize: 18 },
  btn: {
    paddingVertical: 16, borderRadius: Radius.xl,
    backgroundColor: Colors.primary, alignItems: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
    marginTop: Spacing.sm,
  },
  btnLoading: { opacity: 0.7 },
  btnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
  dividerRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.md, marginVertical: Spacing.xl,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textMuted, fontSize: FontSize.xs, textAlign: 'center' },
  registerBtn: {
    paddingVertical: 15, borderRadius: Radius.xl,
    borderWidth: 1.5, borderColor: Colors.primaryLight,
    alignItems: 'center',
  },
  registerBtnText: { color: Colors.primaryLight, fontSize: FontSize.base, fontWeight: '700' },
});

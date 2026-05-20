import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Animated, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { API_BASE, getToken } from '@/lib/api';

export default function RegisterScreen() {
  const { register, refreshUser } = useAuth();
  const { sekolah, targets, reset: resetOnboarding } = useOnboarding();
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPass]       = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [pingResult, setPingResult] = useState<'idle'|'testing'|'ok'|'fail'>('idle');
  const [pingMsg, setPingMsg]     = useState('');

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Connectivity Test ──────────────────────────────────────────────────────
  const testConnection = async () => {
    setPingResult('testing');
    setPingMsg('');
    try {
      const start = Date.now();
      const res = await fetch(`${API_BASE}/kampus?size=1`, {
        headers: { Accept: 'application/json' },
      });
      const ms = Date.now() - start;
      if (res.ok) {
        setPingResult('ok');
        setPingMsg(`✅ Terhubung ke server (${ms}ms)`);
      } else {
        setPingResult('fail');
        setPingMsg(`❌ Server error HTTP ${res.status}`);
      }
    } catch (e: any) {
      setPingResult('fail');
      const raw = e?.message ?? '';
      if (raw.toLowerCase().includes('network')) {
        setPingMsg(`❌ Tidak bisa reach: ${API_BASE}\n\nPastikan:\n• php artisan serve --host=0.0.0.0\n• Firewall allow port 8000\n• Satu jaringan WiFi`);
      } else {
        setPingMsg(`❌ ${raw}`);
      }
    }
  };

  // ── Register ───────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Semua kolom wajib diisi.');
      return;
    }
    if (password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);

      // ── Submit all onboarding data from OnboardingContext ────────────────────
      const token = await getToken();
      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };

      console.log('[Onboarding] Submitting — sekolah:', sekolah, '| targets:', targets.length);

      // 1. Asal sekolah
      if (sekolah) {
        try {
          const r = await fetch(`${API_BASE}/user/profile`, {
            method: 'POST', headers,
            body: JSON.stringify({ asal_sekolah: sekolah }),
          });
          const j = await r.json().catch(() => ({}));
          if (!r.ok) console.warn('[Onboarding] sekolah FAILED', r.status, j);
          else        console.log('[Onboarding] sekolah OK', j);
        } catch (e) { console.warn('[Onboarding] sekolah error', e); }
      }

      // 2. Kampus & Jurusan targets
      if (targets.length > 0) {
        try {
          const valid = targets
            .filter(t => t.kampus_id > 0)
            .map(t => ({
              kampus_id:  t.kampus_id,
              jurusan_id: (t.jurusan_id && t.jurusan_id > 0) ? t.jurusan_id : null,
              priority:   t.priority,
            }));
          console.log('[Onboarding] targets payload:', JSON.stringify(valid));
          if (valid.length > 0) {
            const r = await fetch(`${API_BASE}/onboarding/target`, {
              method: 'POST', headers,
              body: JSON.stringify({ targets: valid }),
            });
            const j = await r.json().catch(() => ({}));
            if (!r.ok) console.warn('[Onboarding] targets FAILED', r.status, j);
            else        console.log('[Onboarding] targets OK');
          }
        } catch (e) { console.warn('[Onboarding] targets error', e); }
      }

      // 3. Mark onboarding complete
      try {
        const r = await fetch(`${API_BASE}/onboarding/complete`, { method: 'POST', headers });
        if (!r.ok) { const j = await r.json().catch(() => ({})); console.warn('[Onboarding] complete FAILED', r.status, j); }
        else console.log('[Onboarding] complete OK');
      } catch (e) { console.warn('[Onboarding] complete error', e); }

      // 4. Clear context + refresh auth user
      resetOnboarding();
      try { await refreshUser(); } catch { /* ok */ }

      // → Go to dashboard
      router.replace('/(tabs)');
    } catch (e: any) {
      const raw: string = e?.message ?? '';
      if (raw.toLowerCase().includes('network') || raw.toLowerCase().includes('fetch')) {
        setError(
          `Tidak bisa terhubung ke server.\n` +
          `Server: ${API_BASE}\n\n` +
          `Fix:\n` +
          `1. php artisan serve --host=0.0.0.0\n` +
          `2. netsh advfirewall firewall add rule name="Laravel" dir=in action=allow protocol=TCP localport=8000\n` +
          `3. Gunakan tombol "Test Koneksi" di bawah`
        );
      } else {
        setError(raw || 'Registrasi gagal. Coba lagi.');
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
      <View style={styles.glow} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Back */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>← Kembali</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoMark}>
              <Text style={styles.logoEmoji}>🎯</Text>
            </View>
            <Text style={styles.title}>Buat Akun</Text>
            <Text style={styles.subtitle}>Mulai perjalanan ke PTN impianmu hari ini</Text>
          </View>

          {/* Error box */}
          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️  {error}</Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Nama Lengkap</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nama kamu"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
              />
            </View>

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
              <Text style={styles.label}>Password</Text>
              <View style={styles.passWrap}>
                <TextInput
                  style={[styles.input, { flex: 1, borderWidth: 0 }]}
                  value={password}
                  onChangeText={setPass}
                  placeholder="Min. 8 karakter"
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
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>Daftar Sekarang  →</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>atau</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Login link */}
          <TouchableOpacity style={styles.loginLink} onPress={() => router.push('/auth/login')}>
            <Text style={styles.loginLinkText}>
              Sudah punya akun?{'  '}
              <Text style={styles.loginLinkAccent}>Masuk</Text>
            </Text>
          </TouchableOpacity>

          {/* ── Dev: Connectivity Tester ─────────────────────────── */}
          <View style={styles.pingBox}>
            <View style={styles.pingHeader}>
              <Text style={styles.pingTitle}>🔧 Diagnostik Koneksi</Text>
              <TouchableOpacity
                style={[
                  styles.pingBtn,
                  pingResult === 'ok'   && styles.pingBtnOk,
                  pingResult === 'fail' && styles.pingBtnFail,
                ]}
                onPress={testConnection}
                disabled={pingResult === 'testing'}
              >
                {pingResult === 'testing'
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.pingBtnText}>Test Koneksi</Text>
                }
              </TouchableOpacity>
            </View>

            <Text style={styles.pingUrl} numberOfLines={2}>
              📡 {API_BASE}
            </Text>

            {!!pingMsg && (
              <View style={[
                styles.pingResult,
                pingResult === 'ok'   && styles.pingResultOk,
                pingResult === 'fail' && styles.pingResultFail,
              ]}>
                <Text style={[
                  styles.pingResultText,
                  pingResult === 'ok'   && { color: Colors.success },
                  pingResult === 'fail' && { color: Colors.error },
                ]}>
                  {pingMsg}
                </Text>
              </View>
            )}

            <Text style={styles.pingHint}>
              Jika gagal, jalankan di terminal backend:{'\n'}
              <Text style={styles.pingCode}>php artisan serve --host=0.0.0.0</Text>
            </Text>
          </View>

          <Text style={styles.terms}>
            Dengan mendaftar, kamu menyetujui{'\n'}
            <Text style={styles.termsLink}>Syarat & Ketentuan</Text> dan{' '}
            <Text style={styles.termsLink}>Kebijakan Privasi</Text> kami.
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  glow: {
    position: 'absolute', top: -60, right: -60,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: Colors.primary + '15',
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
  title: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: '800', letterSpacing: -0.4 },
  subtitle: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center' },
  errorBox: {
    backgroundColor: Colors.error + '18', borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.error + '40',
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  errorText: { color: Colors.error, fontSize: FontSize.xs, lineHeight: 20 },
  form: { gap: Spacing.md },
  field: { gap: 6 },
  label: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600', marginLeft: 2 },
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
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginVertical: Spacing.xl },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textMuted, fontSize: FontSize.sm },
  loginLink: { alignItems: 'center', marginBottom: Spacing.xl },
  loginLinkText: { color: Colors.textMuted, fontSize: FontSize.base },
  loginLinkAccent: { color: Colors.primaryLight, fontWeight: '700' },

  // Ping box
  pingBox: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.lg,
  },
  pingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pingTitle: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '700' },
  pingBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: Radius.lg, minWidth: 100, alignItems: 'center',
  },
  pingBtnOk:   { backgroundColor: Colors.success },
  pingBtnFail: { backgroundColor: Colors.error },
  pingBtnText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '700' },
  pingUrl: {
    color: Colors.textMuted, fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    backgroundColor: Colors.background, padding: 8, borderRadius: Radius.sm,
  },
  pingResult: {
    padding: Spacing.sm, borderRadius: Radius.md,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
  },
  pingResultOk:   { borderColor: Colors.success + '50', backgroundColor: Colors.success + '10' },
  pingResultFail: { borderColor: Colors.error + '50',   backgroundColor: Colors.error + '10' },
  pingResultText: { color: Colors.textSecondary, fontSize: FontSize.xs, lineHeight: 18 },
  pingHint: { color: Colors.textMuted, fontSize: FontSize.xs, lineHeight: 18 },
  pingCode: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: Colors.secondary, fontSize: FontSize.xs,
  },

  terms: { color: Colors.textMuted, fontSize: FontSize.xs, textAlign: 'center', lineHeight: 18 },
  termsLink: { color: Colors.primaryLight, textDecorationLine: 'underline' },
});

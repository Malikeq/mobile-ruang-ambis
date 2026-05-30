import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Animated, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, FlatList, Modal, Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { pengawasApi, Sekolah } from '@/lib/api';

const PW_GREEN   = '#059669';
const PW_GREEN_L = '#10B981';

const JABATAN_OPTS = [
  { id: 'guru_bk',       label: 'Guru BK',          icon: 'heart-outline' },
  { id: 'wali_kelas',    label: 'Wali Kelas',        icon: 'people-outline' },
  { id: 'kepala_sekolah',label: 'Kepala Sekolah',   icon: 'business-outline' },
  { id: 'lainnya',       label: 'Lainnya',           icon: 'person-outline' },
];

// ── Sekolah Picker Bottom Sheet ──────────────────────────────────────────────

function SekolahPicker({ onSelect, onClose }: {
  onSelect: (s: Sekolah) => void;
  onClose: () => void;
}) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<Sekolah[]>([]);
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(700)).current;
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }).start();
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await pengawasApi.searchSekolah(q);
      setResults(res.data ?? []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => search(query), 350);
    return () => clearTimeout(searchTimeout.current);
  }, [query, search]);

  const handleClose = () => {
    Animated.timing(slideAnim, { toValue: 700, duration: 220, useNativeDriver: true }).start(onClose);
  };

  return (
    <Modal transparent animationType="none" onRequestClose={handleClose}>
      <Pressable style={pk.backdrop} onPress={handleClose} />
      <Animated.View style={[pk.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={pk.handle} />

        <View style={pk.header}>
          <Text style={pk.title}>🏫 Pilih Sekolah</Text>
          <TouchableOpacity onPress={handleClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="close" size={22} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Search input */}
        <View style={pk.searchWrap}>
          <Ionicons name="search" size={16} color={Colors.textMuted} />
          <TextInput
            style={pk.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Ketik nama sekolah (min. 2 huruf)..."
            placeholderTextColor={Colors.textMuted}
            autoFocus
          />
          {loading && <ActivityIndicator color={PW_GREEN} size="small" />}
          {query.length > 0 && !loading && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Results */}
        {results.length === 0 && query.length >= 2 && !loading ? (
          <View style={pk.empty}>
            <Text style={pk.emptyText}>Sekolah tidak ditemukan</Text>
            <Text style={pk.emptyHint}>Coba kata kunci lain atau hubungi admin</Text>
          </View>
        ) : query.length < 2 ? (
          <View style={pk.empty}>
            <Ionicons name="business-outline" size={40} color={Colors.textMuted} />
            <Text style={pk.emptyText}>Ketik untuk mencari sekolah</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 44 : 24 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={pk.row} onPress={() => { onSelect(item); handleClose(); }} activeOpacity={0.75}>
                <View style={pk.rowIcon}>
                  <Ionicons name="business" size={16} color={PW_GREEN} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={pk.rowName} numberOfLines={1}>{item.nama}</Text>
                  {(item.kota || item.provinsi) && (
                    <Text style={pk.rowSub}>{[item.kota, item.provinsi].filter(Boolean).join(', ')}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={14} color={Colors.border} />
              </TouchableOpacity>
            )}
          />
        )}
      </Animated.View>
    </Modal>
  );
}

const pk = StyleSheet.create({
  backdrop:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet:       { position: 'absolute', bottom: 0, left: 0, right: 0,
                 backgroundColor: Colors.surface,
                 borderTopLeftRadius: 24, borderTopRightRadius: 24,
                 maxHeight: '75%', borderTopWidth: 1, borderTopColor: Colors.border,
                 paddingBottom: Platform.OS === 'ios' ? 0 : 0 },
  handle:      { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderLight,
                 alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                 paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  title:       { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '800' },
  searchWrap:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
                 marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
                 backgroundColor: Colors.surfaceElevated, borderRadius: Radius.xl,
                 borderWidth: 1, borderColor: Colors.border,
                 paddingHorizontal: Spacing.md, paddingVertical: 11 },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.sm },
  empty:       { alignItems: 'center', paddingVertical: 40, gap: Spacing.sm },
  emptyText:   { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },
  emptyHint:   { color: Colors.textMuted, fontSize: FontSize.xs },
  row:         { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
                 paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
                 borderBottomWidth: 1, borderBottomColor: Colors.border },
  rowIcon:     { width: 34, height: 34, borderRadius: 10, backgroundColor: PW_GREEN + '15',
                 alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  rowName:     { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '600' },
  rowSub:      { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
});

// ── Main Register Screen ─────────────────────────────────────────────────────

export default function PengawasRegisterScreen() {
  const [name,       setName]       = useState('');
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [jabatan,    setJabatan]    = useState<string>('');
  const [sekolah,    setSekolah]    = useState<Sekolah | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleRegister = async () => {
    setError('');
    if (!name.trim())       { setError('Nama lengkap wajib diisi.'); return; }
    if (!email.trim())      { setError('Email wajib diisi.'); return; }
    if (password.length < 8){ setError('Password minimal 8 karakter.'); return; }
    if (!jabatan)           { setError('Pilih jabatan kamu.'); return; }
    if (!sekolah)           { setError('Pilih sekolah kamu terlebih dahulu.'); return; }

    setLoading(true);
    try {
      await pengawasApi.register({
        name: name.trim(),
        email: email.trim(),
        password,
        sekolah_id: sekolah.id,
        jabatan,
      });
      setSuccess(true);
    } catch (e: any) {
      setError(e?.message ?? 'Pendaftaran gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <View style={st.successRoot}>
        <View style={st.successIcon}>
          <Ionicons name="checkmark-circle" size={72} color={PW_GREEN} />
        </View>
        <Text style={st.successTitle}>Pendaftaran Berhasil!</Text>
        <Text style={st.successSub}>
          Akun pengawas kamu sudah terdaftar.{'\n'}
          Admin akan mereview dalam <Text style={{ color: Colors.textPrimary, fontWeight: '700' }}>1–2 hari kerja</Text>.{'\n'}
          Kamu akan mendapat email saat disetujui.
        </Text>
        <TouchableOpacity
          style={[st.btn, { backgroundColor: PW_GREEN }]}
          onPress={() => router.replace('/auth/login')}
        >
          <Text style={st.btnText}>Masuk ke Akun →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={st.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={st.glow} />

      <ScrollView contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Back */}
          <TouchableOpacity style={st.backBtn} onPress={() => router.back()}>
            <Text style={st.backText}>← Kembali</Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={st.header}>
            <View style={st.logoMark}>
              <Ionicons name="shield-checkmark" size={32} color="#fff" />
            </View>
            <Text style={st.title}>Daftar Pengawas</Text>
            <Text style={st.subtitle}>
              Monitoring seluruh siswa sekolahmu dalam satu dashboard
            </Text>
          </View>

          {/* Error */}
          {!!error && (
            <View style={st.errorBox}>
              <Text style={st.errorText}>⚠️  {error}</Text>
            </View>
          )}

          {/* Form */}
          <View style={st.form}>

            {/* Nama */}
            <View style={st.field}>
              <Text style={st.label}>Nama Lengkap</Text>
              <TextInput
                style={st.input}
                value={name}
                onChangeText={setName}
                placeholder="Budi Santoso, S.Pd"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
              />
            </View>

            {/* Email */}
            <View style={st.field}>
              <Text style={st.label}>Email</Text>
              <TextInput
                style={st.input}
                value={email}
                onChangeText={setEmail}
                placeholder="guru@sekolah.sch.id"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text style={st.hint}>💡 Email @sekolah.sch.id akan diverifikasi lebih cepat</Text>
            </View>

            {/* Password */}
            <View style={st.field}>
              <Text style={st.label}>Password</Text>
              <View style={st.passWrap}>
                <TextInput
                  style={[st.input, { flex: 1, borderWidth: 0 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Min. 8 karakter"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showPass}
                />
                <TouchableOpacity onPress={() => setShowPass(v => !v)} style={st.eyeBtn}>
                  <Text style={st.eyeText}>{showPass ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Jabatan */}
            <View style={st.field}>
              <Text style={st.label}>Jabatan</Text>
              <View style={st.jabatanGrid}>
                {JABATAN_OPTS.map(opt => (
                  <TouchableOpacity
                    key={opt.id}
                    style={[st.jabatanBtn, jabatan === opt.id && { backgroundColor: PW_GREEN + '15', borderColor: PW_GREEN }]}
                    onPress={() => setJabatan(opt.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={opt.icon as any}
                      size={15}
                      color={jabatan === opt.id ? PW_GREEN : Colors.textMuted}
                    />
                    <Text style={[st.jabatanText, jabatan === opt.id && { color: PW_GREEN_L }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sekolah Picker */}
            <View style={st.field}>
              <Text style={st.label}>Sekolah</Text>
              <TouchableOpacity
                style={[st.sekolahBtn, sekolah && { borderColor: PW_GREEN, backgroundColor: PW_GREEN + '08' }]}
                onPress={() => setShowPicker(true)}
                activeOpacity={0.8}
              >
                {sekolah ? (
                  <View style={{ flex: 1 }}>
                    <Text style={[st.sekolahName, { color: PW_GREEN_L }]} numberOfLines={1}>{sekolah.nama}</Text>
                    {sekolah.kota && <Text style={st.sekolahCity}>{sekolah.kota}</Text>}
                  </View>
                ) : (
                  <>
                    <Ionicons name="business-outline" size={16} color={Colors.textMuted} />
                    <Text style={st.sekolahPlaceholder}>Cari dan pilih sekolah...</Text>
                  </>
                )}
                <Ionicons
                  name={sekolah ? 'checkmark-circle' : 'chevron-down'}
                  size={16}
                  color={sekolah ? PW_GREEN : Colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[st.btn, loading && { opacity: 0.7 }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={st.btnText}>Daftar Sebagai Pengawas →</Text>
              }
            </TouchableOpacity>
          </View>

          {/* Login link */}
          <TouchableOpacity style={st.loginLink} onPress={() => router.push('/auth/login')}>
            <Text style={st.loginLinkText}>
              Sudah punya akun?{'  '}
              <Text style={{ color: PW_GREEN_L, fontWeight: '700' }}>Masuk</Text>
            </Text>
          </TouchableOpacity>

          {/* Info */}
          <View style={st.infoBox}>
            <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
            <Text style={st.infoText}>
              Akun akan diverifikasi dalam <Text style={{ color: Colors.textPrimary }}>1–2 hari kerja</Text>.
              Kamu akan mendapat email saat disetujui.
            </Text>
          </View>

        </Animated.View>
      </ScrollView>

      {/* Sekolah Picker Modal */}
      {showPicker && (
        <SekolahPicker
          onSelect={s => setSekolah(s)}
          onClose={() => setShowPicker(false)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  root:              { flex: 1, backgroundColor: Colors.background },
  glow:              { position: 'absolute', top: -60, right: -60, width: 220, height: 220,
                       borderRadius: 110, backgroundColor: PW_GREEN + '10' },
  scroll:            { paddingTop: Platform.OS === 'ios' ? 60 : 44,
                       paddingHorizontal: Spacing.lg, paddingBottom: 48 },
  backBtn:           { marginBottom: Spacing.lg },
  backText:          { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '500' },

  header:            { alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xl },
  logoMark:          { width: 72, height: 72, borderRadius: 20, backgroundColor: PW_GREEN,
                       alignItems: 'center', justifyContent: 'center',
                       shadowColor: PW_GREEN, shadowOffset: { width: 0, height: 10 },
                       shadowOpacity: 0.45, shadowRadius: 20, elevation: 12, marginBottom: Spacing.sm },
  title:             { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: '900', letterSpacing: -0.4 },
  subtitle:          { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 22 },

  errorBox:          { backgroundColor: Colors.error + '18', borderRadius: Radius.md,
                       borderWidth: 1, borderColor: Colors.error + '40',
                       padding: Spacing.md, marginBottom: Spacing.md },
  errorText:         { color: Colors.error, fontSize: FontSize.xs, lineHeight: 20 },

  form:              { gap: Spacing.md },
  field:             { gap: 6 },
  label:             { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600', marginLeft: 2 },
  hint:              { color: Colors.textMuted, fontSize: 10, marginLeft: 2, marginTop: 2 },
  input:             { backgroundColor: Colors.surface, borderRadius: Radius.lg,
                       borderWidth: 1.5, borderColor: Colors.border,
                       paddingHorizontal: Spacing.md, paddingVertical: 14,
                       color: Colors.textPrimary, fontSize: FontSize.base },
  passWrap:          { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
                       borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border, paddingLeft: Spacing.md },
  eyeBtn:            { paddingHorizontal: Spacing.md, paddingVertical: 14 },
  eyeText:           { fontSize: 18 },

  jabatanGrid:       { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  jabatanBtn:        { flexDirection: 'row', alignItems: 'center', gap: 6,
                       backgroundColor: Colors.surface, borderRadius: Radius.lg,
                       borderWidth: 1.5, borderColor: Colors.border,
                       paddingHorizontal: 12, paddingVertical: 10 },
  jabatanText:       { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '700' },

  sekolahBtn:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
                       backgroundColor: Colors.surface, borderRadius: Radius.lg,
                       borderWidth: 1.5, borderColor: Colors.border,
                       paddingHorizontal: Spacing.md, paddingVertical: 14 },
  sekolahName:       { fontSize: FontSize.base, fontWeight: '700' },
  sekolahCity:       { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  sekolahPlaceholder:{ color: Colors.textMuted, fontSize: FontSize.base, flex: 1 },

  btn:               { paddingVertical: 16, borderRadius: Radius.xl, backgroundColor: PW_GREEN,
                       alignItems: 'center', shadowColor: PW_GREEN,
                       shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4,
                       shadowRadius: 16, elevation: 8, marginTop: Spacing.sm },
  btnText:           { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },

  loginLink:         { alignItems: 'center', marginTop: Spacing.xl, marginBottom: Spacing.md },
  loginLinkText:     { color: Colors.textMuted, fontSize: FontSize.base },

  infoBox:           { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start',
                       backgroundColor: Colors.surface, borderRadius: Radius.lg,
                       borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },
  infoText:          { color: Colors.textMuted, fontSize: FontSize.xs, flex: 1, lineHeight: 18 },

  // Success state
  successRoot:       { flex: 1, backgroundColor: Colors.background, alignItems: 'center',
                       justifyContent: 'center', padding: Spacing.xl, gap: Spacing.lg },
  successIcon:       { width: 120, height: 120, borderRadius: 30, backgroundColor: PW_GREEN + '15',
                       borderWidth: 2, borderColor: PW_GREEN + '40',
                       alignItems: 'center', justifyContent: 'center' },
  successTitle:      { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: '900', letterSpacing: -0.5 },
  successSub:        { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 24 },
});

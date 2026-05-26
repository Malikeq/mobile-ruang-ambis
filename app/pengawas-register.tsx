import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Platform, Alert, FlatList,
  KeyboardAvoidingView, Animated,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { pengawasApi, Sekolah } from '@/lib/api';

const PW_GREEN   = '#059669';
const PW_GREEN_L = '#10B981';
const PW_SURFACE = '#0A1A0F';

const JABATAN_OPTS = [
  { id: 'guru_bk',       label: 'Guru BK / Bimbingan Konseling', icon: 'people' },
  { id: 'wali_kelas',    label: 'Wali Kelas',                     icon: 'school' },
  { id: 'kepala_sekolah',label: 'Kepala Sekolah / Wakil',         icon: 'business' },
  { id: 'lainnya',       label: 'Lainnya',                        icon: 'person' },
];

export default function PengawasRegisterScreen() {
  const [step,     setStep]     = useState<1 | 2>(1);
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [jabatan,  setJabatan]  = useState('');
  const [sekolahQ, setSekolahQ] = useState('');
  const [sekolahResults, setSekolahResults] = useState<Sekolah[]>([]);
  const [selectedSekolah, setSelectedSekolah] = useState<Sekolah | null>(null);
  const [searching, setSearching] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  const animStep = () => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  // Debounced school search
  useEffect(() => {
    if (sekolahQ.length < 2) { setSekolahResults([]); return; }
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await pengawasApi.searchSekolah(sekolahQ);
        setSekolahResults(res.data ?? []);
      } catch { setSekolahResults([]); }
      setSearching(false);
    }, 400);
    return () => clearTimeout(searchTimeout.current);
  }, [sekolahQ]);

  const goStep2 = () => {
    if (!name.trim())       return Alert.alert('Isi nama lengkapmu');
    if (!email.includes('@')) return Alert.alert('Email tidak valid');
    if (password.length < 8)  return Alert.alert('Password minimal 8 karakter');
    if (!jabatan)             return Alert.alert('Pilih jabatanmu');
    animStep();
    setStep(2);
  };

  const handleRegister = async () => {
    if (!selectedSekolah) return Alert.alert('Pilih Sekolah', 'Cari dan pilih sekolah dari daftar.');
    setLoading(true);
    try {
      await pengawasApi.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        sekolah_id: selectedSekolah.id,
        jabatan,
      });
      router.replace('/pengawas-pending');
    } catch (e: any) {
      Alert.alert('Gagal Mendaftar', e?.message ?? 'Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={st.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={st.header}>
        <TouchableOpacity onPress={() => step === 2 ? (animStep(), setStep(1)) : router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={22} color={Colors.textMuted} />
        </TouchableOpacity>
        <View style={st.stepRow}>
          <View style={[st.stepDot, { backgroundColor: PW_GREEN }]} />
          <View style={[st.stepLine, step === 2 && { backgroundColor: PW_GREEN }]} />
          <View style={[st.stepDot, step === 2 ? { backgroundColor: PW_GREEN } : { backgroundColor: Colors.border }]} />
        </View>
        <Text style={st.stepLabel}>{step}/2</Text>
      </View>

      <ScrollView contentContainerStyle={st.scroll} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Logo */}
          <View style={st.logoWrap}>
            <View style={st.logo}>
              <Ionicons name="business" size={28} color="#fff" />
            </View>
            <Text style={st.logoTitle}>Daftar Pengawas Sekolah</Text>
            <Text style={st.logoSub}>
              {step === 1
                ? 'Isi data dirimu terlebih dahulu'
                : 'Pilih sekolah yang kamu awasi'}
            </Text>
          </View>

          {step === 1 ? (
            /* ─── Step 1: Personal Info ──────────────────────── */
            <View style={st.card}>
              <Field label="Nama Lengkap" icon="person-outline">
                <TextInput style={st.input} value={name} onChangeText={setName}
                  placeholder="Contoh: Budi Santoso, S.Pd"
                  placeholderTextColor={Colors.textMuted}
                  autoCapitalize="words" />
              </Field>

              <Field label="Email" icon="mail-outline">
                <TextInput style={st.input} value={email} onChangeText={setEmail}
                  placeholder="email@sekolah.sch.id"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address" autoCapitalize="none" />
              </Field>

              <Field label="Password" icon="lock-closed-outline">
                <View style={st.pwRow}>
                  <TextInput style={[st.input, { flex: 1 }]}
                    value={password} onChangeText={setPassword}
                    placeholder="Minimal 8 karakter"
                    placeholderTextColor={Colors.textMuted}
                    secureTextEntry={!showPw} />
                  <TouchableOpacity onPress={() => setShowPw(v => !v)} style={st.pwEye}>
                    <Ionicons name={showPw ? 'eye-off' : 'eye'} size={18} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </Field>

              <Text style={st.sectionLabel}>Jabatan di Sekolah</Text>
              <View style={st.jabatanGrid}>
                {JABATAN_OPTS.map(j => (
                  <TouchableOpacity key={j.id}
                    style={[st.jabatanCard, jabatan === j.id && { borderColor: PW_GREEN, backgroundColor: PW_GREEN + '15' }]}
                    onPress={() => setJabatan(j.id)} activeOpacity={0.8}>
                    <Ionicons name={j.icon as any} size={20} color={jabatan === j.id ? PW_GREEN : Colors.textMuted} />
                    <Text style={[st.jabatanLabel, jabatan === j.id && { color: PW_GREEN_L }]}>{j.label}</Text>
                    {jabatan === j.id && <Ionicons name="checkmark-circle" size={16} color={PW_GREEN} />}
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={st.cta} onPress={goStep2} activeOpacity={0.85}>
                <Text style={st.ctaText}>Lanjut →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ─── Step 2: Pilih Sekolah ──────────────────────── */
            <View style={st.card}>
              {selectedSekolah ? (
                <View style={st.selectedSchool}>
                  <Ionicons name="business" size={20} color={PW_GREEN} />
                  <View style={{ flex: 1 }}>
                    <Text style={st.selectedSchoolName}>{selectedSekolah.nama}</Text>
                    {selectedSekolah.kota && (
                      <Text style={st.selectedSchoolCity}>{selectedSekolah.kota}{selectedSekolah.provinsi ? `, ${selectedSekolah.provinsi}` : ''}</Text>
                    )}
                  </View>
                  <TouchableOpacity onPress={() => { setSelectedSekolah(null); setSekolahQ(''); }}>
                    <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={st.sectionLabel}>Cari Nama Sekolah</Text>
                  <View style={st.searchRow}>
                    <Ionicons name="search" size={16} color={Colors.textMuted} style={{ marginRight: 8 }} />
                    <TextInput
                      style={st.searchInput}
                      value={sekolahQ}
                      onChangeText={setSekolahQ}
                      placeholder="Ketik nama sekolah..."
                      placeholderTextColor={Colors.textMuted}
                      autoFocus
                    />
                    {searching && <ActivityIndicator size="small" color={PW_GREEN} />}
                  </View>

                  {sekolahResults.length > 0 && (
                    <FlatList
                      data={sekolahResults}
                      keyExtractor={i => String(i.id)}
                      scrollEnabled={false}
                      renderItem={({ item }) => (
                        <TouchableOpacity style={st.schoolRow} onPress={() => { setSelectedSekolah(item); setSekolahQ(''); setSekolahResults([]); }}>
                          <Ionicons name="business-outline" size={16} color={Colors.textMuted} />
                          <View style={{ flex: 1 }}>
                            <Text style={st.schoolRowName}>{item.nama}</Text>
                            {item.kota && <Text style={st.schoolRowCity}>{item.kota}{item.provinsi ? `, ${item.provinsi}` : ''}</Text>}
                          </View>
                          <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
                        </TouchableOpacity>
                      )}
                      ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Colors.border }} />}
                    />
                  )}

                  {sekolahQ.length >= 2 && !searching && sekolahResults.length === 0 && (
                    <View style={st.emptySearch}>
                      <Text style={st.emptySearchText}>Sekolah tidak ditemukan.{'\n'}Hubungi admin untuk menambahkan sekolah.</Text>
                    </View>
                  )}

                  {sekolahQ.length < 2 && (
                    <View style={st.searchHint}>
                      <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
                      <Text style={st.searchHintText}>Ketik minimal 2 huruf untuk mencari sekolah</Text>
                    </View>
                  )}
                </>
              )}

              <View style={st.infoBox}>
                <Ionicons name="shield-checkmark-outline" size={16} color={PW_GREEN} />
                <Text style={st.infoText}>
                  Akunmu akan diverifikasi dalam 1-2 hari kerja. Kamu akan menerima email konfirmasi.
                </Text>
              </View>

              <TouchableOpacity
                style={[st.cta, (!selectedSekolah || loading) && { opacity: 0.5 }]}
                onPress={handleRegister}
                disabled={!selectedSekolah || loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={st.ctaText}>Daftar Sebagai Pengawas ✓</Text>
                }
              </TouchableOpacity>
            </View>
          )}

          <Text style={st.loginLink}>
            Sudah punya akun?{' '}
            <Text style={{ color: PW_GREEN_L }} onPress={() => router.replace('/auth/login')}>
              Masuk
            </Text>
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <View style={st.field}>
      <View style={st.fieldLabel}>
        <Ionicons name={icon as any} size={13} color={Colors.textMuted} />
        <Text style={st.fieldLabelText}>{label}</Text>
      </View>
      <View style={st.fieldInput}>{children}</View>
    </View>
  );
}

const st = StyleSheet.create({
  root:          { flex: 1, backgroundColor: Colors.background },
  header:        { flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
                   paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  stepRow:       { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepDot:       { width: 10, height: 10, borderRadius: 5 },
  stepLine:      { flex: 1, height: 2, backgroundColor: Colors.border },
  stepLabel:     { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '700' },
  scroll:        { paddingHorizontal: Spacing.lg, paddingBottom: 60 },

  logoWrap:      { alignItems: 'center', marginBottom: Spacing.xl, marginTop: Spacing.md },
  logo:          { width: 72, height: 72, borderRadius: 20, backgroundColor: PW_GREEN,
                   alignItems: 'center', justifyContent: 'center',
                   shadowColor: PW_GREEN, shadowOffset: { width: 0, height: 12 },
                   shadowOpacity: 0.5, shadowRadius: 24, elevation: 16, marginBottom: Spacing.md },
  logoTitle:     { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: '900', textAlign: 'center' },
  logoSub:       { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center', marginTop: 4 },

  card:          { backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1,
                   borderColor: Colors.border, padding: Spacing.lg, gap: Spacing.md },
  field:         { gap: 6 },
  fieldLabel:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  fieldLabelText:{ color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '700' },
  fieldInput:    { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.lg,
                   borderWidth: 1, borderColor: Colors.border },
  input:         { color: Colors.textPrimary, fontSize: FontSize.sm, padding: Spacing.md, minHeight: 44 },
  pwRow:         { flexDirection: 'row', alignItems: 'center' },
  pwEye:         { paddingHorizontal: Spacing.md },

  sectionLabel:  { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 0.5 },
  jabatanGrid:   { gap: Spacing.sm },
  jabatanCard:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
                   backgroundColor: Colors.surfaceElevated, borderRadius: Radius.lg,
                   borderWidth: 1.5, borderColor: Colors.border, padding: Spacing.md, minHeight: 44 },
  jabatanLabel:  { flex: 1, color: Colors.textSecondary, fontSize: FontSize.sm },

  searchRow:     { flexDirection: 'row', alignItems: 'center',
                   backgroundColor: Colors.surfaceElevated, borderRadius: Radius.lg,
                   borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md,
                   paddingVertical: 10 },
  searchInput:   { flex: 1, color: Colors.textPrimary, fontSize: FontSize.sm, minHeight: 24 },

  schoolRow:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
                   paddingVertical: 12, paddingHorizontal: Spacing.sm },
  schoolRowName: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '600' },
  schoolRowCity: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },

  emptySearch:   { alignItems: 'center', paddingVertical: Spacing.md },
  emptySearchText:{ color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },

  searchHint:    { flexDirection: 'row', alignItems: 'flex-start', gap: 6,
                   backgroundColor: Colors.surfaceElevated, borderRadius: Radius.md, padding: Spacing.sm },
  searchHintText:{ flex: 1, color: Colors.textMuted, fontSize: FontSize.xs, lineHeight: 18 },

  selectedSchool:{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
                   backgroundColor: PW_GREEN + '14', borderRadius: Radius.lg,
                   borderWidth: 1.5, borderColor: PW_GREEN + '40', padding: Spacing.md },
  selectedSchoolName:{ color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '700' },
  selectedSchoolCity:{ color: Colors.textMuted, fontSize: 11, marginTop: 2 },

  infoBox:       { flexDirection: 'row', alignItems: 'flex-start', gap: 8,
                   backgroundColor: PW_GREEN + '10', borderRadius: Radius.lg,
                   borderWidth: 1, borderColor: PW_GREEN + '30', padding: Spacing.md },
  infoText:      { flex: 1, color: Colors.textSecondary, fontSize: FontSize.xs, lineHeight: 18 },

  cta:           { backgroundColor: PW_GREEN, borderRadius: Radius.xl,
                   paddingVertical: 15, alignItems: 'center', justifyContent: 'center',
                   shadowColor: PW_GREEN, shadowOffset: { width: 0, height: 6 },
                   shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  ctaText:       { color: '#fff', fontSize: FontSize.base, fontWeight: '800' },

  loginLink:     { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center',
                   marginTop: Spacing.xl, paddingBottom: Spacing.lg },
});

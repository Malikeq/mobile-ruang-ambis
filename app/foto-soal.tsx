import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { API_BASE } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlags } from '@/lib/feature-flags';
import { PremiumGateModal } from '@/components/PremiumGateModal';

interface PhotoAnalysis {
  soal_terdeteksi?: string;
  mapel?: string;
  dekonstruksi?: { diketahui?: string[]; ditanya?: string };
  strategi?: { konsep?: string; rumus?: string; tips_cepat?: string };
  eksekusi?: { langkah?: Array<{ no: number; aksi: string; hasil?: string }> };
  output?: { jawaban_akhir?: string; cara_cepat?: string };
}

export default function FotoSoalScreen() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const { canUseFotoSoal } = useFeatureFlags();

  const [uri, setUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PhotoAnalysis | null>(null);
  const [error, setError] = useState('');
  const [gateOpen, setGateOpen] = useState(false);

  const pickImage = async (useCamera: boolean) => {
    if (!canUseFotoSoal) {
      setGateOpen(true);
      return;
    }

    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!perm.granted) {
      Alert.alert('Izin diperlukan', 'Aktifkan akses kamera atau galeri di pengaturan perangkat.');
      return;
    }

    const picked = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.85, allowsEditing: true })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.85, allowsEditing: true });

    if (picked.canceled || !picked.assets[0]) return;

    setUri(picked.assets[0].uri);
    setResult(null);
    setError('');
  };

  const analyze = async () => {
    if (!uri || !token) return;
    if (!canUseFotoSoal) {
      setGateOpen(true);
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const form = new FormData();
      const name = uri.split('/').pop() ?? 'soal.jpg';
      const ext = name.includes('.') ? name.split('.').pop()?.toLowerCase() : 'jpg';
      const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

      form.append('image', {
        uri,
        name: `soal.${ext ?? 'jpg'}`,
        type: mime,
      } as unknown as Blob);

      const res = await fetch(`${API_BASE}/ai/photo-solve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: form,
      });

      const json = await res.json();

      if (res.status === 403) {
        setGateOpen(true);
        return;
      }
      if (res.status === 429) {
        setError('Batas foto soal hari ini sudah tercapai. Coba lagi besok atau upgrade paket.');
        return;
      }
      if (!res.ok || !json?.success) {
        setError(json?.message ?? 'Gagal menganalisis foto. Coba foto yang lebih jelas.');
        return;
      }

      setResult(json.data as PhotoAnalysis);
    } catch {
      setError('Koneksi bermasalah. Periksa internet kamu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={st.container}>
      <View style={[st.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={Colors.textMuted} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={st.headerTitle}>Foto Soal</Text>
          <Text style={st.headerSub}>AI baca & pecahkan soal dari gambar</Text>
        </View>
        {!canUseFotoSoal && (
          <TouchableOpacity style={st.lockBadge} onPress={() => setGateOpen(true)}>
            <Text style={st.lockBadgeText}>🔒 Premium</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[st.scroll, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={st.hero}>
          <Text style={st.heroEmoji}>📷</Text>
          <Text style={st.heroTitle}>Foto soal dari buku atau lembar ujian</Text>
          <Text style={st.heroDesc}>
            AI akan mendeteksi teks soal, mapel SNBT, dan memberikan pembahasan langkah demi langkah.
          </Text>
        </View>

        <View style={st.pickRow}>
          <TouchableOpacity style={st.pickBtn} onPress={() => pickImage(true)} activeOpacity={0.85}>
            <Ionicons name="camera" size={22} color={Colors.aiAccent} />
            <Text style={st.pickBtnText}>Kamera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={st.pickBtn} onPress={() => pickImage(false)} activeOpacity={0.85}>
            <Ionicons name="images" size={22} color={Colors.primaryLight} />
            <Text style={st.pickBtnText}>Galeri</Text>
          </TouchableOpacity>
        </View>

        {uri && (
          <View style={st.previewWrap}>
            <Image source={{ uri }} style={st.preview} resizeMode="contain" />
            <TouchableOpacity style={st.clearBtn} onPress={() => { setUri(null); setResult(null); }}>
              <Ionicons name="close-circle" size={22} color={Colors.error} />
              <Text style={st.clearText}>Ganti foto</Text>
            </TouchableOpacity>
          </View>
        )}

        {uri && (
          <TouchableOpacity
            style={[st.analyzeBtn, loading && { opacity: 0.6 }]}
            onPress={analyze}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="sparkles" size={20} color="#fff" />
                  <Text style={st.analyzeBtnText}>Analisis dengan AI</Text>
                </>
            }
          </TouchableOpacity>
        )}

        {!!error && (
          <View style={st.errorBox}>
            <Text style={st.errorText}>{error}</Text>
          </View>
        )}

        {result && (
          <View style={st.result}>
            {result.soal_terdeteksi && (
              <Section title="Soal terdeteksi" icon="document-text-outline">
                <Text style={st.body}>{result.soal_terdeteksi}</Text>
                {result.mapel && (
                  <View style={st.mapelPill}>
                    <Text style={st.mapelPillText}>{result.mapel}</Text>
                  </View>
                )}
              </Section>
            )}

            {result.dekonstruksi && (
              <Section title="Dekonstruksi" icon="search-outline" accent={Colors.primary}>
                {result.dekonstruksi.ditanya && (
                  <Text style={st.body}><Text style={st.bold}>Ditanya: </Text>{result.dekonstruksi.ditanya}</Text>
                )}
                {(result.dekonstruksi.diketahui ?? []).map((d, i) => (
                  <Text key={i} style={st.bullet}>• {d}</Text>
                ))}
              </Section>
            )}

            {result.strategi && (
              <Section title="Strategi" icon="bulb-outline" accent={Colors.secondary}>
                {result.strategi.konsep && <Text style={st.body}>{result.strategi.konsep}</Text>}
                {result.strategi.rumus && result.strategi.rumus !== '-' && (
                  <View style={st.rumusBox}><Text style={st.rumus}>{result.strategi.rumus}</Text></View>
                )}
                {result.strategi.tips_cepat && (
                  <Text style={[st.body, { color: Colors.secondary }]}>⚡ {result.strategi.tips_cepat}</Text>
                )}
              </Section>
            )}

            {(result.eksekusi?.langkah ?? []).length > 0 && (
              <Section title="Langkah pengerjaan" icon="list-outline" accent={Colors.success}>
                {result.eksekusi!.langkah!.map(l => (
                  <View key={l.no} style={st.langkahRow}>
                    <View style={st.langkahNum}><Text style={st.langkahNumTxt}>{l.no}</Text></View>
                    <View style={{ flex: 1 }}>
                      <Text style={st.body}>{l.aksi}</Text>
                      {l.hasil && <Text style={[st.body, { color: Colors.success }]}>→ {l.hasil}</Text>}
                    </View>
                  </View>
                ))}
              </Section>
            )}

            {result.output && (
              <Section title="Jawaban" icon="checkmark-circle-outline" accent={Colors.aiAccent}>
                {result.output.jawaban_akhir && (
                  <Text style={[st.body, st.bold, { color: Colors.success }]}>✅ {result.output.jawaban_akhir}</Text>
                )}
                {result.output.cara_cepat && (
                  <Text style={st.body}>🚀 {result.output.cara_cepat}</Text>
                )}
              </Section>
            )}
          </View>
        )}
      </ScrollView>

      <PremiumGateModal
        visible={gateOpen}
        onClose={() => setGateOpen(false)}
        feature="Foto Soal AI"
        description="Upload foto soal dan dapatkan pembahasan instan. Tersedia di paket Premium atau Daily Pass."
      />
    </View>
  );
}

function Section({
  title,
  icon,
  accent = Colors.primary,
  children,
}: {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[st.section, { borderLeftColor: accent }]}>
      <View style={st.sectionHead}>
        <Ionicons name={icon} size={16} color={accent} />
        <Text style={st.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '900' },
  headerSub: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  lockBadge: {
    backgroundColor: Colors.secondary + '22',
    borderWidth: 1,
    borderColor: Colors.secondary + '50',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  lockBadgeText: { color: Colors.secondary, fontSize: 11, fontWeight: '800' },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  hero: { alignItems: 'center', marginBottom: Spacing.lg, gap: 6 },
  heroEmoji: { fontSize: 40 },
  heroTitle: { color: Colors.textPrimary, fontSize: FontSize.base, fontWeight: '800', textAlign: 'center' },
  heroDesc: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },
  pickRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  pickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
  },
  pickBtnText: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '700' },
  previewWrap: { marginBottom: Spacing.md, gap: Spacing.sm },
  preview: {
    width: '100%',
    height: 220,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  clearBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  clearText: { color: Colors.textMuted, fontSize: FontSize.xs },
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.aiAccent,
    borderRadius: Radius.xl,
    paddingVertical: 16,
    marginBottom: Spacing.lg,
  },
  analyzeBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: '800' },
  errorBox: {
    backgroundColor: Colors.error + '15',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.error + '40',
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorText: { color: Colors.error, fontSize: FontSize.sm },
  result: { gap: Spacing.sm },
  section: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm },
  sectionTitle: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '800' },
  body: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 22 },
  bold: { fontWeight: '800', color: Colors.textPrimary },
  bullet: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 22, marginLeft: 4 },
  mapelPill: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: Colors.primary + '20',
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  mapelPillText: { color: Colors.primaryLight, fontSize: 11, fontWeight: '700' },
  rumusBox: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginVertical: 6,
  },
  rumus: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '600' },
  langkahRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: 6 },
  langkahNum: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: Colors.success + '25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langkahNumTxt: { color: Colors.success, fontSize: 12, fontWeight: '900' },
});

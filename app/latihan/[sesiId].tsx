import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Platform, ActivityIndicator, Dimensions, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { API_BASE } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');
const OPTIONS = ['A', 'B', 'C', 'D', 'E'];

interface Soal {
  id: number; nomor: number; pertanyaan: string; wacana?: string;
  opsi_a: string; opsi_b: string; opsi_c: string; opsi_d: string; opsi_e?: string;
  total: number;
}
interface Hasil {
  benar: number; salah: number; total: number;
  skor: number; nilai: number; waktu_selesai: string;
}

type Phase = 'loading' | 'soal' | 'submitting' | 'hasil' | 'error';

export default function SesiScreen() {
  const { sesiId } = useLocalSearchParams<{ sesiId: string }>();
  const { token }  = useAuth();

  const [phase,   setPhase]   = useState<Phase>('loading');
  const [soal,    setSoal]    = useState<Soal | null>(null);
  const [index,   setIndex]   = useState(0);
  const [total,   setTotal]   = useState(0);
  const [pilihan, setPilihan] = useState<string | null>(null);
  const [hasil,   setHasil]   = useState<Hasil | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  // Timer
  const [timer, setTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' };

  useEffect(() => {
    fetchSoal(0);
    timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const animIn = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  };

  const fetchSoal = async (idx: number) => {
    setPhase('loading');
    try {
      const res  = await fetch(`${API_BASE}/latihan/${sesiId}/soal/${idx}`, { headers });
      const json = await res.json();
      const d    = json?.data;
      if (!d) throw new Error('no data');
      setSoal({ ...d, nomor: idx + 1 });
      setTotal(d.total ?? 10);
      setPilihan(answers[idx] ?? null);
      setPhase('soal');
      animIn();
    } catch {
      setPhase('error');
    }
  };

  const submitJawab = async (jawaban: string) => {
    setPilihan(jawaban);
    setAnswers(prev => ({ ...prev, [index]: jawaban }));
    try {
      await fetch(`${API_BASE}/latihan/${sesiId}/jawab`, {
        method: 'POST', headers,
        body: JSON.stringify({ soal_id: soal!.id, jawaban, nomor: index }),
      });
    } catch {}
  };

  const goNext = async () => {
    if (index + 1 >= total) {
      finishSesi();
    } else {
      const next = index + 1;
      setIndex(next);
      fetchSoal(next);
    }
  };

  const goPrev = () => {
    if (index === 0) return;
    const prev = index - 1;
    setIndex(prev);
    fetchSoal(prev);
  };

  const finishSesi = async () => {
    clearInterval(timerRef.current);
    setPhase('submitting');
    try {
      const res  = await fetch(`${API_BASE}/latihan/${sesiId}/selesai`, { method: 'POST', headers });
      const json = await res.json();
      setHasil(json?.data ?? null);
      setPhase('hasil');
      animIn();
    } catch {
      setPhase('hasil');
    }
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (phase === 'loading' || phase === 'submitting') {
    return (
      <View style={[s.container, s.center]}>
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={s.loadingText}>{phase === 'submitting' ? 'Menghitung hasil...' : 'Memuat soal...'}</Text>
      </View>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <View style={[s.container, s.center]}>
        <Text style={{ fontSize: 48 }}>😕</Text>
        <Text style={s.errorTitle}>Gagal memuat soal</Text>
        <TouchableOpacity style={s.retryBtn} onPress={() => fetchSoal(index)}>
          <Text style={s.retryText}>Coba Lagi</Text>
        </TouchableOpacity>
        <TouchableOpacity style={{ marginTop: 12 }} onPress={() => router.back()}>
          <Text style={{ color: Colors.textMuted, fontSize: FontSize.sm }}>← Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Hasil ────────────────────────────────────────────────────────────────────
  if (phase === 'hasil') {
    const benar = hasil?.benar ?? 0;
    const ttl   = hasil?.total ?? total;
    const skor  = hasil?.skor  ?? Math.round((benar / ttl) * 100);
    const color = skor >= 70 ? Colors.success : skor >= 50 ? Colors.secondary : Colors.error;

    return (
      <View style={s.container}>
        <View style={[s.glow, { backgroundColor: color + '14' }]} />
        <Animated.ScrollView style={{ opacity: fadeAnim }} contentContainerStyle={s.hasilScroll}>
          <Text style={s.hasilEmoji}>{skor >= 70 ? '🏆' : skor >= 50 ? '📈' : '💪'}</Text>
          <Text style={s.hasilTitle}>Sesi Selesai!</Text>

          <View style={[s.hasilScoreCard, { borderColor: color + '50' }]}>
            <Text style={s.hasilScoreLabel}>Nilai Kamu</Text>
            <Text style={[s.hasilScore, { color }]}>{skor}</Text>
            <Text style={s.hasilScoreMax}>/100</Text>
          </View>

          <View style={s.hasilStatsRow}>
            <View style={s.hasilStat}>
              <Text style={[s.hasilStatVal, { color: Colors.success }]}>{benar}</Text>
              <Text style={s.hasilStatLabel}>Benar</Text>
            </View>
            <View style={s.hasilStat}>
              <Text style={[s.hasilStatVal, { color: Colors.error }]}>{ttl - benar}</Text>
              <Text style={s.hasilStatLabel}>Salah</Text>
            </View>
            <View style={s.hasilStat}>
              <Text style={s.hasilStatVal}>{formatTime(timer)}</Text>
              <Text style={s.hasilStatLabel}>Waktu</Text>
            </View>
          </View>

          <Text style={s.hasilMotivasi}>
            {skor >= 70 ? 'Luar biasa! Pertahankan performa ini 🚀'
              : skor >= 50 ? 'Bagus! Terus latihan untuk mencapai nilai sempurna 📈'
              : 'Jangan menyerah! Setiap latihan membuat kamu lebih kuat 💪'}
          </Text>

          <TouchableOpacity style={[s.hasilBtn, { backgroundColor: Colors.primary }]} onPress={() => router.back()}>
            <Text style={s.hasilBtnText}>📚  Latihan Lagi</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.hasilBtn, { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border }]}
            onPress={() => router.replace('/(tabs)')}>
            <Text style={[s.hasilBtnText, { color: Colors.textSecondary }]}>🏠  Kembali ke Beranda</Text>
          </TouchableOpacity>
          <View style={{ height: 80 }} />
        </Animated.ScrollView>
      </View>
    );
  }

  // ── Soal ─────────────────────────────────────────────────────────────────────
  const optionValues = [soal!.opsi_a, soal!.opsi_b, soal!.opsi_c, soal!.opsi_d, soal!.opsi_e].filter(Boolean);
  const prog = (index + 1) / total;

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => Alert.alert('Keluar?', 'Progress akan hilang.', [
          { text: 'Batal' },
          { text: 'Keluar', style: 'destructive', onPress: () => router.back() },
        ])}>
          <Text style={s.exitBtn}>✕</Text>
        </TouchableOpacity>

        <View style={s.progressWrap}>
          <View style={s.progressTrack}>
            <Animated.View style={[s.progressFill, { width: `${prog * 100}%` as any }]} />
          </View>
          <Text style={s.progressLabel}>{index + 1} / {total}</Text>
        </View>

        <View style={s.timerBadge}>
          <Text style={s.timerText}>⏱ {formatTime(timer)}</Text>
        </View>
      </View>

      <Animated.ScrollView style={{ opacity: fadeAnim }} showsVerticalScrollIndicator={false}
        contentContainerStyle={s.soalScroll}>

        {/* Nomor */}
        <View style={s.nomorRow}>
          <View style={s.nomorBadge}><Text style={s.nomorText}>Soal {soal!.nomor}</Text></View>
        </View>

        {/* Wacana */}
        {!!soal!.wacana && (
          <View style={s.wacanaCard}>
            <Text style={s.wacanaLabel}>📄 Wacana / Stimulus</Text>
            <Text style={s.wacanaText}>{soal!.wacana}</Text>
          </View>
        )}

        {/* Pertanyaan */}
        <Text style={s.pertanyaan}>{soal!.pertanyaan}</Text>

        {/* Opsi */}
        <View style={s.opsiList}>
          {optionValues.map((val, i) => {
            const key = OPTIONS[i];
            const selected = pilihan === key;
            return (
              <TouchableOpacity
                key={key}
                style={[s.opsiCard, selected && s.opsiSelected]}
                onPress={() => submitJawab(key)}
                activeOpacity={0.75}
              >
                <View style={[s.opsiKey, selected && s.opsiKeySelected]}>
                  <Text style={[s.opsiKeyText, selected && { color: '#fff' }]}>{key}</Text>
                </View>
                <Text style={[s.opsiVal, selected && { color: Colors.textPrimary }]}>{val}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Navigation */}
        <View style={s.navRow}>
          {index > 0 && (
            <TouchableOpacity style={s.navPrev} onPress={goPrev}>
              <Text style={s.navPrevText}>← Sebelumnya</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[s.navNext, { backgroundColor: index + 1 >= total ? Colors.success : Colors.primary },
              !pilihan && { opacity: 0.5 }]}
            onPress={goNext}
            disabled={!pilihan}
          >
            <Text style={s.navNextText}>
              {index + 1 >= total ? '✅ Selesai' : 'Selanjutnya →'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dot navigator */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.dotNav}>
          {Array.from({ length: total }, (_, i) => (
            <TouchableOpacity key={i} onPress={() => { setIndex(i); fetchSoal(i); }}>
              <View style={[s.dot,
                i === index && s.dotCurrent,
                answers[i] && s.dotAnswered,
              ]} />
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  glow: { position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100 },
  center: { alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 12 },
  errorTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '700' },
  retryBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.xl },
  retryText: { color: '#fff', fontWeight: '700' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  exitBtn: { color: Colors.textMuted, fontSize: 18, fontWeight: '700', paddingRight: 4 },
  progressWrap: { flex: 1, gap: 4 },
  progressTrack: { height: 6, backgroundColor: Colors.surfaceElevated, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  progressLabel: { color: Colors.textMuted, fontSize: 10, textAlign: 'right' },
  timerBadge: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.lg, paddingHorizontal: 10, paddingVertical: 6 },
  timerText: { color: Colors.secondary, fontSize: FontSize.xs, fontWeight: '700' },

  soalScroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  nomorRow: { marginBottom: Spacing.sm },
  nomorBadge: { alignSelf: 'flex-start', backgroundColor: Colors.primary + '20', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: Colors.primary + '40' },
  nomorText: { color: Colors.primaryLight, fontSize: FontSize.xs, fontWeight: '700' },

  wacanaCard: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.xl, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  wacanaLabel: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '700', marginBottom: 6 },
  wacanaText: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 22 },

  pertanyaan: { color: Colors.textPrimary, fontSize: FontSize.base, lineHeight: 26, fontWeight: '500', marginBottom: Spacing.lg },

  opsiList: { gap: Spacing.sm, marginBottom: Spacing.lg },
  opsiCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1.5, borderColor: Colors.border, padding: Spacing.md,
  },
  opsiSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '12' },
  opsiKey: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.surfaceElevated, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  opsiKeySelected: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  opsiKeyText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '800' },
  opsiVal: { flex: 1, color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 22, paddingTop: 4 },

  navRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  navPrev: { paddingVertical: 14, paddingHorizontal: Spacing.md, borderRadius: Radius.xl, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  navPrevText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },
  navNext: { flex: 1, paddingVertical: 14, borderRadius: Radius.xl, alignItems: 'center' },
  navNextText: { color: '#fff', fontSize: FontSize.base, fontWeight: '700' },

  dotNav: { marginBottom: Spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.surfaceElevated, marginRight: 6 },
  dotCurrent: { backgroundColor: Colors.primary, width: 22 },
  dotAnswered: { backgroundColor: Colors.success + '80' },

  // Hasil
  hasilScroll: { paddingHorizontal: Spacing.lg, paddingTop: Platform.OS === 'ios' ? 80 : 60, alignItems: 'center', gap: Spacing.md },
  hasilEmoji: { fontSize: 72 },
  hasilTitle: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: '900' },
  hasilScoreCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 2,
    padding: Spacing.xl, alignItems: 'center', gap: 4, width: width * 0.55,
  },
  hasilScoreLabel: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.5 },
  hasilScore: { fontSize: 72, fontWeight: '900', letterSpacing: -2, lineHeight: 80 },
  hasilScoreMax: { color: Colors.textMuted, fontSize: FontSize.sm },
  hasilStatsRow: { flexDirection: 'row', gap: Spacing.xl },
  hasilStat: { alignItems: 'center', gap: 4 },
  hasilStatVal: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: '800' },
  hasilStatLabel: { color: Colors.textMuted, fontSize: FontSize.xs },
  hasilMotivasi: { color: Colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 22, paddingHorizontal: Spacing.md },
  hasilBtn: {
    width: '100%', paddingVertical: 15, borderRadius: Radius.xl, alignItems: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  hasilBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: '700' },
});

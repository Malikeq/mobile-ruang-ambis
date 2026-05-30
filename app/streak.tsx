import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSize } from '@/constants/theme';
import { API_BASE } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');

// ─── Types ───────────────────────────────────────────────────────────────────

interface Kelemahan { mapel: string; skor: number; jumlah: number }
interface PerMapel  { mapel: string; akurasi: number; total: number }
interface DashData {
  streak_days:    number;
  total_soal:     number;
  total_benar:    number;
  akurasi:        number;
  poin:           number;
  estimasi_skor:  number;
  kelemahan:      Kelemahan[];
  per_mapel:      PerMapel[];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RecapStat({ icon, label, value, color }: {
  icon: string; label: string; value: string; color: string;
}) {
  return (
    <View style={st.statCard}>
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <Text style={[st.statVal, { color }]}>{value}</Text>
      <Text style={st.statLabel}>{label}</Text>
    </View>
  );
}

function SmartFocusCard({ kelemahan, onPress }: {
  kelemahan: Kelemahan[]; onPress: () => void;
}) {
  if (!kelemahan.length) return null;
  const top = kelemahan[0];
  const isKritis = top.skor < 50;
  const accent   = isKritis ? '#EF4444' : '#F59E0B';
  return (
    <TouchableOpacity style={[st.focusCard, { borderColor: accent + '60' }]} onPress={onPress} activeOpacity={0.85}>
      <View style={[st.focusIcon, { backgroundColor: accent + '20' }]}>
        <Text style={{ fontSize: 20 }}>🤖</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={st.focusTitle}>Rekomendasi AI</Text>
        <Text style={[st.focusMapel, { color: accent }]}>
          {top.mapel} — akurasi {Math.round(top.skor)}%
        </Text>
        <Text style={st.focusHint}>Tap untuk mulai latihan fokus</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={accent} />
    </TouchableOpacity>
  );
}

// ─── Milestones ───────────────────────────────────────────────────────────────

const MILESTONES = [
  { days: 3,   emoji: '🌱',     label: '3 Hari — Bibit',       color: '#58CC02' },
  { days: 7,   emoji: '🔥',     label: '1 Minggu',             color: '#FF9600' },
  { days: 14,  emoji: '⚡',     label: '2 Minggu',             color: '#1CB0F6' },
  { days: 30,  emoji: '🔥🔥🔥', label: '1 Bulan — Inferno',    color: '#CE82FF' },
  { days: 50,  emoji: '💥',     label: '50 Hari',              color: '#FF4B4B' },
  { days: 100, emoji: '🌋',     label: '100 Hari',             color: '#DC2626' },
];

function streakEmoji(n: number) {
  if (n >= 100) return '🌋';
  if (n >= 50)  return '💥';
  if (n >= 30)  return '🔥🔥🔥';
  if (n >= 14)  return '⚡';
  if (n >= 7)   return '🔥';
  return '🔥';
}

function nextMilestone(streak: number) {
  return MILESTONES.find(m => m.days > streak) ?? MILESTONES[MILESTONES.length - 1];
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function StreakScreen() {
  const { token } = useAuth();
  const insets    = useSafeAreaInsets();
  const fade      = useRef(new Animated.Value(0)).current;

  const [data,    setData]    = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefresh(true); else setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json.data ?? json);
        Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      }
    } catch (_) {}
    finally { setLoading(false); setRefresh(false); }
  }, [token]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  if (loading) {
    return (
      <View style={[st.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  const streak  = data?.streak_days   ?? 0;
  const soal    = data?.total_soal    ?? 0;
  const akurasi = data?.akurasi       ?? 0;
  const poin    = data?.poin          ?? 0;
  const snbt    = data?.estimasi_skor ?? 0;
  const next    = nextMilestone(streak);
  const pct     = Math.min(1, streak / next.days);
  const kelemahan = data?.kelemahan ?? [];
  const perMapel  = data?.per_mapel  ?? [];

  return (
    <View style={st.container}>
      {/* Header */}
      <View style={[st.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={st.headerTitle}>Learning Recap</Text>
        <View style={{ width: 22 }} />
      </View>

      <Animated.ScrollView
        style={{ opacity: fade }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refresh}
            onRefresh={() => fetchData(true)}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Streak Hero */}
        <View style={st.heroCard}>
          <View style={st.heroTop}>
            <Text style={{ fontSize: 48 }}>{streakEmoji(streak)}</Text>
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={st.heroStreak}>{streak}</Text>
              <Text style={st.heroLabel}>Hari Streak</Text>
            </View>
            <View style={[st.heroBadge, { backgroundColor: Colors.primary + '25', borderColor: Colors.primary + '60' }]}>
              <Text style={[st.heroBadgeTxt, { color: Colors.primary }]}>
                {streak === 0 ? 'Mulai!' : 'AKTIF 🔥'}
              </Text>
            </View>
          </View>
          {/* Progress to next milestone */}
          <View style={{ marginTop: 14 }}>
            <View style={st.milestoneRow}>
              <Text style={st.milestoneTxt}>Menuju {next.emoji} {next.label}</Text>
              <Text style={[st.milestoneTxt, { color: next.color }]}>{streak}/{next.days}</Text>
            </View>
            <View style={st.progressTrack}>
              <View style={[st.progressFill, { width: `${pct * 100}%` as any, backgroundColor: next.color }]} />
            </View>
          </View>
        </View>

        {/* Recap Stats */}
        <Text style={st.sectionTitle}>📊 Rekap Performa</Text>
        <View style={st.statsRow}>
          <RecapStat icon="📝" label="Total Soal"  value={soal.toString()}         color="#1CB0F6" />
          <RecapStat icon="🎯" label="Akurasi"     value={`${Math.round(akurasi)}%`} color="#58CC02" />
          <RecapStat icon="💎" label="Poin"        value={poin.toString()}          color="#FF9600" />
          <RecapStat icon="🏆" label="Est. SNBT"   value={snbt > 0 ? snbt.toString() : '—'} color="#CE82FF" />
        </View>

        {/* Smart AI Focus Card */}
        {kelemahan.length > 0 && (
          <>
            <Text style={st.sectionTitle}>🤖 Rekomendasi Cerdas</Text>
            <View style={{ paddingHorizontal: 16 }}>
              <SmartFocusCard
                kelemahan={kelemahan}
                onPress={() => router.push('/(tabs)/latihan')}
              />
            </View>
          </>
        )}

        {/* Per-Mapel Progress */}
        {perMapel.length > 0 && (
          <>
            <Text style={st.sectionTitle}>📚 Progres per Mapel</Text>
            <View style={{ paddingHorizontal: 16, gap: 10 }}>
              {perMapel.map((m) => {
                const isWeak  = m.akurasi < 50;
                const isGood  = m.akurasi >= 75;
                const barColor = isGood ? '#58CC02' : isWeak ? '#EF4444' : '#F59E0B';
                return (
                  <View key={m.mapel} style={st.mapelRow}>
                    <View style={st.mapelMeta}>
                      <Text style={st.mapelName}>{m.mapel}</Text>
                      <Text style={[st.mapelPct, { color: barColor }]}>{Math.round(m.akurasi)}%</Text>
                    </View>
                    <View style={st.mapelTrack}>
                      <View style={[st.mapelFill, { width: `${m.akurasi}%` as any, backgroundColor: barColor }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Milestone Tracker */}
        <Text style={st.sectionTitle}>🏅 Milestone Streak</Text>
        <View style={{ paddingHorizontal: 16, gap: 8 }}>
          {MILESTONES.map((m) => {
            const done = streak >= m.days;
            const p    = Math.min(1, streak / m.days);
            return (
              <View key={m.days} style={[st.msCard, done && { borderColor: m.color + '50', backgroundColor: m.color + '10' }]}>
                <Text style={[{ fontSize: 22 }, !done && { opacity: 0.25 }]}>{m.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <View style={st.msTopRow}>
                    <Text style={[st.msLabel, done && { color: m.color }]}>{m.label}</Text>
                    <Text style={[st.msPct, { color: m.color }]}>{Math.min(streak, m.days)}/{m.days}</Text>
                  </View>
                  <View style={st.msTrack}>
                    <View style={[st.msFill, { width: `${p * 100}%` as any, backgroundColor: m.color }]} />
                  </View>
                </View>
                {done && <Ionicons name="checkmark-circle" size={20} color={m.color} />}
              </View>
            );
          })}
        </View>

        {/* CTA */}
        <View style={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 140 }}>
          <TouchableOpacity style={st.cta} onPress={() => router.push('/(tabs)/latihan')} activeOpacity={0.85}>
            <Ionicons name="flash" size={20} color="#fff" />
            <Text style={st.ctaTxt}>Latihan Sekarang!</Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1C2333' },
  headerTitle:  { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Hero
  heroCard:     { margin: 16, backgroundColor: '#1C2333', borderRadius: 20, borderWidth: 1, borderColor: '#2A3550', padding: 18 },
  heroTop:      { flexDirection: 'row', alignItems: 'center' },
  heroStreak:   { color: '#fff', fontSize: 42, fontWeight: '900', lineHeight: 48 },
  heroLabel:    { color: '#6B7280', fontSize: 13, fontWeight: '600' },
  heroBadge:    { borderRadius: 99, borderWidth: 1.5, paddingHorizontal: 10, paddingVertical: 5 },
  heroBadgeTxt: { fontSize: 11, fontWeight: '800' },
  milestoneRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  milestoneTxt: { color: '#9CA3AF', fontSize: 11, fontWeight: '600' },
  progressTrack:{ height: 8, backgroundColor: '#2A3550', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },

  // Section title
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: '800', marginLeft: 16, marginTop: 18, marginBottom: 10 },

  // Recap stats
  statsRow:     { flexDirection: 'row', paddingHorizontal: 12, gap: 8 },
  statCard:     { flex: 1, backgroundColor: '#1C2333', borderRadius: 14, borderWidth: 1, borderColor: '#2A3550', padding: 12, alignItems: 'center', gap: 4 },
  statVal:      { fontSize: 18, fontWeight: '900' },
  statLabel:    { color: '#6B7280', fontSize: 9, fontWeight: '600', textAlign: 'center' },

  // Smart focus card
  focusCard:    { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1C2333', borderRadius: 16, borderWidth: 1.5, padding: 14, marginBottom: 4 },
  focusIcon:    { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  focusTitle:   { color: '#9CA3AF', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  focusMapel:   { fontSize: 14, fontWeight: '800', marginTop: 2 },
  focusHint:    { color: '#6B7280', fontSize: 10, marginTop: 2 },

  // Per mapel
  mapelRow:     { gap: 6 },
  mapelMeta:    { flexDirection: 'row', justifyContent: 'space-between' },
  mapelName:    { color: '#D1D5DB', fontSize: 12, fontWeight: '600' },
  mapelPct:     { fontSize: 12, fontWeight: '800' },
  mapelTrack:   { height: 7, backgroundColor: '#2A3550', borderRadius: 4, overflow: 'hidden' },
  mapelFill:    { height: '100%', borderRadius: 4 },

  // Milestones
  msCard:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1C2333', borderRadius: 14, borderWidth: 1, borderColor: '#2A3550', padding: 14 },
  msTopRow:     { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  msLabel:      { color: '#fff', fontSize: 12, fontWeight: '700' },
  msPct:        { fontSize: 11, fontWeight: '700' },
  msTrack:      { height: 7, backgroundColor: '#2A3550', borderRadius: 4, overflow: 'hidden' },
  msFill:       { height: '100%', borderRadius: 4 },

  // CTA
  cta:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: 16, paddingVertical: 16 },
  ctaTxt:       { color: '#fff', fontSize: 16, fontWeight: '800' },
});

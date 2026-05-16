import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { API_BASE } from '@/lib/api';

const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const DAYS   = ['Sen','Sel','Rab','Kam','Jum','Sab','Min'];

interface StreakData {
  current_streak: number;
  longest_streak: number;
  total_days_active: number;
  activity_calendar: Record<string, boolean>; // "YYYY-MM-DD": true
}

function MotivationQuote({ streak }: { streak: number }) {
  const quotes = [
    { min: 0,  text: 'Satu langkah kecil hari ini, satu langkah besar menuju PTN impianmu!', emoji: '🌱' },
    { min: 3,  text: '3 hari pertama sudah kamu lalui! Momentum sudah terbentuk.', emoji: '⚡' },
    { min: 7,  text: 'Seminggu penuh! Kamu sudah membuktikan konsistensimu.', emoji: '🔥' },
    { min: 14, text: '2 minggu! Otakmu mulai membentuk kebiasaan belajar yang kuat.', emoji: '🧠' },
    { min: 30, text: 'Sebulan! Kamu termasuk 5% pelajar paling konsisten di platform ini.', emoji: '🏆' },
    { min: 60, text: '2 bulan! Kamu adalah inspirasi bagi semua pejuang PTN.', emoji: '👑' },
  ];
  const q = [...quotes].reverse().find(q => streak >= q.min) ?? quotes[0];
  return (
    <View style={styles.quoteCard}>
      <Text style={styles.quoteEmoji}>{q.emoji}</Text>
      <Text style={styles.quoteText}>{q.text}</Text>
    </View>
  );
}

function HeatmapCalendar({ calendar }: { calendar: Record<string, boolean> }) {
  const today = new Date();
  // Build last 12 weeks of data
  const weeks: { date: string; active: boolean; isToday: boolean }[][] = [];
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 83); // ~12 weeks back
  // Align to Monday
  const dow = startDate.getDay();
  startDate.setDate(startDate.getDate() - (dow === 0 ? 6 : dow - 1));

  let week: typeof weeks[0] = [];
  const cursor = new Date(startDate);
  while (cursor <= today) {
    const key = cursor.toISOString().slice(0, 10);
    const isToday = key === today.toISOString().slice(0, 10);
    week.push({ date: key, active: !!calendar[key], isToday });
    if (week.length === 7) { weeks.push(week); week = []; }
    cursor.setDate(cursor.getDate() + 1);
  }
  if (week.length > 0) weeks.push(week);

  return (
    <View style={styles.heatmap}>
      {/* Day labels */}
      <View style={styles.heatmapDayLabels}>
        {DAYS.map(d => <Text key={d} style={styles.heatmapDayLabel}>{d}</Text>)}
      </View>
      {/* Weeks */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.heatmapGrid}>
          {weeks.map((week, wi) => (
            <View key={wi} style={styles.heatmapWeek}>
              {week.map((day, di) => (
                <View key={di} style={[
                  styles.heatmapCell,
                  day.active && styles.heatmapCellActive,
                  day.isToday && styles.heatmapCellToday,
                ]} />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export default function StreakScreen() {
  const { token } = useAuth();
  const [data, setData] = useState<StreakData>({
    current_streak: 0, longest_streak: 0,
    total_days_active: 0, activity_calendar: {},
  });
  const [loading, setLoading] = useState(true);

  const flameScale = useRef(new Animated.Value(1)).current;
  const fadeAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(flameScale, { toValue: 1.15, duration: 700, useNativeDriver: true }),
        Animated.timing(flameScale, { toValue: 1,    duration: 700, useNativeDriver: true }),
      ])
    ).start();
    fetchStreak();
  }, []);

  const fetchStreak = async () => {
    try {
      const res  = await fetch(`${API_BASE}/dashboard/streak`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const json = await res.json();
      setData(json?.data ?? data);
    } catch {}
    finally { setLoading(false); }
  };

  const STATS = [
    { label: 'Streak Saat Ini', value: data.current_streak, unit: 'hari', color: Colors.secondary, emoji: '🔥' },
    { label: 'Streak Terpanjang', value: data.longest_streak, unit: 'hari', color: Colors.primary, emoji: '🏆' },
    { label: 'Total Aktif', value: data.total_days_active, unit: 'hari', color: Colors.success, emoji: '📅' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.glow} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Back */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backText}>← Beranda</Text>
          </TouchableOpacity>

          {/* Hero */}
          <View style={styles.hero}>
            <Animated.Text style={[styles.heroFlame, { transform: [{ scale: flameScale }] }]}>
              🔥
            </Animated.Text>
            <Text style={styles.heroCount}>{data.current_streak}</Text>
            <Text style={styles.heroLabel}>Hari Berturut-turut</Text>
            {data.current_streak === 0 && (
              <View style={styles.heroBrokenBadge}>
                <Text style={styles.heroBrokenText}>Mulai streak barumu hari ini!</Text>
              </View>
            )}
          </View>

          {/* Motivation */}
          <MotivationQuote streak={data.current_streak} />

          {/* Stats */}
          <View style={styles.statsRow}>
            {STATS.map((s, i) => (
              <View key={i} style={[styles.statCard, { borderColor: s.color + '40' }]}>
                <Text style={{ fontSize: 22 }}>{s.emoji}</Text>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statUnit}>{s.unit}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Calendar heatmap */}
          <Text style={styles.sectionTitle}>📆 Kalender Aktivitas</Text>
          <View style={styles.card}>
            <HeatmapCalendar calendar={data.activity_calendar} />
            <View style={styles.heatmapLegend}>
              <Text style={styles.legendLabel}>Kurang</Text>
              {[0.2, 0.45, 0.7, 1].map((op, i) => (
                <View key={i} style={[styles.legendDot, { backgroundColor: Colors.secondary, opacity: op }]} />
              ))}
              <Text style={styles.legendLabel}>Banyak</Text>
            </View>
          </View>

          {/* Milestones */}
          <Text style={styles.sectionTitle}>🏅 Milestone Streak</Text>
          <View style={styles.card}>
            {[
              { days: 3,  label: '3 Hari',    desc: 'Percikan awal!',      emoji: '✨' },
              { days: 7,  label: 'Seminggu',  desc: 'Kebiasaan terbentuk', emoji: '⚡' },
              { days: 14, label: '2 Minggu',  desc: 'Konsistensi nyata',   emoji: '🔥' },
              { days: 30, label: 'Sebulan',   desc: 'Pejuang sejati',      emoji: '🏆' },
              { days: 60, label: '2 Bulan',   desc: 'Legenda belajar',     emoji: '👑' },
              { days: 100,label: '100 Hari',  desc: 'Tak tertandingi',     emoji: '💎' },
            ].map((m, i, arr) => {
              const done = data.current_streak >= m.days || data.longest_streak >= m.days;
              const next = !done && (i === 0 || data.current_streak >= arr[i-1].days);
              return (
                <View key={i} style={[styles.milestoneRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.border }]}>
                  <View style={[styles.milestoneIcon, {
                    backgroundColor: done ? Colors.secondary + '25' : Colors.surfaceElevated,
                  }]}>
                    <Text style={{ fontSize: 20, opacity: done ? 1 : 0.3 }}>{m.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.milestoneName, done && { color: Colors.secondary }]}>{m.label}</Text>
                    <Text style={styles.milestoneDesc}>{m.desc}</Text>
                  </View>
                  {done
                    ? <Text style={styles.milestoneDone}>✅</Text>
                    : next
                    ? <View style={styles.milestoneNext}><Text style={styles.milestoneNextText}>Berikutnya</Text></View>
                    : <Text style={styles.milestoneLocked}>🔒</Text>
                  }
                </View>
              );
            })}
          </View>

          {/* CTA */}
          <TouchableOpacity style={styles.latihanBtn} onPress={() => router.push('/(tabs)/latihan')}>
            <Text style={styles.latihanBtnText}>📚  Latihan Sekarang untuk Jaga Streak</Text>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  glow: { position: 'absolute', top: -60, left: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: Colors.secondary + '14' },
  scroll: { paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingHorizontal: Spacing.lg },

  backBtn: { marginBottom: Spacing.lg },
  backText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },

  hero: { alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xl },
  heroFlame: { fontSize: 72 },
  heroCount: { color: Colors.secondary, fontSize: 80, fontWeight: '900', lineHeight: 88, letterSpacing: -4 },
  heroLabel: { color: Colors.textSecondary, fontSize: FontSize.base, fontWeight: '600' },
  heroBrokenBadge: { backgroundColor: Colors.primary + '20', borderRadius: Radius.lg, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: Colors.primary + '40' },
  heroBrokenText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '700' },

  quoteCard: {
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.secondary + '30',
    padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  quoteEmoji: { fontSize: 30 },
  quoteText: { flex: 1, color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20, fontStyle: 'italic' },

  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1.5, padding: Spacing.md, alignItems: 'center', gap: 3,
  },
  statValue: { fontSize: FontSize.xl, fontWeight: '900', letterSpacing: -0.5 },
  statUnit: { color: Colors.textMuted, fontSize: 9 },
  statLabel: { color: Colors.textMuted, fontSize: 9, textAlign: 'center' },

  sectionTitle: { color: Colors.textPrimary, fontSize: FontSize.base, fontWeight: '700', marginBottom: Spacing.sm },

  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
    marginBottom: Spacing.lg, padding: Spacing.md,
  },

  heatmap: { gap: 4 },
  heatmapDayLabels: { flexDirection: 'column', gap: 4, marginRight: 6 },
  heatmapDayLabel: { color: Colors.textMuted, fontSize: 8, height: 12, lineHeight: 12 },
  heatmapGrid: { flexDirection: 'row', gap: 3 },
  heatmapWeek: { flexDirection: 'column', gap: 3 },
  heatmapCell: { width: 12, height: 12, borderRadius: 2, backgroundColor: Colors.surfaceElevated },
  heatmapCellActive: { backgroundColor: Colors.secondary + 'CC' },
  heatmapCellToday: { borderWidth: 1.5, borderColor: Colors.primary },
  heatmapLegend: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: Spacing.sm, justifyContent: 'flex-end' },
  legendDot: { width: 10, height: 10, borderRadius: 2 },
  legendLabel: { color: Colors.textMuted, fontSize: 9 },

  milestoneRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  milestoneIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  milestoneName: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '700' },
  milestoneDesc: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  milestoneDone: { fontSize: 20 },
  milestoneNext: { backgroundColor: Colors.primary + '20', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.primary + '40' },
  milestoneNextText: { color: Colors.primaryLight, fontSize: 9, fontWeight: '700' },
  milestoneLocked: { fontSize: 18, opacity: 0.4 },

  latihanBtn: {
    backgroundColor: Colors.secondary, borderRadius: Radius.xl, padding: 16, alignItems: 'center',
    shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
    marginBottom: Spacing.lg,
  },
  latihanBtnText: { color: '#000', fontSize: FontSize.base, fontWeight: '800' },
});

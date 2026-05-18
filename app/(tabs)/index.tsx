import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Dimensions, Platform, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { API_BASE } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';


const { width } = Dimensions.get('window');

// ── Types ──────────────────────────────────────────────────────────────────────
// Flat shape (what TargetScoreCard expects)
interface Target {
  kampusLabel: string;   // display name (akronim or nama)
  jurusanLabel: string;  // display name
  target_nilai: number;
  skor_saat_ini: number;
}
// Raw API shape (backend may return nested objects OR flat strings)
interface TargetRaw {
  kampus:        any;  // string | { nama: string; akronim?: string; }
  jurusan:       any;  // string | { nama: string; passing_grade_estimate?: number; }
  target_nilai?: number;
  skor_saat_ini?:number;
  passing_grade_estimate?: number;
}
function normalizeTarget(raw: TargetRaw): Target {
  const k = raw.kampus;
  const j = raw.jurusan;
  return {
    kampusLabel:   typeof k === 'string' ? k : (k?.akronim || k?.nama || 'PTN'),
    jurusanLabel:  typeof j === 'string' ? j : (j?.nama || 'Jurusan'),
    target_nilai:  raw.target_nilai ?? (typeof j === 'object' ? j?.passing_grade_estimate : 0) ?? 0,
    skor_saat_ini: raw.skor_saat_ini ?? 0,
  };
}

interface MapelProg { mapel: string; skor: number; }
interface DashData {
  total_soal_dijawab: number; rata_rata_skor: number;
  streak: number; longest_streak?: number;
  skor_snbt_estimasi?: number;
  has_skor_data?: boolean;
  akurasi_overall?: number;
  mapel_progress?: MapelProg[];
  kelemahan?: { mapel: string; topik: string; skor: number }[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function greet(name: string) {
  const h = new Date().getHours();
  return `${h < 11 ? 'Pagi' : h < 15 ? 'Siang' : h < 18 ? 'Sore' : 'Malam'}, ${name.split(' ')[0]}`;
}
function pct(val: number, max: number) { return Math.min(100, Math.max(0, (val / max) * 100)); }

// ── Streak Flame Card ──────────────────────────────────────────────────────────
function StreakCard({ streak, longest }: { streak: number; longest: number }) {

  const flameScale = useRef(new Animated.Value(1)).current;
  const flameOp    = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(flameScale, { toValue: 1.12, duration: 800, useNativeDriver: true }),
          Animated.timing(flameOp,    { toValue: 0.85, duration: 800, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(flameScale, { toValue: 1,    duration: 800, useNativeDriver: true }),
          Animated.timing(flameOp,    { toValue: 1,    duration: 800, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  // Mini 7-day calendar
  const days = Array.from({ length: 7 }, (_, i) => i < streak % 7 || streak >= 7);

  return (
    <TouchableOpacity style={styles.streakCard} onPress={() => router.push('/streak')} activeOpacity={0.88}>
      {/* Glow background */}
      <View style={styles.streakGlow} />

      <View style={styles.streakLeft}>
        <Text style={styles.streakBadge}>{streak > 0 ? '🔥 STREAK AKTIF' : '🎯 MULAI STREAK'}</Text>
        <View style={styles.streakRow}>
          <Animated.Text style={[styles.streakFlame, { transform: [{ scale: flameScale }], opacity: flameOp }]}>
            🔥
          </Animated.Text>
          <Text style={styles.streakCount}>{streak > 0 ? streak : '—'}</Text>
          <Text style={styles.streakUnit}>hari</Text>
        </View>
        <Text style={styles.streakSub}>
          {streak > 0 ? `Terpanjang: ${longest} hari · Jangan putus!` : 'Mulai streak hari ini dengan latihan! 💪'}
        </Text>

        {/* 7-day dots */}
        <View style={styles.streakDots}>
          {days.map((active, i) => (
            <View key={i} style={[styles.streakDot, active && styles.streakDotActive]} />
          ))}
        </View>
      </View>

      <View style={styles.streakRight}>
        <Text style={styles.streakArrow}>›</Text>
        <Text style={styles.streakTapHint}>Lihat detail</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Target Score Card ──────────────────────────────────────────────────────────
function TargetScoreCard({ target, rank }: { target: Target; rank: number }) {
  const gap   = target.target_nilai - target.skor_saat_ini;
  const prog  = pct(target.skor_saat_ini, target.target_nilai);
  const color = prog >= 90 ? Colors.success : prog >= 60 ? Colors.secondary : Colors.error;
  const width_anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(width_anim, {
      toValue: prog,
      duration: 800,
      delay: rank * 120,
      useNativeDriver: false,
    }).start();
  }, [prog]);

  return (
    <View style={[styles.targetCard, { borderColor: color + '40' }]}>
      <View style={styles.targetTop}>
        <View style={[styles.targetRankBadge, { backgroundColor: color + '25' }]}>
          <Text style={[styles.targetRank, { color }]}>#{rank}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.targetKampus}>{target.kampusLabel}</Text>
          <Text style={styles.targetJurusan} numberOfLines={1}>{target.jurusanLabel}</Text>
        </View>
        <View style={[styles.targetGapBadge, { backgroundColor: gap <= 0 ? Colors.success + '20' : Colors.error + '18' }]}>
          <Text style={[styles.targetGapText, { color: gap <= 0 ? Colors.success : Colors.error }]}>
            {gap <= 0 ? '✅' : `-${gap}`}
          </Text>
        </View>
      </View>

      <View style={styles.targetProgressRow}>
        <View style={styles.targetTrack}>
          <Animated.View style={[styles.targetFill, {
            backgroundColor: color,
            width: width_anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
          }]} />
        </View>
        <Text style={[styles.targetPct, { color }]}>{Math.round(prog)}%</Text>
      </View>

      <View style={styles.targetScoreRow}>
        <View style={styles.targetScoreItem}>
          <Text style={styles.targetScoreLabel}>Skor kamu</Text>
          <Text style={[styles.targetScoreValue, { color }]}>{target.skor_saat_ini || '—'}</Text>
        </View>
        <View style={styles.targetScoreDivider} />
        <View style={styles.targetScoreItem}>
          <Text style={styles.targetScoreLabel}>Target masuk</Text>
          <Text style={styles.targetScoreValue}>{target.target_nilai}</Text>
        </View>
        <View style={styles.targetScoreDivider} />
        <View style={styles.targetScoreItem}>
          <Text style={styles.targetScoreLabel}>Selisih</Text>
          <Text style={[styles.targetScoreValue, { color: gap <= 0 ? Colors.success : Colors.error }]}>
            {gap <= 0 ? 'Cukup!' : `${gap} pts`}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ── Quick Action ───────────────────────────────────────────────────────────────
function QAction({ emoji, label, color, onPress }: { emoji: string; label: string; color: string; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[styles.qAction, { borderColor: color + '40' }]}
        onPress={() => {
          Animated.sequence([
            Animated.timing(scale, { toValue: 0.93, duration: 60, useNativeDriver: true }),
            Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
          ]).start();
          onPress();
        }}
        activeOpacity={1}
      >
        <View style={[styles.qActionIcon, { backgroundColor: color + '22' }]}>
          <Text style={styles.qActionEmoji}>{emoji}</Text>
        </View>
        <Text style={[styles.qActionLabel, { color }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { user, token } = useAuth();
  const [data,           setData]      = useState<DashData | null>(null);
  const [targets,        setTargets]   = useState<Target[]>([]);
  const [refreshing,     setRef]       = useState(false);
  const [skorTarget,     setSkorTarget] = useState<number | null>(null);
  const [namaTarget,     setNamaTarget] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    fetchAll();
  }, []);

  const fetchAll = async (isRef = false) => {
    if (isRef) setRef(true);
    try {
      const headers = { Authorization: `Bearer ${token}`, Accept: 'application/json' };
      const [dashRes, targetRes, peluangRes] = await Promise.all([
        fetch(`${API_BASE}/dashboard`,         { headers }),
        fetch(`${API_BASE}/user/targets`,       { headers }),
        fetch(`${API_BASE}/user/peluang-lolos`, { headers }),
      ]);
      const dash    = await dashRes.json();
      const tarRes  = await targetRes.json();
      const peluang = await peluangRes.json();
      setData(dash?.data ?? null);
      setTargets((tarRes?.data ?? []).map(normalizeTarget));
      setSkorTarget(peluang?.skor_target_utama ?? null);
      setNamaTarget(peluang?.nama_target_utama ?? null);
    } catch {
      setData({ total_soal_dijawab: 0, rata_rata_skor: 0, streak: 0 });
    } finally { setRef(false); }
  };

  const streak   = data?.streak ?? 0;
  const longest  = data?.longest_streak ?? streak;
  const soal     = data?.total_soal_dijawab ?? 0;
  // Use backend-computed SNBT estimasi; fallback to rata_rata_skor
  const skor     = data?.skor_snbt_estimasi ?? data?.rata_rata_skor ?? 0;
  const hasSkor  = data?.has_skor_data ?? (skor > 0);
  const mapels   = data?.mapel_progress ?? [];
  const kelems   = data?.kelemahan ?? [];

  return (
    <View style={styles.container}>
      <View style={[styles.glow, { top: -100, left: -60, backgroundColor: Colors.primary + '18' }]} />
      <View style={[styles.glow, { top: 300, right: -80, backgroundColor: Colors.secondary + '10' }]} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAll(true)} tintColor={Colors.primary} />}
      >
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* ── Header ───────────────────────────────────────────── */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>👋 {greet(user?.name ?? 'Pejuang')}</Text>
              <Text style={styles.headerTitle}>
                {soal === 0 ? 'Ayo mulai belajar hari ini!' : 'Tetap semangat, kamu bisa!'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profil')}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(user?.name ?? 'U')[0].toUpperCase()}</Text>
                {user?.tier === 'premium' && <View style={styles.premiumDot} />}
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Streak Card ─────────────────────────────────────── */}
          <StreakCard streak={streak} longest={longest} />

          {/* ── SNBT Score Hero ──────────────────────────────────── */}
          <TouchableOpacity style={styles.scoreHero} onPress={() => router.push('/peluang-lolos')} activeOpacity={0.88}>
            {/* Left: user skor */}
            <View style={styles.scoreHeroLeft}>
              <Text style={styles.scoreHeroLabel}>⚡ SKOR ESTIMASIMU</Text>
              {hasSkor && skor > 0 ? (
                <>
                  <Text style={[styles.scoreHeroValue, { color: skor >= 700 ? Colors.success : skor >= 550 ? Colors.secondary : Colors.error }]}>
                    {Math.round(skor)}
                  </Text>
                  <Text style={styles.scoreHeroSub}>
                    {skor >= 700 ? '🏆 Top 10%' : skor >= 550 ? '📈 Di atas rata' : '💪 Perlu ditingkatkan'}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.scoreHeroValue, { color: Colors.textMuted, fontSize: 28 }]}>—</Text>
                  <View style={styles.skorCta}>
                    <Ionicons name="calculator-outline" size={11} color={Colors.primary} />
                    <Text style={styles.skorCtaTxt}>Hitung Estimasi →</Text>
                  </View>
                </>
              )}
            </View>

            {/* Divider */}
            <View style={styles.scoreHeroDivider} />

            {/* Right: skor diperlukan PTN target #1 */}
            <View style={styles.scoreHeroRight}>
              <Text style={styles.scoreHeroLabel}>🎯 DIPERLUKAN PTN</Text>
              {skorTarget ? (
                <>
                  <Text style={[styles.scoreHeroValue, { color: '#F59E0B', fontSize: 28 }]}>
                    {Math.round(skorTarget)}
                  </Text>
                  <Text style={styles.scoreHeroSub} numberOfLines={1}>
                    {namaTarget ?? 'Target #1'}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.scoreHeroValue, { color: Colors.textMuted, fontSize: 28 }]}>—</Text>
                  <Text style={styles.scoreHeroSub}>Atur target PTN</Text>
                </>
              )}
            </View>
          </TouchableOpacity>

          {/* Gap indicator */}
          {hasSkor && skor > 0 && skorTarget && (
            <View style={styles.gapIndicator}>
              {(() => {
                const gap = Math.round(skor - skorTarget);
                const color = gap >= 0 ? Colors.success : '#EF4444';
                return (
                  <>
                    <Ionicons name={gap >= 0 ? 'checkmark-circle' : 'trending-up'} size={14} color={color} />
                    <Text style={[styles.gapTxt, { color }]}>
                      {gap >= 0
                        ? `Skormu sudah ${gap} poin di atas target aman! 🎉`
                        : `Butuh +${Math.abs(gap)} poin lagi untuk aman di target PTN-mu`}
                    </Text>
                  </>
                );
              })()}
            </View>
          )}

          {/* ── Target PTN ──────────────────────────────────────── */}
          {targets.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>🎯 Target PTN & Skormu</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/profil')}>
                  <Text style={styles.sectionLink}>Edit →</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.targetScroll}>
                {targets.map((t, i) => (
                  <View key={i} style={{ marginRight: Spacing.sm }}>
                    <TargetScoreCard target={t} rank={i + 1} />
                  </View>
                ))}
              </ScrollView>
            </>
          )}

          {/* ── Peluang Lolos Banner ─────────────────────────────── */}
          <TouchableOpacity style={styles.peluangBanner} onPress={() => router.push('/peluang-lolos')} activeOpacity={0.85}>
            <View style={styles.peluangLeft}>
              <Text style={styles.peluangLabel}>🎯 PELUANG LOLOS PTN</Text>
              <Text style={styles.peluangTitle}>Cek skor aman & keketatan prodi</Text>
              <Text style={styles.peluangSub}>Formula IRT + data SNPMB real-time</Text>
            </View>
            <View style={styles.peluangRight}>
              <View style={[styles.statusDot, { backgroundColor: Colors.success }]} />
              <View style={[styles.statusDot, { backgroundColor: Colors.secondary }]} />
              <View style={[styles.statusDot, { backgroundColor: Colors.error }]} />
              <Ionicons name="chevron-forward" size={18} color={Colors.primary} style={{ marginTop: 6 }} />
            </View>
          </TouchableOpacity>

          {/* ── Quick Actions ────────────────────────────────────── */}
          <Text style={styles.sectionTitle}>Mulai Belajar</Text>
          <View style={styles.qGrid}>
            <QAction emoji="📝" label="Latihan"  color={Colors.primary}   onPress={() => router.push('/(tabs)/latihan')} />
            <QAction emoji="⚡" label="Tryout"   color={Colors.secondary} onPress={() => router.push('/(tabs)/latihan')} />
            <QAction emoji="🎯" label="Peluang"  color={Colors.success}   onPress={() => router.push('/peluang-lolos')} />
            <QAction emoji="🤖" label="AI Tutor" color="#8B5CF6"          onPress={() => router.push('/ai-chat')} />
          </View>

          {/* ── AI Feature Cards ─────────────────────────────────── */}
          <Text style={styles.sectionTitle}>🤖 Fitur AI Unggulan</Text>
          <View style={{ gap: 10, marginBottom: Spacing.lg }}>
            {/* Strategi Belajar */}
            <TouchableOpacity style={[styles.aiFeatCard, { borderColor: Colors.primary + '50' }]} onPress={() => router.push('/ai-chat')} activeOpacity={0.85}>
              <View style={[styles.aiFeatIcon, { backgroundColor: Colors.primary + '20' }]}>
                <Text style={{ fontSize: 24 }}>🧠</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.aiFeatTitle}>Strategi Belajar Personal</Text>
                <Text style={styles.aiFeatDesc}>AI analisa kelemahanmu & buat jadwal belajar 30 hari</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
            {/* Analisis Lolos */}
            <TouchableOpacity style={[styles.aiFeatCard, { borderColor: '#10B981' + '50' }]} onPress={() => router.push('/ai-chat')} activeOpacity={0.85}>
              <View style={[styles.aiFeatIcon, { backgroundColor: '#10B981' + '20' }]}>
                <Text style={{ fontSize: 24 }}>🎯</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.aiFeatTitle}>Analisis Peluang Lolos SNBT/SNBP</Text>
                <Text style={styles.aiFeatDesc}>Prediksi berbasis skor & histori kompetisi PTN tujuan</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
            {/* Bank Soal */}
            <TouchableOpacity style={[styles.aiFeatCard, { borderColor: Colors.secondary + '50' }]} onPress={() => router.push('/(tabs)/latihan')} activeOpacity={0.85}>
              <View style={[styles.aiFeatIcon, { backgroundColor: Colors.secondary + '20' }]}>
                <Text style={{ fontSize: 24 }}>📚</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.aiFeatTitle}>Bank Soal AI-Generated</Text>
                <Text style={styles.aiFeatDesc}>Ribuan soal SNBT per sub-materi dengan pembahasan DCSEF</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* ── Jadwal Ujian ─────────────────────────────────────── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📅 Jadwal Ujian</Text>
            <TouchableOpacity onPress={() => router.push('/streak')}>
              <Text style={styles.sectionLink}>Countdown →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
            {[
              { label: 'SNBT 2026', emoji: '📝', date: '23 Apr 2026', color: Colors.primary,   days: Math.max(0,Math.ceil((new Date('2026-04-23').getTime()-Date.now())/86400000)) },
              { label: 'SNBP 2026', emoji: '🎓', date: '18 Mar 2026', color: Colors.success,   days: Math.max(0,Math.ceil((new Date('2026-03-18').getTime()-Date.now())/86400000)) },
              { label: 'UM UGM',    emoji: '🏛️', date: '1 Jun 2026',  color: '#8B5CF6',        days: Math.max(0,Math.ceil((new Date('2026-06-01').getTime()-Date.now())/86400000)) },
              { label: 'SIMAK UI', emoji: '🏫', date: '15 Jun 2026', color: '#EC4899',        days: Math.max(0,Math.ceil((new Date('2026-06-15').getTime()-Date.now())/86400000)) },
            ].map((e, i) => (
              <TouchableOpacity key={i} style={[styles.examCard, { borderColor: e.color + '50' }]} onPress={() => router.push('/streak')}>
                <Text style={{ fontSize: 24 }}>{e.emoji}</Text>
                <Text style={[styles.examDays, { color: e.color }]}>{e.days}</Text>
                <Text style={styles.examDaysLabel}>hari lagi</Text>
                <Text style={styles.examName}>{e.label}</Text>
                <Text style={styles.examDate}>{e.date}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── Mapel Progress ────────────────────────────────────── */}
          {mapels.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>📈 Progres per Mapel</Text>
              </View>
              <View style={styles.card}>
                {mapels.slice(0, 6).map((m, i) => {
                  const c = m.skor >= 70 ? Colors.success : m.skor >= 50 ? Colors.secondary : Colors.error;
                  return (
                    <View key={i} style={[styles.mapelRow, i < mapels.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.border }]}>
                      <Text style={styles.mapelName}>{m.mapel}</Text>
                      <View style={styles.mapelBarWrap}>
                        <View style={styles.mapelTrack}>
                          <View style={[styles.mapelFill, { width: `${m.skor}%` as any, backgroundColor: c }]} />
                        </View>
                        <Text style={[styles.mapelPct, { color: c }]}>{Math.round(m.skor)}%</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* ── Empty → First time ───────────────────────────────── */}
          {soal === 0 && targets.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={{ fontSize: 56 }}>🚀</Text>
              <Text style={styles.emptyTitle}>Perjalananmu dimulai di sini!</Text>
              <Text style={styles.emptyDesc}>
                Kerjakan latihan pertama supaya AI bisa menganalisis kemampuanmu dan membuat rencana belajar personal.
              </Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(tabs)/latihan')}>
                <Text style={styles.emptyBtnText}>Mulai Latihan Pertama →</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 150 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  glow: { position: 'absolute', width: 280, height: 280, borderRadius: 140 },
  scroll: { paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingHorizontal: Spacing.lg },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  greeting: { color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: 2 },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '800', letterSpacing: -0.3 },
  avatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  avatarText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '800' },
  premiumDot: {
    position: 'absolute', bottom: -1, right: -1,
    width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.secondary,
    borderWidth: 2, borderColor: Colors.background,
  },

  // Streak
  streakCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.xl, borderWidth: 1.5, borderColor: Colors.secondary + '40',
    padding: Spacing.md, marginBottom: Spacing.lg,
    flexDirection: 'row', alignItems: 'center',
    overflow: 'hidden',
  },
  streakGlow: {
    position: 'absolute', top: -30, left: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: Colors.secondary + '15',
  },
  streakLeft: { flex: 1, gap: 4 },
  streakBadge: { color: Colors.secondary, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  streakRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  streakFlame: { fontSize: 32 },
  streakCount: { color: Colors.secondary, fontSize: 48, fontWeight: '900', lineHeight: 56, letterSpacing: -2 },
  streakUnit: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },
  streakSub: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  streakDots: { flexDirection: 'row', gap: 5, marginTop: 8 },
  streakDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  streakDotActive: { backgroundColor: Colors.secondary },
  streakRight: { alignItems: 'center', gap: 2 },
  streakArrow: { color: Colors.secondary, fontSize: 24, fontWeight: '700' },
  streakTapHint: { color: Colors.textMuted, fontSize: 9 },

  // Score hero
  scoreHero: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1.5, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.lg,
    flexDirection: 'row', alignItems: 'center',
  },
  scoreHeroLeft: { flex: 1, gap: 4 },
  scoreHeroLabel: { color: Colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  scoreHeroValue: { fontSize: 52, fontWeight: '900', letterSpacing: -2, lineHeight: 60 },
  scoreHeroSub: { color: Colors.textSecondary, fontSize: FontSize.xs },
  scoreHeroStats: {
    borderLeftWidth: 1, borderLeftColor: Colors.border,
    paddingLeft: Spacing.md, gap: 12, alignItems: 'center',
  },
  miniStat: { alignItems: 'center', gap: 2 },
  miniStatValue: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '800' },
  miniStatLabel: { color: Colors.textMuted, fontSize: 9, fontWeight: '600' },
  miniStatDiv: { width: 24, height: 1, backgroundColor: Colors.border },

  // Targets
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { color: Colors.textPrimary, fontSize: FontSize.base, fontWeight: '700', marginBottom: Spacing.sm },
  sectionLink: { color: Colors.primaryLight, fontSize: FontSize.xs, fontWeight: '600' },
  targetScroll: { marginHorizontal: -Spacing.lg, paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  targetCard: {
    width: width * 0.75, backgroundColor: Colors.surface,
    borderRadius: Radius.xl, borderWidth: 1.5, padding: Spacing.md, gap: Spacing.sm,
  },
  targetTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  targetRankBadge: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  targetRank: { fontSize: FontSize.xs, fontWeight: '800' },
  targetKampus: { color: Colors.textPrimary, fontSize: FontSize.base, fontWeight: '800' },
  targetJurusan: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 1 },
  targetGapBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  targetGapText: { fontSize: FontSize.xs, fontWeight: '800' },
  targetProgressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  targetTrack: { flex: 1, height: 8, backgroundColor: Colors.surfaceElevated, borderRadius: 4, overflow: 'hidden' },
  targetFill: { height: '100%', borderRadius: 4 },
  targetPct: { width: 36, fontSize: FontSize.xs, fontWeight: '800', textAlign: 'right' },
  targetScoreRow: { flexDirection: 'row', paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  targetScoreItem: { flex: 1, alignItems: 'center', gap: 2 },
  targetScoreDivider: { width: 1, backgroundColor: Colors.border },
  targetScoreLabel: { color: Colors.textMuted, fontSize: 9 },
  targetScoreValue: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '800' },

  // Quick actions
  qGrid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  qAction: {
    flex: 1, backgroundColor: Colors.surface,
    borderRadius: Radius.xl, borderWidth: 1.5,
    padding: 12, alignItems: 'center', gap: 6,
  },
  qActionIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  qActionEmoji: { fontSize: 22 },
  qActionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },

  // Mapel
  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.lg, overflow: 'hidden' },
  mapelRow: { paddingHorizontal: Spacing.md, paddingVertical: 12 },
  mapelName: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600', marginBottom: 6 },
  mapelBarWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  mapelTrack: { flex: 1, height: 6, backgroundColor: Colors.surfaceElevated, borderRadius: 3, overflow: 'hidden' },
  mapelFill: { height: '100%', borderRadius: 3 },
  mapelPct: { width: 34, fontSize: FontSize.xs, fontWeight: '800', textAlign: 'right' },

  // Empty
  emptyCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.xl, alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg,
  },
  emptyTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '800', textAlign: 'center' },
  emptyDesc: { color: Colors.textSecondary, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: 14,
    borderRadius: Radius.xl,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  emptyBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: '700' },

  // AI Feature Cards
  aiFeatCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1.5, padding: Spacing.md,
  },
  aiFeatIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  aiFeatTitle: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '700', marginBottom: 2 },
  aiFeatDesc: { color: Colors.textMuted, fontSize: 11, lineHeight: 16 },

  // Exam countdown cards
  examCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1.5, padding: Spacing.md,
    alignItems: 'center', gap: 2, marginRight: Spacing.sm, width: 110,
  },
  examDays: { fontSize: 28, fontWeight: '900', lineHeight: 34 },
  examDaysLabel: { color: Colors.textMuted, fontSize: 9, fontWeight: '600' },
  examName: { color: Colors.textPrimary, fontSize: FontSize.xs, fontWeight: '800', textAlign: 'center', marginTop: 4 },
  examDate: { color: Colors.textMuted, fontSize: 9, textAlign: 'center' },

  // Peluang Lolos Banner
  peluangBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.primary + '12',
    borderRadius: Radius.xl, borderWidth: 1.5, borderColor: Colors.primary + '40',
    padding: Spacing.md, marginBottom: Spacing.lg,
  },
  peluangLeft: { flex: 1, gap: 3 },
  peluangLabel: { color: Colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  peluangTitle: { color: Colors.textPrimary, fontSize: FontSize.base, fontWeight: '800' },
  peluangSub: { color: Colors.textMuted, fontSize: 10 },
  peluangRight: { alignItems: 'center', gap: 3, paddingLeft: Spacing.sm },
  statusDot: { width: 10, height: 10, borderRadius: 5 },

  // Skor CTA (new user, no skor yet)
  skorCta: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.primary + '18', borderRadius: 10, borderWidth: 1, borderColor: Colors.primary + '40', paddingHorizontal: 10, paddingVertical: 6, marginTop: 4, alignSelf: 'flex-start' },
  skorCtaTxt: { color: Colors.primary, fontSize: 11, fontWeight: '700' },

  // Score hero divider + right panel
  scoreHeroDivider: { width: 1, backgroundColor: Colors.border, marginHorizontal: 4, alignSelf: 'stretch' },
  scoreHeroRight: { flex: 1, gap: 4, paddingLeft: 4 },

  // Gap indicator below score hero
  gapIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 10, marginTop: -4 },
  gapTxt: { flex: 1, fontSize: 12, fontWeight: '600', lineHeight: 18 },
});



import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { API_BASE } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { SkeletonStreak } from '@/components/ui/Skeleton';

const { width: SCREEN_W } = Dimensions.get('window');
const NODE_SIZE = 72;
/** Jarak vertikal tetap antar baris (termasuk ruang bintang) */
const NODE_ROW_H = 112;
const PATH_PAD = 24;
/** Geser kiri/kanan dari tengah — pola simetris */
const ZIGZAG_AMP = 56;

type IonIcon = ComponentProps<typeof Ionicons>['name'];
type NodeState = 'completed' | 'current' | 'locked';

interface PathStep {
  id: string;
  daysRequired: number;
  icon?: IonIcon;
  emoji?: string;
  label: string;
  subtitle?: string;
}

interface KelemahanItem {
  mapel?: { nama?: string };
  sub_materi?: { nama?: string };
  accuracy_rate?: number;
}

interface DashData {
  streak?: number;
  points?: number;
  total_soal_dikerjakan?: number;
  akurasi_overall?: number;
  skor_snbt_estimasi?: number;
  sesi_hari_ini?: number;
  user?: { last_active?: string | null };
  kelemahan_kritis?: KelemahanItem[];
}

function daysSince(iso?: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

function buildPersonalTip(kelemahan: KelemahanItem[], streak: number): string {
  const top = kelemahan[0];
  if (top) {
    const mapel = top.mapel?.nama ?? top.sub_materi?.nama ?? 'area lemah';
    const acc = Math.round(top.accuracy_rate ?? 0);
    if (streak === 0) {
      return `💡 Mulai streak dengan latihan ${mapel} — akurasi kamu baru ${acc}%.`;
    }
    return `💡 Pertahankan streak dengan fokus ${mapel} (akurasi ${acc}%).`;
  }
  if (streak === 0) return '💡 Kerjakan minimal 1 sesi hari ini untuk memulai streak SNBT-mu!';
  return '💡 Latihan harian 10–15 menit cukup untuk menjaga konsistensi streak!';
}

const PATH_STEPS: PathStep[] = [
  { id: 'today', daysRequired: 0, icon: 'chatbubbles', label: 'Latihan Harian', subtitle: 'Kerjakan soal hari ini' },
  { id: 'd3', daysRequired: 3, emoji: '🌱', label: '3 Hari', subtitle: 'Bibit Streak' },
  { id: 'd7', daysRequired: 7, icon: 'flame', label: '1 Minggu', subtitle: 'Api menyala' },
  { id: 'd14', daysRequired: 14, icon: 'flash', label: '2 Minggu', subtitle: 'Konsisten' },
  { id: 'd30', daysRequired: 30, emoji: '🔥', label: '1 Bulan', subtitle: 'Inferno' },
  { id: 'd50', daysRequired: 50, icon: 'barbell', label: '50 Hari', subtitle: 'Elite' },
  { id: 'd100', daysRequired: 100, emoji: '🌋', label: '100 Hari', subtitle: 'Legenda SNBT' },
];

/**
 * Zigzag simetris: tengah → kanan → tengah → kiri → ulang
 * Indeks 0,2,4… = tengah · ganjil kanan · genap>0 kiri (setelah fase pertama)
 */
function zigzagOffset(index: number): number {
  const phase = index % 4;
  if (phase === 0) return 0;
  if (phase === 1) return ZIGZAG_AMP;
  if (phase === 2) return 0;
  return -ZIGZAG_AMP;
}

function isStepCompleted(step: PathStep, streak: number, index: number): boolean {
  if (index > 0) {
    const prev = PATH_STEPS[index - 1];
    if (!isStepCompleted(prev, streak, index - 1)) return false;
  }
  if (step.id === 'today') return streak > 0;
  return streak >= step.daysRequired;
}

function getNodeState(step: PathStep, streak: number, index: number): NodeState {
  const currentIdx = PATH_STEPS.findIndex((p, i) => !isStepCompleted(p, streak, i));
  const activeIdx = currentIdx === -1 ? PATH_STEPS.length - 1 : currentIdx;
  if (index === activeIdx) return 'current';
  return isStepCompleted(step, streak, index) ? 'completed' : 'locked';
}

function starCount(step: PathStep, streak: number, state: NodeState): number {
  if (state === 'locked') return 0;
  if (state === 'current') {
    if (step.daysRequired === 0) return streak > 0 ? 3 : 0;
    const p = streak / step.daysRequired;
    if (p >= 1) return 3;
    if (p >= 0.66) return 2;
    if (p >= 0.33) return 1;
    return 0;
  }
  const over = streak - step.daysRequired;
  if (over >= 7) return 3;
  if (over >= 3) return 2;
  return 3;
}

function StarRow({ filled }: { filled: number }) {
  return (
    <View style={st.stars}>
      {[0, 1, 2].map((i) => (
        <Ionicons
          key={i}
          name={i < filled ? 'star' : 'star-outline'}
          size={14}
          color={i < filled ? Colors.secondary : Colors.borderLight}
        />
      ))}
    </View>
  );
}

function PathNode({
  step,
  state,
  isStart,
  stars,
  onPress,
}: {
  step: PathStep;
  state: NodeState;
  isStart: boolean;
  stars: number;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (!isStart) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.06, duration: 700, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [isStart, scale]);

  const locked = state === 'locked';
  const completed = state === 'completed';
  const current = state === 'current';

  const faceColor = locked
    ? Colors.surfaceElevated
    : completed
      ? Colors.primaryLight
      : Colors.primary;
  const rimColor = locked ? Colors.borderLight : Colors.primaryDark;
  const bottomColor = locked ? '#111827' : Colors.primaryDark;

  const inner = (
    <TouchableOpacity
      style={st.nodeTouch}
      activeOpacity={locked ? 1 : 0.85}
      onPress={locked ? undefined : onPress}
      disabled={locked}
    >
      {isStart && (
        <View style={st.startBubble}>
          <View style={st.startBubbleInner}>
            <Text style={st.startBubbleText} numberOfLines={1} allowFontScaling={false}>
              MULAI
            </Text>
          </View>
          <View style={st.startBubbleTail} />
        </View>
      )}

      {current && <View style={st.progressRing} />}

      <View style={[st.nodeShadow, { backgroundColor: bottomColor }]}>
        <View style={[st.nodeFace, { backgroundColor: faceColor, borderColor: rimColor }]}>
          {step.emoji ? (
            <Text style={[st.nodeEmoji, locked && st.dimmed]}>{step.emoji}</Text>
          ) : (
            <Ionicons
              name={step.icon ?? 'star'}
              size={32}
              color={locked ? Colors.textMuted : '#fff'}
            />
          )}
        </View>
      </View>

      {step.daysRequired > 0 && (completed || current) && (
        <View style={st.starWrap}>
          <StarRow filled={stars} />
        </View>
      )}
    </TouchableOpacity>
  );

  if (isStart) {
    return <Animated.View style={{ transform: [{ scale }] }}>{inner}</Animated.View>;
  }
  return inner;
}

function SectionBanner({
  streak,
  sectionLabel,
  unitLabel,
}: {
  streak: number;
  sectionLabel: string;
  unitLabel: string;
}) {
  return (
    <View style={st.banner}>
      <View style={st.bannerMain}>
        <Text style={st.bannerSection}>{sectionLabel}</Text>
        <Text style={st.bannerTitle}>{unitLabel}</Text>
        <View style={st.bannerStreakRow}>
          <Text style={st.bannerStreakEmoji}>🔥</Text>
          <Text style={st.bannerStreakNum}>{streak}</Text>
          <Text style={st.bannerStreakLabel}>hari streak</Text>
        </View>
      </View>
      <View style={st.bannerDivider} />
      <TouchableOpacity
        style={st.bannerGuide}
        onPress={() => router.push('/(tabs)/latihan')}
        activeOpacity={0.8}
      >
        <Ionicons name="book-outline" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

export default function StreakScreen() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const fade = useRef(new Animated.Value(0)).current;

  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);

  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefresh(true);
      else setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          setData(json.data ?? json);
          Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
        setRefresh(false);
      }
    },
    [token, fade],
  );

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  if (loading) {
    return (
      <View style={st.screen}>
        <View style={[st.topBar, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={st.topTitle}>Jalur Streak</Text>
          <View style={{ width: 22 }} />
        </View>
        <SkeletonStreak />
      </View>
    );
  }

  const streak = data?.streak ?? 0;
  const totalSoal = data?.total_soal_dikerjakan ?? 0;
  const daysGap = daysSince(data?.user?.last_active);
  const sesiHariIni = data?.sesi_hari_ini ?? 0;
  const kelemahan = data?.kelemahan_kritis ?? [];
  const streakBroken = streak === 0 && totalSoal > 0;
  const streakLost = totalSoal > 0 && daysGap !== null && daysGap > 1;
  const streakAtRisk = streak > 0 && sesiHariIni === 0 && daysGap !== null && daysGap >= 1;
  const personalTip = buildPersonalTip(kelemahan, streak);
  const currentIdx = PATH_STEPS.findIndex((p, i) => !isStepCompleted(p, streak, i));
  const currentId = currentIdx === -1 ? PATH_STEPS[PATH_STEPS.length - 1].id : PATH_STEPS[currentIdx].id;
  const nextStep = PATH_STEPS[currentIdx === -1 ? PATH_STEPS.length - 1 : currentIdx];
  const showStartBubble =
    PATH_STEPS[0]?.id === currentId && getNodeState(PATH_STEPS[0], streak, 0) === 'current';

  return (
    <View style={st.screen}>
      <View style={[st.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={st.topTitle}>Jalur Streak</Text>
        <View style={{ width: 22 }} />
      </View>

      <Animated.ScrollView
        style={{ opacity: fade }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refresh}
            onRefresh={() => fetchData(true)}
            tintColor={Colors.primaryLight}
            colors={[Colors.primary]}
          />
        }
      >
        <View style={st.scrollInner}>
          <SectionBanner
            streak={streak}
            sectionLabel="BAB STREAK · SNBT"
            unitLabel={nextStep.subtitle ?? nextStep.label}
          />

          {(streakBroken || streakLost) && (
            <View style={st.brokenBanner}>
              <Ionicons name="warning" size={18} color={Colors.error} />
              <View style={{ flex: 1 }}>
                <Text style={st.brokenTitle}>Streak terputus</Text>
                <Text style={st.brokenDesc}>
                  {streakLost
                    ? `Terakhir latihan ${daysGap} hari lalu. Mulai lagi hari ini!`
                    : 'Kamu pernah latihan sebelumnya — yuk bangun streak baru!'}
                </Text>
              </View>
            </View>
          )}

          {streakAtRisk && !streakBroken && !streakLost && (
            <View style={st.atRiskBanner}>
              <Ionicons name="flame-outline" size={18} color={Colors.secondary} />
              <Text style={st.atRiskTxt}>
                Belum latihan hari ini — jangan sampai streak {streak} hari terputus!
              </Text>
            </View>
          )}

          <View style={st.tipCard}>
            <Text style={st.tipText}>{personalTip}</Text>
          </View>

          <View style={st.statsStrip}>
            <View style={st.statPill}>
              <Text style={st.statPillVal}>{totalSoal}</Text>
              <Text style={st.statPillLbl}>Soal</Text>
            </View>
            <View style={st.statPill}>
              <Text style={st.statPillVal}>{Math.round(data?.akurasi_overall ?? 0)}%</Text>
              <Text style={st.statPillLbl}>Akurasi</Text>
            </View>
            <View style={st.statPill}>
              <Text style={st.statPillVal}>{data?.points ?? 0}</Text>
              <Text style={st.statPillLbl}>Poin</Text>
            </View>
          </View>

          <View style={[st.pathArea, { paddingTop: showStartBubble ? 48 : 12 }]}>
            <Text style={st.pathMascot}>🎓</Text>

            {PATH_STEPS.map((step, index) => {
              const state = getNodeState(step, streak, index);
              const isStart = step.id === currentId && state === 'current';
              const stars = starCount(step, streak, state);

              return (
                <View key={step.id} style={[st.pathRow, { height: NODE_ROW_H }]}>
                  <View style={[st.pathRowInner, { transform: [{ translateX: zigzagOffset(index) }] }]}>
                    <PathNode
                      step={step}
                      state={state}
                      isStart={isStart}
                      stars={stars}
                      onPress={() => router.push('/(tabs)/latihan')}
                    />
                  </View>
                </View>
              );
            })}
          </View>

          <TouchableOpacity
            style={st.cta}
            onPress={() => router.push('/(tabs)/latihan')}
            activeOpacity={0.88}
          >
            <Ionicons name="flash" size={22} color="#fff" />
            <Text style={st.ctaText}>
              {streak === 0 ? 'Mulai Streak Hari Ini' : 'Lanjutkan Latihan'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  centered: { justifyContent: 'center', alignItems: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  topTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: '800' },
  scrollInner: { paddingHorizontal: PATH_PAD, paddingTop: Spacing.md },

  brokenBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.error + '14',
    borderWidth: 1,
    borderColor: Colors.error + '40',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  brokenTitle: { color: Colors.error, fontSize: 13, fontWeight: '800' },
  brokenDesc: { color: Colors.textSecondary, fontSize: 12, marginTop: 2, lineHeight: 17 },
  atRiskBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.secondary + '14',
    borderWidth: 1,
    borderColor: Colors.secondary + '40',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  atRiskTxt: { flex: 1, color: Colors.textSecondary, fontSize: 12, fontWeight: '600', lineHeight: 17 },
  tipCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  tipText: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19, fontWeight: '600' },

  banner: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderBottomWidth: 4,
    borderBottomColor: Colors.primaryDark,
  },
  bannerMain: { flex: 1, padding: Spacing.md },
  bannerSection: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  bannerTitle: { color: '#fff', fontSize: 20, fontWeight: '900', marginTop: 2 },
  bannerStreakRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 6 },
  bannerStreakEmoji: { fontSize: 18 },
  bannerStreakNum: { color: '#fff', fontSize: 22, fontWeight: '900' },
  bannerStreakLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  bannerDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)', marginVertical: 12 },
  bannerGuide: { width: 56, alignItems: 'center', justifyContent: 'center', paddingRight: 4 },

  statsStrip: { flexDirection: 'row', gap: 8, marginTop: Spacing.md, marginBottom: Spacing.lg },
  statPill: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statPillVal: { color: Colors.primaryLight, fontSize: 16, fontWeight: '900' },
  statPillLbl: { color: Colors.textMuted, fontSize: 10, fontWeight: '600', marginTop: 2 },

  pathArea: {
    position: 'relative',
    width: SCREEN_W,
    marginHorizontal: -PATH_PAD,
    paddingBottom: Spacing.md,
    overflow: 'visible',
  },
  pathMascot: {
    position: 'absolute',
    right: SCREEN_W * 0.06,
    top: 80,
    fontSize: 80,
    opacity: 0.09,
    pointerEvents: 'none',
  },
  pathRow: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathRowInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  nodeTouch: {
    width: NODE_SIZE,
    alignItems: 'center',
    overflow: 'visible',
  },
  startBubble: {
    position: 'absolute',
    top: -50,
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
  },
  startBubbleInner: {
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderColor: Colors.primary,
    minWidth: 88,
    alignItems: 'center',
  },
  startBubbleText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    includeFontPadding: false,
  },
  startBubbleTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Colors.primary,
    marginTop: -1,
  },
  progressRing: {
    position: 'absolute',
    width: NODE_SIZE + 16,
    height: NODE_SIZE + 16,
    borderRadius: (NODE_SIZE + 16) / 2,
    borderWidth: 4,
    borderColor: 'rgba(59,130,246,0.35)',
    top: -8,
    left: -8,
    zIndex: 0,
  },
  nodeShadow: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: NODE_SIZE / 2,
    paddingBottom: 5,
  },
  nodeFace: {
    width: NODE_SIZE,
    height: NODE_SIZE - 5,
    borderRadius: NODE_SIZE / 2,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeEmoji: { fontSize: 34 },
  dimmed: { opacity: 0.45 },
  starWrap: {
    position: 'absolute',
    bottom: -18,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  stars: { flexDirection: 'row', gap: 2 },

  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    marginTop: Spacing.lg,
    borderBottomWidth: 4,
    borderBottomColor: Colors.primaryDark,
  },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});

import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Platform, RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { pengawasApi, RankingSiswa } from '@/lib/api';

const PW_GREEN   = '#059669';
const PW_GREEN_L = '#10B981';

type Periode = 'minggu' | 'bulan' | 'all';

const PERIODE_OPTS: { id: Periode; label: string }[] = [
  { id: 'minggu', label: 'Minggu Ini' },
  { id: 'bulan',  label: 'Bulan Ini' },
  { id: 'all',    label: 'All-time' },
];

const MEDAL = ['🥇', '🥈', '🥉'];
const MEDAL_COLOR = ['#F59E0B', '#94A3B8', '#CD7F32'];

function TopPodium({ ranking }: { ranking: RankingSiswa[] }) {
  if (ranking.length < 3) return null;
  const [second, first, third] = [ranking[1], ranking[0], ranking[2]];

  const PodiumItem = ({
    siswa, medal, height, color, rank,
  }: {
    siswa: RankingSiswa; medal: string; height: number; color: string; rank: number;
  }) => (
    <TouchableOpacity
      style={pod.item}
      onPress={() => router.push({ pathname: '/(pengawas)/siswa/[id]', params: { id: siswa.id } })}
      activeOpacity={0.8}
    >
      <Text style={pod.medal}>{medal}</Text>
      <View style={[pod.avatar, { backgroundColor: color + '20', borderColor: color + '60' }]}>
        <Text style={[pod.avatarText, { color }]}>{siswa.name.charAt(0)}</Text>
      </View>
      <Text style={pod.name} numberOfLines={1}>{siswa.name.split(' ')[0]}</Text>
      <Text style={[pod.snbt, { color }]}>{Math.round(siswa.avg_snbt) || '—'}</Text>
      <View style={[pod.block, { height, backgroundColor: color + '25', borderColor: color + '50' }]}>
        <Text style={[pod.rankNum, { color }]}>#{rank}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={pod.wrap}>
      <PodiumItem siswa={second} medal={MEDAL[1]} height={60} color={MEDAL_COLOR[1]} rank={2} />
      <PodiumItem siswa={first}  medal={MEDAL[0]} height={90} color={MEDAL_COLOR[0]} rank={1} />
      <PodiumItem siswa={third}  medal={MEDAL[2]} height={45} color={MEDAL_COLOR[2]} rank={3} />
    </View>
  );
}

const pod = StyleSheet.create({
  wrap:       { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center',
                gap: 8, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  item:       { flex: 1, alignItems: 'center', gap: 4 },
  medal:      { fontSize: 24 },
  avatar:     { width: 48, height: 48, borderRadius: 24, borderWidth: 2,
                alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: FontSize.lg, fontWeight: '900' },
  name:       { color: Colors.textPrimary, fontSize: 11, fontWeight: '700', maxWidth: 90, textAlign: 'center' },
  snbt:       { fontSize: FontSize.md, fontWeight: '900' },
  block:      { width: '100%', borderRadius: Radius.md, borderWidth: 1, borderTopLeftRadius: 8,
                borderTopRightRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rankNum:    { fontSize: FontSize.sm, fontWeight: '900' },
});

function RankRow({ siswa, rank }: { siswa: RankingSiswa; rank: number }) {
  const isTop3 = rank <= 3;
  return (
    <TouchableOpacity
      style={[rr.wrap, isTop3 && { backgroundColor: MEDAL_COLOR[rank - 1] + '08', borderColor: MEDAL_COLOR[rank - 1] + '30' }]}
      onPress={() => router.push({ pathname: '/(pengawas)/siswa/[id]', params: { id: siswa.id } })}
      activeOpacity={0.8}
    >
      {/* Rank */}
      <View style={[rr.rankBadge, isTop3 && { backgroundColor: MEDAL_COLOR[rank - 1] + '20' }]}>
        <Text style={[rr.rankText, isTop3 && { color: MEDAL_COLOR[rank - 1] }]}>
          {isTop3 ? MEDAL[rank - 1] : rank}
        </Text>
      </View>

      {/* Avatar */}
      <View style={[rr.avatar, { backgroundColor: PW_GREEN + '20' }]}>
        <Text style={rr.avatarText}>{siswa.name.charAt(0)}</Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={rr.name} numberOfLines={1}>{siswa.name}</Text>
        <View style={rr.meta}>
          <Ionicons name="flame" size={10} color="#EF4444" />
          <Text style={rr.metaText}>{siswa.streak_days} hari streak</Text>
          <Text style={rr.sep}>·</Text>
          <Text style={rr.metaText}>{siswa.total_sesi} sesi</Text>
        </View>
      </View>

      {/* Score */}
      <View style={rr.scoreBox}>
        {siswa.avg_snbt > 0 ? (
          <>
            <Text style={[rr.score, { color: PW_GREEN }]}>{Math.round(siswa.avg_snbt)}</Text>
            <Text style={rr.scoreLabel}>SNBT</Text>
          </>
        ) : (
          <Text style={rr.noScore}>—</Text>
        )}
      </View>

      <Ionicons name="chevron-forward" size={13} color={Colors.border} />
    </TouchableOpacity>
  );
}

const rr = StyleSheet.create({
  wrap:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
                backgroundColor: Colors.surface, borderRadius: Radius.xl,
                borderWidth: 1, borderColor: Colors.border,
                marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, padding: Spacing.md },
  rankBadge:  { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
                backgroundColor: Colors.surfaceElevated },
  rankText:   { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '900' },
  avatar:     { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { color: PW_GREEN, fontSize: FontSize.md, fontWeight: '900' },
  name:       { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '700' },
  meta:       { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaText:   { color: Colors.textMuted, fontSize: 10, fontWeight: '600' },
  sep:        { color: Colors.border, fontSize: 10 },
  scoreBox:   { alignItems: 'flex-end', marginRight: 4 },
  score:      { fontSize: FontSize.md, fontWeight: '900' },
  scoreLabel: { color: Colors.textMuted, fontSize: 8, fontWeight: '700' },
  noScore:    { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '700' },
});

export default function RankingScreen() {
  const [ranking,  setRanking]  = useState<RankingSiswa[]>([]);
  const [periode,  setPeriode]  = useState<Periode>('minggu');
  const [loading,  setLoading]  = useState(true);
  const [refresh,  setRefresh]  = useState(false);

  const load = useCallback(async (p: Periode = periode, isRefresh = false) => {
    if (isRefresh) setRefresh(true); else setLoading(true);
    try {
      const res = await pengawasApi.getRanking(p);
      setRanking(res.data ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); setRefresh(false); }
  }, [periode]);

  useFocusEffect(useCallback(() => { load(periode); }, [periode]));

  const changePeriode = (p: Periode) => {
    setPeriode(p);
    load(p);
  };

  const top3    = ranking.slice(0, 3);
  const rest    = ranking.slice(3);

  return (
    <View style={st.root}>
      {/* Header */}
      <View style={st.header}>
        <TouchableOpacity onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={22} color={Colors.textMuted} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={st.title}>Ranking Sekolah</Text>
          <Text style={st.subtitle}>{ranking.length} siswa dalam peringkat</Text>
        </View>
      </View>

      {/* Periode tabs */}
      <View style={st.periodeRow}>
        {PERIODE_OPTS.map(opt => (
          <TouchableOpacity
            key={opt.id}
            style={[st.periodeBtn, periode === opt.id && { backgroundColor: PW_GREEN, borderColor: PW_GREEN }]}
            onPress={() => changePeriode(opt.id)}
            activeOpacity={0.8}
          >
            <Text style={[st.periodeBtnText, periode === opt.id && { color: '#fff' }]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={st.loader}><ActivityIndicator color={PW_GREEN} size="large" /></View>
      ) : ranking.length === 0 ? (
        <View style={st.empty}>
          <Ionicons name="trophy-outline" size={56} color={Colors.textMuted} />
          <Text style={st.emptyTitle}>Belum Ada Data</Text>
          <Text style={st.emptySub}>Belum ada siswa yang latihan dalam periode ini</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 160, paddingTop: Spacing.md }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => load(periode, true)} tintColor={PW_GREEN} />}
        >
          {/* Podium top 3 */}
          {top3.length >= 3 && (
            <View style={st.podiumWrap}>
              <Text style={st.sectionLabel}>🏆 Top 3 Pekan Ini</Text>
              <TopPodium ranking={top3} />
            </View>
          )}

          {/* Rest of list */}
          {rest.length > 0 && (
            <>
              <Text style={[st.sectionLabel, { marginHorizontal: Spacing.lg, marginBottom: Spacing.sm }]}>
                Peringkat Lainnya
              </Text>
              {rest.map((s, i) => (
                <RankRow key={s.id} siswa={s} rank={i + 4} />
              ))}
            </>
          )}

          {/* If top3 < 3, show as simple list */}
          {top3.length < 3 && ranking.map((s, i) => (
            <RankRow key={s.id} siswa={s} rank={i + 1} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  root:         { flex: 1, backgroundColor: Colors.background },
  header:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
                  paddingTop: Platform.OS === 'ios' ? 56 : 44,
                  paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  title:        { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: '900' },
  subtitle:     { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },

  periodeRow:   { flexDirection: 'row', gap: Spacing.sm,
                  paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  periodeBtn:   { flex: 1, alignItems: 'center', paddingVertical: 9,
                  backgroundColor: Colors.surface, borderRadius: Radius.xl,
                  borderWidth: 1, borderColor: Colors.border },
  periodeBtnText:{ color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '700' },

  loader:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty:        { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
                  paddingHorizontal: Spacing.xl },
  emptyTitle:   { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '900' },
  emptySub:     { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 22 },

  podiumWrap:   { marginBottom: Spacing.lg },
  sectionLabel: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '900',
                  marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
});

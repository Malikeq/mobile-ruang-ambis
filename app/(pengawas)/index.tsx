import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Animated, Platform, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import {
  pengawasApi,
  PengawasOverview, RankingSiswa, KelemahanKelas, AktivitasHarian,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const PW_GREEN   = '#059669';
const PW_GREEN_L = '#10B981';

interface DashState {
  overview:    PengawasOverview | null;
  ranking:     RankingSiswa[];
  kelemahan:   KelemahanKelas[];
  aktivitas:   AktivitasHarian[];
  atRiskSum:   Record<string, number>;
}

function timeSince(dateStr?: string): string {
  if (!dateStr) return 'Belum pernah';
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (h < 1)  return 'Baru saja';
  if (h < 24) return `${h} jam lalu`;
  if (d < 7)  return `${d} hari lalu`;
  return `${d} hari lalu`;
}

/** Simple horizontal bar chart — no external lib */
function MiniBarChart({ data }: { data: AktivitasHarian[] }) {
  const max = Math.max(...data.map(d => d.siswa_aktif), 1);
  const last7 = data.slice(-7);
  return (
    <View style={ch.wrap}>
      {last7.map((d, i) => {
        const pct = d.siswa_aktif / max;
        const isToday = i === last7.length - 1;
        return (
          <View key={d.tanggal} style={ch.col}>
            <View style={ch.barBg}>
              <View style={[ch.bar, {
                height: `${Math.max(pct * 100, 5)}%`,
                backgroundColor: isToday ? PW_GREEN : PW_GREEN + '60',
              }]} />
            </View>
            <Text style={[ch.lbl, isToday && { color: PW_GREEN_L }]}>
              {new Date(d.tanggal).toLocaleDateString('id-ID', { weekday: 'narrow' })}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const ch = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 64, marginTop: Spacing.sm },
  col:   { flex: 1, alignItems: 'center', gap: 4 },
  barBg: { flex: 1, width: '100%', justifyContent: 'flex-end', borderRadius: 4, overflow: 'hidden',
            backgroundColor: Colors.surfaceElevated },
  bar:   { width: '100%', borderRadius: 4 },
  lbl:   { color: Colors.textMuted, fontSize: 8, fontWeight: '700' },
});

export default function PengawasDashboard() {
  const { user } = useAuth();
  const [state,   setState]   = useState<DashState>({ overview: null, ranking: [], kelemahan: [], aktivitas: [], atRiskSum: {} });
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefresh(true); else setLoading(true);
    try {
      const [ovRes, rkRes, kwRes, akRes, arRes] = await Promise.all([
        pengawasApi.overview(),
        pengawasApi.getRanking('minggu'),
        pengawasApi.getKelemahanKelas(),
        pengawasApi.getAktivitasHarian(7),
        pengawasApi.getAtRisk(),
      ]);
      setState({
        overview:  ovRes.data,
        ranking:   rkRes.data.slice(0, 3),
        kelemahan: kwRes.data.slice(0, 3),
        aktivitas: akRes.data,
        atRiskSum: arRes.summary ?? {},
      });
      if (!isRefresh) {
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      }
    } catch {
      // handle silently
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const ov = state.overview;
  const totalAtRisk = (state.atRiskSum.tidak_aktif ?? 0) +
                      (state.atRiskSum.akurasi_rendah ?? 0) +
                      (state.atRiskSum.belum_latihan ?? 0);

  const firstName = user?.name?.split(' ')[0] ?? 'Pengawas';
  const now = new Date();
  const greeting = now.getHours() < 11 ? 'Selamat pagi' : now.getHours() < 15 ? 'Selamat siang' : 'Selamat sore';

  if (loading) return (
    <View style={st.loader}>
      <ActivityIndicator color={PW_GREEN} size="large" />
      <Text style={st.loaderText}>Memuat data sekolah...</Text>
    </View>
  );

  return (
    <Animated.ScrollView
      style={{ flex: 1, backgroundColor: Colors.background }}
      contentContainerStyle={{ paddingBottom: 160 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => load(true)} tintColor={PW_GREEN} />}
    >
      {/* ── Header ──────────────────────────────────── */}
      <View style={st.header}>
        <View style={{ flex: 1 }}>
          <Text style={st.greeting}>{greeting},</Text>
          <Text style={st.name}>{firstName} 👋</Text>
          {ov?.sekolah && (
            <View style={st.schoolPill}>
              <Ionicons name="business" size={11} color={PW_GREEN} />
              <Text style={st.schoolPillText} numberOfLines={1}>{ov.sekolah.nama}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={st.notifBtn} onPress={() => router.push('/(pengawas)/pengaturan')}>
          <Ionicons name="settings-outline" size={20} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* ── Stats Row ───────────────────────────────── */}
      <View style={st.statsRow}>
        <StatCard value={ov?.aktif_hari_ini ?? 0} total={ov?.total_siswa} label="Aktif Hari Ini" icon="flash" color={PW_GREEN} />
        <StatCard value={Math.round(ov?.avg_snbt ?? 0)} label="Rata SNBT" icon="trophy" color="#F59E0B" />
        <StatCard value={ov?.streak_bagus ?? 0} label="Streak ≥7" icon="flame" color="#EF4444" />
        <StatCard value={ov?.sesi_minggu_ini ?? 0} label="Sesi/Minggu" icon="book" color="#8B5CF6" />
      </View>

      {/* ── At-Risk Alert ───────────────────────────── */}
      {totalAtRisk > 0 && (
        <TouchableOpacity style={st.atRiskCard} onPress={() => router.push('/(pengawas)/at-risk')} activeOpacity={0.85}>
          <View style={st.atRiskLeft}>
            <View style={st.atRiskIcon}>
              <Ionicons name="warning" size={18} color="#F59E0B" />
            </View>
            <View>
              <Text style={st.atRiskTitle}>⚠️ {totalAtRisk} Siswa Perlu Perhatian</Text>
              <View style={st.atRiskBadges}>
                {(state.atRiskSum.tidak_aktif ?? 0) > 0 && (
                  <View style={st.badge}><Text style={st.badgeText}>{state.atRiskSum.tidak_aktif} tdk aktif</Text></View>
                )}
                {(state.atRiskSum.akurasi_rendah ?? 0) > 0 && (
                  <View style={[st.badge, { backgroundColor: '#EF444420', borderColor: '#EF4444' }]}>
                    <Text style={[st.badgeText, { color: '#EF4444' }]}>{state.atRiskSum.akurasi_rendah} akurasi rendah</Text>
                  </View>
                )}
                {(state.atRiskSum.belum_latihan ?? 0) > 0 && (
                  <View style={[st.badge, { backgroundColor: Colors.border }]}>
                    <Text style={[st.badgeText, { color: Colors.textMuted }]}>{state.atRiskSum.belum_latihan} blm latihan</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </TouchableOpacity>
      )}

      {/* ── Activity Chart ──────────────────────────── */}
      <SectionCard title="📊 Aktivitas 7 Hari" onPress={() => router.push('/(pengawas)/analisis')}>
        {state.aktivitas.length > 0
          ? <MiniBarChart data={state.aktivitas} />
          : <Text style={st.empty}>Belum ada data aktivitas</Text>
        }
        <View style={st.chartLegend}>
          <Text style={st.chartLegendText}>
            {state.aktivitas.at(-1)?.siswa_aktif ?? 0} siswa aktif hari ini
          </Text>
          <Text style={[st.chartLegendText, { color: Colors.textMuted }]}>
            Total minggu ini: {ov?.sesi_minggu_ini ?? 0} sesi
          </Text>
        </View>
      </SectionCard>

      {/* ── Top Ranking ─────────────────────────────── */}
      <SectionCard title="🏆 Top Siswa Minggu Ini" onPress={() => router.push('/(pengawas)/siswa')}>
        {state.ranking.length === 0
          ? <Text style={st.empty}>Belum ada data latihan minggu ini</Text>
          : state.ranking.map((s, i) => (
            <TouchableOpacity key={s.id} style={st.rankRow}
              onPress={() => router.push({ pathname: '/(pengawas)/siswa/[id]', params: { id: s.id } })}>
              <Text style={[st.rankBadge, i === 0 && { color: '#F59E0B' }, i === 1 && { color: Colors.textMuted }, i === 2 && { color: '#CD7F32' }]}>
                {['🥇', '🥈', '🥉'][i]}
              </Text>
              <View style={st.rankAvatar}>
                <Text style={st.rankAvatarText}>{s.name.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={st.rankName} numberOfLines={1}>{s.name}</Text>
                <Text style={st.rankSub}>🔥 {s.streak_days} hari · {s.total_sesi} sesi</Text>
              </View>
              <View style={st.rankScore}>
                <Text style={[st.rankScoreVal, { color: PW_GREEN }]}>{Math.round(s.avg_snbt) || '—'}</Text>
                <Text style={st.rankScoreLabel}>SNBT</Text>
              </View>
            </TouchableOpacity>
          ))
        }
        <TouchableOpacity style={st.seeAll} onPress={() => router.push('/(pengawas)/siswa')}>
          <Text style={st.seeAllText}>Lihat Semua Siswa →</Text>
        </TouchableOpacity>
      </SectionCard>

      {/* ── Class Weaknesses ────────────────────────── */}
      <SectionCard title="📚 Kelemahan Kelas Terbesar" onPress={() => router.push('/(pengawas)/analisis')}>
        {state.kelemahan.length === 0
          ? <Text style={st.empty}>Belum ada data kelemahan</Text>
          : state.kelemahan.map((k, i) => (
            <View key={i} style={st.weakRow}>
              <View style={st.weakLeft}>
                <Text style={st.weakSub} numberOfLines={1}>{k.sub_materi}</Text>
                <Text style={st.weakMapel}>{k.mapel} · {k.persen_siswa}% siswa lemah</Text>
              </View>
              <View style={st.weakRight}>
                <Text style={[st.weakAkurasi, { color: k.avg_akurasi < 40 ? '#EF4444' : '#F59E0B' }]}>
                  {Math.round(k.avg_akurasi)}%
                </Text>
                <Text style={st.weakAkurasiLabel}>akurasi</Text>
              </View>
            </View>
          ))
        }
        <TouchableOpacity style={st.seeAll} onPress={() => router.push('/(pengawas)/analisis')}>
          <Text style={st.seeAllText}>Lihat Analisis Lengkap →</Text>
        </TouchableOpacity>
      </SectionCard>

      {/* ── Tier Distribution ───────────────────────── */}
      {ov && (
        <SectionCard title="💎 Distribusi Paket">
          <View style={st.tierRow}>
            {Object.entries(ov.tier_distribusi).map(([tier, count]) => (
              <View key={tier} style={st.tierItem}>
                <Text style={st.tierVal}>{count}</Text>
                <Text style={st.tierLabel}>{tier === 'premium' ? '⭐ Premium' : tier === 'free' ? '🆓 Gratis' : '📅 Daily'}</Text>
                <Text style={st.tierPct}>{ov.total_siswa > 0 ? Math.round(count / ov.total_siswa * 100) : 0}%</Text>
              </View>
            ))}
          </View>
        </SectionCard>
      )}
    </Animated.ScrollView>
  );
}

// ── Reusable sub-components ──────────────────────────────────────────────────

function StatCard({ value, total, label, icon, color }: {
  value: number; total?: number; label: string; icon: string; color: string;
}) {
  return (
    <View style={[sc.card, { borderColor: color + '30' }]}>
      <Ionicons name={icon as any} size={16} color={color} />
      <Text style={[sc.value, { color }]}>{value}{total ? `/${total}` : ''}</Text>
      <Text style={sc.label}>{label}</Text>
    </View>
  );
}
const sc = StyleSheet.create({
  card:  { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1,
            alignItems: 'center', gap: 4, padding: Spacing.sm, paddingVertical: 12 },
  value: { fontSize: FontSize.md, fontWeight: '900', lineHeight: 22 },
  label: { color: Colors.textMuted, fontSize: 9, textAlign: 'center', fontWeight: '600' },
});

function SectionCard({ title, children, onPress }: {
  title: string; children: React.ReactNode; onPress?: () => void;
}) {
  return (
    <View style={sec.wrap}>
      <View style={sec.header}>
        <Text style={sec.title}>{title}</Text>
        {onPress && (
          <TouchableOpacity onPress={onPress}>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      <View style={sec.body}>{children}</View>
    </View>
  );
}
const sec = StyleSheet.create({
  wrap:   { marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
             backgroundColor: Colors.surface, borderRadius: Radius.xl,
             borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
             paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
             borderBottomWidth: 1, borderBottomColor: Colors.border },
  title:  { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '800' },
  body:   { padding: Spacing.md, gap: Spacing.sm },
});

const st = StyleSheet.create({
  loader:     { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loaderText: { color: Colors.textMuted, fontSize: FontSize.sm },

  header:     { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
                paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingHorizontal: Spacing.lg,
                paddingBottom: Spacing.lg },
  greeting:   { color: Colors.textMuted, fontSize: FontSize.sm },
  name:       { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: '900' },
  schoolPill: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4,
                backgroundColor: PW_GREEN + '15', borderRadius: Radius.full,
                paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start',
                borderWidth: 1, borderColor: PW_GREEN + '30' },
  schoolPillText:{ color: PW_GREEN_L, fontSize: 10, fontWeight: '700', maxWidth: 200 },
  notifBtn:   { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surface,
                borderWidth: 1, borderColor: Colors.border,
                alignItems: 'center', justifyContent: 'center', marginTop: 4 },

  statsRow:   { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },

  atRiskCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
                marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
                backgroundColor: '#F59E0B15', borderRadius: Radius.xl,
                borderWidth: 1.5, borderColor: '#F59E0B40', padding: Spacing.md },
  atRiskLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  atRiskIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F59E0B20',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  atRiskTitle:{ color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '800', marginBottom: 6 },
  atRiskBadges:{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  badge:      { backgroundColor: '#F59E0B20', borderRadius: Radius.full, borderWidth: 1,
                borderColor: '#F59E0B', paddingHorizontal: 8, paddingVertical: 2 },
  badgeText:  { color: '#F59E0B', fontSize: 10, fontWeight: '700' },

  chartLegend:{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  chartLegendText:{ color: PW_GREEN, fontSize: FontSize.xs, fontWeight: '700' },

  rankRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 4 },
  rankBadge:  { fontSize: 18, width: 28, textAlign: 'center' },
  rankAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: PW_GREEN + '20',
                alignItems: 'center', justifyContent: 'center' },
  rankAvatarText:{ color: PW_GREEN, fontSize: FontSize.sm, fontWeight: '900' },
  rankName:   { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '700' },
  rankSub:    { color: Colors.textMuted, fontSize: 10, marginTop: 1 },
  rankScore:  { alignItems: 'center' },
  rankScoreVal:{ fontSize: FontSize.md, fontWeight: '900' },
  rankScoreLabel:{ color: Colors.textMuted, fontSize: 8, fontWeight: '700' },

  weakRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 2 },
  weakLeft:   { flex: 1 },
  weakSub:    { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '600' },
  weakMapel:  { color: Colors.textMuted, fontSize: 10, marginTop: 1 },
  weakRight:  { alignItems: 'center' },
  weakAkurasi:{ fontSize: FontSize.md, fontWeight: '900' },
  weakAkurasiLabel:{ color: Colors.textMuted, fontSize: 8, fontWeight: '700' },

  tierRow:    { flexDirection: 'row', justifyContent: 'space-around' },
  tierItem:   { alignItems: 'center', gap: 2 },
  tierVal:    { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: '900' },
  tierLabel:  { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '600' },
  tierPct:    { color: Colors.textMuted, fontSize: 9 },

  seeAll:     { alignItems: 'center', paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border, marginTop: 4 },
  seeAllText: { color: PW_GREEN_L, fontSize: FontSize.xs, fontWeight: '700' },
  empty:      { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center', paddingVertical: Spacing.md },
});

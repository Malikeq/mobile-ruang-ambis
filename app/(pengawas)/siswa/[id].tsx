import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Platform, RefreshControl, Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { pengawasApi, SiswaDetail } from '@/lib/api';

const PW_GREEN   = '#059669';
const PW_GREEN_L = '#10B981';

function ProgressBar({ value, max = 100, color = PW_GREEN }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0);
  return (
    <View style={{ height: 6, backgroundColor: Colors.surfaceElevated, borderRadius: 3, overflow: 'hidden' }}>
      <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color, borderRadius: 3 }} />
    </View>
  );
}

function ScoreChip({ value, label, color }: { value: string | number; label: string; color?: string }) {
  return (
    <View style={sc.wrap}>
      <Text style={[sc.value, color ? { color } : {}]}>{value}</Text>
      <Text style={sc.label}>{label}</Text>
    </View>
  );
}
const sc = StyleSheet.create({
  wrap:  { flex: 1, alignItems: 'center', backgroundColor: Colors.surface,
           borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border,
           padding: Spacing.sm, paddingVertical: 12, gap: 3 },
  value: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '900' },
  label: { color: Colors.textMuted, fontSize: 9, fontWeight: '700', textAlign: 'center' },
});

function SectionTitle({ title }: { title: string }) {
  return <Text style={sst.t}>{title}</Text>;
}
const sst = StyleSheet.create({ t: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '800', letterSpacing: 0.6, marginBottom: 6 } });

export default function SiswaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data,    setData]    = useState<SiswaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefresh(true); else setLoading(true);
    try {
      const res = await pengawasApi.getSiswaDetail(Number(id));
      setData(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); setRefresh(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <View style={st.loader}>
      <ActivityIndicator color={PW_GREEN} size="large" />
    </View>
  );

  if (!data) return (
    <View style={st.loader}>
      <Ionicons name="warning-outline" size={40} color={Colors.textMuted} />
      <Text style={{ color: Colors.textMuted, marginTop: 12 }}>Gagal memuat data</Text>
      <TouchableOpacity onPress={() => load()} style={{ marginTop: 12 }}>
        <Text style={{ color: PW_GREEN_L }}>Coba lagi</Text>
      </TouchableOpacity>
    </View>
  );

  const s = data.siswa;
  const initials = s.name.charAt(0).toUpperCase();
  const lastDays = s.last_active
    ? Math.floor((Date.now() - new Date(s.last_active).getTime()) / 86_400_000)
    : null;
  const statusColor = lastDays === null ? '#6B7280' : lastDays === 0 ? PW_GREEN : lastDays <= 3 ? '#F59E0B' : '#EF4444';

  // Simple line chart for sesi scores
  const scores = data.sesi_list.filter(s => s.skor_akhir > 0).slice(0, 14).reverse();
  const maxScore = Math.max(...scores.map(s => s.skor_akhir), 1);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header bar */}
      <View style={st.headerBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={22} color={Colors.textMuted} />
        </TouchableOpacity>
        <Text style={st.headerTitle} numberOfLines={1}>{s.name}</Text>
        <TouchableOpacity
          style={st.emailBtn}
          onPress={() => Linking.openURL(`mailto:${s.email}?subject=Informasi Belajar SNBT`)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="mail-outline" size={18} color={PW_GREEN} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120, paddingTop: Spacing.md }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => load(true)} tintColor={PW_GREEN} />}
      >
        {/* ── Profile Card ─────────────────────────── */}
        <View style={st.profileCard}>
          <View style={[st.avatar, { backgroundColor: statusColor + '20', borderColor: statusColor + '60' }]}>
            <Text style={[st.avatarText, { color: statusColor }]}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={st.nameRow}>
              <Text style={st.name} numberOfLines={1}>{s.name}</Text>
              {s.tier === 'premium' && <View style={st.premBadge}><Text style={st.premText}>⭐ PRO</Text></View>}
            </View>
            <Text style={st.email}>{s.email}</Text>
            <View style={st.statusRow}>
              <View style={[st.dot, { backgroundColor: statusColor }]} />
              <Text style={[st.statusText, { color: statusColor }]}>
                {lastDays === null ? 'Belum pernah aktif' : lastDays === 0 ? 'Aktif hari ini' : `${lastDays} hari tidak aktif`}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Target PTN ───────────────────────────── */}
        {(s.kampusTargets?.length ?? 0) > 0 && (
          <View style={st.section}>
            <SectionTitle title="🎯 TARGET PTN" />
            {s.kampusTargets!.map((t: any, i: number) => (
              <View key={i} style={st.targetRow}>
                <Ionicons name="flag" size={13} color={PW_GREEN} />
                <Text style={st.targetText} numberOfLines={1}>
                  {t.kampus?.nama} — {t.jurusan?.nama}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Stats Row ────────────────────────────── */}
        <View style={st.statsRow}>
          <ScoreChip
            value={s.avg_snbt > 0 ? Math.round(s.avg_snbt) : '—'}
            label="Rata SNBT"
            color={s.avg_snbt >= 600 ? PW_GREEN : s.avg_snbt >= 400 ? '#F59E0B' : Colors.textMuted}
          />
          <ScoreChip value={s.streak_days} label="🔥 Streak" color={s.streak_days >= 7 ? '#EF4444' : undefined} />
          <ScoreChip value={s.total_sesi} label="Total Sesi" />
          <ScoreChip value={s.sesi_7d} label="Sesi 7 Hari" />
        </View>

        {/* ── Score Trend ──────────────────────────── */}
        {scores.length > 1 && (
          <View style={st.section}>
            <SectionTitle title="📈 TREN SKOR SNBT (30 HARI)" />
            <View style={st.chartWrap}>
              {scores.map((s, i) => (
                <View key={i} style={st.chartCol}>
                  <View style={st.chartBarBg}>
                    <View style={[st.chartBar, {
                      height: `${(s.skor_akhir / maxScore) * 100}%`,
                      backgroundColor: i === scores.length - 1 ? PW_GREEN : PW_GREEN + '60',
                    }]} />
                  </View>
                  <Text style={st.chartLbl}>{Math.round(s.skor_akhir / 10) * 10}</Text>
                </View>
              ))}
            </View>
            <Text style={st.chartSubtitle}>
              {scores.at(-1)?.skor_akhir && scores[0]?.skor_akhir
                ? scores.at(-1)!.skor_akhir > scores[0]!.skor_akhir
                  ? `📈 Naik ${Math.round(scores.at(-1)!.skor_akhir - scores[0]!.skor_akhir)} poin dari sesi pertama`
                  : `📉 Turun ${Math.round(scores[0]!.skor_akhir - scores.at(-1)!.skor_akhir)} poin dari sesi pertama`
                : ''
              }
            </Text>
          </View>
        )}

        {/* ── Progres Mapel ────────────────────────── */}
        {data.progres_mapel.length > 0 && (
          <View style={st.section}>
            <SectionTitle title="📚 PROGRES PER MAPEL" />
            {data.progres_mapel.map((m, i) => {
              const color = m.akurasi >= 70 ? PW_GREEN : m.akurasi >= 50 ? '#F59E0B' : '#EF4444';
              return (
                <View key={i} style={st.mapelRow}>
                  <View style={st.mapelLeft}>
                    <Text style={st.mapelName} numberOfLines={1}>{m.mapel}</Text>
                    <Text style={st.mapelSub}>{m.total} soal · {m.benar} benar</Text>
                  </View>
                  <Text style={[st.mapelPct, { color }]}>{Math.round(m.akurasi)}%</Text>
                  <View style={{ width: 80 }}>
                    <ProgressBar value={m.akurasi} color={color} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Kelemahan ────────────────────────────── */}
        {data.kelemahan.length > 0 && (
          <View style={st.section}>
            <SectionTitle title="⚠️ KELEMAHAN UTAMA" />
            {data.kelemahan.map((k, i) => (
              <View key={i} style={st.weakRow}>
                <View style={st.weakRank}>
                  <Text style={st.weakRankText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.weakSub} numberOfLines={1}>{k.sub_materi}</Text>
                  <Text style={st.weakMapel}>{k.mapel}</Text>
                </View>
                <View style={st.weakRight}>
                  <Text style={[st.weakPct, { color: k.accuracy_rate < 40 ? '#EF4444' : '#F59E0B' }]}>
                    {Math.round(k.accuracy_rate)}%
                  </Text>
                  <Text style={st.weakAttempt}>{k.attempt_count} soal</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Riwayat Sesi ─────────────────────────── */}
        {data.sesi_list.length > 0 && (
          <View style={st.section}>
            <SectionTitle title="🕐 RIWAYAT LATIHAN" />
            {data.sesi_list.slice(0, 10).map((sesi, i) => {
              const d = new Date(sesi.created_at);
              const tgl = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
              return (
                <View key={i} style={st.sesiRow}>
                  <View style={st.sesiDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={st.sesiTipe}>{sesi.tipe === 'tryout' ? '📋 Tryout' : sesi.tipe === 'topik' ? '📖 Topik' : '✏️ Latihan'}</Text>
                    <Text style={st.sesiDate}>{tgl}</Text>
                  </View>
                  {sesi.skor_akhir > 0 && (
                    <Text style={[st.sesiScore, { color: sesi.skor_akhir >= 600 ? PW_GREEN : '#F59E0B' }]}>
                      {Math.round(sesi.skor_akhir)} SNBT
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* ── No Data ──────────────────────────────── */}
        {data.sesi_list.length === 0 && data.progres_mapel.length === 0 && (
          <View style={st.noData}>
            <Ionicons name="book-outline" size={40} color={Colors.textMuted} />
            <Text style={st.noDataText}>Siswa ini belum pernah latihan</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  loader:      { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  headerBar:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
                 paddingTop: Platform.OS === 'ios' ? 56 : 44,
                 paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
                 borderBottomWidth: 1, borderBottomColor: Colors.border,
                 backgroundColor: Colors.background },
  headerTitle: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '800' },
  emailBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: PW_GREEN + '15',
                 alignItems: 'center', justifyContent: 'center',
                 borderWidth: 1, borderColor: PW_GREEN + '40' },

  profileCard: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
                 marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
                 backgroundColor: Colors.surface, borderRadius: Radius.xl,
                 borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },
  avatar:      { width: 56, height: 56, borderRadius: 28, borderWidth: 2,
                 alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText:  { fontSize: FontSize.xl, fontWeight: '900' },
  nameRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name:        { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '900', flex: 1 },
  premBadge:   { backgroundColor: '#F59E0B20', borderRadius: Radius.full,
                 paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#F59E0B' },
  premText:    { color: '#F59E0B', fontSize: 9, fontWeight: '800' },
  email:       { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 3 },
  statusRow:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  dot:         { width: 7, height: 7, borderRadius: 4 },
  statusText:  { fontSize: FontSize.xs, fontWeight: '700' },

  statsRow:    { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },

  section:     { marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
                 backgroundColor: Colors.surface, borderRadius: Radius.xl,
                 borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },

  targetRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 3 },
  targetText:  { color: Colors.textPrimary, fontSize: FontSize.sm, flex: 1 },

  chartWrap:   { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 72 },
  chartCol:    { flex: 1, alignItems: 'center', gap: 3 },
  chartBarBg:  { flex: 1, width: '100%', justifyContent: 'flex-end',
                 backgroundColor: Colors.surfaceElevated, borderRadius: 3 },
  chartBar:    { width: '100%', borderRadius: 3 },
  chartLbl:    { color: Colors.textMuted, fontSize: 7, fontWeight: '700' },
  chartSubtitle:{ color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 8, textAlign: 'center' },

  mapelRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 6,
                 borderBottomWidth: 1, borderBottomColor: Colors.border + '60' },
  mapelLeft:   { flex: 1 },
  mapelName:   { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '700' },
  mapelSub:    { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  mapelPct:    { fontSize: FontSize.sm, fontWeight: '900', width: 36, textAlign: 'right' },

  weakRow:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 5 },
  weakRank:    { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.surfaceElevated,
                 alignItems: 'center', justifyContent: 'center' },
  weakRankText:{ color: Colors.textMuted, fontSize: 10, fontWeight: '800' },
  weakSub:     { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '600' },
  weakMapel:   { color: Colors.textMuted, fontSize: 10 },
  weakRight:   { alignItems: 'flex-end' },
  weakPct:     { fontSize: FontSize.sm, fontWeight: '900' },
  weakAttempt: { color: Colors.textMuted, fontSize: 9 },

  sesiRow:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 6 },
  sesiDot:     { width: 6, height: 6, borderRadius: 3, backgroundColor: PW_GREEN },
  sesiTipe:    { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '600' },
  sesiDate:    { color: Colors.textMuted, fontSize: 10 },
  sesiScore:   { fontSize: FontSize.sm, fontWeight: '900' },

  noData:      { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  noDataText:  { color: Colors.textMuted, fontSize: FontSize.sm },
});

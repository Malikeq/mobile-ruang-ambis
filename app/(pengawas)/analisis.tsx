import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Platform, RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { pengawasApi, AktivitasHarian, KelemahanKelas } from '@/lib/api';

const PW_GREEN   = '#059669';
const PW_GREEN_L = '#10B981';

type Tab = 'aktivitas' | 'kelemahan';
type Period = 7 | 14 | 30;

function BarChart({ data, valueKey, labelKey, color }: {
  data: any[];
  valueKey: string;
  labelKey: string;
  color: string;
}) {
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <View style={bc.wrap}>
      {data.map((d, i) => {
        const pct = (d[valueKey] / max) * 100;
        const isLast = i === data.length - 1;
        return (
          <View key={i} style={bc.col}>
            <Text style={bc.val}>{d[valueKey] > 0 ? d[valueKey] : ''}</Text>
            <View style={bc.barBg}>
              <View style={[bc.bar, {
                height: `${Math.max(pct, 3)}%`,
                backgroundColor: isLast ? color : color + '70',
              }]} />
            </View>
            <Text style={[bc.lbl, isLast && { color, fontWeight: '800' }]}>
              {typeof d[labelKey] === 'string' && d[labelKey].length > 3
                ? d[labelKey].slice(-3)
                : d[labelKey]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
const bc = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 100 },
  col:   { flex: 1, alignItems: 'center', gap: 2 },
  val:   { color: Colors.textMuted, fontSize: 7, fontWeight: '700', height: 10 },
  barBg: { flex: 1, width: '100%', justifyContent: 'flex-end',
            backgroundColor: Colors.surfaceElevated, borderRadius: 3 },
  bar:   { width: '100%', borderRadius: 3 },
  lbl:   { color: Colors.textMuted, fontSize: 7 },
});

function AkurasiBar({ pct, color }: { pct: number; color: string }) {
  return (
    <View style={{ flex: 1, height: 6, backgroundColor: Colors.surfaceElevated, borderRadius: 3 }}>
      <View style={{ width: `${Math.min(pct, 100)}%`, height: '100%', backgroundColor: color, borderRadius: 3 }} />
    </View>
  );
}

export default function AnalisisScreen() {
  const [tab,       setTab]       = useState<Tab>('aktivitas');
  const [period,    setPeriod]    = useState<Period>(7);
  const [aktivitas, setAktivitas] = useState<AktivitasHarian[]>([]);
  const [kelemahan, setKelemahan] = useState<KelemahanKelas[]>([]);
  const [totalSiswa, setTotalSiswa] = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [refresh,   setRefresh]   = useState(false);

  const load = useCallback(async (p: Period = period, isRefresh = false) => {
    if (isRefresh) setRefresh(true); else setLoading(true);
    try {
      const [akRes, kwRes] = await Promise.all([
        pengawasApi.getAktivitasHarian(p),
        pengawasApi.getKelemahanKelas(),
      ]);
      setAktivitas(akRes.data);
      setKelemahan(kwRes.data);
      setTotalSiswa(kwRes.total_siswa);
    } catch { /* silent */ }
    finally { setLoading(false); setRefresh(false); }
  }, [period]);

  useFocusEffect(useCallback(() => { load(period); }, [period]));

  const changePeriod = (p: Period) => {
    setPeriod(p);
    load(p);
  };

  // Summary stats for aktivitas tab
  const totalSesi   = aktivitas.reduce((sum, d) => sum + d.total_sesi, 0);
  const maxAktif    = Math.max(...aktivitas.map(d => d.siswa_aktif), 0);
  const avgAktif    = aktivitas.length
    ? Math.round(aktivitas.reduce((s, d) => s + d.siswa_aktif, 0) / aktivitas.length)
    : 0;
  const avgSnbt     = aktivitas.length
    ? Math.round(aktivitas.filter(d => d.avg_snbt > 0).reduce((s, d) => s + d.avg_snbt, 0) /
        Math.max(aktivitas.filter(d => d.avg_snbt > 0).length, 1))
    : 0;

  return (
    <View style={st.root}>
      {/* Header */}
      <View style={st.header}>
        <Text style={st.title}>Analisis Kelas</Text>
        <Text style={st.subtitle}>Data agregat seluruh siswa sekolah</Text>
      </View>

      {/* Tab switcher */}
      <View style={st.tabBar}>
        <TouchableOpacity
          style={[st.tabBtn, tab === 'aktivitas' && { backgroundColor: PW_GREEN, borderColor: PW_GREEN }]}
          onPress={() => setTab('aktivitas')} activeOpacity={0.8}>
          <Ionicons name="bar-chart" size={13} color={tab === 'aktivitas' ? '#fff' : Colors.textMuted} />
          <Text style={[st.tabBtnText, tab === 'aktivitas' && { color: '#fff' }]}>Aktivitas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[st.tabBtn, tab === 'kelemahan' && { backgroundColor: '#EF4444', borderColor: '#EF4444' }]}
          onPress={() => setTab('kelemahan')} activeOpacity={0.8}>
          <Ionicons name="warning" size={13} color={tab === 'kelemahan' ? '#fff' : Colors.textMuted} />
          <Text style={[st.tabBtnText, tab === 'kelemahan' && { color: '#fff' }]}>Kelemahan Kelas</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={st.loader}><ActivityIndicator color={PW_GREEN} size="large" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 160, paddingTop: Spacing.sm }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => load(period, true)} tintColor={PW_GREEN} />}
        >
          {tab === 'aktivitas' ? (
            /* ── AKTIVITAS TAB ─────────────────────── */
            <>
              {/* Period selector */}
              <View style={st.periodRow}>
                {([7, 14, 30] as Period[]).map(p => (
                  <TouchableOpacity key={p}
                    style={[st.periodBtn, period === p && { backgroundColor: PW_GREEN, borderColor: PW_GREEN }]}
                    onPress={() => changePeriod(p)}>
                    <Text style={[st.periodText, period === p && { color: '#fff' }]}>{p} Hari</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Summary stats */}
              <View style={st.summaryRow}>
                <View style={st.sumCard}>
                  <Text style={[st.sumVal, { color: PW_GREEN }]}>{totalSesi}</Text>
                  <Text style={st.sumLabel}>Total Sesi</Text>
                </View>
                <View style={st.sumCard}>
                  <Text style={[st.sumVal, { color: '#F59E0B' }]}>{avgAktif}</Text>
                  <Text style={st.sumLabel}>Rata Aktif/Hari</Text>
                </View>
                <View style={st.sumCard}>
                  <Text style={[st.sumVal, { color: PW_GREEN }]}>{maxAktif}</Text>
                  <Text style={st.sumLabel}>Aktif Tertinggi</Text>
                </View>
                <View style={st.sumCard}>
                  <Text style={[st.sumVal, { color: '#8B5CF6' }]}>{avgSnbt > 0 ? avgSnbt : '—'}</Text>
                  <Text style={st.sumLabel}>Rata SNBT</Text>
                </View>
              </View>

              {/* Bar chart: siswa aktif */}
              <View style={st.chartCard}>
                <Text style={st.chartTitle}>Siswa Aktif per Hari</Text>
                {aktivitas.length > 0
                  ? <BarChart data={aktivitas} valueKey="siswa_aktif" labelKey="tanggal" color={PW_GREEN} />
                  : <Text style={st.empty}>Belum ada data</Text>
                }
              </View>

              {/* Bar chart: total sesi */}
              <View style={st.chartCard}>
                <Text style={st.chartTitle}>Total Sesi per Hari</Text>
                {aktivitas.length > 0
                  ? <BarChart data={aktivitas} valueKey="total_sesi" labelKey="tanggal" color="#8B5CF6" />
                  : <Text style={st.empty}>Belum ada data</Text>
                }
              </View>

              {/* Table detail */}
              {aktivitas.length > 0 && (
                <View style={st.tableCard}>
                  <View style={st.tableHeader}>
                    <Text style={[st.tableCell, { flex: 2 }]}>Tanggal</Text>
                    <Text style={st.tableCell}>Aktif</Text>
                    <Text style={st.tableCell}>Sesi</Text>
                    <Text style={st.tableCell}>Avg SNBT</Text>
                  </View>
                  {aktivitas.slice(-7).reverse().map((d, i) => (
                    <View key={i} style={[st.tableRow, i % 2 === 0 && { backgroundColor: Colors.surfaceElevated + '80' }]}>
                      <Text style={[st.tableCell, { flex: 2, color: Colors.textSecondary }]}>
                        {new Date(d.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </Text>
                      <Text style={[st.tableCell, { color: PW_GREEN }]}>{d.siswa_aktif}</Text>
                      <Text style={[st.tableCell, { color: '#8B5CF6' }]}>{d.total_sesi}</Text>
                      <Text style={[st.tableCell, { color: d.avg_snbt > 0 ? '#F59E0B' : Colors.textMuted }]}>
                        {d.avg_snbt > 0 ? Math.round(d.avg_snbt) : '—'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          ) : (
            /* ── KELEMAHAN TAB ─────────────────────── */
            <>
              <View style={st.weakHeader}>
                <Text style={st.weakHeaderText}>
                  {kelemahan.length} sub-materi lemah ditemukan dari {totalSiswa} siswa
                </Text>
              </View>

              {kelemahan.length === 0 ? (
                <View style={st.empty2}>
                  <Ionicons name="checkmark-circle-outline" size={48} color={PW_GREEN} />
                  <Text style={st.empty2Title}>Luar biasa!</Text>
                  <Text style={st.empty2Sub}>Tidak ada sub-materi yang sangat lemah di kelas ini</Text>
                </View>
              ) : (
                kelemahan.map((k, i) => {
                  const color = k.avg_akurasi < 40 ? '#EF4444' : k.avg_akurasi < 60 ? '#F59E0B' : '#22C55E';
                  return (
                    <View key={i} style={st.weakCard}>
                      <View style={st.weakTop}>
                        <View style={st.weakRank}>
                          <Text style={st.weakRankText}>{i + 1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={st.weakSub} numberOfLines={2}>{k.sub_materi}</Text>
                          <View style={st.weakTagRow}>
                            <View style={st.weakMapelTag}>
                              <Text style={st.weakMapelText}>{k.kode_mapel}</Text>
                            </View>
                            <Text style={st.weakMeta}>{k.mapel}</Text>
                          </View>
                        </View>
                        <View style={st.weakScoreBox}>
                          <Text style={[st.weakScore, { color }]}>{Math.round(k.avg_akurasi)}%</Text>
                          <Text style={st.weakScoreLabel}>akurasi</Text>
                        </View>
                      </View>

                      <View style={st.weakBottom}>
                        <View style={st.weakStatRow}>
                          <View style={st.weakStat}>
                            <Text style={[st.weakStatVal, { color }]}>{k.jumlah_siswa}</Text>
                            <Text style={st.weakStatLabel}>siswa lemah</Text>
                          </View>
                          <View style={st.weakStat}>
                            <Text style={st.weakStatVal}>{k.persen_siswa}%</Text>
                            <Text style={st.weakStatLabel}>dari kelas</Text>
                          </View>
                          <View style={st.weakStat}>
                            <Text style={st.weakStatVal}>{k.total_attempt}</Text>
                            <Text style={st.weakStatLabel}>total soal</Text>
                          </View>
                        </View>
                        <AkurasiBar pct={k.avg_akurasi} color={color} />
                        <Text style={[st.weakBarLabel, { color }]}>{Math.round(k.avg_akurasi)}% rata-rata akurasi kelas</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  root:         { flex: 1, backgroundColor: Colors.background },
  header:       { paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  title:        { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: '900' },
  subtitle:     { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },

  tabBar:       { flexDirection: 'row', gap: Spacing.sm,
                  paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  tabBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
                  backgroundColor: Colors.surface, borderRadius: Radius.xl,
                  borderWidth: 1, borderColor: Colors.border,
                  paddingVertical: 10 },
  tabBtnText:   { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '800' },

  loader:       { flex: 1, alignItems: 'center', justifyContent: 'center' },

  periodRow:    { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  periodBtn:    { flex: 1, alignItems: 'center', paddingVertical: 8,
                  backgroundColor: Colors.surface, borderRadius: Radius.lg,
                  borderWidth: 1, borderColor: Colors.border },
  periodText:   { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '700' },

  summaryRow:   { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  sumCard:      { flex: 1, alignItems: 'center', backgroundColor: Colors.surface,
                  borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border,
                  padding: Spacing.sm, paddingVertical: 10 },
  sumVal:       { fontSize: FontSize.lg, fontWeight: '900' },
  sumLabel:     { color: Colors.textMuted, fontSize: 8, textAlign: 'center', marginTop: 2, fontWeight: '600' },

  chartCard:    { marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
                  backgroundColor: Colors.surface, borderRadius: Radius.xl,
                  borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },
  chartTitle:   { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '800', marginBottom: Spacing.sm },

  tableCard:    { marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
                  backgroundColor: Colors.surface, borderRadius: Radius.xl,
                  borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  tableHeader:  { flexDirection: 'row', backgroundColor: Colors.surfaceElevated,
                  paddingHorizontal: Spacing.md, paddingVertical: 8,
                  borderBottomWidth: 1, borderBottomColor: Colors.border },
  tableRow:     { flexDirection: 'row', paddingHorizontal: Spacing.md, paddingVertical: 8 },
  tableCell:    { flex: 1, color: Colors.textMuted, fontSize: 10, fontWeight: '700' },

  empty:        { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center', padding: Spacing.md },
  empty2:       { alignItems: 'center', paddingVertical: 60, gap: Spacing.sm },
  empty2Title:  { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: '900' },
  empty2Sub:    { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center' },

  weakHeader:   { marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
                  backgroundColor: '#EF444415', borderRadius: Radius.lg,
                  borderWidth: 1, borderColor: '#EF444430', padding: Spacing.sm },
  weakHeaderText:{ color: '#EF4444', fontSize: FontSize.xs, fontWeight: '700', textAlign: 'center' },

  weakCard:     { marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
                  backgroundColor: Colors.surface, borderRadius: Radius.xl,
                  borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  weakTop:      { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
                  padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  weakRank:     { width: 28, height: 28, borderRadius: 14,
                  backgroundColor: Colors.surfaceElevated,
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  weakRankText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '900' },
  weakSub:      { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '700', lineHeight: 20 },
  weakTagRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  weakMapelTag: { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.full,
                  paddingHorizontal: 6, paddingVertical: 2 },
  weakMapelText:{ color: Colors.textMuted, fontSize: 9, fontWeight: '800' },
  weakMeta:     { color: Colors.textMuted, fontSize: 10 },
  weakScoreBox: { alignItems: 'center' },
  weakScore:    { fontSize: FontSize.xl, fontWeight: '900' },
  weakScoreLabel:{ color: Colors.textMuted, fontSize: 8, fontWeight: '700' },
  weakBottom:   { padding: Spacing.md, gap: 8 },
  weakStatRow:  { flexDirection: 'row', justifyContent: 'space-around' },
  weakStat:     { alignItems: 'center', gap: 2 },
  weakStatVal:  { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '900' },
  weakStatLabel:{ color: Colors.textMuted, fontSize: 9, fontWeight: '600' },
  weakBarLabel: { fontSize: FontSize.xs, fontWeight: '700' },
});

import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Platform, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { API_BASE } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Weakness {
  id: number; mapel: any; sub_materi: any;
  rata_rata_skor: number; total_sesi: number;
}
function toStr(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  return val.nama ?? val.kode ?? JSON.stringify(val);
}
interface MapelProgress { mapel: string; skor: number; soal_count: number; }

function ScoreRing({ value, color, size = 72 }: { value: number; color: string; size?: number }) {
  const pct   = Math.min(100, Math.max(0, value));
  const score = Math.round(value);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: size, height: size, borderRadius: size / 2,
        borderWidth: 6, borderColor: color,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: color + '15',
      }}>
        <Text style={{ color, fontSize: size * 0.26, fontWeight: '900', lineHeight: size * 0.32 }}>{score}</Text>
        <Text style={{ color: Colors.textMuted, fontSize: 9 }}>%</Text>
      </View>
    </View>
  );
}

function BarChart({ data }: { data: MapelProgress[] }) {
  const max = Math.max(...data.map(d => d.skor), 1);
  return (
    <View style={barStyles.wrap}>
      {data.map((d, i) => {
        const color = d.skor >= 70 ? Colors.success : d.skor >= 50 ? Colors.secondary : Colors.error;
        return (
          <View key={i} style={barStyles.col}>
            <Text style={barStyles.pct}>{Math.round(d.skor)}</Text>
            <View style={barStyles.track}>
              <View style={[barStyles.fill, { height: `${(d.skor / max) * 100}%` as any, backgroundColor: color }]} />
            </View>
            <Text style={barStyles.label} numberOfLines={2}>{d.mapel.split(' ')[0]}</Text>
          </View>
        );
      })}
    </View>
  );
}
const barStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 100, paddingTop: 16 },
  col:  { flex: 1, alignItems: 'center', gap: 4 },
  track:{ width: '70%', height: 70, backgroundColor: Colors.surfaceElevated, borderRadius: 4, overflow: 'hidden', justifyContent: 'flex-end' },
  fill: { width: '100%', borderRadius: 4 },
  pct:  { color: Colors.textMuted, fontSize: 9, fontWeight: '700' },
  label:{ color: Colors.textMuted, fontSize: 8, textAlign: 'center' },
});

export default function AnalisisScreen() {
  const { token } = useAuth();
  const [weaknesses, setWeaknesses]   = useState<Weakness[]>([]);
  const [mapelData, setMapelData]     = useState<MapelProgress[]>([]);
  const [totalSkor, setTotalSkor]     = useState(0);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [activeTab, setActiveTab]     = useState<'kelemahan'|'progres'|'rekomendasi'>('kelemahan');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    fetchData();
  }, []);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [dashRes, weakRes] = await Promise.all([
        fetch(`${API_BASE}/dashboard`,  { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }),
        fetch(`${API_BASE}/weakness`,   { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } }),
      ]);
      const dash  = await dashRes.json();
      const weak  = await weakRes.json();
      setTotalSkor(dash?.data?.rata_rata_skor ?? 0);
      setMapelData(dash?.data?.mapel_progress ?? []);
      setWeaknesses(weak?.data ?? []);
    } catch {
      setWeaknesses([]);
      setMapelData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const TABS = [
    { id: 'kelemahan',    label: '⚠️ Kelemahan' },
    { id: 'progres',      label: '📊 Progres' },
    { id: 'rekomendasi',  label: '🤖 Rekomendasi' },
  ];

  const REKOMENDASI = weaknesses.slice(0, 3).map(w => ({
    mapel: toStr(w.mapel), action: `Latih ulang "${toStr(w.sub_materi)}"`,
    reason: `Skor rata-rata ${Math.round(w.rata_rata_skor)}% — di bawah target`, color: Colors.error,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.glow} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor={Colors.primary} />}
      >
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Analisis AI 🤖</Text>
            <Text style={styles.subtitle}>Diagnosis mendalam berbasis DCSEF untuk strategi belajarmu</Text>
          </View>

          {/* Overall score */}
          <View style={styles.overallCard}>
            <View style={styles.overallLeft}>
              <Text style={styles.overallLabel}>Skor Keseluruhan</Text>
              <Text style={[styles.overallScore, { color: totalSkor >= 70 ? Colors.success : totalSkor >= 50 ? Colors.secondary : Colors.error }]}>
                {totalSkor > 0 ? Math.round(totalSkor) : '—'}%
              </Text>
              <Text style={styles.overallSub}>
                {totalSkor >= 70 ? '🏆 Di atas rata-rata nasional' :
                 totalSkor >= 50 ? '📈 Progres yang baik!' :
                 totalSkor > 0   ? '💪 Masih ada ruang untuk berkembang' :
                 'Kerjakan latihan untuk melihat analisis'}
              </Text>
            </View>
            <ScoreRing value={totalSkor} color={totalSkor >= 70 ? Colors.success : totalSkor >= 50 ? Colors.secondary : Colors.error} />
          </View>

          {/* DCSEF Badges */}
          <Text style={styles.sectionTitle}>Framework DCSEF</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dcsef}>
            {[
              { code:'D', label:'Diagnostik',    color:Colors.primary,    desc:'Identifikasi baseline' },
              { code:'C', label:'Customized',    color:'#8B5CF6',         desc:'Rencana personal' },
              { code:'S', label:'Strengthening', color:Colors.secondary,  desc:'Penguatan kelemahan' },
              { code:'E', label:'Evaluation',    color:Colors.success,    desc:'Evaluasi berkala' },
              { code:'F', label:'Forecasting',   color:'#EC4899',         desc:'Prediksi kelulusan' },
            ].map(d => (
              <View key={d.code} style={[styles.dcsefCard, { borderColor: d.color + '50' }]}>
                <View style={[styles.dcsefBadge, { backgroundColor: d.color }]}>
                  <Text style={styles.dcsefCode}>{d.code}</Text>
                </View>
                <Text style={[styles.dcsefLabel, { color: d.color }]}>{d.label}</Text>
                <Text style={styles.dcsefDesc}>{d.desc}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Tabs */}
          <View style={styles.tabRow}>
            {TABS.map(t => (
              <TouchableOpacity
                key={t.id}
                style={[styles.tab, activeTab === t.id && styles.tabActive]}
                onPress={() => setActiveTab(t.id as any)}
              >
                <Text style={[styles.tabText, activeTab === t.id && styles.tabTextActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Tab content */}
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={Colors.primary} size="large" />
              <Text style={styles.loadingText}>Memuat analisis...</Text>
            </View>
          ) : (
            <>
              {/* Kelemahan */}
              {activeTab === 'kelemahan' && (
                <View style={styles.card}>
                  {weaknesses.length === 0 ? (
                    <View style={styles.emptyTab}>
                      <Text style={{ fontSize: 36 }}>✅</Text>
                      <Text style={styles.emptyTabText}>Tidak ada kelemahan signifikan{'\n'}atau belum ada data latihan</Text>
                    </View>
                  ) : weaknesses.map((w, i) => (
                    <View key={w.id} style={[styles.weakRow, i < weaknesses.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.border }]}>
                      <View style={[styles.weakBadge, {
                        backgroundColor: w.rata_rata_skor < 50 ? Colors.error + '18' : Colors.warning + '18',
                      }]}>
                        <Text style={styles.weakBadgeEmoji}>{w.rata_rata_skor < 50 ? '🔴' : '🟡'}</Text>
                      </View>
                      <View style={styles.weakInfo}>
                        <Text style={styles.weakMapel}>{toStr(w.mapel)}</Text>
                        <Text style={styles.weakSub}>{toStr(w.sub_materi)}</Text>
                        <View style={styles.weakMeta}>
                          <Text style={[styles.weakSkor, { color: w.rata_rata_skor < 50 ? Colors.error : Colors.warning }]}>
                            {Math.round(w.rata_rata_skor)}%
                          </Text>
                          <Text style={styles.weakSesi}>· {w.total_sesi} sesi</Text>
                        </View>
                      </View>
                      <View style={styles.progressMini}>
                        <View style={[styles.progressMiniFill, {
                          width: `${w.rata_rata_skor}%` as any,
                          backgroundColor: w.rata_rata_skor < 50 ? Colors.error : Colors.warning,
                        }]} />
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Progres */}
              {activeTab === 'progres' && (
                <View style={styles.card}>
                  {mapelData.length === 0 ? (
                    <View style={styles.emptyTab}>
                      <Text style={{ fontSize: 36 }}>📊</Text>
                      <Text style={styles.emptyTabText}>Belum ada data progres{'\n'}Kerjakan latihan pertamamu!</Text>
                    </View>
                  ) : (
                    <>
                      <BarChart data={mapelData} />
                      <View style={{ height: 12 }} />
                      {mapelData.map((m, i) => (
                        <View key={i} style={[styles.progresRow, i < mapelData.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.border }]}>
                          <Text style={styles.progresMapel}>{m.mapel}</Text>
                          <View style={styles.progresRight}>
                            <View style={styles.progresTrack}>
                              <View style={[styles.progresFill, {
                                width: `${m.skor}%` as any,
                                backgroundColor: m.skor >= 70 ? Colors.success : m.skor >= 50 ? Colors.secondary : Colors.error,
                              }]} />
                            </View>
                            <Text style={[styles.progresPct, {
                              color: m.skor >= 70 ? Colors.success : m.skor >= 50 ? Colors.secondary : Colors.error,
                            }]}>{Math.round(m.skor)}%</Text>
                          </View>
                        </View>
                      ))}
                    </>
                  )}
                </View>
              )}

              {/* Rekomendasi */}
              {activeTab === 'rekomendasi' && (
                <View style={styles.card}>
                  {REKOMENDASI.length === 0 ? (
                    <View style={styles.emptyTab}>
                      <Text style={{ fontSize: 36 }}>🤖</Text>
                      <Text style={styles.emptyTabText}>Rekomendasi akan muncul{'\n'}setelah kamu latihan</Text>
                    </View>
                  ) : REKOMENDASI.map((r, i) => (
                    <View key={i} style={[styles.rekRow, i < REKOMENDASI.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.border }]}>
                      <View style={[styles.rekIcon, { backgroundColor: r.color + '18' }]}>
                        <Text>🎯</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.rekMapel}>{toStr(r.mapel)}</Text>
                        <Text style={[styles.rekAction, { color: r.color }]}>{r.action}</Text>
                        <Text style={styles.rekReason}>{r.reason}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {/* AI Chat CTA */}
          <View style={styles.aiCta}>
            <View style={styles.aiCtaLeft}>
              <Text style={styles.aiCtaTitle}>🤖 Tanya AI Tutor</Text>
              <Text style={styles.aiCtaDesc}>Minta penjelasan soal, strategi belajar, atau motivasi kapan saja</Text>
            </View>
            <TouchableOpacity style={styles.aiCtaBtn}>
              <Text style={styles.aiCtaBtnText}>Chat →</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: Platform.OS === 'ios' ? 100 : 80 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  glow: { position: 'absolute', top: -60, right: -80, width: 240, height: 240, borderRadius: 120, backgroundColor: '#8B5CF6' + '12' },
  scroll: { paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingHorizontal: Spacing.lg },

  header: { marginBottom: Spacing.xl },
  title: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: '900', letterSpacing: -0.5 },
  subtitle: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 4, lineHeight: 20 },

  overallCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1.5, borderColor: Colors.border,
    padding: Spacing.lg, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  overallLeft: { flex: 1 },
  overallLabel: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  overallScore: { fontSize: 48, fontWeight: '900', lineHeight: 56, letterSpacing: -1 },
  overallSub: { color: Colors.textSecondary, fontSize: FontSize.xs, lineHeight: 18 },

  sectionTitle: { color: Colors.textPrimary, fontSize: FontSize.base, fontWeight: '700', marginBottom: Spacing.sm },

  dcsef: { marginBottom: Spacing.xl },
  dcsefCard: {
    width: 110, backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1.5, padding: Spacing.md, gap: 6, marginRight: Spacing.sm,
  },
  dcsefBadge: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dcsefCode: { color: '#fff', fontSize: FontSize.md, fontWeight: '900' },
  dcsefLabel: { fontSize: FontSize.xs, fontWeight: '700' },
  dcsefDesc: { color: Colors.textMuted, fontSize: 10, lineHeight: 14 },

  tabRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  tab: {
    flex: 1, paddingVertical: 10,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontSize: 11, fontWeight: '600' },
  tabTextActive: { color: '#fff', fontWeight: '700' },

  loadingWrap: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.md },
  loadingText: { color: Colors.textMuted, fontSize: FontSize.sm },

  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginBottom: Spacing.lg, padding: Spacing.md },
  emptyTab: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.md },
  emptyTabText: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 22 },

  weakRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  weakBadge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  weakBadgeEmoji: { fontSize: 18 },
  weakInfo: { flex: 1, gap: 2 },
  weakMapel: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '700' },
  weakSub: { color: Colors.textMuted, fontSize: FontSize.xs },
  weakMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  weakSkor: { fontSize: FontSize.xs, fontWeight: '800' },
  weakSesi: { color: Colors.textMuted, fontSize: FontSize.xs },
  progressMini: { width: 50, height: 6, backgroundColor: Colors.surfaceElevated, borderRadius: 3, overflow: 'hidden' },
  progressMiniFill: { height: '100%', borderRadius: 3 },

  progresRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: Spacing.md },
  progresMapel: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600', width: 100 },
  progresRight: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  progresTrack: { flex: 1, height: 8, backgroundColor: Colors.surfaceElevated, borderRadius: 4, overflow: 'hidden' },
  progresFill: { height: '100%', borderRadius: 4 },
  progresPct: { width: 36, fontSize: FontSize.xs, fontWeight: '800', textAlign: 'right' },

  rekRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md, paddingVertical: Spacing.md },
  rekIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rekMapel: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '700' },
  rekAction: { fontSize: FontSize.sm, fontWeight: '600', marginTop: 2 },
  rekReason: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },

  aiCta: {
    backgroundColor: Colors.primary + '18',
    borderRadius: Radius.xl, borderWidth: 1.5, borderColor: Colors.primary + '40',
    padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  aiCtaLeft: { flex: 1, gap: 4 },
  aiCtaTitle: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '700' },
  aiCtaDesc: { color: Colors.textMuted, fontSize: FontSize.xs, lineHeight: 18 },
  aiCtaBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: Radius.lg,
  },
  aiCtaBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
});

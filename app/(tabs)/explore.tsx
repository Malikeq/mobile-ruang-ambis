import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Platform, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { API_BASE } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

interface Weakness {
  id: number;
  mapel: any;
  sub_materi: any;
  // backend returns these two names
  accuracy_rate: number | null;
  attempt_count: number;
  // aliases also returned by backend
  rata_rata_skor: number | null;
  total_sesi: number;
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
  const [mapelData,   setMapelData]   = useState<MapelProgress[]>([]);
  const [totalSkor,   setTotalSkor]   = useState(0);
  const [snbtEst,     setSnbtEst]     = useState(0);  // from backend skor_snbt_estimasi
  const [totalSoal,   setTotalSoal]   = useState(0);  // total soal dikerjakan
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [activeTab,   setActiveTab]   = useState<'kelemahan'|'progres'|'rekomendasi'|'riwayat'>('kelemahan');

  // Riwayat state
  const [riwayat,      setRiwayat]      = useState<any[]>([]);
  const [riwayatPage,  setRiwayatPage]  = useState(1);
  const [riwayatTotal, setRiwayatTotal] = useState(0);
  const [riwayatLoad,  setRiwayatLoad]  = useState(false);
  const [riwayatFetched, setRiwayatFetched] = useState(false);

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
      const d = dash?.data ?? {};

      // Backend returns akurasi_overall (0-100), fallback to rata_rata_skor for compat
      const skor = Number(d.akurasi_overall ?? d.rata_rata_skor ?? 0);
      setTotalSkor(isNaN(skor) ? 0 : skor);
      setSnbtEst(Number(d.skor_snbt_estimasi ?? 0));
      setTotalSoal(Number(d.total_soal_dikerjakan ?? 0));

      // Backend returns progres_per_mapel: [{mapel: {nama,...}, akurasi, attempt_count}]
      // Also handle legacy mapel_progress: [{mapel: string, skor, soal_count}]
      const rawMapel: any[] = d.progres_per_mapel ?? d.mapel_progress ?? [];
      const mapped: MapelProgress[] = rawMapel.map((r: any) => ({
        mapel:      typeof r.mapel === 'string' ? r.mapel : (r.mapel?.nama ?? r.mapel?.kode ?? '—'),
        skor:       Number(r.akurasi ?? r.skor ?? 0),
        soal_count: Number(r.attempt_count ?? r.soal_count ?? 0),
      }));
      setMapelData(mapped);

      setWeaknesses(weak?.data ?? []);
      // Reset riwayat so it re-fetches on next tab switch
      if (isRefresh) { setRiwayat([]); setRiwayatPage(1); setRiwayatFetched(false); }
    } catch {
      setWeaknesses([]);
      setMapelData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchRiwayat = async (page = 1) => {
    if (riwayatLoad) return;
    setRiwayatLoad(true);
    try {
      const res  = await fetch(`${API_BASE}/latihan/riwayat?page=${page}&per_page=15`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const json = await res.json();
      const items: any[] = json?.data ?? [];
      setRiwayat(prev => page === 1 ? items : [...prev, ...items]);
      setRiwayatTotal(json?.total ?? 0);
      setRiwayatPage(page);
      setRiwayatFetched(true);
    } catch {}
    finally { setRiwayatLoad(false); }
  };

  // Lazy-load riwayat when tab is first opened
  useEffect(() => {
    if (activeTab === 'riwayat' && !riwayatFetched) fetchRiwayat(1);
  }, [activeTab]);

  const TABS = [
    { id: 'kelemahan',   label: '⚠️ Lemah'  },
    { id: 'progres',     label: '📊 Progres' },
    { id: 'rekomendasi', label: '🤖 Rekomen' },
    { id: 'riwayat',     label: '📋 Riwayat' },
  ];

  const REKOMENDASI = weaknesses.slice(0, 3).map(w => ({
    mapel: toStr(w.mapel), action: `Latih ulang "${toStr(w.sub_materi)}"`,
    reason: `Skor rata-rata ${Math.round(Number(w.rata_rata_skor) || 0)}% — di bawah target`, color: Colors.error,
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
          {(() => {
            const hasData = totalSkor > 0 || totalSoal > 0;
            const c       = totalSkor >= 70 ? Colors.success : totalSkor >= 50 ? Colors.secondary : totalSkor > 0 ? Colors.error : Colors.textMuted;
            // Use real backend SNBT estimate; fallback to local calc if 0
            const snbt    = snbtEst > 0 ? snbtEst : totalSkor > 0 ? Math.round(400 + (totalSkor / 100) * 400) : null;
            const label   = totalSkor >= 70 ? 'Excellent 🏆' : totalSkor >= 50 ? 'On Track 📈' : totalSkor > 0 ? 'Needs Work 💪' : 'Mulai Latihan! 🚀';
            const badgeIcon = totalSkor >= 70 ? 'checkmark-circle' : totalSkor >= 50 ? 'trending-up' : totalSkor > 0 ? 'flash' : 'play-circle';
            // SNBT bar: backend scale 400–1000 (range=600), clamp 0-100%
            const snbtBarPct = snbt != null ? Math.min(100, Math.max(0, ((snbt - 400) / 600) * 100)) : 0;
            return (
              <View style={[styles.overallCard, { borderColor: c + '40' }]}>
                {/* Glow blob */}
                <View style={[styles.overallGlow, { backgroundColor: c + '14' }]} />

                {/* Top: text + ring */}
                <View style={styles.overallTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.overallLabel}>SKOR KESELURUHAN</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 4 }}>
                      <Text style={[styles.overallScore, { color: c }]}>
                        {totalSkor > 0 ? Math.round(totalSkor) : '—'}%
                      </Text>
                      {totalSkor > 0 && <Text style={[styles.overallAccLabel, { color: c }]}>akurasi</Text>}
                    </View>
                    <View style={[styles.overallBadge, { backgroundColor: c + '20', borderColor: c + '60' }]}>
                      <Ionicons name={badgeIcon as any} size={12} color={c} />
                      <Text style={[styles.overallBadgeText, { color: c }]}>{label}</Text>
                    </View>
                    {!hasData && (
                      <Text style={{ color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 8, lineHeight: 18 }}>
                        Kerjakan latihan pertamamu untuk{'\n'}melihat analisis lengkap di sini!
                      </Text>
                    )}
                  </View>
                  <ScoreRing value={totalSkor} color={c} size={90} />
                </View>

                {/* SNBT estimate bar */}
                {snbt != null && totalSkor > 0 && (
                  <View style={styles.snbtWrap}>
                    <View style={styles.snbtLabelRow}>
                      <Text style={styles.snbtLabel}>Estimasi Skor SNBT</Text>
                      <Text style={[styles.snbtValue, { color: c }]}>
                        {snbt} <Text style={{ fontSize: 11, color: Colors.textMuted, fontWeight: '400' }}>/ 1000</Text>
                      </Text>
                    </View>
                    <View style={styles.snbtTrack}>
                      <View style={[styles.snbtFill, { width: `${snbtBarPct}%` as any, backgroundColor: c }]} />
                      {/* Passing threshold marker at ~33% of bar = score 600 */}
                      <View style={styles.snbtThreshold} />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }}>
                      <Text style={styles.snbtMin}>400</Text>
                      <Text style={styles.snbtPassMark}>↑ Pass ~600</Text>
                      <Text style={styles.snbtMin}>1000</Text>
                    </View>
                  </View>
                )}

                {/* Stat pills */}
                <View style={styles.overallPills}>
                  {([
                    { icon: 'school-outline',      label: 'SNBT Est.',  val: snbt != null && totalSkor > 0 ? `${snbt}` : '—' },
                    { icon: 'document-text-outline',label: 'Dikerjakan', val: totalSoal > 0 ? `${totalSoal}` : '—' },
                    { icon: 'alert-circle-outline', label: 'Kelemahan',  val: `${weaknesses.length}` },
                  ] as { icon: any; label: string; val: string }[]).map((p, i) => (
                    <View key={i} style={[styles.pill, { borderColor: c + '30' }]}>
                      <Ionicons name={p.icon} size={14} color={c} />
                      <Text style={[styles.pillVal, { color: c }]}>{p.val}</Text>
                      <Text style={styles.pillLabel}>{p.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })()}

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
                <View>
                  {weaknesses.length === 0 ? (
                    <View style={[styles.card, styles.emptyTab]}>
                      <Text style={{ fontSize: 48 }}>✅</Text>
                      <Text style={styles.emptyTabTitle}>Tidak Ada Kelemahan!</Text>
                      <Text style={styles.emptyTabText}>
                        Performa rata-ratamu bagus.{'\n'}Terus latihan untuk menjaga konsistensi.
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.weakHeader}>{weaknesses.length} area perlu ditingkatkan</Text>
                      {weaknesses.map((w) => {
                        const skor    = Math.round(Number(w.rata_rata_skor) || 0);
                        const isCrit  = skor < 50;
                        const c       = isCrit ? Colors.error : Colors.secondary;
                        const gap     = Math.max(0, 70 - skor);
                        const sevLabel= isCrit ? 'Kritis' : 'Perlu Latihan';
                        const sevIcon = isCrit ? 'alert-circle' : 'warning';
                        return (
                          <View key={w.id} style={[styles.weakCard, { borderLeftColor: c }]}>
                            {/* Header: severity badge + score */}
                            <View style={styles.weakCardTop}>
                              <View style={[styles.weakSevBadge, { backgroundColor: c + '18' }]}>
                                <Ionicons name={sevIcon as any} size={12} color={c} />
                                <Text style={[styles.weakSevText, { color: c }]}>{sevLabel}</Text>
                              </View>
                              <Text style={[styles.weakSkorBig, { color: c }]}>{skor}%</Text>
                            </View>

                            {/* Mapel + sub materi */}
                            <Text style={styles.weakMapelBig}>{toStr(w.mapel)}</Text>
                            <Text style={styles.weakSubBig}>{toStr(w.sub_materi)}</Text>

                            {/* Progress bar toward 70% target */}
                            <View style={styles.weakBarWrap}>
                              <View style={styles.weakBarTrack}>
                                <View style={[styles.weakBarFill, { width: `${Math.min(skor, 100)}%` as any, backgroundColor: c }]} />
                                <View style={styles.weakBarTarget} />
                              </View>
                              <View style={styles.weakBarLabels}>
                                <Text style={[styles.weakBarLbl, { color: c }]}>{skor}% sekarang</Text>
                                <Text style={styles.weakBarLblRight}>🎯 70% target</Text>
                              </View>
                            </View>

                            {/* Footer pills */}
                            <View style={styles.weakCardFoot}>
                              <View style={styles.weakFootPill}>
                                <Ionicons name="book-outline" size={11} color={Colors.textMuted} />
                                <Text style={styles.weakFootTxt}>{w.total_sesi} sesi</Text>
                              </View>
                              {gap > 0 && (
                                <View style={[styles.weakFootPill, { borderColor: c + '50', backgroundColor: c + '0C' }]}>
                                  <Ionicons name="arrow-up" size={11} color={c} />
                                  <Text style={[styles.weakFootTxt, { color: c }]}>Butuh +{gap}% lagi</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        );
                      })}
                    </>
                  )}
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

              {/* Riwayat */}
              {activeTab === 'riwayat' && (
                <View>
                  {riwayatLoad && riwayat.length === 0 ? (
                    <View style={styles.loadingWrap}>
                      <ActivityIndicator color={Colors.primary} size="large" />
                      <Text style={styles.loadingText}>Memuat riwayat...</Text>
                    </View>
                  ) : riwayat.length === 0 ? (
                    <View style={[styles.card, styles.emptyTab]}>
                      <Text style={{ fontSize: 40 }}>📋</Text>
                      <Text style={styles.emptyTabText}>Belum ada riwayat latihan{'\n'}Yuk, mulai latihan sekarang!</Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.riwayatCount}>{riwayatTotal} sesi selesai</Text>
                      {riwayat.map((r, i) => {
                        const acc   = r.skor_raw ?? 0;
                        const snbt  = r.skor_akhir ?? 0;
                        const color = acc >= 70 ? Colors.success : acc >= 50 ? Colors.secondary : Colors.error;
                        const dur   = r.durasi_detik;
                        const durStr = dur != null
                          ? `${String(Math.floor(dur/60)).padStart(2,'0')}:${String(dur%60).padStart(2,'0')}`
                          : '—';
                        const tgl = new Date(r.tanggal);
                        const tglStr = `${tgl.getDate()}/${tgl.getMonth()+1}/${tgl.getFullYear()} ${String(tgl.getHours()).padStart(2,'0')}.${String(tgl.getMinutes()).padStart(2,'0')}`;
                        return (
                          <View key={r.id} style={styles.riwayatCard}>
                            {/* Left: Mapel badge + info */}
                            <View style={[styles.riwayatMapelBadge, { backgroundColor: color + '18' }]}>
                              <Text style={[styles.riwayatMapelKode, { color }]}>{r.mapel_kode}</Text>
                            </View>
                            <View style={{ flex: 1, gap: 4 }}>
                              <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
                                <Text style={styles.riwayatMapelNama} numberOfLines={1}>{r.mapel_nama}</Text>
                                <Text style={styles.riwayatTgl}>{tglStr}</Text>
                              </View>
                              {/* Score bar */}
                              <View style={styles.riwayatBarWrap}>
                                <View style={styles.riwayatBarTrack}>
                                  <View style={[styles.riwayatBarFill, { width: `${acc}%` as any, backgroundColor: color }]} />
                                </View>
                                <Text style={[styles.riwayatPct, { color }]}>{acc}%</Text>
                              </View>
                              {/* Stats row */}
                              <View style={styles.riwayatStatsRow}>
                                <View style={styles.riwayatStat}>
                                  <Ionicons name="school-outline" size={11} color={Colors.textMuted} />
                                  <Text style={styles.riwayatStatTxt}>SNBT {snbt}</Text>
                                </View>
                                <View style={styles.riwayatStat}>
                                  <Ionicons name="checkmark-circle-outline" size={11} color={Colors.success} />
                                  <Text style={styles.riwayatStatTxt}>{r.total_benar}/{r.total_soal}</Text>
                                </View>
                                <View style={styles.riwayatStat}>
                                  <Ionicons name="timer-outline" size={11} color={Colors.textMuted} />
                                  <Text style={styles.riwayatStatTxt}>{durStr}</Text>
                                </View>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                      {/* Load more */}
                      {riwayat.length < riwayatTotal && (
                        <TouchableOpacity
                          style={styles.loadMoreBtn}
                          onPress={() => fetchRiwayat(riwayatPage + 1)}
                          disabled={riwayatLoad}
                        >
                          {riwayatLoad
                            ? <ActivityIndicator color={Colors.primary} size="small" />
                            : <Text style={styles.loadMoreText}>Muat lebih banyak →</Text>}
                        </TouchableOpacity>
                      )}
                    </>
                  )}
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
    borderWidth: 1.5, overflow: 'hidden',
    padding: Spacing.lg, marginBottom: Spacing.lg,
  },
  overallGlow: { position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: 70 },
  overallTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: Spacing.md },
  overallLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  overallScore: { fontSize: 52, fontWeight: '900', lineHeight: 58, letterSpacing: -1 },
  overallAccLabel: { fontSize: FontSize.sm, fontWeight: '700', marginBottom: 8 },
  overallBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4, marginTop: 6 },
  overallBadgeText: { fontSize: 11, fontWeight: '700' },
  overallSub: { color: Colors.textSecondary, fontSize: FontSize.xs, lineHeight: 18 },
  // SNBT bar
  snbtWrap: { marginBottom: Spacing.md },
  snbtLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  snbtLabel: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '600' },
  snbtValue: { fontSize: FontSize.base, fontWeight: '800' },
  snbtTrack: { height: 10, backgroundColor: Colors.surfaceElevated, borderRadius: 5, overflow: 'hidden', position: 'relative' },
  snbtFill: { height: '100%', borderRadius: 5 },
  snbtThreshold: { position: 'absolute', left: '50%' as any, top: 0, bottom: 0, width: 2, backgroundColor: Colors.textMuted + '60' },
  snbtMin: { color: Colors.textMuted, fontSize: 9, fontWeight: '600' },
  snbtPassMark: { color: Colors.textMuted, fontSize: 9, fontWeight: '600' },
  // Stat pills
  overallPills: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  pill: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 10, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.lg, borderWidth: 1 },
  pillVal: { fontSize: FontSize.sm, fontWeight: '900' },
  pillLabel: { color: Colors.textMuted, fontSize: 9, fontWeight: '600' },

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


  emptyTabTitle: { color: Colors.textPrimary, fontSize: FontSize.base, fontWeight: '800' },
  // Old weak styles kept for compat
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
  // New weak card styles
  weakHeader: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 0.4, marginBottom: Spacing.sm, textTransform: 'uppercase' },
  weakCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border,
    borderLeftWidth: 4, padding: Spacing.md,
    marginBottom: Spacing.sm, gap: 6,
  },
  weakCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weakSevBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  weakSevText: { fontSize: 11, fontWeight: '700' },
  weakSkorBig: { fontSize: 26, fontWeight: '900', lineHeight: 30 },
  weakMapelBig: { color: Colors.textPrimary, fontSize: FontSize.base, fontWeight: '800' },
  weakSubBig: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '500' },
  weakBarWrap: { gap: 4, marginTop: 4 },
  weakBarTrack: { height: 10, backgroundColor: Colors.surfaceElevated, borderRadius: 5, overflow: 'hidden', position: 'relative' },
  weakBarFill: { height: '100%', borderRadius: 5 },
  weakBarTarget: { position: 'absolute', left: '70%' as any, top: 0, bottom: 0, width: 2, backgroundColor: Colors.textMuted + '80' },
  weakBarLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  weakBarLbl: { fontSize: 10, fontWeight: '700' },
  weakBarLblRight: { color: Colors.textMuted, fontSize: 10, fontWeight: '600' },
  weakCardFoot: { flexDirection: 'row', gap: Spacing.sm, marginTop: 2 },
  weakFootPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: Colors.surfaceElevated, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
  weakFootTxt: { color: Colors.textMuted, fontSize: 10, fontWeight: '600' },

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
  riwayatCount: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '600', marginBottom: Spacing.sm, letterSpacing: 0.3 },
  riwayatCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  riwayatMapelBadge: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  riwayatMapelKode: { fontSize: 11, fontWeight: '900' },
  riwayatMapelNama: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '700', flex: 1, marginRight: 8 },
  riwayatTgl: { color: Colors.textMuted, fontSize: 9, fontWeight: '600' },
  riwayatBarWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  riwayatBarTrack: { flex: 1, height: 6, backgroundColor: Colors.surfaceElevated, borderRadius: 3, overflow: 'hidden' },
  riwayatBarFill: { height: '100%', borderRadius: 3 },
  riwayatPct: { width: 30, fontSize: 10, fontWeight: '800', textAlign: 'right' },
  riwayatStatsRow: { flexDirection: 'row', gap: Spacing.md },
  riwayatStat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  riwayatStatTxt: { color: Colors.textMuted, fontSize: 10, fontWeight: '600' },
  loadMoreBtn: { alignItems: 'center', paddingVertical: Spacing.md, marginBottom: Spacing.md },
  loadMoreText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '700' },
});

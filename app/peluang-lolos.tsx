import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { API_BASE } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

type Status = 'AMAN' | 'KUNING' | 'MERAH' | 'BELUM_DIHITUNG';
const META: Record<Status, { color: string; bg: string; icon: string; label: string }> = {
  AMAN:           { color: '#10B981', bg: '#10B98112', icon: 'checkmark-circle', label: 'AMAN' },
  KUNING:         { color: '#F59E0B', bg: '#F59E0B12', icon: 'warning',          label: 'KUNING' },
  MERAH:          { color: '#EF4444', bg: '#EF444412', icon: 'close-circle',     label: 'MERAH' },
  BELUM_DIHITUNG: { color: '#6B7280', bg: Colors.surface, icon: 'help-circle',   label: 'Belum' },
};

interface Breakdown { base_rerata: number; multiplier: number; tier_label: string; inflasi_tahunan: number; safety_buffer: number; formula: string; }
interface SkorDiperlukan { skor_masuk: number; skor_aman: number; formula_breakdown: Breakdown; }
interface Stat { keketatan_persen: number; kategori_keketatan: string; rerata_skor_diterima: number; kuota_snbt: number; peminat_snbt: number; tahun: number; }
interface Peluang { jurusan_id: number; priority: number; nama_prodi: string; nama_ptn: string; akronim_ptn: string; skor_user: number; skor_diperlukan: SkorDiperlukan | null; stat: Stat | null; status_lolos: Status; probabilitas: number | null; gap_skor: number | null; catatan: string; }

/* ── Skor Comparison Bar ───────────────────────────────────────── */
function SkorCompare({ skorUser, skorDiperlukan, hasSkor }: { skorUser: number; skorDiperlukan: SkorDiperlukan | null; hasSkor: boolean }) {
  const skorAman  = skorDiperlukan?.skor_aman  ?? 0;
  const skorMasuk = skorDiperlukan?.skor_masuk ?? 0;
  const max = Math.max(skorAman * 1.15, skorUser * 1.1, 1000);
  const userPct  = hasSkor ? Math.min((skorUser  / max) * 100, 100) : 0;
  const amanPct  = Math.min((skorAman  / max) * 100, 100);
  const masukPct = Math.min((skorMasuk / max) * 100, 100);

  return (
    <View style={sc.wrap}>
      <View style={sc.row}>
        <Text style={sc.label}>Skor Kamu</Text>
        <Text style={[sc.val, { color: hasSkor ? (skorUser >= skorAman ? '#10B981' : skorUser >= skorMasuk ? '#F59E0B' : '#EF4444') : Colors.textMuted }]}>
          {hasSkor ? Math.round(skorUser) : '—'}
        </Text>
      </View>
      <View style={sc.track}>
        {/* Skor masuk marker */}
        <View style={[sc.marker, { left: `${masukPct}%` as any, backgroundColor: '#F59E0B' }]} />
        {/* Skor aman marker */}
        <View style={[sc.marker, { left: `${amanPct}%` as any, backgroundColor: '#10B981' }]} />
        {/* User fill */}
        {hasSkor && <View style={[sc.fill, { width: `${userPct}%` as any, backgroundColor: skorUser >= skorAman ? '#10B981' : skorUser >= skorMasuk ? '#F59E0B' : '#EF4444' }]} />}
      </View>
      <View style={sc.legendRow}>
        <View style={sc.leg}><View style={[sc.dot, { backgroundColor: '#F59E0B' }]} /><Text style={sc.legTxt}>Masuk min: {Math.round(skorMasuk)}</Text></View>
        <View style={sc.leg}><View style={[sc.dot, { backgroundColor: '#10B981' }]} /><Text style={sc.legTxt}>Aman: {Math.round(skorAman)}</Text></View>
      </View>
    </View>
  );
}
const sc = StyleSheet.create({
  wrap: { gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: Colors.textMuted, fontSize: 12 },
  val: { fontSize: 15, fontWeight: '900' },
  track: { height: 10, backgroundColor: Colors.surfaceElevated, borderRadius: 5, overflow: 'visible', position: 'relative' },
  fill: { height: '100%', borderRadius: 5 },
  marker: { position: 'absolute', top: -2, width: 2, height: 14, borderRadius: 1 },
  legendRow: { flexDirection: 'row', gap: 16 },
  leg: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legTxt: { color: Colors.textMuted, fontSize: 10 },
});

/* ── Formula Breakdown Card ────────────────────────────────────── */
function FormulaCard({ b }: { b: Breakdown }) {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity onPress={() => setOpen(v => !v)} style={fc.wrap} activeOpacity={0.8}>
      <View style={fc.header}>
        <Ionicons name="calculator" size={12} color={Colors.primary} />
        <Text style={fc.hTxt}>Cara Hitung Skor Diperlukan</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={12} color={Colors.textMuted} />
      </View>
      {open && (
        <View style={fc.body}>
          {[
            ['📊 Base (rata diterima)', `${b.base_rerata} poin`],
            [`🏆 Multiplier (${b.tier_label})`, `× ${b.multiplier}`],
            [`📅 Inflasi tahunan`, `+ ${b.inflasi_tahunan} poin`],
            ['🛡️ Safety buffer', `+ ${b.safety_buffer} poin`],
            ['✅ Skor Aman', b.formula.split('= ')[1] ?? ''],
          ].map(([k, v]) => (
            <View key={k} style={fc.row}>
              <Text style={fc.key}>{k}</Text>
              <Text style={fc.fval}>{v}</Text>
            </View>
          ))}
          <Text style={fc.formulaTxt}>📐 {b.formula}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
const fc = StyleSheet.create({
  wrap: { backgroundColor: Colors.primary + '0D', borderRadius: 12, borderWidth: 1, borderColor: Colors.primary + '30', padding: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hTxt: { flex: 1, color: Colors.primary, fontSize: 11, fontWeight: '700' },
  body: { marginTop: 10, gap: 6 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  key: { color: Colors.textMuted, fontSize: 11 },
  fval: { color: Colors.textPrimary, fontSize: 11, fontWeight: '700' },
  formulaTxt: { color: Colors.textMuted, fontSize: 10, marginTop: 4, fontStyle: 'italic' },
});

/* ── Peluang Card ──────────────────────────────────────────────── */
function PeluangCard({ p, hasSkor }: { p: Peluang; hasSkor: boolean }) {
  const meta = META[p.status_lolos];
  return (
    <View style={[cd.card, { borderColor: meta.color + '35', backgroundColor: meta.bg }]}>
      <View style={cd.head}>
        <View style={{ flex: 1 }}>
          <Text style={cd.ptn}>{p.akronim_ptn || p.nama_ptn}</Text>
          <Text style={cd.prodi} numberOfLines={2}>{p.nama_prodi}</Text>
        </View>
        <View style={[cd.badge, { backgroundColor: meta.color + '20', borderColor: meta.color }]}>
          <Ionicons name={meta.icon as any} size={13} color={meta.color} />
          <Text style={[cd.badgeTxt, { color: meta.color }]}>{meta.label}</Text>
        </View>
        <View style={cd.priority}><Text style={cd.priorityTxt}>#{p.priority}</Text></View>
      </View>

      {/* Skor comparison bar */}
      {p.skor_diperlukan && (
        <SkorCompare skorUser={p.skor_user} skorDiperlukan={p.skor_diperlukan} hasSkor={hasSkor} />
      )}

      {/* Stats grid */}
      {p.skor_diperlukan && (
        <View style={cd.grid}>
          {[
            ['Skor Kamu', hasSkor ? Math.round(p.skor_user) : '—', meta.color],
            ['Masuk Min', Math.round(p.skor_diperlukan.skor_masuk), '#F59E0B'],
            ['Aman', Math.round(p.skor_diperlukan.skor_aman), '#10B981'],
            ['Gap', hasSkor && p.gap_skor !== null ? (p.gap_skor >= 0 ? `+${Math.round(p.gap_skor)}` : Math.round(p.gap_skor)) : '—',
              (p.gap_skor ?? -1) >= 0 ? '#10B981' : '#EF4444'],
          ].map(([l, v, c], i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={cd.div} />}
              <View style={cd.si}><Text style={cd.sl}>{l}</Text><Text style={[cd.sv, { color: c as string }]}>{String(v)}</Text></View>
            </React.Fragment>
          ))}
        </View>
      )}

      {/* Probabilitas bar */}
      {hasSkor && p.probabilitas !== null && (
        <View style={cd.probWrap}>
          <View style={cd.probRow}>
            <Text style={cd.probLbl}>Peluang Lolos</Text>
            <Text style={[cd.probVal, { color: meta.color }]}>{p.probabilitas}%</Text>
          </View>
          <View style={cd.track}><View style={[cd.fill, { width: `${Math.min(p.probabilitas, 100)}%` as any, backgroundColor: meta.color }]} /></View>
        </View>
      )}

      {/* Keketatan detail */}
      {p.stat && (
        <View style={cd.kRow}>
          {[['Kuota', p.stat.kuota_snbt], ['Peminat', p.stat.peminat_snbt.toLocaleString()],
            ['Rata Diterima', p.stat.rerata_skor_diterima?.toFixed(0)], ['Data', p.stat.tahun]].map(([l, v]) => (
            <View key={l} style={cd.ki}><Text style={cd.kl}>{l}</Text><Text style={cd.kv}>{v}</Text></View>
          ))}
        </View>
      )}

      {/* Formula breakdown (collapsible) */}
      {p.skor_diperlukan?.formula_breakdown && (
        <FormulaCard b={p.skor_diperlukan.formula_breakdown} />
      )}

      {/* AI catatan */}
      {hasSkor && p.catatan && !p.catatan.includes('belum tersedia') && (
        <View style={cd.catatan}><Ionicons name="sparkles" size={12} color="#CE82FF" /><Text style={cd.catatanTxt}>{p.catatan}</Text></View>
      )}

      {!p.skor_diperlukan && !p.stat && (
        <View style={cd.noData}><Ionicons name="cloud-offline-outline" size={13} color={Colors.textMuted} /><Text style={cd.noDataTxt}>Data keketatan prodi ini belum tersedia.</Text></View>
      )}
    </View>
  );
}
const cd = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1.5, padding: 14, gap: 12 },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  ptn: { color: Colors.textPrimary, fontSize: 18, fontWeight: '900' },
  prodi: { color: Colors.textMuted, fontSize: 12, marginTop: 2, lineHeight: 18 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 99, borderWidth: 1.5, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' },
  badgeTxt: { fontSize: 11, fontWeight: '800' },
  priority: { backgroundColor: Colors.surfaceElevated, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  priorityTxt: { color: Colors.textMuted, fontSize: 10, fontWeight: '700' },
  grid: { flexDirection: 'row', borderWidth: 1, borderColor: Colors.border, borderRadius: 12, overflow: 'hidden' },
  si: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 3 },
  sl: { color: Colors.textMuted, fontSize: 9 },
  sv: { fontSize: 13, fontWeight: '900', color: Colors.textPrimary },
  div: { width: 1, backgroundColor: Colors.border },
  probWrap: { gap: 6 },
  probRow: { flexDirection: 'row', justifyContent: 'space-between' },
  probLbl: { color: Colors.textMuted, fontSize: 12 },
  probVal: { fontSize: 13, fontWeight: '900' },
  track: { height: 8, backgroundColor: Colors.surfaceElevated, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  kRow: { flexDirection: 'row', backgroundColor: Colors.surfaceElevated, borderRadius: 10, padding: 10 },
  ki: { flex: 1, alignItems: 'center', gap: 2 },
  kl: { color: Colors.textMuted, fontSize: 8 },
  kv: { color: Colors.textSecondary, fontSize: 10, fontWeight: '700' },
  catatan: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#CE82FF10', borderRadius: 10, padding: 10 },
  catatanTxt: { flex: 1, color: '#CE82FF', fontSize: 11, lineHeight: 16 },
  noData: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  noDataTxt: { flex: 1, color: Colors.textMuted, fontSize: 11 },
});

/* ── Main Screen ───────────────────────────────────────────────── */
export default function PeluangLolosScreen() {
  const { token } = useAuth();
  const [data,       setData]       = useState<Peluang[]>([]);
  const [skorUser,   setSkorUser]   = useState(0);
  const [hasSkor,    setHasSkor]    = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [genLoading, setGenLoading] = useState(false);
  const H = { Authorization: `Bearer ${token}`, Accept: 'application/json' };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/user/peluang-lolos`, { headers: H });
      const j   = await res.json();
      setData(j?.data ?? []);
      const s = j?.skor_user ?? 0;
      setSkorUser(s); setHasSkor(s > 0);
    } catch {}
    setLoading(false);
  }, [token]);

  const genEstimasi = async () => {
    setGenLoading(true);
    try {
      const res = await fetch(`${API_BASE}/user/estimasi-skor`, { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' } });
      const j   = await res.json();
      if (j.has_data) { setSkorUser(j.skor_estimasi); setHasSkor(true); await load(); }
      else Alert.alert('Belum Ada Data Latihan', j.saran ?? 'Kerjakan beberapa soal latihan terlebih dahulu.',
        [{ text: 'Mulai Latihan', onPress: () => router.push('/(tabs)/latihan') }, { text: 'Nanti', style: 'cancel' }]);
    } catch {}
    setGenLoading(false);
  };

  useEffect(() => { load(); }, []);

  const aman = data.filter(p => p.status_lolos === 'AMAN').length;
  const kuning = data.filter(p => p.status_lolos === 'KUNING').length;
  const merah = data.filter(p => p.status_lolos === 'MERAH').length;

  return (
    <View style={st.container}>
      <View style={st.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={22} color={Colors.textMuted} /></TouchableOpacity>
        <Text style={st.headerTitle}>Peluang Lolos PTN 🎯</Text>
        <TouchableOpacity onPress={load}><Ionicons name="refresh" size={20} color={Colors.primary} /></TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={{ color: Colors.textMuted, fontSize: 13 }}>Menghitung peluang lolos...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

          {/* ── Skor User Banner ────────────────────────── */}
          <View style={st.skorBanner}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={st.skorLabel}>SKOR SNBT ESTIMASIMU</Text>
              {hasSkor ? (
                <>
                  <Text style={[st.skorVal, { color: skorUser >= 700 ? '#10B981' : skorUser >= 550 ? '#F59E0B' : '#EF4444' }]}>
                    {Math.round(skorUser)} poin
                  </Text>
                  <Text style={st.skorSub}>{skorUser >= 700 ? '🏆 Top 10% nasional!' : skorUser >= 550 ? '📈 Di atas rata-rata' : '💪 Terus tingkatkan!'}</Text>
                </>
              ) : (
                <Text style={[st.skorVal, { color: Colors.textMuted, fontSize: 22 }]}>Belum Ada Data</Text>
              )}
            </View>
            {!hasSkor && (
              <TouchableOpacity style={[st.genBtn, genLoading && { opacity: 0.7 }]} onPress={genEstimasi} disabled={genLoading}>
                {genLoading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="calculator" size={16} color="#fff" />}
                <Text style={st.genBtnTxt}>{genLoading ? 'Menghitung...' : 'Hitung Estimasi'}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ── Summary pills ───────────────────────────── */}
          {data.length > 0 && hasSkor && (
            <View style={st.sumRow}>
              {([['Aman', aman, '#10B981'], ['Kuning', kuning, '#F59E0B'], ['Merah', merah, '#EF4444']] as const).map(([l, v, c]) => (
                <View key={l} style={[st.pill, { backgroundColor: c + '15', borderColor: c }]}>
                  <Text style={[st.pillVal, { color: c }]}>{v}</Text>
                  <Text style={st.pillLabel}>{l}</Text>
                </View>
              ))}
              <TouchableOpacity style={[st.pill, { flex: 1.5, backgroundColor: Colors.primary + '15', borderColor: Colors.primary }]} onPress={() => router.push('/ai-chat')}>
                <Ionicons name="sparkles" size={15} color={Colors.primary} />
                <Text style={[st.pillLabel, { color: Colors.primary }]}>Tanya AI</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Cards ───────────────────────────────────── */}
          <View style={{ padding: 16, gap: 16 }}>
            {data.length === 0 ? (
              <View style={st.empty}>
                <Text style={{ fontSize: 48 }}>🎯</Text>
                <Text style={st.emptyTitle}>Belum ada target PTN</Text>
                <Text style={st.emptySub}>Tambahkan target PTN di halaman profil.</Text>
                <TouchableOpacity style={st.emptyBtn} onPress={() => router.push('/(tabs)/profil')}>
                  <Ionicons name="school" size={16} color="#fff" />
                  <Text style={st.emptyBtnTxt}>Atur Target PTN →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {!hasSkor && (
                  <View style={st.noSkorCard}>
                    <Text style={{ fontSize: 32 }}>📊</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={st.noSkorTitle}>Skor estimasimu belum ada</Text>
                      <Text style={st.noSkorDesc}>Tap "Hitung Estimasi" di atas untuk melihat peluang lolos setiap PTN.</Text>
                    </View>
                  </View>
                )}
                {data.map((p, i) => <PeluangCard key={i} p={p} hasSkor={hasSkor} />)}
              </>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingTop: Platform.OS === 'ios' ? 56 : 44, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.base, fontWeight: '800' },
  skorBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, margin: 16, marginBottom: 0, backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1.5, borderColor: Colors.border, padding: 16 },
  skorLabel: { color: Colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  skorVal: { fontSize: 28, fontWeight: '900' },
  skorSub: { color: Colors.textMuted, fontSize: 11 },
  genBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  genBtnTxt: { color: '#fff', fontSize: 11, fontWeight: '800' },
  sumRow: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginTop: 12 },
  pill: { flex: 1, alignItems: 'center', borderRadius: 12, borderWidth: 1.5, paddingVertical: 10, gap: 2 },
  pillVal: { fontSize: 20, fontWeight: '900' },
  pillLabel: { color: Colors.textMuted, fontSize: 9, fontWeight: '700' },
  noSkorCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.primary + '10', borderRadius: 16, borderWidth: 1.5, borderColor: Colors.primary + '30', padding: 16 },
  noSkorTitle: { color: Colors.textPrimary, fontSize: 13, fontWeight: '800', marginBottom: 4 },
  noSkorDesc: { color: Colors.textMuted, fontSize: 11, lineHeight: 16 },
  empty: { alignItems: 'center', gap: 12, paddingTop: 40 },
  emptyTitle: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '800' },
  emptySub: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center' },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, borderRadius: Radius.xl, paddingHorizontal: 24, paddingVertical: 14 },
  emptyBtnTxt: { color: '#fff', fontWeight: '700' },
});

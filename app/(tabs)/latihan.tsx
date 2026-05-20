import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Platform, Dimensions, ActivityIndicator, Modal, Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { API_BASE } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
type Screen = 'list' | 'config' | 'bab';

const SUBJECTS: { kode: string; nama: string; icon: IoniconName; color: string; tags: string[] }[] = [
  { kode:'PU',  nama:'Penalaran Umum',               icon:'bulb',         color:'#3B82F6', tags:['snbt','tps'] },
  { kode:'PPU', nama:'Pengetahuan & Pemahaman Umum', icon:'newspaper',    color:'#6366F1', tags:['snbt','tps'] },
  { kode:'PBM', nama:'Pemahaman Bacaan & Menulis',   icon:'document-text',color:'#8B5CF6', tags:['snbt','tps'] },
  { kode:'PK',  nama:'Pengetahuan Kuantitatif',      icon:'calculator',   color:'#EC4899', tags:['snbt','tps'] },
  { kode:'LBI', nama:'Literasi Bahasa Indonesia',    icon:'flag',         color:'#EF4444', tags:['snbt','literasi'] },
  { kode:'LBE', nama:'Literasi Bahasa Inggris',      icon:'globe',        color:'#3B82F6', tags:['snbt','literasi'] },
  { kode:'MAT', nama:'Matematika',                   icon:'grid',         color:'#F59E0B', tags:['tka','saintek'] },
  { kode:'FIS', nama:'Fisika',                       icon:'flash',        color:'#06B6D4', tags:['tka','saintek'] },
  { kode:'KIM', nama:'Kimia',                        icon:'nuclear',      color:'#84CC16', tags:['tka','saintek'] },
  { kode:'BIO', nama:'Biologi',                      icon:'leaf',         color:'#22C55E', tags:['tka','saintek'] },
  { kode:'GEO', nama:'Geografi',                     icon:'map',          color:'#F97316', tags:['tka','soshum'] },
  { kode:'SOS', nama:'Sosiologi',                    icon:'people',       color:'#A855F7', tags:['tka','soshum'] },
  { kode:'EKO', nama:'Ekonomi',                      icon:'trending-up',  color:'#0EA5E9', tags:['tka','soshum'] },
  { kode:'SEJ', nama:'Sejarah',                      icon:'time',         color:'#D97706', tags:['tka','soshum'] },
];

const FILTERS = [
  { id:'snbt',     label:'SNBT',    icon:'school'    as IoniconName },
  { id:'tps',      label:'TPS',     icon:'analytics' as IoniconName },
  { id:'literasi', label:'Literasi',icon:'book'      as IoniconName },
  { id:'saintek',  label:'Saintek', icon:'planet'    as IoniconName },
  { id:'soshum',   label:'Soshum',  icon:'earth'     as IoniconName },
];

const MODES = [
  { id:'acak',      label:'Reguler',  desc:'Soal acak dari bank soal',       icon:'shuffle'  as IoniconName, color: Colors.primary   },
  { id:'per_bab',   label:'Per Bab',  desc:'Pilih bab/topik tertentu',        icon:'list'     as IoniconName, color:'#8B5CF6'         },
  { id:'tryout',    label:'Tryout',   desc:'Simulasi ujian penuh (85 soal)',  icon:'timer'    as IoniconName, color: Colors.secondary },
  { id:'kelemahan', label:'Targeted', desc:'Fokus pada area kelemahanmu',     icon:'locate'   as IoniconName, color: Colors.primary   },
];
const COUNTS = [5, 10, 20, 30];
const TIMER_OPTS = [5, 10, 15, 20, 30, 45, 60]; // minutes

interface SubMateri { id: number; nama: string; bab: string; soal_count: number; }

export default function LatihanScreen() {
  const { token } = useAuth();
  const [screen,      setScreen]      = useState<Screen>('list');
  const [filter,      setFilter]      = useState('snbt');
  const [selSubj,     setSelSubj]     = useState(SUBJECTS[0]);
  const [mode,        setMode]        = useState(MODES[0].id);
  const [count,       setCount]       = useState(10);
  const [timerEnabled,setTimerEnabled]= useState(false);
  const [timerMenit,  setTimerMenit]  = useState(15);
  const [starting,    setStarting]    = useState(false);
  const [mapelIds,    setMapelIds]    = useState<Record<string, number>>({});
  const [subMateris,  setSubMateris]  = useState<SubMateri[]>([]);
  const [selBab,      setSelBab]      = useState<SubMateri | null>(null);
  const [loadingBab,  setLoadBab]     = useState(false);

  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    fetchMapelIds();
  }, []);

  const fetchMapelIds = async () => {
    try {
      const res  = await fetch(`${API_BASE}/mapel`, { headers: { Authorization:`Bearer ${token}`, Accept:'application/json' } });
      const json = await res.json();
      const map: Record<string, number> = {};
      (json?.data ?? []).forEach((m: any) => { if (m.kode) map[m.kode] = m.id; });
      setMapelIds(map);
    } catch {}
  };

  const fetchSubMateri = async (mapelId: number) => {
    setLoadBab(true);
    try {
      const res  = await fetch(`${API_BASE}/sub-materi?mapel_id=${mapelId}`, { headers: { Authorization:`Bearer ${token}`, Accept:'application/json' } });
      const json = await res.json();
      const list: SubMateri[] = json?.data ?? [];
      setSubMateris(list);
      if (list.length > 0) setSelBab(list[0]);
    } catch { setSubMateris([]); }
    finally { setLoadBab(false); }
  };

  const getMapelId = () => mapelIds[selSubj.kode] ?? 0;

  const handleMulai = async () => {
    const mapelId = getMapelId();
    if (!mapelId) { console.warn('mapelId not found for kode:', selSubj.kode, 'ids:', mapelIds); return; }
    setStarting(true);
    try {
      const body: any = {
        tipe: 'harian',
        mode: mode,   // acak | per_bab | tryout | kelemahan
        mapel_ids: [mapelId],
      };
      // tryout uses backend default (no jumlah_soal limit enforced by us)
      if (mode !== 'tryout') body.jumlah_soal = count;

      if (mode === 'per_bab' && selBab) body.sub_materi_ids = [selBab.id];
      const res  = await fetch(`${API_BASE}/latihan/mulai`, {
        method: 'POST',
        headers: { Authorization:`Bearer ${token}`, Accept:'application/json', 'Content-Type':'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      const sesiId    = json?.data?.id;
      const totalSoal  = json?.data?.total_soal ?? count;
      if (sesiId) {
        router.push(`/latihan/${sesiId}?total=${totalSoal}&timer=${timerEnabled ? timerMenit : 0}`);
        return;
      }
      console.warn('mulai response:', JSON.stringify(json));
    } catch (e) { console.log('mulai error', e); }
    finally { setStarting(false); }
  };

  const goToConfig = (subj: typeof SUBJECTS[0]) => {
    setSelSubj(subj);
    setMode(MODES[0].id);
    setSelBab(null);
    setSubMateris([]);
    setScreen('config');
  };

  const handleModeSelect = (m: string) => {
    setMode(m);
    if (m === 'per_bab') {
      const id = mapelIds[selSubj.kode];
      if (id) fetchSubMateri(id);
    }
  };

  const selMode = MODES.find(m => m.id === mode) ?? MODES[0];
  const filtered = SUBJECTS.filter(s => s.tags.includes(filter));

  // ── Per Bab screen ────────────────────────────────────────────────────────
  if (screen === 'bab') {
    return (
      <View style={s.container}>
        <View style={[s.glow, { backgroundColor: selSubj.color + '10' }]} />
        <View style={s.header}>
          <TouchableOpacity style={s.backRow} onPress={() => setScreen('config')}>
            <Ionicons name="arrow-back" size={18} color={Colors.textMuted} />
            <Text style={s.backText}>Kembali</Text>
          </TouchableOpacity>
          <Text style={s.pageTitle}>Pilih Bab / Topik</Text>
          <Text style={s.pageSub}>{selSubj.nama}</Text>
        </View>
        {loadingBab ? (
          <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.babList}>
            {subMateris.length === 0 && (
              <View style={s.emptyBab}>
                <Ionicons name="alert-circle-outline" size={40} color={Colors.textMuted} />
                <Text style={s.emptyBabText}>Belum ada sub-materi tersedia</Text>
              </View>
            )}
            {subMateris.map((sm, i) => (
              <TouchableOpacity
                key={sm.id}
                style={[s.babCard, selBab?.id === sm.id && { borderColor: selSubj.color, backgroundColor: selSubj.color + '0E' }]}
                onPress={() => setSelBab(sm)}
              >
                <View style={[s.babRadio, selBab?.id === sm.id && { backgroundColor: selSubj.color, borderColor: selSubj.color }]}>
                  {selBab?.id === sm.id && <View style={s.babRadioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.babNama}>{sm.nama}</Text>
                  <Text style={s.babBab}>{sm.bab} · {sm.soal_count} soal</Text>
                </View>
                {selBab?.id === sm.id && <Ionicons name="checkmark-circle" size={20} color={selSubj.color} />}
              </TouchableOpacity>
            ))}
            <View style={{ height: 20 }} />
          </ScrollView>
        )}
        <View style={s.babFooter}>
          <TouchableOpacity
            style={[s.startBtn, { backgroundColor: selSubj.color }, (!selBab || starting) && { opacity: 0.5 }]}
            onPress={handleMulai}
            disabled={!selBab || starting}
          >
            {starting ? <ActivityIndicator color="#fff" size="small" /> : (
              <><Ionicons name="play-circle" size={20} color="#fff" /><Text style={s.startBtnText}>Mulai Per Bab</Text></>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Config screen ──────────────────────────────────────────────────────────
  if (screen === 'config') {
    return (
      <View style={s.container}>
        <View style={[s.glow, { backgroundColor: selSubj.color + '10' }]} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          <TouchableOpacity style={s.backRow} onPress={() => setScreen('list')}>
            <Ionicons name="arrow-back" size={18} color={Colors.textMuted} />
            <Text style={s.backText}>Ganti Mapel</Text>
          </TouchableOpacity>

          {/* Hero */}
          <View style={[s.heroCard, { borderColor: selSubj.color + '50' }]}>
            <View style={[s.heroIcon, { backgroundColor: selSubj.color + '20' }]}>
              <Ionicons name={selSubj.icon} size={34} color={selSubj.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.heroKode, { color: selSubj.color }]}>{selSubj.kode}</Text>
              <Text style={s.heroNama}>{selSubj.nama}</Text>
            </View>
          </View>

          {/* Mode */}
          <Text style={s.sectionLabel}>Mode Latihan</Text>
          <View style={s.modeList}>
            {MODES.map(m => (
              <TouchableOpacity key={m.id}
                style={[s.modeRow, mode === m.id && { borderColor: m.color, backgroundColor: m.color + '0E' }]}
                onPress={() => handleModeSelect(m.id)}>
                <View style={[s.modeIconWrap, { backgroundColor: m.color + '18' }]}>
                  <Ionicons name={m.icon} size={20} color={m.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.modeLabel, mode === m.id && { color: m.color }]}>{m.label}</Text>
                  <Text style={s.modeDesc}>{m.desc}</Text>
                </View>
                <View style={[s.radio, mode === m.id && { backgroundColor: m.color, borderColor: m.color }]}>
                  {mode === m.id && <View style={s.radioDot} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Per Bab CTA */}
          {mode === 'per_bab' && (
            <TouchableOpacity style={[s.babCta, { borderColor: '#8B5CF6' + '60' }]}
              onPress={() => setScreen('bab')}>
              <Ionicons name="list-outline" size={20} color="#8B5CF6" />
              <View style={{ flex: 1 }}>
                <Text style={[s.babCtaTitle, { color: '#8B5CF6' }]}>
                  {selBab ? selBab.nama : 'Pilih Bab / Topik'}
                </Text>
                <Text style={s.babCtaSub}>{selBab ? selBab.bab : 'Tap untuk memilih bab'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}

          {/* Count (not tryout) */}
          {mode !== 'tryout' && (
            <>
              <Text style={s.sectionLabel}>Jumlah Soal</Text>
              <View style={s.countRow}>
                {COUNTS.map(n => (
                  <TouchableOpacity key={n}
                    style={[s.countChip, count === n && { backgroundColor: selSubj.color, borderColor: selSubj.color }]}
                    onPress={() => setCount(n)}>
                    <Text style={[s.countVal, count === n && { color: '#fff' }]}>{n}</Text>
                    <Text style={[s.countSub, count === n && { color: '#ffffff99' }]}>soal</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Timer Countdown */}
          <Text style={s.sectionLabel}>Timer Countdown</Text>
          <View style={[s.timerToggleRow, timerEnabled && { borderColor: '#F59E0B60' }]}>
            <View style={{ flexDirection:'row', alignItems:'center', gap: 10, flex: 1 }}>
              <View style={[s.timerIconWrap, { backgroundColor: timerEnabled ? '#F59E0B20' : Colors.surfaceElevated }]}>
                <Ionicons name="hourglass-outline" size={20} color={timerEnabled ? '#F59E0B' : Colors.textMuted} />
              </View>
              <View>
                <Text style={[s.timerToggleTitle, timerEnabled && { color: '#F59E0B' }]}>Aktifkan Timer</Text>
                <Text style={s.timerToggleSub}>{timerEnabled ? `${timerMenit} menit countdown` : 'Tanpa batas waktu'}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[s.toggleSwitch, timerEnabled && { backgroundColor: '#F59E0B' }]}
              onPress={() => setTimerEnabled(v => !v)}
              activeOpacity={0.8}
            >
              <View style={[s.toggleThumb, timerEnabled && s.toggleThumbOn]} />
            </TouchableOpacity>
          </View>

          {timerEnabled && (
            <>
              <Text style={[s.sectionLabel, { color: '#F59E0B', marginTop: 6 }]}>Durasi Waktu</Text>
              <View style={s.countRow}>
                {TIMER_OPTS.map(m => (
                  <TouchableOpacity key={m}
                    style={[s.countChip, timerMenit === m && { backgroundColor: '#F59E0B', borderColor: '#F59E0B' }]}
                    onPress={() => setTimerMenit(m)}>
                    <Text style={[s.countVal, timerMenit === m && { color: '#fff' }]}>{m}</Text>
                    <Text style={[s.countSub, timerMenit === m && { color: '#ffffff99' }]}>mnt</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Summary */}
          <View style={[s.summaryCard, { borderColor: selSubj.color + '30' }]}>
            {[
              { label:'Mapel', val: selSubj.nama },
              { label:'Mode',  val: selMode.label, color: selMode.color },
              { label:'Soal',  val: `${mode === 'tryout' ? 85 : count} soal` },
              ...(mode === 'per_bab' && selBab ? [{ label:'Bab', val: selBab.nama }] : []),
              { label:'Timer', val: timerEnabled ? `⏳ ${timerMenit} menit` : '∞ Tanpa batas', color: timerEnabled ? '#F59E0B' : Colors.textMuted },
            ].map((r, i, arr) => (
              <View key={i} style={[s.sumRow, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={s.sumLabel}>{r.label}</Text>
                <Text style={[s.sumVal, r.color ? { color: r.color } : {}]}>{r.val}</Text>
              </View>
            ))}
          </View>

          {/* Start */}
          <TouchableOpacity
            style={[s.startBtn, { backgroundColor: selSubj.color }, (starting || (mode === 'per_bab' && !selBab)) && { opacity: 0.5 }]}
            onPress={mode === 'per_bab' && !selBab ? () => setScreen('bab') : handleMulai}
            disabled={starting}
          >
            {starting ? <ActivityIndicator color="#fff" size="small" /> : (
              <><Ionicons name={selMode.icon} size={20} color="#fff" />
              <Text style={s.startBtnText}>{mode === 'per_bab' && !selBab ? 'Pilih Bab Dulu' : `Mulai ${selMode.label}`}</Text></>
            )}
          </TouchableOpacity>
          <View style={{ height: 120 }} />
        </ScrollView>
      </View>
    );
  }

  // ── List screen ────────────────────────────────────────────────────────────
  return (
    <View style={s.container}>
      <View style={[s.glow, { backgroundColor: Colors.primary + '0E' }]} />
      <View style={s.header}>
        <Text style={s.pageTitle}>Latihan Soal</Text>
        <Text style={s.pageSub}>Pilih mata pelajaran SNBT</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={s.filterScroll} contentContainerStyle={s.filterContent}>
        {FILTERS.map(f => {
          const active = filter === f.id;
          return (
            <TouchableOpacity key={f.id}
              style={[s.filterChip, active && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
              onPress={() => setFilter(f.id)}>
              <Ionicons name={active ? f.icon : `${f.icon}-outline` as IoniconName} size={14}
                color={active ? '#fff' : Colors.textMuted} />
              <Text style={[s.filterLabel, active && { color: '#fff' }]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.listContent}>
        <Text style={s.listCount}>{filtered.length} mata pelajaran</Text>
        {filtered.map(subj => (
          <TouchableOpacity key={subj.kode} style={s.subjCard} onPress={() => goToConfig(subj)} activeOpacity={0.75}>
            <View style={[s.subjIcon, { backgroundColor: subj.color + '1A' }]}>
              <Ionicons name={subj.icon} size={26} color={subj.color} />
            </View>
            <View style={s.subjInfo}>
              <View style={s.subjNameRow}>
                <Text style={s.subjKode}>{subj.kode}</Text>
                <View style={[s.subjTag, { backgroundColor: subj.color + '18' }]}>
                  <Text style={[s.subjTagText, { color: subj.color }]}>
                    {subj.tags.includes('tps') ? 'TPS' : subj.tags.includes('literasi') ? 'Literasi' : subj.tags.includes('saintek') ? 'Saintek' : 'Soshum'}
                  </Text>
                </View>
              </View>
              <Text style={s.subjNama}>{subj.nama}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  glow: { position: 'absolute', top: -80, right: -80, width: 200, height: 200, borderRadius: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: Spacing.lg },
  header: { paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  pageTitle: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: '900', letterSpacing: -0.5 },
  pageSub: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: Platform.OS === 'ios' ? 60 : 48, marginBottom: Spacing.md },
  backText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },
  filterScroll: { flexGrow: 0 },
  filterContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, gap: Spacing.sm, flexDirection: 'row' },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.surface, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border },
  filterLabel: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '700' },
  listContent: { paddingHorizontal: Spacing.lg },
  listCount: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '600', marginBottom: Spacing.sm, letterSpacing: 0.3 },
  subjCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.sm },
  subjIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  subjInfo: { flex: 1, gap: 2 },
  subjNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  subjKode: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '800' },
  subjTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  subjTagText: { fontSize: 9, fontWeight: '700' },
  subjNama: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '600' },
  heroCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 2, padding: Spacing.md, marginBottom: Spacing.xl },
  heroIcon: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  heroKode: { fontSize: FontSize.xl, fontWeight: '900' },
  heroNama: { color: Colors.textPrimary, fontSize: FontSize.base, fontWeight: '700', marginTop: 2 },
  sectionLabel: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '700', marginBottom: Spacing.sm, letterSpacing: 0.3 },
  modeList: { gap: Spacing.sm, marginBottom: Spacing.lg },
  modeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1.5, borderColor: Colors.border, padding: Spacing.md },
  modeIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modeLabel: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '700' },
  modeDesc: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  babCta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1.5, padding: Spacing.md, marginBottom: Spacing.lg },
  babCtaTitle: { fontSize: FontSize.base, fontWeight: '700' },
  babCtaSub: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  countRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  countChip: { flex: 1, paddingVertical: 14, borderRadius: Radius.lg, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', gap: 2 },
  countVal: { color: Colors.textSecondary, fontSize: FontSize.base, fontWeight: '800' },
  countSub: { color: Colors.textMuted, fontSize: 9 },
  summaryCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1.5, padding: Spacing.md, marginBottom: Spacing.lg },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: Colors.border },
  sumLabel: { color: Colors.textMuted, fontSize: FontSize.sm },
  sumVal: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '700', textAlign: 'right', flex: 1, marginLeft: Spacing.sm },
  startBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingVertical: 17, borderRadius: Radius.xl, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  startBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '800' },
  babList: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  babCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1.5, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.sm },
  babRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  babRadioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  babNama: { color: Colors.textPrimary, fontSize: FontSize.base, fontWeight: '700' },
  babBab: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  babFooter: { padding: Spacing.lg, borderTopWidth: 1, borderTopColor: Colors.border },
  emptyBab: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xl },
  emptyBabText: { color: Colors.textMuted, fontSize: FontSize.sm },
  // ── Timer Toggle ──────────────────────────────────────────────────────────
  timerToggleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 1.5, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.sm },
  timerIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  timerToggleTitle: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '700' },
  timerToggleSub: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  toggleSwitch: { width: 48, height: 28, borderRadius: 14, backgroundColor: Colors.border, padding: 3, justifyContent: 'center' },
  toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
  toggleThumbOn: { alignSelf: 'flex-end' },
});

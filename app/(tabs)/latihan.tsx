import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Platform, Dimensions, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { API_BASE } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');

// ── Icon mapping with Ionicons ────────────────────────────────────────────────
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const SUBJECTS: {
  id: string; kode: string; nama: string; deskripsi: string;
  icon: IoniconName; color: string; tags: string[];
}[] = [
  // TPS
  { id:'pu',  kode:'PU',  nama:'Penalaran Umum',                  deskripsi:'Logika, analisis, dan penarikan kesimpulan', icon:'bulb',          color:'#3B82F6', tags:['snbt','tps'] },
  { id:'ppu', kode:'PPU', nama:'Pengetahuan & Pemahaman Umum',    deskripsi:'Pengetahuan umum dan isu terkini',           icon:'newspaper',     color:'#6366F1', tags:['snbt','tps'] },
  { id:'pbm', kode:'PBM', nama:'Pemahaman Bacaan & Menulis',      deskripsi:'Membaca kritis dan kemampuan menulis',       icon:'document-text', color:'#8B5CF6', tags:['snbt','tps'] },
  { id:'pk',  kode:'PK',  nama:'Pengetahuan Kuantitatif',         deskripsi:'Matematika dasar dan statistika',            icon:'calculator',    color:'#EC4899', tags:['snbt','tps'] },
  // Literasi
  { id:'lbi', kode:'LBI', nama:'Literasi Bahasa Indonesia',       deskripsi:'Membaca dan memahami teks Bahasa Indonesia', icon:'flag',          color:'#EF4444', tags:['snbt','literasi'] },
  { id:'lbe', kode:'LBE', nama:'Literasi Bahasa Inggris',         deskripsi:'Reading comprehension and vocabulary',       icon:'globe',         color:'#10B981', tags:['snbt','literasi'] },
  // Saintek
  { id:'mat', kode:'MAT', nama:'Matematika',                      deskripsi:'Aljabar, geometri, kalkulus, statistika',    icon:'grid',          color:'#F59E0B', tags:['tka','saintek'] },
  { id:'fis', kode:'FIS', nama:'Fisika',                          deskripsi:'Mekanika, gelombang, listrik, magnet',        icon:'flash',         color:'#06B6D4', tags:['tka','saintek'] },
  { id:'kim', kode:'KIM', nama:'Kimia',                           deskripsi:'Reaksi kimia, stoikiometri, larutan',         icon:'beaker',        color:'#84CC16', tags:['tka','saintek'] },
  { id:'bio', kode:'BIO', nama:'Biologi',                         deskripsi:'Sel, genetika, ekologi, evolusi',            icon:'leaf',          color:'#22C55E', tags:['tka','saintek'] },
  // Soshum
  { id:'geo', kode:'GEO', nama:'Geografi',                        deskripsi:'Peta, lingkungan, dan fenomena alam',         icon:'map',           color:'#F97316', tags:['tka','soshum'] },
  { id:'sos', kode:'SOS', nama:'Sosiologi',                       deskripsi:'Masyarakat, budaya, dan interaksi sosial',   icon:'people',        color:'#A855F7', tags:['tka','soshum'] },
  { id:'eko', kode:'EKO', nama:'Ekonomi',                         deskripsi:'Makro, mikro, dan pengantar bisnis',          icon:'trending-up',   color:'#0EA5E9', tags:['tka','soshum'] },
  { id:'sej', kode:'SEJ', nama:'Sejarah',                         deskripsi:'Sejarah Indonesia dan dunia',                icon:'time',          color:'#D97706', tags:['tka','soshum'] },
];

const FILTERS = [
  { id: 'snbt',    label: 'SNBT',    icon: 'school'    as IoniconName },
  { id: 'tps',     label: 'TPS',     icon: 'brain'     as IoniconName },
  { id: 'literasi',label: 'Literasi',icon: 'book'      as IoniconName },
  { id: 'saintek', label: 'Saintek', icon: 'flask'     as IoniconName },
  { id: 'soshum',  label: 'Soshum',  icon: 'earth'     as IoniconName },
];

const MODES = [
  { id: 'reguler',  label: 'Reguler',  desc: 'Soal acak',       icon: 'shuffle'     as IoniconName, color: Colors.primary   },
  { id: 'per_bab',  label: 'Per Bab',  desc: 'Pilih topik',     icon: 'list'        as IoniconName, color: '#8B5CF6'        },
  { id: 'tryout',   label: 'Tryout',   desc: 'Simulasi full',   icon: 'timer'       as IoniconName, color: Colors.secondary },
  { id: 'targeted', label: 'Targeted', desc: 'Kelemahan',       icon: 'locate'      as IoniconName, color: Colors.success   },
];
const COUNTS = [5, 10, 20, 30];

type Screen = 'list' | 'config';

function SubjectCard({ subj, onPress }: { subj: typeof SUBJECTS[0]; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={s.subjectCard}
        onPress={() => {
          Animated.sequence([
            Animated.timing(scale, { toValue: 0.97, duration: 60, useNativeDriver: true }),
            Animated.spring(scale,  { toValue: 1,    useNativeDriver: true }),
          ]).start();
          onPress();
        }}
        activeOpacity={1}
      >
        <View style={[s.subjectIcon, { backgroundColor: subj.color + '1A' }]}>
          <Ionicons name={subj.icon} size={26} color={subj.color} />
        </View>
        <View style={s.subjectInfo}>
          <View style={s.subjectNameRow}>
            <Text style={s.subjectKode}>{subj.kode}</Text>
            <View style={[s.subjectTag, { backgroundColor: subj.color + '18' }]}>
              <Text style={[s.subjectTagText, { color: subj.color }]}>
                {subj.tags.includes('tps') ? 'TPS' : subj.tags.includes('literasi') ? 'Literasi' : subj.tags.includes('saintek') ? 'Saintek' : 'Soshum'}
              </Text>
            </View>
          </View>
          <Text style={s.subjectNama}>{subj.nama}</Text>
          <Text style={s.subjectDesc}>{subj.deskripsi}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function LatihanScreen() {
  const [filter,  setFilter]   = useState('snbt');
  const [screen,  setScreen]   = useState<Screen>('list');
  const [selected, setSelected] = useState(SUBJECTS[0]);
  const [mode,    setMode]      = useState('reguler');
  const [count,   setCount]     = useState(10);
  const [starting, setStarting] = useState(false);
  const { token } = useAuth();

  const filtered = SUBJECTS.filter(s => s.tags.includes(filter));
  const selMode  = MODES.find(m => m.id === mode)!;

  const handleMulai = async () => {
    setStarting(true);
    try {
      const body = { kode: selected.kode, mode, jumlah_soal: mode === 'tryout' ? 85 : count };
      const res  = await fetch(`${API_BASE}/latihan/mulai`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      const sesiId = json?.data?.id;
      if (sesiId) {
        router.push(`/latihan/${sesiId}`);
      }
    } catch (e) { console.log('mulai error', e); }
    finally { setStarting(false); }
  };

  // ── Config Screen ─────────────────────────────────────────────────────────
  if (screen === 'config') {
    return (
      <View style={s.container}>
        <View style={[s.glow, { backgroundColor: selected.color + '10' }]} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

          {/* Back */}
          <TouchableOpacity style={s.backBtn} onPress={() => setScreen('list')}>
            <Ionicons name="arrow-back" size={18} color={Colors.textMuted} />
            <Text style={s.backText}>Ganti Mapel</Text>
          </TouchableOpacity>

          {/* Selected subject hero */}
          <View style={[s.selectedHero, { borderColor: selected.color + '50' }]}>
            <View style={[s.selectedIconWrap, { backgroundColor: selected.color + '20' }]}>
              <Ionicons name={selected.icon} size={36} color={selected.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.selectedKode, { color: selected.color }]}>{selected.kode}</Text>
              <Text style={s.selectedNama}>{selected.nama}</Text>
              <Text style={s.selectedDesc}>{selected.deskripsi}</Text>
            </View>
          </View>

          {/* Mode */}
          <Text style={s.sectionLabel}>Mode Latihan</Text>
          <View style={s.modeList}>
            {MODES.map(m => (
              <TouchableOpacity
                key={m.id}
                style={[s.modeRow, mode === m.id && { borderColor: m.color, backgroundColor: m.color + '0E' }]}
                onPress={() => setMode(m.id)}
              >
                <View style={[s.modeIconWrap, { backgroundColor: m.color + '1A' }]}>
                  <Ionicons name={m.icon} size={20} color={m.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.modeLabel, mode === m.id && { color: m.color }]}>{m.label}</Text>
                  <Text style={s.modeDesc}>{m.desc}</Text>
                </View>
                <View style={[s.modeRadio, mode === m.id && { backgroundColor: m.color, borderColor: m.color }]}>
                  {mode === m.id && <View style={s.modeRadioDot} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Count */}
          {mode !== 'tryout' && (
            <>
              <Text style={s.sectionLabel}>Jumlah Soal</Text>
              <View style={s.countRow}>
                {COUNTS.map(n => (
                  <TouchableOpacity
                    key={n}
                    style={[s.countChip, count === n && { backgroundColor: selected.color, borderColor: selected.color }]}
                    onPress={() => setCount(n)}
                  >
                    <Text style={[s.countText, count === n && { color: '#fff' }]}>{n}</Text>
                    <Text style={[s.countSub, count === n && { color: '#ffffff99' }]}>soal</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Summary */}
          <View style={[s.summaryCard, { borderColor: selected.color + '30' }]}>
            <View style={s.summaryRow}>
              <Ionicons name="book-outline" size={14} color={Colors.textMuted} />
              <Text style={s.summaryLabel}>Mapel</Text>
              <Text style={s.summaryVal}>{selected.nama}</Text>
            </View>
            <View style={s.summaryRow}>
              <Ionicons name="options-outline" size={14} color={Colors.textMuted} />
              <Text style={s.summaryLabel}>Mode</Text>
              <Text style={[s.summaryVal, { color: selMode.color }]}>{selMode.label}</Text>
            </View>
            <View style={[s.summaryRow, { borderBottomWidth: 0 }]}>
              <Ionicons name="help-circle-outline" size={14} color={Colors.textMuted} />
              <Text style={s.summaryLabel}>Jumlah</Text>
              <Text style={s.summaryVal}>{mode === 'tryout' ? 85 : count} soal · ~{mode === 'tryout' ? 85 : count * 2} menit</Text>
            </View>
          </View>

          {/* Start CTA */}
          <TouchableOpacity
            style={[s.startBtn, { backgroundColor: selected.color }, starting && { opacity: 0.6 }]}
            onPress={handleMulai}
            disabled={starting}
          >
            {starting
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Ionicons name={selMode.icon} size={20} color="#fff" />
                  <Text style={s.startBtnText}>Mulai {selMode.label}</Text>
                </>
            }
          </TouchableOpacity>

          <View style={{ height: 120 }} />
        </ScrollView>
      </View>
    );
  }

  // ── List Screen ────────────────────────────────────────────────────────────
  return (
    <View style={s.container}>
      <View style={[s.glow, { backgroundColor: Colors.primary + '0E' }]} />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Latihan Soal</Text>
        <Text style={s.headerSub}>Pilih mata pelajaran SNBT</Text>
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={s.filterScroll} contentContainerStyle={s.filterContent}
      >
        {FILTERS.map(f => {
          const active = filter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              style={[s.filterChip, active && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
              onPress={() => setFilter(f.id)}
            >
              <Ionicons
                name={active ? f.icon : `${f.icon}-outline` as IoniconName}
                size={14}
                color={active ? '#fff' : Colors.textMuted}
              />
              <Text style={[s.filterLabel, active && { color: '#fff' }]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Subject list */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.listContent}>
        <Text style={s.listCount}>{filtered.length} mata pelajaran</Text>
        {filtered.map(subj => (
          <SubjectCard
            key={subj.id}
            subj={subj}
            onPress={() => { setSelected(subj); setScreen('config'); }}
          />
        ))}
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  glow: { position: 'absolute', top: -80, right: -80, width: 220, height: 220, borderRadius: 110 },
  scroll: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
  },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: '900', letterSpacing: -0.5 },
  headerSub: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },

  filterScroll: { flexGrow: 0 },
  filterContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, gap: Spacing.sm, flexDirection: 'row' },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: Colors.surface, borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  filterLabel: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '700' },

  listContent: { paddingHorizontal: Spacing.lg },
  listCount: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '600', marginBottom: Spacing.sm, letterSpacing: 0.3 },

  subjectCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  subjectIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  subjectInfo: { flex: 1, gap: 2 },
  subjectNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  subjectKode: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '800' },
  subjectTag: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full },
  subjectTagText: { fontSize: 9, fontWeight: '700' },
  subjectNama: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '600' },
  subjectDesc: { color: Colors.textMuted, fontSize: 10, lineHeight: 15 },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.lg, paddingTop: Platform.OS === 'ios' ? 60 : 44 },
  backText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },

  selectedHero: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 2,
    padding: Spacing.md, marginBottom: Spacing.xl,
  },
  selectedIconWrap: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  selectedKode: { fontSize: FontSize.xl, fontWeight: '900' },
  selectedNama: { color: Colors.textPrimary, fontSize: FontSize.base, fontWeight: '700', marginTop: 2 },
  selectedDesc: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },

  sectionLabel: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '700', marginBottom: Spacing.sm, letterSpacing: 0.3 },

  modeList: { gap: Spacing.sm, marginBottom: Spacing.lg },
  modeRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1.5, borderColor: Colors.border, padding: Spacing.md,
  },
  modeIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modeLabel: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '700' },
  modeDesc: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  modeRadio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  modeRadioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },

  countRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  countChip: {
    flex: 1, paddingVertical: 14, borderRadius: Radius.lg,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', gap: 2,
  },
  countText: { color: Colors.textSecondary, fontSize: FontSize.base, fontWeight: '800' },
  countSub: { color: Colors.textMuted, fontSize: 9 },

  summaryCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1.5, padding: Spacing.md, marginBottom: Spacing.lg, gap: 0,
  },
  summaryRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  summaryLabel: { color: Colors.textMuted, fontSize: FontSize.sm, flex: 1 },
  summaryVal: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '700' },

  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: 17, borderRadius: Radius.xl,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  startBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '800' },
});

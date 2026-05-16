import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Platform, ActivityIndicator, Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { API_BASE } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');

// ── SNBT Subject Categories ───────────────────────────────────────────────────
const GROUPS = [
  {
    id: 'tps', label: 'TPS', desc: 'Tes Potensi Skolastik', emoji: '🧠',
    color: Colors.primary,
    mapels: [
      { id: 1, kode: 'PU',  nama: 'Penalaran Umum',                  emoji: '💡' },
      { id: 2, kode: 'PPU', nama: 'Pengetahuan & Pemahaman Umum',    emoji: '📖' },
      { id: 3, kode: 'PBM', nama: 'Pemahaman Bacaan & Menulis',      emoji: '✍️' },
      { id: 4, kode: 'PK',  nama: 'Pengetahuan Kuantitatif',         emoji: '🔢' },
    ],
  },
  {
    id: 'literasi', label: 'Literasi', desc: 'Bahasa Indonesia & Inggris', emoji: '📚',
    color: '#8B5CF6',
    mapels: [
      { id: 5, kode: 'LBI', nama: 'Literasi Bahasa Indonesia', emoji: '🇮🇩' },
      { id: 6, kode: 'LBE', nama: 'Literasi Bahasa Inggris',   emoji: '🇬🇧' },
    ],
  },
  {
    id: 'saintek', label: 'Saintek', desc: 'TKA Sains & Teknologi', emoji: '🔬',
    color: Colors.success,
    mapels: [
      { id: 7,  kode: 'MAT', nama: 'Matematika', emoji: '📐' },
      { id: 8,  kode: 'FIS', nama: 'Fisika',     emoji: '⚛️' },
      { id: 9,  kode: 'KIM', nama: 'Kimia',      emoji: '🧪' },
      { id: 10, kode: 'BIO', nama: 'Biologi',    emoji: '🦠' },
    ],
  },
  {
    id: 'soshum', label: 'Soshum', desc: 'TKA Sosial & Humaniora', emoji: '🌏',
    color: Colors.secondary,
    mapels: [
      { id: 11, kode: 'GEO', nama: 'Geografi',  emoji: '🗺️' },
      { id: 12, kode: 'SOS', nama: 'Sosiologi', emoji: '👥' },
      { id: 13, kode: 'EKO', nama: 'Ekonomi',   emoji: '📊' },
      { id: 14, kode: 'SEJ', nama: 'Sejarah',   emoji: '📜' },
    ],
  },
];

const MODES = [
  { id: 'reguler',  label: 'Reguler',  desc: 'Soal acak',       emoji: '📝', color: Colors.primary },
  { id: 'per_bab',  label: 'Per Bab',  desc: 'Pilih topik',     emoji: '📖', color: '#8B5CF6' },
  { id: 'tryout',   label: 'Tryout',   desc: 'Simulasi full',   emoji: '⚡', color: Colors.secondary },
  { id: 'targeted', label: 'Targeted', desc: 'Fokus kelemahan', emoji: '🎯', color: Colors.success },
];
const COUNTS = [5, 10, 20, 30];

type Screen = 'menu' | 'config';

export default function LatihanScreen() {
  const { token } = useAuth();
  const [screen, setScreen]     = useState<Screen>('menu');
  const [activeGroup, setGroup] = useState(GROUPS[0]);
  const [selectedMapel, setMapel] = useState(GROUPS[0].mapels[0]);
  const [mode, setMode]           = useState('reguler');
  const [count, setCount]         = useState(10);
  const [starting, setStarting]   = useState(false);
  const [mapelIds, setMapelIds]   = useState<Record<string, number>>({});

  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    fetchMapelIds();
  }, []);

  const fetchMapelIds = async () => {
    try {
      const res  = await fetch(`${API_BASE}/mapel`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
      const json = await res.json();
      const map: Record<string, number> = {};
      (json?.data ?? []).forEach((m: any) => { map[m.kode ?? m.nama] = m.id; });
      setMapelIds(map);
    } catch {}
  };

  const resolveMapelId = () =>
    mapelIds[selectedMapel.kode] ?? mapelIds[selectedMapel.nama] ?? selectedMapel.id;

  const handleMulai = async () => {
    setStarting(true);
    try {
      const body = { mapel_id: resolveMapelId(), mode, jumlah_soal: mode === 'tryout' ? 85 : count };
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
    } catch (e) { console.log(e); }
    finally { setStarting(false); }
  };

  const selMode = MODES.find(m => m.id === mode)!;

  // ── Menu screen ─────────────────────────────────────────────────────────────
  if (screen === 'menu') {
    return (
      <View style={s.container}>
        <View style={[s.glow, { backgroundColor: Colors.primary + '10' }]} />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          <Animated.View style={{ opacity: fade }}>
            <Text style={s.title}>Pilih Mapel 📚</Text>
            <Text style={s.subtitle}>Pilih kelompok dan mata pelajaran SNBT</Text>

            {GROUPS.map(g => (
              <View key={g.id} style={s.group}>
                {/* Group header */}
                <View style={[s.groupHeader, { borderColor: g.color + '40' }]}>
                  <Text style={s.groupEmoji}>{g.emoji}</Text>
                  <View>
                    <Text style={[s.groupLabel, { color: g.color }]}>{g.label}</Text>
                    <Text style={s.groupDesc}>{g.desc}</Text>
                  </View>
                </View>
                {/* Mapel grid */}
                <View style={s.mapelGrid}>
                  {g.mapels.map(m => (
                    <TouchableOpacity
                      key={m.id}
                      style={[s.mapelCard, {
                        borderColor: activeGroup.id === g.id && selectedMapel.id === m.id
                          ? g.color : Colors.border,
                        backgroundColor: activeGroup.id === g.id && selectedMapel.id === m.id
                          ? g.color + '14' : Colors.surface,
                      }]}
                      onPress={() => { setGroup(g); setMapel(m); setScreen('config'); }}
                      activeOpacity={0.75}
                    >
                      <Text style={s.mapelEmoji}>{m.emoji}</Text>
                      <Text style={s.mapelKode}>{m.kode}</Text>
                      <Text style={s.mapelNama} numberOfLines={2}>{m.nama}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
            <View style={{ height: 120 }} />
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // ── Config screen ────────────────────────────────────────────────────────────
  return (
    <View style={s.container}>
      <View style={[s.glow, { backgroundColor: activeGroup.color + '12' }]} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Animated.View style={{ opacity: fade }}>
          {/* Back */}
          <TouchableOpacity onPress={() => setScreen('menu')} style={s.backBtn}>
            <Text style={s.backText}>← Ganti Mapel</Text>
          </TouchableOpacity>

          {/* Selected mapel */}
          <View style={[s.selectedCard, { borderColor: activeGroup.color + '60' }]}>
            <Text style={{ fontSize: 40 }}>{selectedMapel.emoji}</Text>
            <View>
              <Text style={[s.selectedKode, { color: activeGroup.color }]}>{selectedMapel.kode}</Text>
              <Text style={s.selectedNama}>{selectedMapel.nama}</Text>
              <Text style={s.selectedGroup}>{activeGroup.label} · {activeGroup.desc}</Text>
            </View>
          </View>

          {/* Mode */}
          <Text style={s.sectionLabel}>Mode Latihan</Text>
          <View style={s.modeGrid}>
            {MODES.map(m => (
              <TouchableOpacity
                key={m.id}
                style={[s.modeCard, mode === m.id && { borderColor: m.color, backgroundColor: m.color + '12' }]}
                onPress={() => setMode(m.id)}
              >
                <Text style={s.modeEmoji}>{m.emoji}</Text>
                <Text style={[s.modeLabel, mode === m.id && { color: m.color }]}>{m.label}</Text>
                <Text style={s.modeDesc}>{m.desc}</Text>
                {mode === m.id && (
                  <View style={[s.modeCheckDot, { backgroundColor: m.color }]} />
                )}
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
                    style={[s.countChip, count === n && { backgroundColor: activeGroup.color, borderColor: activeGroup.color }]}
                    onPress={() => setCount(n)}
                  >
                    <Text style={[s.countText, count === n && { color: '#fff' }]}>{n}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Summary */}
          <View style={s.summaryCard}>
            <View style={s.summaryRow}><Text style={s.summaryLabel}>Mapel</Text><Text style={s.summaryVal}>{selectedMapel.nama}</Text></View>
            <View style={s.summaryRow}><Text style={s.summaryLabel}>Mode</Text><Text style={[s.summaryVal, { color: selMode.color }]}>{selMode.label}</Text></View>
            <View style={[s.summaryRow, { borderBottomWidth: 0 }]}>
              <Text style={s.summaryLabel}>Jumlah</Text>
              <Text style={s.summaryVal}>{mode === 'tryout' ? 85 : count} soal · ~{mode === 'tryout' ? 85 : count * 2} menit</Text>
            </View>
          </View>

          {/* Start */}
          <TouchableOpacity
            style={[s.startBtn, { backgroundColor: activeGroup.color }, starting && { opacity: 0.6 }]}
            onPress={handleMulai}
            disabled={starting}
          >
            {starting
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.startBtnText}>{selMode.emoji}  Mulai {selMode.label}</Text>
            }
          </TouchableOpacity>

          <View style={{ height: 120 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const CARD_W = (width - Spacing.lg * 2 - Spacing.sm * 3) / 4;
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  glow: { position: 'absolute', top: -80, right: -80, width: 240, height: 240, borderRadius: 120 },
  scroll: { paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingHorizontal: Spacing.lg },
  title: { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: Spacing.xl },

  group: { marginBottom: Spacing.lg },
  groupHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1,
    padding: Spacing.sm, paddingHorizontal: Spacing.md, marginBottom: Spacing.sm,
  },
  groupEmoji: { fontSize: 22 },
  groupLabel: { fontSize: FontSize.base, fontWeight: '800' },
  groupDesc: { color: Colors.textMuted, fontSize: FontSize.xs },
  mapelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  mapelCard: {
    width: CARD_W, backgroundColor: Colors.surface,
    borderRadius: Radius.xl, borderWidth: 1.5,
    padding: 10, alignItems: 'center', gap: 4,
  },
  mapelEmoji: { fontSize: 24 },
  mapelKode: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: '800' },
  mapelNama: { color: Colors.textMuted, fontSize: 9, textAlign: 'center', lineHeight: 13 },

  backBtn: { marginBottom: Spacing.lg },
  backText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },
  selectedCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.xl, borderWidth: 2,
    padding: Spacing.md, marginBottom: Spacing.xl,
  },
  selectedKode: { fontSize: FontSize.xl, fontWeight: '900' },
  selectedNama: { color: Colors.textPrimary, fontSize: FontSize.base, fontWeight: '700' },
  selectedGroup: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },

  sectionLabel: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '700', marginBottom: Spacing.sm, letterSpacing: 0.3 },
  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  modeCard: {
    width: (width - Spacing.lg * 2 - Spacing.sm) / 2,
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1.5, borderColor: Colors.border,
    padding: Spacing.md, gap: 4, position: 'relative',
  },
  modeEmoji: { fontSize: 22 },
  modeLabel: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '700' },
  modeDesc: { color: Colors.textMuted, fontSize: FontSize.xs },
  modeCheckDot: { position: 'absolute', top: 10, right: 10, width: 10, height: 10, borderRadius: 5 },

  countRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  countChip: {
    flex: 1, paddingVertical: 12, borderRadius: Radius.lg,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center',
  },
  countText: { color: Colors.textSecondary, fontSize: FontSize.base, fontWeight: '700' },

  summaryCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  summaryLabel: { color: Colors.textMuted, fontSize: FontSize.sm },
  summaryVal: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '700' },

  startBtn: {
    paddingVertical: 17, borderRadius: Radius.xl, alignItems: 'center',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  startBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '800' },
});

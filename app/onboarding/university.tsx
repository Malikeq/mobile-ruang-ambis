import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  TextInput, Platform, ActivityIndicator, FlatList,
  ScrollView, Alert, Modal, Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { API_BASE, Kampus, Jurusan } from '@/lib/api';
import { useOnboarding } from '@/contexts/OnboardingContext';

const ACCENT_COLORS = [
  Colors.primary, Colors.secondary, Colors.success,
  Colors.primaryLight, '#8B5CF6', '#EC4899', '#F97316',
];

const FALLBACK_KAMPUS: Kampus[] = [
  { id: 1,  nama: 'Universitas Indonesia',         akronim: 'UI',    kota: 'Depok',           provinsi: 'Jawa Barat' },
  { id: 2,  nama: 'Universitas Gadjah Mada',       akronim: 'UGM',   kota: 'Yogyakarta',      provinsi: 'DI Yogyakarta' },
  { id: 3,  nama: 'Institut Teknologi Bandung',    akronim: 'ITB',   kota: 'Bandung',         provinsi: 'Jawa Barat' },
  { id: 4,  nama: 'Institut Teknologi Sepuluh N.', akronim: 'ITS',   kota: 'Surabaya',        provinsi: 'Jawa Timur' },
  { id: 5,  nama: 'Universitas Diponegoro',        akronim: 'UNDIP', kota: 'Semarang',        provinsi: 'Jawa Tengah' },
  { id: 6,  nama: 'Universitas Airlangga',         akronim: 'UNAIR', kota: 'Surabaya',        provinsi: 'Jawa Timur' },
  { id: 7,  nama: 'Institut Pertanian Bogor',      akronim: 'IPB',   kota: 'Bogor',           provinsi: 'Jawa Barat' },
  { id: 8,  nama: 'Universitas Padjadjaran',       akronim: 'UNPAD', kota: 'Bandung',         provinsi: 'Jawa Barat' },
  { id: 9,  nama: 'Universitas Brawijaya',         akronim: 'UB',    kota: 'Malang',          provinsi: 'Jawa Timur' },
  { id: 10, nama: 'Universitas Hasanuddin',        akronim: 'UNHAS', kota: 'Makassar',        provinsi: 'Sulawesi Selatan' },
];

export interface Target { kampus: Kampus; jurusan?: Jurusan; }

// ─── Fallback jurusan per akronim (mirrors KampusSeeder) ─────────────────────
const JURUSAN_FALLBACK: Record<string, Jurusan[]> = {
  UI:    [{ id:-1, nama:'Ilmu Komputer',         fakultas:'FASILKOM',     passing_grade_estimate:93 },
          { id:-2, nama:'Kedokteran',             fakultas:'FK',           passing_grade_estimate:95 },
          { id:-3, nama:'Teknik Elektro',         fakultas:'FT',           passing_grade_estimate:89 },
          { id:-4, nama:'Hukum',                  fakultas:'FH',           passing_grade_estimate:88 },
          { id:-5, nama:'Psikologi',              fakultas:'FPSI',         passing_grade_estimate:88 },
          { id:-6, nama:'Akuntansi',              fakultas:'FEB',          passing_grade_estimate:86 }],
  ITB:   [{ id:-1, nama:'Teknik Informatika',    fakultas:'STEI',         passing_grade_estimate:95 },
          { id:-2, nama:'Teknik Elektro',         fakultas:'STEI',         passing_grade_estimate:93 },
          { id:-3, nama:'Teknik Mesin',           fakultas:'FTMD',         passing_grade_estimate:90 },
          { id:-4, nama:'Arsitektur',             fakultas:'SAPPK',        passing_grade_estimate:88 },
          { id:-5, nama:'Matematika',             fakultas:'FMIPA',        passing_grade_estimate:87 }],
  UGM:   [{ id:-1, nama:'Kedokteran',             fakultas:'FK',           passing_grade_estimate:94 },
          { id:-2, nama:'Teknik Informatika',     fakultas:'FT',           passing_grade_estimate:90 },
          { id:-3, nama:'Kedokteran Gigi',        fakultas:'FKG',          passing_grade_estimate:91 },
          { id:-4, nama:'Farmasi',                fakultas:'FF',           passing_grade_estimate:88 },
          { id:-5, nama:'Psikologi',              fakultas:'FPSI',         passing_grade_estimate:87 }],
  ITS:   [{ id:-1, nama:'Teknik Informatika',    fakultas:'FTIK',         passing_grade_estimate:91 },
          { id:-2, nama:'Teknik Elektro',         fakultas:'FTEE',         passing_grade_estimate:88 },
          { id:-3, nama:'Teknik Mesin',           fakultas:'FTI',          passing_grade_estimate:86 },
          { id:-4, nama:'Statistika',             fakultas:'FMIPA-ITS',    passing_grade_estimate:82 }],
  UNDIP: [{ id:-1, nama:'Kedokteran',             fakultas:'FK',           passing_grade_estimate:88 },
          { id:-2, nama:'Teknik Informatika',     fakultas:'FSM',          passing_grade_estimate:83 },
          { id:-3, nama:'Hukum',                  fakultas:'FH',           passing_grade_estimate:79 }],
  UNAIR: [{ id:-1, nama:'Kedokteran',             fakultas:'FK',           passing_grade_estimate:92 },
          { id:-2, nama:'Farmasi',                fakultas:'FF',           passing_grade_estimate:86 },
          { id:-3, nama:'Psikologi',              fakultas:'FPSI',         passing_grade_estimate:83 }],
  IPB:   [{ id:-1, nama:'Ilmu Komputer',          fakultas:'FASILKOM-MTI', passing_grade_estimate:86 },
          { id:-2, nama:'Statistika',             fakultas:'FMIPA',        passing_grade_estimate:85 },
          { id:-3, nama:'Agribisnis',             fakultas:'FEM',          passing_grade_estimate:81 }],
  UNPAD: [{ id:-1, nama:'Kedokteran',             fakultas:'FK',           passing_grade_estimate:89 },
          { id:-2, nama:'Informatika',            fakultas:'FMIPA',        passing_grade_estimate:82 },
          { id:-3, nama:'Farmasi',                fakultas:'FF',           passing_grade_estimate:85 }],
  UB:    [{ id:-1, nama:'Kedokteran',             fakultas:'FK',           passing_grade_estimate:87 },
          { id:-2, nama:'Ilmu Komputer',          fakultas:'FILKOM',       passing_grade_estimate:82 }],
  UNHAS: [{ id:-1, nama:'Kedokteran',             fakultas:'FK',           passing_grade_estimate:86 },
          { id:-2, nama:'Teknik Informatika',     fakultas:'FT',           passing_grade_estimate:79 }],
};
const DEFAULT_JURUSAN: Jurusan[] = [
  { id:-1, nama:'Teknik Informatika',    fakultas:'Teknik',             passing_grade_estimate:78 },
  { id:-2, nama:'Manajemen',             fakultas:'Ekonomi dan Bisnis', passing_grade_estimate:73 },
  { id:-3, nama:'Hukum',                 fakultas:'Hukum',              passing_grade_estimate:71 },
  { id:-4, nama:'Ilmu Komunikasi',       fakultas:'FISIP',              passing_grade_estimate:70 },
  { id:-5, nama:'Pendidikan Matematika', fakultas:'FMIPA',              passing_grade_estimate:68 },
];

// ─── Jurusan Bottom Sheet ─────────────────────────────────────────────────────

function JurusanSheet({ kampus, color, onClose, onSelect }: {
  kampus: Kampus;
  color: string;
  onClose: () => void;
  onSelect: (j: Jurusan) => void;
}) {
  const [jurusanList, setJurusanList] = useState<Jurusan[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [isOffline, setIsOffline]     = useState(false);
  const slideAnim = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }).start();
    fetchJurusan();
  }, []);

  const fetchJurusan = async () => {
    setLoading(true);
    setIsOffline(false);
    try {
      const res  = await fetch(`${API_BASE}/kampus/${kampus.id}/jurusan`, { headers: { Accept: 'application/json' } });
      const json = await res.json();
      const data: Jurusan[] = json?.data ?? [];
      if (data.length > 0) {
        setJurusanList(data);
      } else {
        useFallback();
      }
    } catch {
      useFallback();
    } finally {
      setLoading(false);
    }
  };

  const useFallback = () => {
    setIsOffline(true);
    setJurusanList(JURUSAN_FALLBACK[kampus.akronim] ?? DEFAULT_JURUSAN);
  };

  const filtered = jurusanList.filter(j =>
    j.nama.toLowerCase().includes(search.toLowerCase()) ||
    (j.fakultas ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const handleClose = () => {
    Animated.timing(slideAnim, { toValue: 600, duration: 220, useNativeDriver: true }).start(onClose);
  };

  const handleSelect = (item: Jurusan) => { onSelect(item); handleClose(); };

  return (
    <Modal transparent animationType="none" onRequestClose={handleClose}>
      {/* Backdrop */}
      <Pressable style={styles.sheetBackdrop} onPress={handleClose} />

      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Handle */}
        <View style={styles.sheetHandle} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sheetTitle, { color }]}>{kampus.akronim}</Text>
            <Text style={styles.sheetSubtitle}>{kampus.nama} · Pilih jurusan tujuan</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Offline notice */}
        {isOffline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineBannerText}>📦 Data estimasi · Jalankan: php artisan db:seed --class=KampusSeeder</Text>
          </View>
        )}

        {/* Search */}
        <View style={[styles.sheetSearch, { borderColor: color + '40' }]}>
          <Text style={{ fontSize: 14 }}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Cari jurusan atau fakultas..."
            placeholderTextColor={Colors.textMuted}
            style={styles.sheetSearchInput}
            autoFocus
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ color: Colors.textMuted, fontSize: 18, paddingHorizontal: 4 }}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Skip */}
        <TouchableOpacity style={styles.skipJurusan} onPress={handleClose}>
          <Text style={styles.skipJurusanText}>Lewati · Pilih jurusan nanti →</Text>
        </TouchableOpacity>

        {/* List */}
        {loading ? (
          <View style={styles.sheetLoading}>
            <ActivityIndicator color={color} size="large" />
            <Text style={styles.sheetLoadingText}>Memuat jurusan...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.sheetLoading}>
            <Text style={{ fontSize: 32 }}>🔍</Text>
            <Text style={styles.sheetLoadingText}>Jurusan tidak ditemukan</Text>
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={{ color: Colors.primaryLight, fontSize: FontSize.sm }}>Hapus pencarian</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item, i) => `${item.id}-${i}`}
            contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 44 : 24 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.jurusanRow}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
              >
                <View style={styles.jurusanInfo}>
                  <Text style={styles.jurusanName}>{item.nama}</Text>
                  {!!item.fakultas && (
                    <Text style={styles.jurusanFakultas}>🏛 {item.fakultas}</Text>
                  )}
                  {!!item.passing_grade_estimate && (
                    <View style={[styles.pgBadge, { backgroundColor: color + '18' }]}>
                      <Text style={[styles.pgText, { color }]}>PG ~{item.passing_grade_estimate}%</Text>
                    </View>
                  )}
                </View>
                <View style={[styles.jurusanArrow, { backgroundColor: color + '20' }]}>
                  <Text style={[styles.jurusanArrowText, { color }]}>→</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </Animated.View>
    </Modal>
  );
}

// ─── Kampus Card ──────────────────────────────────────────────────────────────

function KampusCard({ item, target, onPress, colorIndex }: {
  item: Kampus; target?: Target; onPress: () => void; colorIndex: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const color = ACCENT_COLORS[colorIndex % ACCENT_COLORS.length];
  const selected = !!target;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.95, duration: 70,  useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1,    duration: 110, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={1}
        style={[styles.card, selected && { borderColor: color, backgroundColor: color + '10' }]}
      >
        <View style={[styles.cardAvatar, { backgroundColor: color + '20', borderColor: color + '50' }]}>
          <Text style={[styles.cardShort, { color }]}>{item.akronim}</Text>
        </View>

        <View style={styles.cardInfo}>
          <Text style={[styles.cardName, selected && { color: Colors.textPrimary }]} numberOfLines={1}>
            {item.nama}
          </Text>
          {target?.jurusan ? (
            <Text style={[styles.cardJurusan, { color }]} numberOfLines={1}>
              📚 {target.jurusan.nama}
            </Text>
          ) : (
            <Text style={styles.cardCity}>📍 {item.kota}</Text>
          )}
        </View>

        {selected ? (
          <View style={[styles.selectedBadge, { backgroundColor: color + '20', borderColor: color + '50' }]}>
            <Text style={[styles.selectedBadgeText, { color }]}>
              {target?.jurusan ? '✓' : 'Pilih\nJurusan'}
            </Text>
          </View>
        ) : (
          <View style={styles.addBtn}>
            <Text style={styles.addBtnText}>+</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function UniversityScreen() {
  const { setTargets: saveTargets } = useOnboarding();
  const [allKampus, setAllKampus]     = useState<Kampus[]>([]);
  const [targets, setTargets]         = useState<Target[]>([]);
  const [search, setSearch]           = useState('');
  const [loading, setLoading]         = useState(true);
  const [isFallback, setIsFallback]   = useState(false);
  const [errorMsg, setErrorMsg]       = useState('');
  const [activeSheet, setActiveSheet] = useState<{ kampus: Kampus; ci: number } | null>(null);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
    fetchKampus();
  }, []);

  const fetchKampus = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res  = await fetch(`${API_BASE}/kampus?size=200`, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const rawData: Kampus[] = json?.data ?? [];
      if (rawData.length === 0) throw new Error('Data kosong');
      // Sanitize null fields that crash toLowerCase
      const data = rawData.map(k => ({
        ...k,
        nama:    k.nama    ?? '',
        akronim: k.akronim ?? '',
        kota:    k.kota    ?? '',
        provinsi:k.provinsi ?? '',
      }));
      setAllKampus(data);
      setIsFallback(false);
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Gagal');
      setAllKampus(FALLBACK_KAMPUS);
      setIsFallback(true);
    } finally {
      setLoading(false);
    }
  };

  const openSheet = (kampus: Kampus, ci: number) => {
    const existing = targets.find(t => t.kampus.id === kampus.id);
    if (existing) {
      // Already selected → open sheet to change jurusan
      setActiveSheet({ kampus, ci });
    } else if (targets.length >= 3) {
      Alert.alert('Maksimal 3 PTN', 'Hapus salah satu pilihan untuk menambah PTN baru.');
    } else {
      // Add kampus first, then open jurusan sheet
      setTargets(prev => [...prev, { kampus }]);
      setActiveSheet({ kampus, ci });
    }
  };

  const removeTarget = (kampusId: number) =>
    setTargets(prev => prev.filter(t => t.kampus.id !== kampusId));

  const setJurusan = (kampusId: number, jurusan: Jurusan) =>
    setTargets(prev => prev.map(t => t.kampus.id === kampusId ? { ...t, jurusan } : t));

  const filtered = allKampus.filter(k => {
    const q = search.toLowerCase();
    return (
      (k.nama    ?? '').toLowerCase().includes(q) ||
      (k.akronim ?? '').toLowerCase().includes(q) ||
      (k.kota    ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <View style={styles.container}>
      <View style={styles.glowRight} />

      {/* Header */}
      <Animated.View style={[styles.headerBlock, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepText}>Langkah 2 dari 3</Text>
        </View>
        <Text style={styles.title}>Cari PTN{'\n'}Impianmu 🎓</Text>
        <Text style={styles.subtitle}>Pilih PTN + jurusan impian · Maksimal 3 target</Text>

        {isFallback && (
          <TouchableOpacity style={styles.errorBanner} onPress={fetchKampus}>
            <Text style={styles.errorBannerText}>⚠️ Data offline · {errorMsg}</Text>
            <Text style={styles.retryText}>🔄 Coba lagi</Text>
          </TouchableOpacity>
        )}

        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Cari PTN atau kota..."
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={styles.clearBtn}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Selected targets */}
        {targets.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chips}>
              {targets.map((t, i) => {
                const ci = allKampus.findIndex(k => k.id === t.kampus.id);
                const color = ACCENT_COLORS[(ci >= 0 ? ci : i) % ACCENT_COLORS.length];
                return (
                  <View key={t.kampus.id} style={[styles.targetChip, { borderColor: color, backgroundColor: color + '15' }]}>
                    <View style={styles.targetChipInner}>
                      <Text style={[styles.targetChipKampus, { color }]}>{t.kampus.akronim}</Text>
                      {t.jurusan && (
                        <Text style={styles.targetChipJurusan} numberOfLines={1}>{t.jurusan.nama}</Text>
                      )}
                    </View>
                    <TouchableOpacity onPress={() => removeTarget(t.kampus.id)} style={styles.targetChipRemove}>
                      <Text style={[styles.targetChipX, { color }]}>×</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
              <Text style={styles.chipCount}>{targets.length}/3</Text>
            </View>
          </ScrollView>
        )}
      </Animated.View>

      {/* List */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={styles.loadingText}>Memuat data PTN...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <KampusCard
              item={item}
              target={targets.find(t => t.kampus.id === item.id)}
              onPress={() => openSheet(item, index)}
              colorIndex={index}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 36 }}>🏫</Text>
              <Text style={styles.emptyText}>PTN tidak ditemukan</Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: 120 }} />}
        />
      )}

      {/* Bottom CTA */}
      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.btn, targets.length === 0 && styles.btnMuted]}
          onPress={() => {
            // Save to OnboardingContext (in-memory — no AsyncStorage needed)
            saveTargets(targets.map((t, i) => ({
              kampus_id:      t.kampus.id,
              kampus_nama:    t.kampus.nama,
              kampus_akronim: t.kampus.akronim,
              jurusan_id:     t.jurusan?.id ?? null,
              jurusan_nama:   t.jurusan?.nama ?? null,
              passing_grade:  t.jurusan?.passing_grade_estimate ?? null,
              priority:       i + 1,
            })));
            router.push('/onboarding/pricing');
          }}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>
            {targets.length > 0
              ? `Lanjut · ${targets.length} target dipilih  →`
              : 'Lewati · Pilih nanti  →'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Jurusan Bottom Sheet */}
      {activeSheet && (
        <JurusanSheet
          kampus={activeSheet.kampus}
          color={ACCENT_COLORS[activeSheet.ci % ACCENT_COLORS.length]}
          onClose={() => setActiveSheet(null)}
          onSelect={(j) => setJurusan(activeSheet.kampus.id, j)}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  glowRight: {
    position: 'absolute', top: 100, right: -80,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: Colors.secondary + '10',
  },

  headerBlock: {
    paddingTop: Platform.OS === 'ios' ? 60 : 44,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.secondary + '18', borderColor: Colors.secondary + '40',
    borderWidth: 1, borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  stepText: { color: Colors.secondary, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.5 },
  title: { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: '800', lineHeight: 36, letterSpacing: -0.4 },
  subtitle: { color: Colors.textSecondary, fontSize: FontSize.sm },

  errorBanner: {
    backgroundColor: Colors.warning + '15',
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.warning + '40',
    padding: Spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  errorBannerText: { color: Colors.warning, fontSize: FontSize.xs, flex: 1 },
  retryText: { color: Colors.primaryLight, fontSize: FontSize.xs, fontWeight: '700' },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.base },
  clearBtn: { color: Colors.textMuted, fontSize: 22, paddingHorizontal: 4 },

  chips: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 4, paddingTop: 2 },
  targetChip: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: Radius.md, borderWidth: 1.5,
    paddingLeft: 10, paddingRight: 4, paddingVertical: 6, gap: 6,
    maxWidth: 160,
  },
  targetChipInner: { flex: 1 },
  targetChipKampus: { fontSize: FontSize.xs, fontWeight: '800' },
  targetChipJurusan: { color: Colors.textMuted, fontSize: 9, marginTop: 1 },
  targetChipRemove: { padding: 4 },
  targetChipX: { fontSize: 18, fontWeight: '300', lineHeight: 20 },
  chipCount: { color: Colors.textMuted, fontSize: FontSize.xs },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  loadingText: { color: Colors.textSecondary, fontSize: FontSize.sm },

  list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, gap: 10 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: Colors.border, padding: Spacing.md,
  },
  cardAvatar: {
    width: 50, height: 50, borderRadius: Radius.md, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardShort: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5, textAlign: 'center' },
  cardInfo: { flex: 1, gap: 3 },
  cardName: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },
  cardCity: { color: Colors.textMuted, fontSize: FontSize.xs },
  cardJurusan: { fontSize: FontSize.xs, fontWeight: '600' },

  selectedBadge: {
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: Radius.md, borderWidth: 1,
    alignItems: 'center', minWidth: 44,
  },
  selectedBadgeText: { fontSize: 11, fontWeight: '700', textAlign: 'center', lineHeight: 14 },
  addBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1.5, borderColor: Colors.borderLight,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: Colors.textMuted, fontSize: 20, lineHeight: 24 },

  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.md },
  emptyText: { color: Colors.textSecondary, fontSize: FontSize.base, fontWeight: '600' },

  bottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    paddingTop: Spacing.md,
    backgroundColor: Colors.background + 'F5',
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  btn: {
    paddingVertical: 16, borderRadius: Radius.xl,
    backgroundColor: Colors.primary, alignItems: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 6,
  },
  btnMuted: { backgroundColor: Colors.surfaceElevated, shadowOpacity: 0, elevation: 0 },
  btnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },

  // Bottom Sheet
  sheetBackdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.borderLight,
    alignSelf: 'center', marginTop: 12, marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  sheetTitle: { fontSize: FontSize.xl, fontWeight: '800' },
  sheetSubtitle: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { color: Colors.textSecondary, fontSize: 14, fontWeight: '700' },
  sheetSearch: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.lg,
    borderWidth: 1, marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
  },
  sheetSearchInput: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.sm },
  sheetLoading: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.md },
  sheetLoadingText: { color: Colors.textMuted, fontSize: FontSize.sm },

  offlineBanner: {
    backgroundColor: Colors.warning + '15',
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.warning + '30',
    marginHorizontal: Spacing.lg, padding: Spacing.sm, marginBottom: 4,
  },
  offlineBannerText: { color: Colors.warning, fontSize: 10, lineHeight: 16 },

  skipJurusan: {
    alignSelf: 'flex-end', paddingHorizontal: Spacing.lg,
    paddingVertical: 6, marginBottom: 4,
  },
  skipJurusanText: { color: Colors.textMuted, fontSize: FontSize.xs },

  jurusanRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  jurusanInfo: { flex: 1, gap: 3 },
  jurusanName: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '700' },
  jurusanFakultas: { color: Colors.textMuted, fontSize: FontSize.xs },
  pgBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.full, marginTop: 3,
  },
  pgText: { fontSize: 10, fontWeight: '800' },
  jurusanArrow: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  jurusanArrowText: { fontSize: 16, fontWeight: '700' },
});

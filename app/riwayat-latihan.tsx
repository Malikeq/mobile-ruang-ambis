import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Animated, ActivityIndicator, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { API_BASE } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RiwayatItem {
  id:            number;
  mapel_kode:    string;
  mapel_nama:    string;
  tipe:          string;
  skor_raw:      number;
  skor_akhir:    number;
  total_soal:    number;
  total_benar:   number;
  durasi_detik?: number | null;
  tanggal:       string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDurasi(s?: number | null): string {
  if (!s) return '—';
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}m ${sec}s`;
}

function fmtTanggal(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function tipeLabel(tipe: string): { label: string; color: string; emoji: string } {
  if (tipe === 'ujian')      return { label: 'Ujian',      color: '#F59E0B', emoji: '📝' };
  if (tipe === 'diagnostic') return { label: 'Diagnostik', color: '#8B5CF6', emoji: '🔍' };
  return                            { label: 'Harian',     color: Colors.primary, emoji: '📚' };
}

// ─── Card component ───────────────────────────────────────────────────────────

function RiwayatCard({ item, onPress }: { item: RiwayatItem; onPress: () => void }) {
  const acc = item.total_soal > 0 ? Math.round((item.total_benar / item.total_soal) * 100) : 0;
  const snbt = Math.round(item.skor_akhir ?? (400 + (item.skor_raw / 100) * 400));
  const accColor = acc >= 70 ? Colors.success : acc >= 50 ? Colors.secondary : Colors.error;
  const { label, color, emoji } = tipeLabel(item.tipe);
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 60, useNativeDriver: true }),
      Animated.spring(scale,  { toValue: 1, useNativeDriver: true }),
    ]).start(() => onPress());
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity style={st.card} onPress={handlePress} activeOpacity={1}>
        {/* Top row */}
        <View style={st.cardTop}>
          <View style={[st.tipeBadge, { backgroundColor: color + '20', borderColor: color + '60' }]}>
            <Text style={{ fontSize: 11 }}>{emoji}</Text>
            <Text style={[st.tipeTxt, { color }]}>{label}</Text>
          </View>
          <Text style={st.tanggal}>{fmtTanggal(item.tanggal)}</Text>
        </View>

        {/* Mapel */}
        <Text style={st.mapelNama} numberOfLines={1}>{item.mapel_nama}</Text>

        {/* Stats row */}
        <View style={st.statsRow}>
          <View style={st.statItem}>
            <Text style={[st.statVal, { color: snbt >= 600 ? Colors.success : snbt >= 500 ? Colors.secondary : Colors.error }]}>
              {snbt}
            </Text>
            <Text style={st.statLbl}>Skor SNBT</Text>
          </View>
          <View style={st.statDivider} />
          <View style={st.statItem}>
            <Text style={[st.statVal, { color: accColor }]}>{acc}%</Text>
            <Text style={st.statLbl}>Akurasi</Text>
          </View>
          <View style={st.statDivider} />
          <View style={st.statItem}>
            <Text style={st.statVal}>{item.total_benar}<Text style={{ fontSize: 11, color: Colors.textMuted }}>/{item.total_soal}</Text></Text>
            <Text style={st.statLbl}>Benar</Text>
          </View>
          <View style={st.statDivider} />
          <View style={st.statItem}>
            <Text style={st.statVal}>{fmtDurasi(item.durasi_detik)}</Text>
            <Text style={st.statLbl}>Waktu</Text>
          </View>
        </View>

        {/* Accuracy bar */}
        <View style={st.barTrack}>
          <View style={[st.barFill, { width: `${acc}%` as any, backgroundColor: accColor }]} />
        </View>

        {/* Review CTA */}
        <View style={st.reviewCta}>
          <Ionicons name="list-outline" size={12} color={Colors.primary} />
          <Text style={st.reviewCtaTxt}>Tap untuk review jawaban →</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RiwayatLatihanScreen() {
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const fade   = useRef(new Animated.Value(0)).current;

  const [list,      setList]      = useState<RiwayatItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refresh,   setRefresh]   = useState(false);
  const [page,      setPage]      = useState(1);
  const [lastPage,  setLastPage]  = useState(1);
  const [loadMore,  setLoadMore]  = useState(false);

  const H = { Authorization: `Bearer ${token}`, Accept: 'application/json' };

  const fetchPage = useCallback(async (p: number, isRefresh = false) => {
    if (isRefresh) { setRefresh(true); setPage(1); }
    else if (p === 1) setLoading(true);
    else setLoadMore(true);

    try {
      const res  = await fetch(`${API_BASE}/latihan/riwayat?per_page=15&page=${p}`, { headers: H });
      const json = await res.json();
      const data: RiwayatItem[] = json?.data ?? [];
      setLastPage(json?.last_page ?? 1);
      setList(prev => p === 1 ? data : [...prev, ...data]);
      if (p === 1) Animated.timing(fade, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    } catch (_) {}
    finally { setLoading(false); setRefresh(false); setLoadMore(false); }
  }, [token]);

  useFocusEffect(useCallback(() => { fetchPage(1); }, [fetchPage]));

  const handleEndReached = () => {
    if (loadMore || page >= lastPage) return;
    const next = page + 1;
    setPage(next);
    fetchPage(next);
  };

  return (
    <View style={st.container}>
      {/* Header */}
      <View style={[st.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={st.headerTitle}>📊 Riwayat Latihan</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <View style={st.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={st.mutedTxt}>Memuat riwayat...</Text>
        </View>
      ) : list.length === 0 ? (
        <View style={st.center}>
          <Text style={{ fontSize: 52 }}>📭</Text>
          <Text style={st.emptyTitle}>Belum ada riwayat</Text>
          <Text style={st.emptyDesc}>Selesaikan sesi latihan pertamamu!</Text>
          <TouchableOpacity style={st.startBtn} onPress={() => router.push('/(tabs)/latihan')}>
            <Text style={st.startBtnTxt}>Mulai Latihan →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fade }}>
          <FlatList
            data={list}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={st.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refresh}
                onRefresh={() => fetchPage(1, true)}
                tintColor={Colors.primary}
                colors={[Colors.primary]}
              />
            }
            onEndReached={handleEndReached}
            onEndReachedThreshold={0.3}
            ListFooterComponent={loadMore ? (
              <View style={{ padding: 16, alignItems: 'center' }}>
                <ActivityIndicator color={Colors.primary} size="small" />
              </View>
            ) : null}
            renderItem={({ item }) => (
              <RiwayatCard
                item={item}
                onPress={() => router.push(`/latihan/review?sesiId=${item.id}`)}
              />
            )}
          />
        </Animated.View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1C2333' },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },

  listContent: { padding: 16, gap: 12 },

  card: {
    backgroundColor: '#1C2333', borderRadius: Radius.xl,
    borderWidth: 1.5, borderColor: '#2A3550', padding: 14, gap: 8,
  },
  cardTop:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tipeBadge:  { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 99, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  tipeTxt:    { fontSize: 11, fontWeight: '800' },
  tanggal:    { color: '#6B7280', fontSize: 11 },
  mapelNama:  { color: '#fff', fontSize: 14, fontWeight: '800' },

  statsRow:    { flexDirection: 'row', alignItems: 'center' },
  statItem:    { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: '#2A3550' },
  statVal:     { color: '#fff', fontSize: 16, fontWeight: '900' },
  statLbl:     { color: '#6B7280', fontSize: 9, fontWeight: '600' },

  barTrack: { height: 5, backgroundColor: '#2A3550', borderRadius: 3, overflow: 'hidden' },
  barFill:  { height: '100%', borderRadius: 3 },

  reviewCta:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  reviewCtaTxt: { color: Colors.primary, fontSize: 11, fontWeight: '700' },

  // Empty / loading states
  mutedTxt:   { color: '#6B7280', fontSize: 13, marginTop: 8 },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  emptyDesc:  { color: '#6B7280', fontSize: 13, textAlign: 'center' },
  startBtn:   { marginTop: 8, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.xl },
  startBtnTxt:{ color: '#fff', fontSize: 14, fontWeight: '800' },
});

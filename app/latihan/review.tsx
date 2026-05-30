import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { API_BASE } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Pilihan {
  id:         number;
  label:      string;
  konten:     string;
  is_correct: boolean;
}

interface ReviewItem {
  index:      number;
  soal_id:    number;
  konten:     string;
  mapel?:     { id: number; nama: string; kode: string };
  pembahasan?: string;
  pilihan:    Pilihan[];
  jawaban_id?: number | null;
  correct_id?: number | null;
  is_correct: boolean;
  skipped:    boolean;
}

interface Summary {
  total:     number;
  benar:     number;
  salah:     number;
  dilewati:  number;
}

// ─── Filter tabs ─────────────────────────────────────────────────────────────

type Filter = 'semua' | 'salah' | 'benar' | 'dilewati';

// ─── Soal Card ───────────────────────────────────────────────────────────────

function SoalCard({ item, no }: { item: ReviewItem; no: number }) {
  const [expanded, setExpanded] = useState(false);

  const statusColor = item.skipped
    ? Colors.textMuted
    : item.is_correct ? Colors.success : Colors.error;

  const statusIcon = item.skipped ? '⏭' : item.is_correct ? '✅' : '❌';
  const statusText = item.skipped ? 'Dilewati' : item.is_correct ? 'Benar' : 'Salah';

  return (
    <View style={[st.card, { borderColor: statusColor + '40' }]}>
      {/* Header */}
      <TouchableOpacity style={st.cardHeader} onPress={() => setExpanded(e => !e)} activeOpacity={0.8}>
        <View style={[st.noBadge, { backgroundColor: statusColor + '20', borderColor: statusColor + '60' }]}>
          <Text style={[st.noBadgeTxt, { color: statusColor }]}>{no}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={st.mapelTag}>{item.mapel?.kode ?? '—'}</Text>
          <Text style={st.soalPreview} numberOfLines={2}>{item.konten}</Text>
        </View>
        <View style={st.statusBadge}>
          <Text style={{ fontSize: 14 }}>{statusIcon}</Text>
          <Text style={[st.statusTxt, { color: statusColor }]}>{statusText}</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16} color={Colors.textMuted}
          style={{ marginLeft: 4 }}
        />
      </TouchableOpacity>

      {/* Expanded detail */}
      {expanded && (
        <View style={st.cardBody}>
          {/* Full question */}
          <Text style={st.fullKonten}>{item.konten}</Text>

          {/* Options */}
          <View style={st.pilihanWrap}>
            {item.pilihan.map(p => {
              const isUserChoice  = p.id === item.jawaban_id;
              const isCorrect     = p.id === item.correct_id;
              let bg = Colors.surface, border = Colors.border, textColor = Colors.textSecondary;
              if (isCorrect)     { bg = Colors.success + '18'; border = Colors.success; textColor = Colors.success; }
              if (isUserChoice && !isCorrect) { bg = Colors.error + '18'; border = Colors.error; textColor = Colors.error; }

              return (
                <View key={p.id} style={[st.pilihan, { backgroundColor: bg, borderColor: border }]}>
                  <Text style={[st.pilihanLabel, { color: textColor, fontWeight: isCorrect || isUserChoice ? '800' : '600' }]}>
                    {p.label}.
                  </Text>
                  <Text style={[st.pilihanKonten, { color: textColor }]}>{p.konten}</Text>
                  {isCorrect && (
                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} style={{ marginLeft: 'auto' }} />
                  )}
                  {isUserChoice && !isCorrect && (
                    <Ionicons name="close-circle" size={16} color={Colors.error} style={{ marginLeft: 'auto' }} />
                  )}
                </View>
              );
            })}
          </View>

          {/* Pembahasan */}
          {item.pembahasan && (
            <View style={st.pembahasanBox}>
              <Text style={st.pembahasanTitle}>💡 Pembahasan</Text>
              <Text style={st.pembahasanTxt}>{item.pembahasan}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SessionReviewScreen() {
  const { sesiId } = useLocalSearchParams<{ sesiId: string }>();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  const fade   = useRef(new Animated.Value(0)).current;

  const [items,   setItems]   = useState<ReviewItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState<Filter>('semua');

  useFocusEffect(useCallback(() => {
    (async () => {
      try {
        const res  = await fetch(`${API_BASE}/latihan/${sesiId}/review`, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        });
        const json = await res.json();
        setItems(json?.data ?? []);
        setSummary(json?.summary ?? null);
        Animated.timing(fade, { toValue: 1, duration: 350, useNativeDriver: true }).start();
      } catch (_) {}
      finally { setLoading(false); }
    })();
  }, [sesiId, token]));

  const FILTERS: { key: Filter; label: string; color: string }[] = [
    { key: 'semua',    label: `Semua (${summary?.total ?? 0})`,    color: Colors.primary },
    { key: 'benar',    label: `Benar (${summary?.benar ?? 0})`,    color: Colors.success },
    { key: 'salah',    label: `Salah (${summary?.salah ?? 0})`,    color: Colors.error   },
    { key: 'dilewati', label: `Skip (${summary?.dilewati ?? 0})`,  color: Colors.textMuted },
  ];

  const filtered = items.filter(it => {
    if (filter === 'semua')    return true;
    if (filter === 'benar')    return it.is_correct && !it.skipped;
    if (filter === 'salah')    return !it.is_correct && !it.skipped;
    if (filter === 'dilewati') return it.skipped;
    return true;
  });

  return (
    <View style={st.container}>
      {/* Header */}
      <View style={[st.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={st.headerTitle}>📋 Review Jawaban</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <View style={st.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={st.mutedTxt}>Memuat review...</Text>
        </View>
      ) : (
        <Animated.ScrollView style={{ opacity: fade }} showsVerticalScrollIndicator={false}>
          {/* Summary bar */}
          {summary && (
            <View style={st.summaryBar}>
              <View style={st.summaryItem}>
                <Text style={[st.summaryVal, { color: Colors.success }]}>{summary.benar}</Text>
                <Text style={st.summaryLbl}>Benar</Text>
              </View>
              <View style={st.summaryItem}>
                <Text style={[st.summaryVal, { color: Colors.error }]}>{summary.salah}</Text>
                <Text style={st.summaryLbl}>Salah</Text>
              </View>
              <View style={st.summaryItem}>
                <Text style={[st.summaryVal, { color: Colors.textMuted }]}>{summary.dilewati}</Text>
                <Text style={st.summaryLbl}>Dilewati</Text>
              </View>
              <View style={st.summaryItem}>
                <Text style={[st.summaryVal, { color: '#F59E0B' }]}>
                  {summary.total > 0 ? Math.round((summary.benar / summary.total) * 100) : 0}%
                </Text>
                <Text style={st.summaryLbl}>Akurasi</Text>
              </View>
            </View>
          )}

          {/* Filter tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.filterScroll} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
            {FILTERS.map(f => (
              <TouchableOpacity
                key={f.key}
                style={[st.filterBtn, filter === f.key && { backgroundColor: f.color + '20', borderColor: f.color }]}
                onPress={() => setFilter(f.key)}
                activeOpacity={0.8}
              >
                <Text style={[st.filterTxt, filter === f.key && { color: f.color, fontWeight: '800' }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Cards */}
          <View style={st.listWrap}>
            {filtered.length === 0 ? (
              <View style={st.center}>
                <Text style={{ fontSize: 36 }}>🎉</Text>
                <Text style={st.emptyTxt}>Tidak ada soal di kategori ini</Text>
              </View>
            ) : (
              filtered.map((item, i) => (
                <SoalCard key={item.soal_id} item={item} no={item.index + 1} />
              ))
            )}
          </View>

          <View style={{ height: 100 }} />
        </Animated.ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1C2333' },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },

  summaryBar:  { flexDirection: 'row', marginHorizontal: 16, marginVertical: 12, backgroundColor: '#1C2333', borderRadius: 14, borderWidth: 1, borderColor: '#2A3550', padding: 12 },
  summaryItem: { flex: 1, alignItems: 'center', gap: 2 },
  summaryVal:  { fontSize: 22, fontWeight: '900' },
  summaryLbl:  { color: '#6B7280', fontSize: 10, fontWeight: '600' },

  filterScroll: { marginBottom: 8 },
  filterBtn:    { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1, borderColor: '#2A3550' },
  filterTxt:    { color: '#6B7280', fontSize: 12, fontWeight: '600' },

  listWrap: { paddingHorizontal: 16, gap: 10 },

  card:       { backgroundColor: '#1C2333', borderRadius: Radius.xl, borderWidth: 1.5, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  cardBody:   { padding: 14, paddingTop: 0, gap: 12 },

  noBadge:     { width: 30, height: 30, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  noBadgeTxt:  { fontSize: 12, fontWeight: '900' },
  mapelTag:    { color: Colors.primary, fontSize: 10, fontWeight: '800', marginBottom: 2 },
  soalPreview: { color: '#D1D5DB', fontSize: 12, lineHeight: 18 },
  statusBadge: { alignItems: 'center', gap: 2 },
  statusTxt:   { fontSize: 9, fontWeight: '700' },

  fullKonten: { color: '#fff', fontSize: 13, lineHeight: 20 },

  pilihanWrap: { gap: 8 },
  pilihan:     { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 10 },
  pilihanLabel:{ fontSize: 13, minWidth: 18 },
  pilihanKonten:{ flex: 1, fontSize: 13, lineHeight: 18 },

  pembahasanBox:  { backgroundColor: '#0F1923', borderRadius: 12, borderWidth: 1, borderColor: '#F59E0B30', padding: 12 },
  pembahasanTitle:{ color: '#F59E0B', fontSize: 12, fontWeight: '800', marginBottom: 6 },
  pembahasanTxt:  { color: '#D1D5DB', fontSize: 12, lineHeight: 19 },

  mutedTxt: { color: '#6B7280', fontSize: 13, marginTop: 8 },
  emptyTxt: { color: '#9CA3AF', fontSize: 13, textAlign: 'center' },
});

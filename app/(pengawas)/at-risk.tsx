import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Platform, RefreshControl, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { pengawasApi, SiswaListItem, AtRiskData } from '@/lib/api';

const PW_GREEN   = '#059669';
const PW_GREEN_L = '#10B981';

type RiskTab = 'tidak_aktif' | 'akurasi_rendah' | 'belum_latihan';

const TAB_CONFIG: { id: RiskTab; label: string; color: string; icon: string; desc: string }[] = [
  { id: 'tidak_aktif',    label: 'Tidak Aktif',   color: '#F59E0B', icon: 'time-outline',    desc: 'Tidak aktif > 7 hari' },
  { id: 'akurasi_rendah', label: 'Akurasi Rendah',color: '#EF4444', icon: 'trending-down',   desc: 'Rata-rata akurasi < 40%' },
  { id: 'belum_latihan',  label: 'Belum Latihan', color: '#6B7280', icon: 'book-outline',    desc: 'Belum pernah mengerjakan soal' },
];

function daysSince(dateStr?: string): string {
  if (!dateStr) return 'Tidak pernah';
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  return days === 0 ? 'Hari ini' : `${days} hari lalu`;
}

function SiswaRiskCard({
  siswa, riskType, extraInfo, onPress,
}: {
  siswa: SiswaListItem & { avg_akurasi?: number };
  riskType: RiskTab;
  extraInfo: string;
  onPress: () => void;
}) {
  const cfg = TAB_CONFIG.find(t => t.id === riskType)!;
  return (
    <TouchableOpacity style={[card.wrap, { borderLeftColor: cfg.color, borderLeftWidth: 3 }]}
      onPress={onPress} activeOpacity={0.8}>
      {/* Avatar */}
      <View style={[card.avatar, { backgroundColor: cfg.color + '20' }]}>
        <Text style={[card.avatarText, { color: cfg.color }]}>{siswa.name.charAt(0)}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={card.name} numberOfLines={1}>{siswa.name}</Text>
        <Text style={card.email} numberOfLines={1}>{siswa.email}</Text>
        <View style={card.badgeRow}>
          <View style={[card.riskBadge, { backgroundColor: cfg.color + '20', borderColor: cfg.color + '50' }]}>
            <Ionicons name={cfg.icon as any} size={10} color={cfg.color} />
            <Text style={[card.riskBadgeText, { color: cfg.color }]}>{extraInfo}</Text>
          </View>
          {siswa.streak_days > 0 && (
            <View style={card.streakBadge}>
              <Text style={card.streakText}>🔥 {siswa.streak_days}</Text>
            </View>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={14} color={Colors.border} />
    </TouchableOpacity>
  );
}
const card = StyleSheet.create({
  wrap:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
                backgroundColor: Colors.surface, borderRadius: Radius.xl,
                borderWidth: 1, borderColor: Colors.border,
                marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
                padding: Spacing.md, overflow: 'hidden' },
  avatar:     { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: FontSize.md, fontWeight: '900' },
  name:       { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '700' },
  email:      { color: Colors.textMuted, fontSize: 10, marginTop: 1 },
  badgeRow:   { flexDirection: 'row', gap: 5, marginTop: 5, flexWrap: 'wrap' },
  riskBadge:  { flexDirection: 'row', alignItems: 'center', gap: 3,
                borderRadius: Radius.full, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 2 },
  riskBadgeText:{ fontSize: 9, fontWeight: '700' },
  streakBadge:{ backgroundColor: '#EF444420', borderRadius: Radius.full, paddingHorizontal: 6, paddingVertical: 2 },
  streakText: { color: '#EF4444', fontSize: 9, fontWeight: '700' },
});

export default function AtRiskScreen() {
  const [tab,     setTab]     = useState<RiskTab>('tidak_aktif');
  const [data,    setData]    = useState<AtRiskData | null>(null);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefresh(true); else setLoading(true);
    try {
      const res = await pengawasApi.getAtRisk();
      setData(res.data);
      setSummary(res.summary ?? {});
    } catch { /* silent */ }
    finally { setLoading(false); setRefresh(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const currentList: (SiswaListItem & { avg_akurasi?: number })[] = !data ? [] :
    tab === 'tidak_aktif'    ? data.tidak_aktif :
    tab === 'akurasi_rendah' ? data.akurasi_rendah :
    data.belum_latihan;

  const getExtraInfo = (siswa: SiswaListItem & { avg_akurasi?: number }): string => {
    if (tab === 'tidak_aktif')    return `Terakhir aktif: ${daysSince(siswa.last_active)}`;
    if (tab === 'akurasi_rendah') return `Rata akurasi: ${Math.round(siswa.avg_akurasi ?? 0)}%`;
    return `Bergabung: ${new Date(siswa.last_active ?? '').toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}`;
  };

  const totalAtRisk = (summary.tidak_aktif ?? 0) + (summary.akurasi_rendah ?? 0) + (summary.belum_latihan ?? 0);

  return (
    <View style={st.root}>
      {/* Header */}
      <View style={st.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={22} color={Colors.textMuted} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={st.title}>Siswa Perlu Perhatian</Text>
          <Text style={st.subtitle}>{totalAtRisk} siswa membutuhkan tindakan</Text>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={st.tabScroll}>
        {TAB_CONFIG.map(t => {
          const count = summary[t.id] ?? 0;
          const active = tab === t.id;
          return (
            <TouchableOpacity key={t.id}
              style={[st.tabChip, active && { backgroundColor: t.color, borderColor: t.color }]}
              onPress={() => setTab(t.id)} activeOpacity={0.8}>
              <Ionicons name={t.icon as any} size={13} color={active ? '#fff' : Colors.textMuted} />
              <Text style={[st.tabChipText, active && { color: '#fff' }]}>{t.label}</Text>
              <View style={[st.tabCount, active && { backgroundColor: '#ffffff40' }]}>
                <Text style={[st.tabCountText, active && { color: '#fff' }]}>{count}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Description */}
      <View style={st.descBar}>
        <Ionicons name="information-circle-outline" size={13} color={Colors.textMuted} />
        <Text style={st.descText}>{TAB_CONFIG.find(t => t.id === tab)?.desc}</Text>
      </View>

      {loading ? (
        <View style={st.loader}><ActivityIndicator color={PW_GREEN} size="large" /></View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 160, paddingTop: Spacing.sm }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => load(true)} tintColor={PW_GREEN} />}
        >
          {currentList.length === 0 ? (
            <View style={st.empty}>
              <Ionicons name="checkmark-circle-outline" size={48} color={PW_GREEN} />
              <Text style={st.emptyTitle}>Tidak Ada Siswa</Text>
              <Text style={st.emptySub}>Tidak ada siswa dalam kategori ini saat ini</Text>
            </View>
          ) : (
            <>
              {currentList.map(siswa => (
                <SiswaRiskCard
                  key={siswa.id}
                  siswa={siswa}
                  riskType={tab}
                  extraInfo={getExtraInfo(siswa)}
                  onPress={() => router.push({ pathname: '/(pengawas)/siswa/[id]', params: { id: siswa.id } })}
                />
              ))}

              {/* Bulk action bar */}
              {currentList.length > 0 && (
                <View style={st.bulkBar}>
                  <Text style={st.bulkText}>{currentList.length} siswa dalam kategori ini</Text>
                  <TouchableOpacity
                    style={st.bulkBtn}
                    onPress={() => Alert.alert(
                      'Fitur Segera Hadir',
                      'Kirim pesan massal ke siswa akan tersedia di pembaruan berikutnya.',
                      [{ text: 'OK' }]
                    )}
                  >
                    <Ionicons name="mail-outline" size={14} color="#fff" />
                    <Text style={st.bulkBtnText}>Kirim Pesan ke Semua</Text>
                  </TouchableOpacity>
                </View>
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
  header:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
                  paddingTop: Platform.OS === 'ios' ? 56 : 44,
                  paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  title:        { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: '900' },
  subtitle:     { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },

  tabScroll:    { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm, gap: Spacing.sm },
  tabChip:      { flexDirection: 'row', alignItems: 'center', gap: 5,
                  backgroundColor: Colors.surface, borderRadius: Radius.full,
                  borderWidth: 1.5, borderColor: Colors.border,
                  paddingHorizontal: 12, paddingVertical: 7 },
  tabChipText:  { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '800' },
  tabCount:     { backgroundColor: Colors.surfaceElevated, borderRadius: Radius.full,
                  paddingHorizontal: 6, paddingVertical: 1, minWidth: 20, alignItems: 'center' },
  tabCountText: { color: Colors.textMuted, fontSize: 9, fontWeight: '900' },

  descBar:      { flexDirection: 'row', alignItems: 'center', gap: 5,
                  marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
                  paddingHorizontal: Spacing.sm, paddingVertical: 6,
                  backgroundColor: Colors.surface, borderRadius: Radius.lg,
                  borderWidth: 1, borderColor: Colors.border },
  descText:     { color: Colors.textMuted, fontSize: FontSize.xs },
  loader:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  empty:        { alignItems: 'center', paddingTop: 60, gap: Spacing.sm, paddingHorizontal: Spacing.xl },
  emptyTitle:   { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '900' },
  emptySub:     { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center' },

  bulkBar:      { marginHorizontal: Spacing.lg, marginTop: Spacing.md,
                  backgroundColor: Colors.surface, borderRadius: Radius.xl,
                  borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
                  alignItems: 'center', gap: Spacing.sm },
  bulkText:     { color: Colors.textMuted, fontSize: FontSize.xs },
  bulkBtn:      { flexDirection: 'row', alignItems: 'center', gap: 6,
                  backgroundColor: PW_GREEN, borderRadius: Radius.xl,
                  paddingHorizontal: Spacing.lg, paddingVertical: 10 },
  bulkBtnText:  { color: '#fff', fontSize: FontSize.sm, fontWeight: '800' },
});

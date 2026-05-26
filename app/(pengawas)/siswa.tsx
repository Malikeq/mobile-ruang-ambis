import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Platform, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { pengawasApi, SiswaListItem } from '@/lib/api';

const PW_GREEN   = '#059669';
const PW_GREEN_L = '#10B981';

type Filter = 'semua' | 'aktif' | 'berisiko' | 'premium';
type SortBy = 'last_active' | 'streak' | 'points';

function statusInfo(lastActive?: string): { color: string; label: string } {
  if (!lastActive) return { color: '#6B7280', label: 'Belum aktif' };
  const days = Math.floor((Date.now() - new Date(lastActive).getTime()) / 86_400_000);
  if (days === 0) return { color: PW_GREEN,   label: 'Aktif hari ini' };
  if (days <= 3)  return { color: '#F59E0B',  label: `${days} hari lalu` };
  if (days <= 7)  return { color: '#EF4444',  label: `${days} hari lalu` };
  return           { color: '#6B7280', label: `${days} hari lalu` };
}

function SiswaCard({ siswa, onPress }: { siswa: SiswaListItem; onPress: () => void }) {
  const st = statusInfo(siswa.last_active);
  const initial = siswa.name.charAt(0).toUpperCase();
  return (
    <TouchableOpacity style={card.wrap} onPress={onPress} activeOpacity={0.8}>
      {/* Avatar */}
      <View style={[card.avatar, { borderColor: st.color + '60', backgroundColor: st.color + '15' }]}>
        <Text style={[card.avatarText, { color: st.color }]}>{initial}</Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <View style={card.nameRow}>
          <Text style={card.name} numberOfLines={1}>{siswa.name}</Text>
          {siswa.tier === 'premium' && (
            <View style={card.premBadge}><Text style={card.premBadgeText}>⭐ PRO</Text></View>
          )}
        </View>
        <View style={card.metaRow}>
          <View style={[card.statusDot, { backgroundColor: st.color }]} />
          <Text style={[card.meta, { color: st.color }]}>{st.label}</Text>
          <Text style={card.sep}>·</Text>
          <Ionicons name="flame" size={11} color="#EF4444" />
          <Text style={card.meta}>{siswa.streak_days} hari</Text>
          <Text style={card.sep}>·</Text>
          <Text style={card.meta}>{siswa.sesi_7d} sesi/7hr</Text>
        </View>
      </View>

      {/* Score */}
      <View style={card.right}>
        {siswa.avg_snbt > 0 ? (
          <>
            <Text style={[card.snbt, { color: siswa.avg_snbt >= 600 ? PW_GREEN : siswa.avg_snbt >= 500 ? '#F59E0B' : '#EF4444' }]}>
              {Math.round(siswa.avg_snbt)}
            </Text>
            <Text style={card.snbtLabel}>SNBT</Text>
          </>
        ) : (
          <Text style={card.noScore}>—</Text>
        )}
      </View>

      <Ionicons name="chevron-forward" size={14} color={Colors.border} />
    </TouchableOpacity>
  );
}

const card = StyleSheet.create({
  wrap:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
                backgroundColor: Colors.surface, borderRadius: Radius.xl,
                borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
                marginHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  avatar:     { width: 44, height: 44, borderRadius: 22, borderWidth: 2,
                alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: FontSize.md, fontWeight: '900' },
  nameRow:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  name:       { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '700', flex: 1 },
  premBadge:  { backgroundColor: '#F59E0B20', borderRadius: Radius.full,
                paddingHorizontal: 6, paddingVertical: 1, borderWidth: 1, borderColor: '#F59E0B50' },
  premBadgeText:{ color: '#F59E0B', fontSize: 8, fontWeight: '800' },
  metaRow:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusDot:  { width: 6, height: 6, borderRadius: 3 },
  meta:       { color: Colors.textMuted, fontSize: 10, fontWeight: '600' },
  sep:        { color: Colors.border, fontSize: 10 },
  right:      { alignItems: 'flex-end', marginRight: 4 },
  snbt:       { fontSize: FontSize.md, fontWeight: '900' },
  snbtLabel:  { color: Colors.textMuted, fontSize: 8, fontWeight: '700' },
  noScore:    { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '700' },
});

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'semua',    label: 'Semua' },
  { id: 'aktif',    label: '✅ Aktif' },
  { id: 'berisiko', label: '⚠️ Berisiko' },
  { id: 'premium',  label: '⭐ Premium' },
];

const SORT_OPTS: { id: SortBy; label: string }[] = [
  { id: 'last_active', label: 'Terakhir Aktif' },
  { id: 'streak',      label: 'Streak Tertinggi' },
  { id: 'points',      label: 'Poin Tertinggi' },
];

export default function SiswaListScreen() {
  const [siswa,    setSiswa]    = useState<SiswaListItem[]>([]);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState<Filter>('semua');
  const [sortBy,   setSortBy]   = useState<SortBy>('last_active');
  const [loading,  setLoading]  = useState(true);
  const [refresh,  setRefresh]  = useState(false);
  const [page,     setPage]     = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total,    setTotal]    = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showSort, setShowSort] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  const load = useCallback(async (p = 1, isRefresh = false, q = search, s = sortBy) => {
    if (p === 1) { if (isRefresh) setRefresh(true); else setLoading(true); }
    else setLoadingMore(true);

    try {
      const res = await pengawasApi.getSiswa({ search: q, sort_by: s, page: p, per_page: 20 });
      const d = res.data;
      setSiswa(prev => p === 1 ? d.data : [...prev, ...d.data]);
      setPage(d.current_page);
      setLastPage(d.last_page);
      setTotal(d.total);
    } catch { /* silent */ }
    finally {
      setLoading(false);
      setRefresh(false);
      setLoadingMore(false);
    }
  }, [search, sortBy]);

  useFocusEffect(useCallback(() => { load(1); }, [sortBy]));

  // Debounced search
  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => load(1, false, search, sortBy), 350);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  const loadMore = () => {
    if (!loadingMore && page < lastPage) load(page + 1, false, search, sortBy);
  };

  // Client-side filter for active/at-risk/premium
  const displayed = siswa.filter(s => {
    if (filter === 'semua') return true;
    if (filter === 'premium') return s.tier === 'premium';
    if (filter === 'aktif') {
      if (!s.last_active) return false;
      return (Date.now() - new Date(s.last_active).getTime()) < 86_400_000 * 3;
    }
    if (filter === 'berisiko') {
      const days = s.last_active ? Math.floor((Date.now() - new Date(s.last_active).getTime()) / 86_400_000) : 999;
      return days > 7 || s.avg_snbt < 400 || s.total_sesi === 0;
    }
    return true;
  });

  return (
    <View style={st.root}>
      {/* Header */}
      <View style={st.header}>
        <View>
          <Text style={st.title}>Daftar Siswa</Text>
          <Text style={st.subtitle}>{total} siswa terdaftar</Text>
        </View>
        <TouchableOpacity style={st.sortBtn} onPress={() => setShowSort(v => !v)}>
          <Ionicons name="funnel-outline" size={16} color={Colors.textMuted} />
          <Text style={st.sortBtnText}>{SORT_OPTS.find(o => o.id === sortBy)?.label}</Text>
          <Ionicons name={showSort ? 'chevron-up' : 'chevron-down'} size={12} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Sort picker */}
      {showSort && (
        <View style={st.sortPicker}>
          {SORT_OPTS.map(o => (
            <TouchableOpacity key={o.id} style={st.sortOption}
              onPress={() => { setSortBy(o.id); setShowSort(false); load(1, false, search, o.id); }}>
              <Text style={[st.sortOptionText, sortBy === o.id && { color: PW_GREEN }]}>{o.label}</Text>
              {sortBy === o.id && <Ionicons name="checkmark" size={14} color={PW_GREEN} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Search */}
      <View style={st.searchWrap}>
        <Ionicons name="search" size={16} color={Colors.textMuted} />
        <TextInput
          style={st.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Cari nama atau email..."
          placeholderTextColor={Colors.textMuted}
          clearButtonMode="while-editing"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <View style={st.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f.id}
            style={[st.filterChip, filter === f.id && { backgroundColor: PW_GREEN, borderColor: PW_GREEN }]}
            onPress={() => setFilter(f.id)}>
            <Text style={[st.filterText, filter === f.id && { color: '#fff' }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={st.loader}>
          <ActivityIndicator color={PW_GREEN} size="large" />
        </View>
      ) : (
        <FlatList
          data={displayed}
          keyExtractor={i => String(i.id)}
          renderItem={({ item }) => (
            <SiswaCard siswa={item} onPress={() =>
              router.push({ pathname: '/(pengawas)/siswa/[id]', params: { id: item.id } })} />
          )}
          contentContainerStyle={{ paddingTop: Spacing.sm, paddingBottom: 160 }}
          refreshControl={<RefreshControl refreshing={refresh} onRefresh={() => load(1, true)} tintColor={PW_GREEN} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={loadingMore ? <ActivityIndicator color={PW_GREEN} style={{ margin: 16 }} /> : null}
          ListEmptyComponent={
            <View style={st.empty}>
              <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
              <Text style={st.emptyTitle}>{search ? 'Siswa tidak ditemukan' : 'Belum ada siswa'}</Text>
              <Text style={st.emptySub}>
                {search
                  ? 'Coba kata kunci lain'
                  : 'Siswa akan muncul setelah mendaftar dan memilih sekolah ini'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const st = StyleSheet.create({
  root:         { flex: 1, backgroundColor: Colors.background },
  header:       { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
                  paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  title:        { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: '900' },
  subtitle:     { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  sortBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4,
                  backgroundColor: Colors.surface, borderRadius: Radius.lg,
                  borderWidth: 1, borderColor: Colors.border,
                  paddingHorizontal: Spacing.sm, paddingVertical: 7 },
  sortBtnText:  { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '600' },
  sortPicker:   { marginHorizontal: Spacing.lg, backgroundColor: Colors.surface,
                  borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border,
                  marginBottom: Spacing.sm, overflow: 'hidden' },
  sortOption:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
                  borderBottomWidth: 1, borderBottomColor: Colors.border },
  sortOptionText:{ color: Colors.textSecondary, fontSize: FontSize.sm },
  searchWrap:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
                  marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
                  backgroundColor: Colors.surface, borderRadius: Radius.xl,
                  borderWidth: 1, borderColor: Colors.border,
                  paddingHorizontal: Spacing.md, paddingVertical: 10 },
  searchInput:  { flex: 1, color: Colors.textPrimary, fontSize: FontSize.sm, minHeight: 24 },
  filterRow:    { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  filterChip:   { backgroundColor: Colors.surface, borderRadius: Radius.full,
                  borderWidth: 1, borderColor: Colors.border,
                  paddingHorizontal: 12, paddingVertical: 6 },
  filterText:   { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '700' },
  loader:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  empty:        { alignItems: 'center', paddingTop: 60, paddingHorizontal: Spacing.xl, gap: Spacing.sm },
  emptyTitle:   { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '800' },
  emptySub:     { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 22 },
});

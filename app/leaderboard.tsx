import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, ActivityIndicator, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSize } from '@/constants/theme';
import { API_BASE } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface LeaderEntry {
  rank:        number;
  points:      number;
  streak_days: number;
  user: {
    id:            number;
    name:          string;
    tier?:         string;
    asal_sekolah?: string | null;
  };
}

interface MyRank {
  rank:        number;
  points:      number;
  streak_days: number;
}

// ─── Medal helper ─────────────────────────────────────────────────────────────

function medal(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

function rankColor(rank: number): string {
  if (rank === 1) return '#F59E0B';
  if (rank === 2) return '#9CA3AF';
  if (rank === 3) return '#CD7F32';
  return Colors.textMuted;
}

function nameInitial(name: string): string {
  return (name ?? 'U')[0].toUpperCase();
}

// ─── Row component ────────────────────────────────────────────────────────────

function LeaderRow({ entry, isMe }: { entry: LeaderEntry; isMe: boolean }) {
  const color = rankColor(entry.rank);
  return (
    <View style={[st.row, isMe && st.rowMe]}>
      {/* Rank */}
      <View style={st.rankCol}>
        <Text style={[st.rankTxt, { color }]}>{medal(entry.rank)}</Text>
      </View>

      {/* Avatar */}
      <View style={[st.avatar, isMe && { backgroundColor: Colors.primary + '40', borderColor: Colors.primary }]}>
        <Text style={st.avatarTxt}>{nameInitial(entry.user?.name ?? '')}</Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={[st.name, isMe && { color: Colors.primaryLight }]} numberOfLines={1}>
          {entry.user?.name ?? ''}{isMe ? ' (Kamu)' : ''}
        </Text>
        <Text style={st.school} numberOfLines={1}>
          {entry.user?.asal_sekolah ?? 'Pejuang PTN'} · {entry.streak_days ?? 0}🔥
        </Text>
      </View>

      {/* Poin */}
    <View style={st.pointCol}>
        <Text style={[st.pointVal, { color: isMe ? Colors.primaryLight : '#F59E0B' }]}>
          {(entry.poin ?? entry.points ?? 0).toLocaleString('id-ID')}
        </Text>
        <Text style={st.pointLabel}>poin</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function LeaderboardScreen() {
  const { token, user } = useAuth();
  const insets = useSafeAreaInsets();
  const fade   = useRef(new Animated.Value(0)).current;

  const [list,    setList]    = useState<LeaderEntry[]>([]);
  const [myRank,  setMyRank]  = useState<MyRank | null>(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [periode, setPeriode] = useState<'minggu' | 'bulan' | 'all'>('minggu');

  const H = { Authorization: `Bearer ${token}`, Accept: 'application/json' };

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefresh(true); else setLoading(true);
    try {
      const [lRes, mRes] = await Promise.all([
        fetch(`${API_BASE}/leaderboard?periode=${periode}`, { headers: H }),
        fetch(`${API_BASE}/leaderboard/me`, { headers: H }),
      ]);
      const lJson = await lRes.json();
      const mJson = await mRes.json();
      setList(lJson?.data ?? lJson ?? []);
      setMyRank(mJson?.data ?? null);
      Animated.timing(fade, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    } catch (_) {}
    finally { setLoading(false); setRefresh(false); }
  }, [token, periode]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  const PERIODS: { key: 'minggu' | 'bulan' | 'all'; label: string }[] = [
    { key: 'minggu', label: 'Minggu Ini' },
    { key: 'bulan',  label: 'Bulan Ini'  },
    { key: 'all',    label: 'All Time'   },
  ];

  return (
    <View style={st.container}>
      {/* Header */}
      <View style={[st.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={st.headerTitle}>🏆 Leaderboard</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Period filter */}
      <View style={st.filterRow}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p.key}
            style={[st.filterBtn, periode === p.key && st.filterBtnActive]}
            onPress={() => setPeriode(p.key)}
            activeOpacity={0.8}
          >
            <Text style={[st.filterTxt, periode === p.key && st.filterTxtActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* My Rank Banner */}
      {myRank && (
        <View style={st.myBanner}>
          <View style={{ flex: 1 }}>
            <Text style={st.myBannerLabel}>Posisimu</Text>
            <Text style={st.myBannerRank}>#{myRank.rank}</Text>
          </View>
          <View style={st.myBannerRight}>
            <Text style={st.myBannerPoin}>{(myRank.points ?? 0).toLocaleString('id-ID')}</Text>
            <Text style={st.myBannerPoinLabel}>poin · {myRank.streak_days ?? 0}🔥</Text>
          </View>
        </View>
      )}

      {loading ? (
        <View style={st.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
          <Text style={st.loadingTxt}>Memuat peringkat...</Text>
        </View>
      ) : list.length === 0 ? (
        <View style={st.center}>
          <Text style={{ fontSize: 48 }}>🏆</Text>
          <Text style={st.emptyTxt}>Belum ada data peringkat</Text>
          <Text style={st.emptyHint}>Mulai latihan untuk masuk papan skor!</Text>
        </View>
      ) : (
        <Animated.ScrollView
          style={{ opacity: fade }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refresh}
              onRefresh={() => fetchData(true)}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
        >
          {/* Top 3 podium */}
          {list.length >= 3 && (
            <View style={st.podium}>
              {/* 2nd */}
              <View style={[st.podiumItem, { marginTop: 24 }]}>
                <Text style={{ fontSize: 32 }}>🥈</Text>
                <View style={[st.podiumAvatar, { backgroundColor: '#9CA3AF20', borderColor: '#9CA3AF' }]}>
                  <Text style={st.podiumAvatarTxt}>{nameInitial(list[1].user?.name ?? '')}</Text>
                </View>
                <Text style={st.podiumName} numberOfLines={1}>{(list[1].user?.name ?? '').split(' ')[0]}</Text>
                <Text style={st.podiumPoin}>{(list[1].points ?? 0).toLocaleString('id-ID')}</Text>
              </View>
              {/* 1st */}
              <View style={st.podiumItem}>
                <Text style={{ fontSize: 40 }}>🥇</Text>
                <View style={[st.podiumAvatar, st.podiumAvatarGold]}>
                  <Text style={st.podiumAvatarTxt}>{nameInitial(list[0].user?.name ?? '')}</Text>
                </View>
                <Text style={st.podiumName} numberOfLines={1}>{(list[0].user?.name ?? '').split(' ')[0]}</Text>
                <Text style={[st.podiumPoin, { color: '#F59E0B' }]}>{(list[0].points ?? 0).toLocaleString('id-ID')}</Text>
              </View>
              {/* 3rd */}
              <View style={[st.podiumItem, { marginTop: 36 }]}>
                <Text style={{ fontSize: 28 }}>🥉</Text>
                <View style={[st.podiumAvatar, { backgroundColor: '#CD7F3220', borderColor: '#CD7F32' }]}>
                  <Text style={st.podiumAvatarTxt}>{nameInitial(list[2].user?.name ?? '')}</Text>
                </View>
                <Text style={st.podiumName} numberOfLines={1}>{(list[2].user?.name ?? '').split(' ')[0]}</Text>
                <Text style={st.podiumPoin}>{(list[2].points ?? 0).toLocaleString('id-ID')}</Text>
              </View>
            </View>
          )}

          {/* Full list */}
          <View style={st.listCard}>
            {list.map(entry => (
              <LeaderRow
                key={entry.user?.id ?? entry.rank}
                entry={entry}
                isMe={entry.user?.id === user?.id}
              />
            ))}
          </View>

          <View style={{ height: 120 }} />
        </Animated.ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },

  // Header
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1C2333' },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Period filter
  filterRow:      { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  filterBtn:      { flex: 1, paddingVertical: 8, borderRadius: 99, borderWidth: 1, borderColor: '#2A3550', alignItems: 'center' },
  filterBtnActive:{ backgroundColor: Colors.primary + '20', borderColor: Colors.primary },
  filterTxt:      { color: '#6B7280', fontSize: 12, fontWeight: '600' },
  filterTxtActive:{ color: Colors.primaryLight, fontWeight: '800' },

  // My rank banner
  myBanner:         { marginHorizontal: 16, marginBottom: 4, backgroundColor: Colors.primary + '15', borderRadius: 14, borderWidth: 1, borderColor: Colors.primary + '40', padding: 14, flexDirection: 'row', alignItems: 'center' },
  myBannerLabel:    { color: '#9CA3AF', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  myBannerRank:     { color: '#fff', fontSize: 20, fontWeight: '900' },
  myBannerRight:    { alignItems: 'flex-end' },
  myBannerPoin:     { color: Colors.primaryLight, fontSize: 18, fontWeight: '900' },
  myBannerPoinLabel:{ color: '#6B7280', fontSize: 10 },

  // Podium
  podium:          { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 12, paddingVertical: 20, paddingHorizontal: 16 },
  podiumItem:      { alignItems: 'center', flex: 1, gap: 4 },
  podiumAvatar:    { width: 56, height: 56, borderRadius: 28, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1C2333' },
  podiumAvatarGold:{ backgroundColor: '#F59E0B20', borderColor: '#F59E0B', width: 64, height: 64, borderRadius: 32 },
  podiumAvatarTxt: { color: '#fff', fontSize: 20, fontWeight: '800' },
  podiumName:      { color: '#D1D5DB', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  podiumPoin:      { color: '#9CA3AF', fontSize: 11, fontWeight: '600' },

  // List
  listCard:  { marginHorizontal: 16, backgroundColor: '#1C2333', borderRadius: 16, borderWidth: 1, borderColor: '#2A3550', overflow: 'hidden' },
  row:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2A3550' },
  rowMe:     { backgroundColor: Colors.primary + '12' },
  rankCol:   { width: 32, alignItems: 'center' },
  rankTxt:   { fontSize: 14, fontWeight: '900' },
  avatar:    { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2A3550', borderWidth: 1, borderColor: '#3A4560', alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
  name:      { color: '#fff', fontSize: 13, fontWeight: '700' },
  school:    { color: '#6B7280', fontSize: 10, marginTop: 1 },
  pointCol:  { alignItems: 'flex-end' },
  pointVal:  { fontSize: 15, fontWeight: '900' },
  pointLabel:{ color: '#6B7280', fontSize: 9 },

  // States
  loadingTxt:{ color: '#6B7280', fontSize: 13, marginTop: 8 },
  emptyTxt:  { color: '#fff', fontSize: 15, fontWeight: '700' },
  emptyHint: { color: '#6B7280', fontSize: 12 },
});

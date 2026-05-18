import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Platform, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { API_BASE } from '@/lib/api';

// Flat shape used for display
interface Target {
  kampusLabel: string;
  jurusanLabel: string;
  target_nilai: number;
  skor_saat_ini: number;
}
// Raw API shape — kampus/jurusan may be nested objects
function normalizeTarget(raw: any): Target {
  const k = raw.kampus;
  const j = raw.jurusan;
  return {
    kampusLabel:   typeof k === 'string' ? k : (k?.akronim || k?.nama || 'PTN'),
    jurusanLabel:  typeof j === 'string' ? j : (j?.nama || 'Jurusan'),
    target_nilai:  raw.target_nilai ?? (typeof j === 'object' ? j?.passing_grade_estimate : 0) ?? 0,
    skor_saat_ini: raw.skor_saat_ini ?? 0,
  };
}

function TargetCard({ target }: { target: Target }) {
  const gap  = target.target_nilai - target.skor_saat_ini;
  const pct  = Math.min(100, (target.skor_saat_ini / target.target_nilai) * 100);
  const color = pct >= 80 ? Colors.success : pct >= 50 ? Colors.secondary : Colors.error;
  return (
    <View style={styles.targetCard}>
      <View style={styles.targetHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.targetKampus}>{target.kampusLabel}</Text>
          <Text style={styles.targetJurusan}>{target.jurusanLabel}</Text>
        </View>
        <View style={[styles.targetBadge, { backgroundColor: color + '20', borderColor: color + '50' }]}>
          <Text style={[styles.targetBadgeText, { color }]}>
            {gap <= 0 ? '✅ Tercapai' : `-${gap} pts`}
          </Text>
        </View>
      </View>
      <View style={styles.targetProgress}>
        <View style={styles.targetTrack}>
          <View style={[styles.targetFill, { width: `${pct}%` as any, backgroundColor: color }]} />
        </View>
        <Text style={[styles.targetPct, { color }]}>{Math.round(pct)}%</Text>
      </View>
      <View style={styles.targetNilai}>
        <Text style={styles.targetNilaiLabel}>Skor kamu</Text>
        <Text style={[styles.targetNilaiValue, { color }]}>{target.skor_saat_ini}</Text>
        <Text style={styles.targetNilaiSep}>/</Text>
        <Text style={styles.targetNilaiTarget}>{target.target_nilai}</Text>
        <Text style={styles.targetNilaiLabel}>target</Text>
      </View>
    </View>
  );
}

function MenuRow({ emoji, label, desc, color, onPress, badge }: {
  emoji: string; label: string; desc: string; color: string; onPress: () => void; badge?: string;
}) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.menuIcon, { backgroundColor: color + '20' }]}>
        <Text style={styles.menuEmoji}>{emoji}</Text>
      </View>
      <View style={styles.menuInfo}>
        <Text style={styles.menuLabel}>{label}</Text>
        <Text style={styles.menuDesc}>{desc}</Text>
      </View>
      {badge && (
        <View style={[styles.menuBadge, { backgroundColor: color }]}>
          <Text style={styles.menuBadgeText}>{badge}</Text>
        </View>
      )}
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );
}

export default function ProfilScreen() {
  const { user, logout, token } = useAuth();
  const [targets, setTargets]   = useState<Target[]>([]);
  const [loading, setLoading]   = useState(true);
  const [loggingOut, setLO]     = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    fetchTargets();
  }, []);

  const fetchTargets = async () => {
    try {
      const res  = await fetch(`${API_BASE}/user/targets`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      });
      const json = await res.json();
      setTargets((json?.data ?? []).map(normalizeTarget));
    } catch { setTargets([]); }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    Alert.alert(
      'Keluar',
      'Yakin ingin keluar dari akun ini?',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Keluar', style: 'destructive', onPress: async () => {
          setLO(true);
          await logout();
          setLO(false);
          router.replace('/auth/login');
        }},
      ]
    );
  };

  const tierLabel = user?.tier === 'premium'    ? '⚡ Premium'
                  : user?.tier === 'daily_pass' ? '🔥 Day Pass'
                  : '🆓 Gratis';
  const tierColor = user?.tier === 'premium'    ? Colors.secondary
                  : user?.tier === 'daily_pass' ? Colors.primary
                  : Colors.textMuted;

  return (
    <View style={styles.container}>
      <View style={styles.glow} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* ── Profile Hero ─────────────────────────────────────── */}
          <View style={styles.hero}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(user?.name ?? 'U')[0].toUpperCase()}</Text>
            </View>
            <Text style={styles.heroName}>{user?.name ?? 'Pengguna'}</Text>
            <Text style={styles.heroEmail}>{user?.email ?? ''}</Text>
            <View style={[styles.tierBadge, { backgroundColor: tierColor + '20', borderColor: tierColor + '50' }]}>
              <Text style={[styles.tierText, { color: tierColor }]}>{tierLabel}</Text>
            </View>
          </View>

          {/* ── Upgrade Banner (jika free) ───────────────────────── */}
          {(!user?.tier || user.tier === 'free') && (
            <TouchableOpacity
              style={styles.upgradeBanner}
              onPress={() => router.push('/onboarding/pricing')}
              activeOpacity={0.85}
            >
              <View>
                <Text style={styles.upgradeBannerTitle}>⚡ Upgrade ke Premium</Text>
                <Text style={styles.upgradeBannerDesc}>Rp 49k/bulan · Akses penuh semua fitur AI</Text>
              </View>
              <View style={styles.upgradeBannerArrow}>
                <Text style={styles.upgradeBannerArrowText}>→</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* ── Target PTN ──────────────────────────────────────── */}
          <Text style={styles.sectionTitle}>🎯 Target PTN & Jurusan</Text>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : targets.length === 0 ? (
            <View style={styles.emptyTargets}>
              <Text style={{ fontSize: 32 }}>🏫</Text>
              <Text style={styles.emptyTargetsText}>Belum ada target PTN</Text>
              <TouchableOpacity
                style={styles.addTargetBtn}
                onPress={() => router.push('/edit-target')}
              >
                <Text style={styles.addTargetBtnText}>+ Tambah Target</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {targets.map((t, i) => <TargetCard key={i} target={t} />)}
              <TouchableOpacity style={styles.editTargetBtn} onPress={() => router.push('/edit-target')}>
                <Text style={styles.editTargetBtnText}>✏️  Edit target PTN</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Menu ────────────────────────────────────────────── */}
          <Text style={styles.sectionTitle}>Akun</Text>
          <View style={styles.menuCard}>
            <MenuRow
              emoji="📦" label="Paket Saya"
              desc={tierLabel + ' · Lihat detail'}
              color={tierColor}
              onPress={() => router.push('/onboarding/pricing')}
            />
            <View style={styles.divider} />
            <MenuRow
              emoji="🏆" label="Leaderboard"
              desc="Lihat ranking nasional"
              color={Colors.secondary}
              badge="Baru"
              onPress={() => {}}
            />
            <View style={styles.divider} />
            <MenuRow
              emoji="📊" label="Riwayat Latihan"
              desc="Semua sesi yang sudah dikerjakan"
              color={Colors.primary}
              onPress={() => {}}
            />
            <View style={styles.divider} />
            <MenuRow
              emoji="🔔" label="Notifikasi"
              desc="Pengingat belajar harian"
              color="#8B5CF6"
              onPress={() => {}}
            />
          </View>

          <Text style={[styles.sectionTitle, { marginTop: Spacing.md }]}>Tentang</Text>
          <View style={styles.menuCard}>
            <MenuRow emoji="📋" label="Syarat & Ketentuan" desc="Kebijakan penggunaan" color={Colors.textMuted} onPress={() => {}} />
            <View style={styles.divider} />
            <MenuRow emoji="🔒" label="Kebijakan Privasi" desc="Data & keamanan" color={Colors.textMuted} onPress={() => {}} />
            <View style={styles.divider} />
            <MenuRow emoji="ℹ️" label="Versi Aplikasi" desc="v1.0.0 · AI Lolos PTN" color={Colors.textMuted} onPress={() => {}} />
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            disabled={loggingOut}
            activeOpacity={0.85}
          >
            {loggingOut
              ? <ActivityIndicator color={Colors.error} size="small" />
              : <Text style={styles.logoutText}>🚪  Keluar dari Akun</Text>
            }
          </TouchableOpacity>

          <Text style={styles.footerText}>AI Lolos PTN · Dibuat dengan ❤️ untuk pejuang PTN Indonesia</Text>

          <View style={{ height: Platform.OS === 'ios' ? 100 : 80 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  glow: { position: 'absolute', top: -60, left: -80, width: 240, height: 240, borderRadius: 120, backgroundColor: Colors.primary + '10' },
  scroll: { paddingTop: Platform.OS === 'ios' ? 60 : 48, paddingHorizontal: Spacing.lg },

  // Hero
  hero: { alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.xl },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45, shadowRadius: 20, elevation: 12,
    marginBottom: Spacing.sm,
  },
  avatarText: { color: '#fff', fontSize: 40, fontWeight: '900' },
  heroName:   { color: Colors.textPrimary, fontSize: FontSize.xl, fontWeight: '800', letterSpacing: -0.3 },
  heroEmail:  { color: Colors.textMuted, fontSize: FontSize.sm },
  tierBadge:  { paddingHorizontal: 16, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1 },
  tierText:   { fontSize: FontSize.sm, fontWeight: '700' },

  // Upgrade banner
  upgradeBanner: {
    backgroundColor: Colors.secondary,
    borderRadius: Radius.xl, padding: Spacing.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    shadowColor: Colors.secondary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  upgradeBannerTitle: { color: '#000', fontSize: FontSize.base, fontWeight: '800' },
  upgradeBannerDesc:  { color: '#00000090', fontSize: FontSize.xs, marginTop: 2 },
  upgradeBannerArrow: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#00000020', alignItems: 'center', justifyContent: 'center',
  },
  upgradeBannerArrowText: { color: '#000', fontSize: 20, fontWeight: '700' },

  sectionTitle: { color: Colors.textPrimary, fontSize: FontSize.base, fontWeight: '700', marginBottom: Spacing.sm },

  // Target
  loadingWrap: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyTargets: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.xl, alignItems: 'center', gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  emptyTargetsText: { color: Colors.textMuted, fontSize: FontSize.sm },
  addTargetBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: 12,
    borderRadius: Radius.lg,
  },
  addTargetBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  editTargetBtn: { alignItems: 'center', paddingVertical: 12, marginBottom: Spacing.lg },
  editTargetBtnText: { color: Colors.primaryLight, fontSize: FontSize.sm, fontWeight: '600' },

  targetCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.sm, gap: Spacing.sm,
  },
  targetHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  targetKampus: { color: Colors.textPrimary, fontSize: FontSize.base, fontWeight: '800' },
  targetJurusan: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  targetBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, borderWidth: 1 },
  targetBadgeText: { fontSize: FontSize.xs, fontWeight: '700' },
  targetProgress: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  targetTrack: { flex: 1, height: 8, backgroundColor: Colors.surfaceElevated, borderRadius: 4, overflow: 'hidden' },
  targetFill: { height: '100%', borderRadius: 4 },
  targetPct: { width: 40, fontSize: FontSize.xs, fontWeight: '800', textAlign: 'right' },
  targetNilai: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  targetNilaiLabel: { color: Colors.textMuted, fontSize: FontSize.xs },
  targetNilaiValue: { fontSize: FontSize.lg, fontWeight: '900' },
  targetNilaiSep: { color: Colors.textMuted, fontSize: FontSize.base },
  targetNilaiTarget: { color: Colors.textSecondary, fontSize: FontSize.md, fontWeight: '700' },

  // Menu
  menuCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden', marginBottom: Spacing.md,
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 14, gap: Spacing.md,
  },
  menuIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  menuEmoji: { fontSize: 20 },
  menuInfo: { flex: 1 },
  menuLabel: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '600' },
  menuDesc: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  menuBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  menuBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },
  menuArrow: { color: Colors.textMuted, fontSize: 20 },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 56 },

  logoutBtn: {
    backgroundColor: Colors.error + '18',
    borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.error + '40',
    padding: 16, alignItems: 'center', marginTop: Spacing.md, marginBottom: Spacing.md,
  },
  logoutText: { color: Colors.error, fontSize: FontSize.base, fontWeight: '700' },
  footerText: { color: Colors.textMuted, fontSize: 10, textAlign: 'center', marginBottom: Spacing.md },
});

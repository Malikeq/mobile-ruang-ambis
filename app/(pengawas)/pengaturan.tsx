import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Platform, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { pengawasApi, PengawasOverview } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const PW_GREEN   = '#059669';
const PW_GREEN_L = '#10B981';

export default function PengaturanScreen() {
  const { user, logout } = useAuth();
  const [overview, setOverview] = useState<PengawasOverview | null>(null);
  const [loading,  setLoading]  = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pengawasApi.overview();
      setOverview(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleLogout = () => {
    Alert.alert(
      'Keluar',
      'Kamu yakin ingin keluar dari akun Pengawas?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/onboarding');
          },
        },
      ],
    );
  };

  const sekolah = overview?.sekolah;
  const initials = user?.name?.charAt(0)?.toUpperCase() ?? 'P';

  return (
    <View style={st.root}>
      {/* Header */}
      <View style={st.header}>
        <Text style={st.title}>Profil Pengawas</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 160 }} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={st.profileCard}>
          <View style={st.avatar}>
            <Text style={st.avatarText}>{initials}</Text>
          </View>
          <Text style={st.profileName}>{user?.name ?? '—'}</Text>
          <Text style={st.profileEmail}>{user?.email ?? '—'}</Text>
          <View style={st.rolePill}>
            <Ionicons name="shield-checkmark" size={12} color={PW_GREEN} />
            <Text style={st.roleText}>Pengawas Sekolah</Text>
          </View>
        </View>

        {/* School info card */}
        {loading ? (
          <View style={st.loadCard}><ActivityIndicator color={PW_GREEN} /></View>
        ) : sekolah ? (
          <View style={st.section}>
            <Text style={st.sectionTitle}>🏫 Informasi Sekolah</Text>
            <InfoRow icon="business" label="Nama Sekolah" value={sekolah.nama} />
            {sekolah.kota && <InfoRow icon="location-outline" label="Kota" value={sekolah.kota} />}
            {sekolah.provinsi && <InfoRow icon="map-outline" label="Provinsi" value={sekolah.provinsi} />}
            {sekolah.npsn && <InfoRow icon="barcode-outline" label="NPSN" value={sekolah.npsn} />}
            <View style={st.divider} />
            <InfoRow icon="people" label="Total Siswa" value={String(overview?.total_siswa ?? 0)} highlight />
            <InfoRow icon="flash" label="Aktif Hari Ini" value={String(overview?.aktif_hari_ini ?? 0)} />
            <InfoRow icon="trophy" label="Rata-rata SNBT" value={String(Math.round(overview?.avg_snbt ?? 0))} />
          </View>
        ) : null}

        {/* Menu items */}
        <View style={st.section}>
          <Text style={st.sectionTitle}>⚙️ Pengaturan</Text>

          <MenuItem
            icon="people"
            label="Daftar Siswa"
            sub={`${overview?.total_siswa ?? 0} siswa terdaftar`}
            onPress={() => router.push('/(pengawas)/siswa')}
          />
          <MenuItem
            icon="bar-chart"
            label="Analisis Kelas"
            sub="Chart aktivitas & kelemahan"
            onPress={() => router.push('/(pengawas)/analisis')}
          />
          <MenuItem
            icon="warning"
            label="Siswa Berisiko"
            sub={`${overview?.tidak_aktif_7d ?? 0} perlu perhatian`}
            onPress={() => router.push('/(pengawas)/at-risk')}
            badgeColor="#EF4444"
            badgeCount={overview?.tidak_aktif_7d}
          />

          <View style={st.divider} />

          <MenuItem
            icon="information-circle-outline"
            label="Tentang Aplikasi"
            sub="AI Lolos PTN v1.0"
          />
          <MenuItem
            icon="help-circle-outline"
            label="Bantuan"
            sub="Hubungi tim support"
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={st.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={18} color="#EF4444" />
          <Text style={st.logoutText}>Keluar dari Akun</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={st.version}>AI Lolos PTN · Mode Pengawas · v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value, highlight }: {
  icon: string; label: string; value: string; highlight?: boolean;
}) {
  return (
    <View style={ir.row}>
      <Ionicons name={icon as any} size={15} color={highlight ? PW_GREEN : Colors.textMuted} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>
        <Text style={ir.label}>{label}</Text>
        <Text style={[ir.value, highlight && { color: PW_GREEN_L }]}>{value}</Text>
      </View>
    </View>
  );
}
const ir = StyleSheet.create({
  row:   { flexDirection: 'row', gap: Spacing.sm, paddingVertical: 6 },
  label: { color: Colors.textMuted, fontSize: FontSize.xs },
  value: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '700', marginTop: 1 },
});

function MenuItem({ icon, label, sub, onPress, badgeColor, badgeCount }: {
  icon: string; label: string; sub: string; onPress?: () => void;
  badgeColor?: string; badgeCount?: number;
}) {
  return (
    <TouchableOpacity style={mi.row} onPress={onPress} activeOpacity={onPress ? 0.75 : 1}>
      <View style={mi.iconWrap}>
        <Ionicons name={icon as any} size={18} color={Colors.textMuted} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={mi.label}>{label}</Text>
        <Text style={mi.sub}>{sub}</Text>
      </View>
      {(badgeCount ?? 0) > 0 && (
        <View style={[mi.badge, { backgroundColor: (badgeColor ?? PW_GREEN) + '20' }]}>
          <Text style={[mi.badgeText, { color: badgeColor ?? PW_GREEN }]}>{badgeCount}</Text>
        </View>
      )}
      {onPress && <Ionicons name="chevron-forward" size={14} color={Colors.border} />}
    </TouchableOpacity>
  );
}
const mi = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 10,
              borderBottomWidth: 1, borderBottomColor: Colors.border + '50' },
  iconWrap: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.surfaceElevated,
              alignItems: 'center', justifyContent: 'center' },
  label:    { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '700' },
  sub:      { color: Colors.textMuted, fontSize: 10, marginTop: 1 },
  badge:    { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText:{ fontSize: 10, fontWeight: '900' },
});

const st = StyleSheet.create({
  root:        { flex: 1, backgroundColor: Colors.background },
  header:      { paddingTop: Platform.OS === 'ios' ? 60 : 48,
                 paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  title:       { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: '900' },

  profileCard: { alignItems: 'center', marginHorizontal: Spacing.lg, marginVertical: Spacing.md,
                 backgroundColor: Colors.surface, borderRadius: Radius.xl,
                 borderWidth: 1, borderColor: Colors.border, padding: Spacing.xl },
  avatar:      { width: 72, height: 72, borderRadius: 36, backgroundColor: PW_GREEN + '20',
                 borderWidth: 2, borderColor: PW_GREEN + '60',
                 alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  avatarText:  { color: PW_GREEN, fontSize: FontSize.xxl, fontWeight: '900' },
  profileName: { color: Colors.textPrimary, fontSize: FontSize.lg, fontWeight: '900' },
  profileEmail:{ color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  rolePill:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: Spacing.sm,
                 backgroundColor: PW_GREEN + '15', borderRadius: Radius.full,
                 paddingHorizontal: 12, paddingVertical: 5,
                 borderWidth: 1, borderColor: PW_GREEN + '30' },
  roleText:    { color: PW_GREEN_L, fontSize: FontSize.xs, fontWeight: '800' },

  section:     { marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
                 backgroundColor: Colors.surface, borderRadius: Radius.xl,
                 borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },
  sectionTitle:{ color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '800', marginBottom: Spacing.sm },
  divider:     { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },

  loadCard:    { height: 120, marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
                 backgroundColor: Colors.surface, borderRadius: Radius.xl,
                 borderWidth: 1, borderColor: Colors.border,
                 alignItems: 'center', justifyContent: 'center' },

  logoutBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
                 marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
                 backgroundColor: '#EF444410', borderRadius: Radius.xl,
                 borderWidth: 1, borderColor: '#EF444430',
                 paddingVertical: 14 },
  logoutText:  { color: '#EF4444', fontSize: FontSize.sm, fontWeight: '700' },

  version:     { color: Colors.textMuted, fontSize: 10, textAlign: 'center', marginTop: Spacing.sm },
});

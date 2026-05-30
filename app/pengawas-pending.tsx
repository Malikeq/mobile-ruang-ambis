import React, { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Platform, ScrollView, Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { pengawasApi, PengawasApprovalStatus } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const PW_GREEN = '#059669';
const PW_RED   = '#EF4444';
const PW_AMBER = '#F59E0B';

export default function PengawasPendingScreen() {
  const { logout, user } = useAuth();
  const [status,  setStatus]  = useState<PengawasApprovalStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const checkStatus = useCallback(async (manual = false) => {
    if (manual) setChecking(true); else setLoading(true);
    try {
      const res = await pengawasApi.getStatus();
      setStatus(res.data);
      // If now approved, redirect to dashboard
      if (res.data?.status === 'approved') {
        router.replace('/(pengawas)');
      }
    } catch { /* silent */ }
    finally { setLoading(false); setChecking(false); }
  }, []);

  useFocusEffect(useCallback(() => { checkStatus(); }, [checkStatus]));

  const handleLogout = async () => {
    await logout();
    router.replace('/onboarding');
  };

  if (loading) {
    return (
      <View style={st.loader}>
        <ActivityIndicator color={PW_GREEN} size="large" />
        <Text style={st.loaderText}>Memeriksa status akun...</Text>
      </View>
    );
  }

  const isPending  = !status || status.status === 'pending';
  const isRejected = status?.status === 'rejected';

  return (
    <View style={st.root}>
      {/* Top glow */}
      <View style={[st.glow, { backgroundColor: isPending ? PW_AMBER + '20' : PW_RED + '20' }]} />

      <ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>

        {/* Icon */}
        <View style={[st.iconWrap, { backgroundColor: isPending ? PW_AMBER + '15' : PW_RED + '15',
                                      borderColor: isPending ? PW_AMBER + '40' : PW_RED + '40' }]}>
          <Ionicons
            name={isPending ? 'time-outline' : 'close-circle-outline'}
            size={56}
            color={isPending ? PW_AMBER : PW_RED}
          />
        </View>

        {/* Title */}
        <Text style={st.title}>
          {isPending ? 'Menunggu Verifikasi' : 'Akun Tidak Disetujui'}
        </Text>
        <Text style={st.subtitle}>
          {isPending
            ? 'Akun pengawas kamu sedang direview oleh tim admin.'
            : 'Akun pengawas kamu tidak dapat disetujui saat ini.'}
        </Text>

        {/* Status card */}
        <View style={[st.statusCard, { borderColor: isPending ? PW_AMBER + '40' : PW_RED + '40',
                                        backgroundColor: isPending ? PW_AMBER + '08' : PW_RED + '08' }]}>
          <View style={st.statusRow}>
            <Ionicons name="person-outline" size={15} color={Colors.textMuted} />
            <Text style={st.statusLabel}>Email</Text>
            <Text style={st.statusValue}>{user?.email ?? '—'}</Text>
          </View>

          {status?.sekolah && (
            <View style={st.statusRow}>
              <Ionicons name="business-outline" size={15} color={Colors.textMuted} />
              <Text style={st.statusLabel}>Sekolah</Text>
              <Text style={st.statusValue} numberOfLines={1}>{status.sekolah.nama}</Text>
            </View>
          )}

          <View style={st.statusRow}>
            <Ionicons name="shield-outline" size={15} color={Colors.textMuted} />
            <Text style={st.statusLabel}>Status</Text>
            <View style={[st.statusBadge, {
              backgroundColor: isPending ? PW_AMBER + '20' : PW_RED + '20',
              borderColor:     isPending ? PW_AMBER + '50' : PW_RED + '50',
            }]}>
              <Text style={[st.statusBadgeText, { color: isPending ? PW_AMBER : PW_RED }]}>
                {isPending ? '⏳ Menunggu Review' : '❌ Ditolak'}
              </Text>
            </View>
          </View>

          {isRejected && status?.catatan && (
            <View style={[st.catatanBox, { borderColor: PW_RED + '30', backgroundColor: PW_RED + '08' }]}>
              <Text style={st.catatanLabel}>Catatan Admin:</Text>
              <Text style={st.catatanText}>{status.catatan}</Text>
            </View>
          )}
        </View>

        {/* Info box */}
        {isPending && (
          <View style={st.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
            <Text style={st.infoText}>
              Proses verifikasi biasanya memakan waktu{' '}
              <Text style={{ color: Colors.textPrimary, fontWeight: '700' }}>1–2 hari kerja</Text>.
              {'\n'}Kamu akan menerima email saat akun disetujui.
            </Text>
          </View>
        )}

        {/* Actions */}
        <View style={st.actions}>

          {/* Check status button */}
          <TouchableOpacity
            style={[st.btnPrimary, { backgroundColor: PW_GREEN }]}
            onPress={() => checkStatus(true)}
            disabled={checking}
            activeOpacity={0.85}
          >
            {checking
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Ionicons name="refresh-outline" size={16} color="#fff" />
                  <Text style={st.btnPrimaryText}>Cek Status Sekarang</Text>
                </>
            }
          </TouchableOpacity>

          {/* Contact admin */}
          <TouchableOpacity
            style={st.btnSecondary}
            onPress={() => Linking.openURL('mailto:admin@ailolos.id?subject=Verifikasi%20Akun%20Pengawas')}
            activeOpacity={0.8}
          >
            <Ionicons name="mail-outline" size={16} color={Colors.textMuted} />
            <Text style={st.btnSecondaryText}>Hubungi Admin</Text>
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity style={st.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Ionicons name="log-out-outline" size={14} color={Colors.textMuted} />
            <Text style={st.logoutText}>Keluar dari Akun</Text>
          </TouchableOpacity>
        </View>

        <Text style={st.version}>AI Lolos PTN · Mode Pengawas</Text>
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  root:          { flex: 1, backgroundColor: Colors.background },
  loader:        { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loaderText:    { color: Colors.textMuted, fontSize: FontSize.sm },
  glow:          { position: 'absolute', top: -60, left: -60, width: 240, height: 240, borderRadius: 120 },

  scroll:        {
    flexGrow: 1, alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 48,
    gap: Spacing.lg,
  },

  iconWrap:      {
    width: 112, height: 112, borderRadius: 28,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
  },

  title:         { color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5 },
  subtitle:      { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 22, marginTop: -Spacing.sm },

  statusCard:    {
    width: '100%', borderRadius: Radius.xl, borderWidth: 1.5,
    padding: Spacing.md, gap: Spacing.sm,
  },
  statusRow:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  statusLabel:   { color: Colors.textMuted, fontSize: FontSize.xs, width: 60 },
  statusValue:   { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '600', flex: 1 },
  statusBadge:   { borderRadius: Radius.full, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 3 },
  statusBadgeText: { fontSize: FontSize.xs, fontWeight: '800' },

  catatanBox:    { borderRadius: Radius.md, borderWidth: 1, padding: Spacing.sm, marginTop: Spacing.sm },
  catatanLabel:  { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '700', marginBottom: 4 },
  catatanText:   { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },

  infoBox:       {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start', width: '100%',
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
  },
  infoText:      { color: Colors.textMuted, fontSize: FontSize.sm, lineHeight: 22, flex: 1 },

  actions:       { width: '100%', gap: Spacing.sm },

  btnPrimary:    {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: Radius.xl, paddingVertical: 15,
    shadowColor: PW_GREEN, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  btnPrimaryText:{ color: '#fff', fontSize: FontSize.md, fontWeight: '800' },

  btnSecondary:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border, paddingVertical: 13,
  },
  btnSecondaryText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '600' },

  logoutBtn:     {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10,
  },
  logoutText:    { color: Colors.textMuted, fontSize: FontSize.xs },

  version:       { color: Colors.textMuted, fontSize: 10, textAlign: 'center' },
});

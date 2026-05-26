import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Animated, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { pengawasApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

const PW_GREEN   = '#059669';
const PW_GREEN_L = '#10B981';

export default function PengawasPendingScreen() {
  const { logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const [status, setStatus]     = useState<'pending' | 'rejected' | 'not_registered'>('pending');
  const [catatan, setCatatan]   = useState<string>('');
  const [sekolahNama, setSekolahNama] = useState('');

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();

    // Pulse the icon
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 1200, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const checkStatus = async () => {
    setChecking(true);
    try {
      const res = await pengawasApi.getStatus();
      const s   = res.data;
      if (s.status === 'approved') {
        router.replace('/(pengawas)');
        return;
      }
      setStatus(s.status as any);
      setCatatan(s.catatan ?? '');
      setSekolahNama(s.sekolah?.nama ?? '');
    } catch {
      // ignore
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/onboarding');
  };

  const isRejected = status === 'rejected';

  return (
    <Animated.View style={[st.container, { opacity: fadeAnim }]}>
      {/* Background glow */}
      <View style={[st.glow, { backgroundColor: (isRejected ? '#EF4444' : PW_GREEN) + '12' }]} />

      {/* Icon */}
      <Animated.View style={[st.iconWrap, {
        backgroundColor: (isRejected ? '#EF4444' : PW_GREEN) + '20',
        borderColor: (isRejected ? '#EF4444' : PW_GREEN) + '60',
        transform: [{ scale: pulseAnim }],
        shadowColor: isRejected ? '#EF4444' : PW_GREEN,
      }]}>
        <Ionicons
          name={isRejected ? 'close-circle-outline' : 'hourglass-outline'}
          size={48}
          color={isRejected ? '#EF4444' : PW_GREEN}
        />
      </Animated.View>

      {/* Title */}
      <Text style={st.title}>
        {isRejected ? 'Akun Ditolak' : 'Menunggu Verifikasi'}
      </Text>
      <Text style={st.subtitle}>
        {isRejected
          ? 'Permintaan aksesmu sebagai Pengawas ditolak oleh admin.'
          : `Kami sedang memverifikasi bahwa kamu adalah pengawas${sekolahNama ? ` dari\n${sekolahNama}` : ''}.\nBiasanya memakan waktu 1-2 hari kerja.`}
      </Text>

      {/* Catatan rejection */}
      {isRejected && catatan ? (
        <View style={st.catatanBox}>
          <Ionicons name="information-circle-outline" size={16} color="#EF4444" />
          <Text style={[st.catatanText, { color: '#EF4444' }]}>{catatan}</Text>
        </View>
      ) : null}

      {/* Steps (only when pending) */}
      {!isRejected && (
        <View style={st.steps}>
          {[
            { done: true,  label: 'Akun berhasil dibuat' },
            { done: false, label: 'Verifikasi oleh admin (proses)' },
            { done: false, label: 'Akses dashboard diaktifkan' },
          ].map((s, i) => (
            <View key={i} style={st.stepRow}>
              <View style={[st.stepDot, { backgroundColor: s.done ? PW_GREEN : Colors.border }]}>
                {s.done
                  ? <Ionicons name="checkmark" size={12} color="#fff" />
                  : <Text style={[st.stepNum, { color: Colors.textMuted }]}>{i + 1}</Text>
                }
              </View>
              {i < 2 && <View style={[st.stepLine, s.done && { backgroundColor: PW_GREEN }]} />}
              <Text style={[st.stepLabel, s.done && { color: PW_GREEN_L }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Info badge */}
      {!isRejected && (
        <View style={st.infoBadge}>
          <Ionicons name="mail-outline" size={14} color={PW_GREEN} />
          <Text style={st.infoText}>
            Kamu akan mendapat email saat akun disetujui
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={st.actions}>
        {!isRejected && (
          <TouchableOpacity
            style={[st.ctaBtn, checking && { opacity: 0.6 }]}
            onPress={checkStatus}
            disabled={checking}
            activeOpacity={0.85}
          >
            {checking
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Ionicons name="refresh" size={16} color="#fff" />
                  <Text style={st.ctaBtnText}>Cek Status Sekarang</Text>
                </>
            }
          </TouchableOpacity>
        )}

        {isRejected && (
          <TouchableOpacity
            style={[st.ctaBtn, { backgroundColor: Colors.primary }]}
            onPress={() => router.replace('/pengawas-register')}
            activeOpacity={0.85}
          >
            <Ionicons name="create-outline" size={16} color="#fff" />
            <Text style={st.ctaBtnText}>Daftar Ulang</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={st.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={16} color={Colors.textMuted} />
          <Text style={st.logoutText}>Keluar dari Akun</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const st = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
  },
  glow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    top: '20%',
  },
  iconWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 28,
    elevation: 16,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  catatanBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EF444415',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#EF444430',
    padding: Spacing.md,
    width: '100%',
    marginBottom: Spacing.xl,
  },
  catatanText: {
    flex: 1,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  steps: {
    width: '100%',
    gap: 0,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: 12,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  stepLine: {
    position: 'absolute',
    left: 11,
    top: 26,
    width: 2,
    height: 14,
    backgroundColor: Colors.border,
  },
  stepNum: {
    fontSize: 10,
    fontWeight: '800',
  },
  stepLabel: {
    flex: 1,
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    lineHeight: 22,
    marginTop: 2,
  },
  infoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#059669' + '15',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#059669' + '30',
    marginBottom: Spacing.xl,
  },
  infoText: {
    color: '#10B981',
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  actions: {
    width: '100%',
    gap: Spacing.sm,
  },
  ctaBtn: {
    backgroundColor: '#059669',
    borderRadius: Radius.xl,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaBtnText: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: '800',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 12,
  },
  logoutText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
});

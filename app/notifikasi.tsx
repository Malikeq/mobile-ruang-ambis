import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import {
  applyNotificationPreferences,
  fetchNotificationPrefs,
  getPushPermissionStatus,
  isNotificationsAvailable,
  requestPushPermissionAsync,
  requestServerTestPush,
  sendLocalTestNotification,
  updateNotificationPrefs,
  type NotificationPrefs,
} from '@/lib/push-notifications';

const easBuild = isNotificationsAvailable();

export default function NotifikasiScreen() {
  const insets = useSafeAreaInsets();

  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<'local' | 'server' | null>(null);
  const [permGranted, setPermGranted] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const status = await getPushPermissionStatus();
    setPermGranted(status === 'granted');
    const serverPrefs = await fetchNotificationPrefs();
    setPrefs(serverPrefs ?? { push_streak_reminder: false, push_weekly_report: false });
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const ensurePermission = async (): Promise<boolean> => {
    if (permGranted) return true;
    const result = await requestPushPermissionAsync();
    if (result === 'granted') {
      setPermGranted(true);
      return true;
    }
    if (result === 'denied') {
      Alert.alert(
        'Izin Notifikasi Ditolak',
        'Aktifkan notifikasi di Pengaturan perangkat agar bisa menerima pengingat belajar.',
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Buka Pengaturan', onPress: () => Linking.openSettings() },
        ],
      );
    }
    return false;
  };

  const toggle = async (key: 'push_streak_reminder' | 'push_weekly_report', value: boolean) => {
    setSaving(key);
    try {
      if (value) {
        const ok = await ensurePermission();
        if (!ok) return;
      }

      const updated = await updateNotificationPrefs({ [key]: value });
      const nextPrefs: NotificationPrefs = {
        push_streak_reminder: key === 'push_streak_reminder' ? value : (prefs?.push_streak_reminder ?? false),
        push_weekly_report: key === 'push_weekly_report' ? value : (prefs?.push_weekly_report ?? false),
        ...(updated ?? {}),
      };
      setPrefs(nextPrefs);

      // Schedule/cancel local notifications (works in Expo Go + EAS builds)
      await applyNotificationPreferences(nextPrefs);

      if (value) {
        Alert.alert(
          '✅ Notifikasi Diaktifkan',
          key === 'push_streak_reminder'
            ? 'Pengingat streak: 08.00 & 20.00 WIB (lokal + push server).'
            : 'Laporan mingguan: setiap Minggu 09.00 WIB.',
          [{ text: 'OK' }],
        );
      }
    } finally {
      setSaving(null);
    }
  };

  const runLocalTest = async () => {
    setTesting('local');
    try {
      const ok = await ensurePermission();
      if (!ok) return;
      const scheduled = await sendLocalTestNotification();
      Alert.alert(
        scheduled ? '✅ Test Lokal Dijadwalkan' : '❌ Gagal',
        scheduled
          ? 'Notifikasi muncul ~5 detik lagi. Minimize app agar terlihat di status bar.'
          : 'Gagal menjadwalkan notifikasi lokal.',
        [{ text: 'OK' }],
      );
    } finally {
      setTesting(null);
    }
  };

  const runServerTest = async () => {
    setTesting('server');
    try {
      const ok = await ensurePermission();
      if (!ok) return;
      await applyNotificationPreferences(prefs);
      const result = await requestServerTestPush();
      Alert.alert(result.ok ? '✅ Push Server' : '❌ Push Server', result.message, [{ text: 'OK' }]);
      if (result.ok) await load();
    } finally {
      setTesting(null);
    }
  };

  return (
    <View style={st.container}>
      <View style={[st.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={st.headerTitle}>🔔 Notifikasi</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <View style={st.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <View style={st.content}>
          {!easBuild && (
            <View style={st.expoGoBanner}>
              <Ionicons name="information-circle-outline" size={22} color="#f59e0b" />
              <View style={{ flex: 1 }}>
                <Text style={st.expoGoTitle}>Mode Expo Go</Text>
                <Text style={st.expoGoDesc}>
                  Notifikasi lokal (pengingat streak) ✅ berfungsi.{`\n`}
                  Remote push server ❌ perlu EAS build.
                </Text>
              </View>
            </View>
          )}

          {easBuild && (
            <View style={st.statusCard}>
              <View style={st.statusRow}>
                <Ionicons
                  name={permGranted ? 'checkmark-circle' : 'alert-circle'}
                  size={18}
                  color={permGranted ? Colors.success : Colors.secondary}
                />
                <Text style={st.statusText}>
                  Izin: {permGranted ? 'Diizinkan' : 'Belum diizinkan'}
                </Text>
              </View>
              <View style={st.statusRow}>
                <Ionicons
                  name={prefs?.has_token ? 'cloud-done' : 'cloud-offline'}
                  size={18}
                  color={prefs?.has_token ? Colors.success : Colors.textMuted}
                />
                <Text style={st.statusText}>
                  Push token: {prefs?.has_token ? 'Terdaftar di server' : 'Belum terdaftar'}
                </Text>
              </View>
            </View>
          )}

          {easBuild && permGranted === false && (
            <TouchableOpacity style={st.permBanner} onPress={ensurePermission} activeOpacity={0.85}>
              <Ionicons name="notifications-off-outline" size={22} color={Colors.secondary} />
              <View style={{ flex: 1 }}>
                <Text style={st.permTitle}>Aktifkan izin notifikasi</Text>
                <Text style={st.permDesc}>Wajib untuk push token &amp; pengingat harian</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}

          <Text style={st.sectionLabel}>Pengingat</Text>
          <View style={st.card}>
            <View style={st.row}>
              <View style={st.rowIcon}><Text style={{ fontSize: 20 }}>🔥</Text></View>
              <View style={st.rowText}>
                <Text style={st.rowTitle}>Pengingat Streak</Text>
                <Text style={st.rowDesc}>08.00 &amp; 20.00 WIB — lokal + push server (jika belum latihan)</Text>
              </View>
              <Switch
                value={prefs?.push_streak_reminder ?? false}
                onValueChange={v => toggle('push_streak_reminder', v)}
                disabled={saving !== null}
                trackColor={{ false: Colors.border, true: Colors.primary + '80' }}
                thumbColor={prefs?.push_streak_reminder ? Colors.primary : Colors.textMuted}
              />
            </View>
            <View style={st.divider} />
            <View style={st.row}>
              <View style={st.rowIcon}><Text style={{ fontSize: 20 }}>📊</Text></View>
              <View style={st.rowText}>
                <Text style={st.rowTitle}>Laporan Mingguan</Text>
                <Text style={st.rowDesc}>Setiap Minggu 09.00 WIB</Text>
              </View>
              <Switch
                value={prefs?.push_weekly_report ?? false}
                onValueChange={v => toggle('push_weekly_report', v)}
                disabled={saving !== null}
                trackColor={{ false: Colors.border, true: Colors.primary + '80' }}
                thumbColor={prefs?.push_weekly_report ? Colors.primary : Colors.textMuted}
              />
            </View>
          </View>

          <View style={st.infoCard}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.textMuted} />
            <Text style={st.infoText}>
              Fase A: notifikasi lokal dijadwalkan di HP. Push server dikirim Laravel (08:00 &amp; 20:00 WIB).
              Push server butuh FCM credentials di EAS (`eas credentials`).
              {Platform.OS === 'android' ? ' Nonaktifkan pembatasan baterai untuk app ini.' : ''}
            </Text>
          </View>

          {/* Test buttons — local works in Expo Go too */}
          <View style={st.testSection}>
            <Text style={st.sectionLabel}>Tes Notifikasi</Text>
            <TouchableOpacity
                style={st.testBtn}
                onPress={runLocalTest}
                disabled={testing !== null}
                activeOpacity={0.8}
              >
                {testing === 'local'
                  ? <ActivityIndicator size="small" color={Colors.primary} />
                  : <Ionicons name="time-outline" size={18} color={Colors.primary} />}
              <Text style={st.testBtnText}>Test lokal (5 detik)</Text>
            </TouchableOpacity>

            {/* Server push — EAS build only (needs registered Expo push token) */}
            {easBuild && (
              <TouchableOpacity
                style={[st.testBtn, st.testBtnServer]}
                onPress={runServerTest}
                disabled={testing !== null}
                activeOpacity={0.8}
              >
                {testing === 'server'
                  ? <ActivityIndicator size="small" color={Colors.aiAccent} />
                  : <Ionicons name="cloud-upload-outline" size={18} color={Colors.aiAccent} />}
                <Text style={[st.testBtnText, { color: Colors.aiAccent }]}>Test push dari server</Text>
              </TouchableOpacity>
            )}
          </View>

        </View>
      )}
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: '800' },
  content: { padding: Spacing.lg, gap: Spacing.md },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  statusCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  statusText: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '600' },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.md },
  rowIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 3 },
  rowTitle: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '700' },
  rowDesc: { color: Colors.textMuted, fontSize: FontSize.xs, lineHeight: 17 },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.lg },
  expoGoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    backgroundColor: '#f59e0b14', borderWidth: 1, borderColor: '#f59e0b40',
    borderRadius: Radius.lg, padding: Spacing.md,
  },
  expoGoTitle: { color: '#f59e0b', fontSize: FontSize.sm, fontWeight: '800', marginBottom: 4 },
  expoGoDesc: { color: Colors.textMuted, fontSize: FontSize.xs, lineHeight: 17 },
  permBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.secondary + '14', borderWidth: 1, borderColor: Colors.secondary + '40',
    borderRadius: Radius.lg, padding: Spacing.md,
  },
  permTitle: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '800' },
  permDesc: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
  infoCard: {
    flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md,
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.lg,
  },
  infoText: { flex: 1, color: Colors.textMuted, fontSize: FontSize.xs, lineHeight: 18 },
  testSection: { gap: Spacing.sm },
  testBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    padding: Spacing.md, backgroundColor: Colors.primary + '14',
    borderWidth: 1, borderColor: Colors.primary + '40', borderRadius: Radius.lg,
  },
  testBtnServer: {
    backgroundColor: Colors.aiAccent + '14',
    borderColor: Colors.aiAccent + '40',
  },
  testBtnText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '700' },
});

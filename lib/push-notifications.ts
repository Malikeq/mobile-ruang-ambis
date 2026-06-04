/**
 * Push & local notifications — Phase A (EAS development build).
 *
 * - EAS dev/production: local scheduled + remote push token → Laravel cron
 * - Expo Go: prefs saved to server only (no expo-notifications import — SDK 53+)
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { API_BASE, getToken } from '@/lib/api';

export interface NotificationPrefs {
  push_streak_reminder: boolean;
  push_weekly_report: boolean;
  has_token?: boolean;
}

const ID_STREAK_PAGI  = 'streak-pagi';
const ID_STREAK_MALAM = 'streak-malam';
const ID_WEEKLY       = 'weekly-report';
const CHANNEL_ID      = 'pengingat';

// ─── Environment ───────────────────────────────────────────────────────────────

/** Remote push + local notifs need a dev/production build (not Expo Go). */
export function isNotificationsAvailable(): boolean {
  return Constants.appOwnership !== 'expo';
}

/** @deprecated use isNotificationsAvailable */
export function isRemotePushSupported(): boolean {
  return isNotificationsAvailable();
}

type NotifMod = typeof import('expo-notifications');
let _mod: NotifMod | null = null;
let _handlerSet = false;

async function getMod(): Promise<NotifMod | null> {
  try {
    if (!_mod) {
      // Suppress Expo Go's one-time "remote push removed" console.error.
      // Local scheduled notifications still work — only remote push token is removed.
      const orig = console.error;
      console.error = (...args: unknown[]) => {
        const msg = String(args[0] ?? '');
        if (
          msg.includes('expo-notifications') ||
          msg.includes('DevicePushToken') ||
          msg.includes('remote notifications') ||
          msg.includes('development build')
        ) return;
        orig.apply(console, args);
      };
      _mod = await import('expo-notifications');
      setTimeout(() => { console.error = orig; }, 1000);
    }
    if (!_handlerSet) {
      _mod.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      _handlerSet = true;
    }
    return _mod;
  } catch {
    return null;
  }
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  const N = await getMod();
  if (!N) return;
  await N.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Pengingat Belajar',
    importance: N.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#6366F1',
    sound: 'default',
  });
}

// ─── Permissions ─────────────────────────────────────────────────────────────

export async function getPushPermissionStatus(): Promise<
  'granted' | 'denied' | 'undetermined' | 'unsupported'
> {
  const N = await getMod();
  if (!N) return 'unsupported';
  const { status } = await N.getPermissionsAsync();
  return status as 'granted' | 'denied' | 'undetermined';
}

export async function requestPushPermissionAsync(): Promise<
  'granted' | 'denied' | 'unsupported'
> {
  const N = await getMod();
  if (!N) return 'unsupported';
  const { status } = await N.requestPermissionsAsync();
  return status === 'granted' ? 'granted' : 'denied';
}

// ─── Local scheduled (device) ────────────────────────────────────────────────

export async function scheduleStreakReminders(): Promise<boolean> {
  const N = await getMod();
  if (!N) return false;
  await ensureAndroidChannel();

  try {
    await N.cancelScheduledNotificationAsync(ID_STREAK_PAGI).catch(() => {});
    await N.cancelScheduledNotificationAsync(ID_STREAK_MALAM).catch(() => {});

    const daily = (N as any).SchedulableTriggerInputTypes?.DAILY ?? 'daily';
    const channelId = Platform.OS === 'android' ? CHANNEL_ID : undefined;

    await N.scheduleNotificationAsync({
      identifier: ID_STREAK_PAGI,
      content: {
        title: '🌅 Mulai hari dengan belajar!',
        body: 'Selesaikan satu sesi latihan pagi ini dan jaga streak kamu.',
        data: { screen: 'latihan' },
        sound: 'default',
      },
      trigger: { type: daily, hour: 8, minute: 0, channelId } as any,
    });

    await N.scheduleNotificationAsync({
      identifier: ID_STREAK_MALAM,
      content: {
        title: '🔥 Jangan putus streak kamu!',
        body: 'Malam ini waktu yang pas untuk latihan soal. Yuk, mulai sekarang!',
        data: { screen: 'latihan' },
        sound: 'default',
      },
      trigger: { type: daily, hour: 20, minute: 0, channelId } as any,
    });

    return true;
  } catch (e) {
    console.warn('[notif] scheduleStreakReminders:', e);
    return false;
  }
}

export async function cancelStreakReminders(): Promise<void> {
  const N = await getMod();
  if (!N) return;
  await N.cancelScheduledNotificationAsync(ID_STREAK_PAGI).catch(() => {});
  await N.cancelScheduledNotificationAsync(ID_STREAK_MALAM).catch(() => {});
}

export async function scheduleWeeklyReport(): Promise<boolean> {
  const N = await getMod();
  if (!N) return false;
  await ensureAndroidChannel();

  try {
    await N.cancelScheduledNotificationAsync(ID_WEEKLY).catch(() => {});
    const weekly = (N as any).SchedulableTriggerInputTypes?.WEEKLY ?? 'weekly';
    await N.scheduleNotificationAsync({
      identifier: ID_WEEKLY,
      content: {
        title: '📊 Laporan Mingguan Belajarmu',
        body: 'Lihat progres, akurasi, dan streak belajar kamu minggu ini!',
        data: { screen: 'home' },
        sound: 'default',
      },
      trigger: {
        type: weekly,
        weekday: 1,
        hour: 9,
        minute: 0,
        channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
      } as any,
    });
    return true;
  } catch (e) {
    console.warn('[notif] scheduleWeeklyReport:', e);
    return false;
  }
}

export async function cancelWeeklyReport(): Promise<void> {
  const N = await getMod();
  if (!N) return;
  await N.cancelScheduledNotificationAsync(ID_WEEKLY).catch(() => {});
}

/** Fire a local notification in ~5 seconds (works on EAS build). */
export async function sendLocalTestNotification(): Promise<boolean> {
  const N = await getMod();
  if (!N) return false;
  await ensureAndroidChannel();

  try {
    const interval = (N as any).SchedulableTriggerInputTypes?.TIME_INTERVAL ?? 'timeInterval';
    await N.scheduleNotificationAsync({
      content: {
        title: '🔔 Test Notifikasi AI Lolos',
        body: 'Notifikasi lokal berhasil! Pengingat streak: 08.00 & 20.00 WIB.',
        data: { screen: 'latihan' },
        sound: 'default',
      },
      trigger: { type: interval, seconds: 5 } as any,
    });
    return true;
  } catch {
    return false;
  }
}

// ─── Remote push token (EAS) ─────────────────────────────────────────────────

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!isNotificationsAvailable()) return null;

  try {
    const Device = await import('expo-device');
    if (!Device.isDevice) return null;

    const N = await getMod();
    if (!N) return null;

    const { status: existing } = await N.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await N.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    await ensureAndroidChannel();

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;

    if (!projectId) {
      console.warn('[notif] EAS projectId missing — cannot get Expo push token');
      return null;
    }

    const tokenData = await N.getExpoPushTokenAsync({ projectId });
    return tokenData.data;
  } catch (e) {
    console.warn('[notif] registerForPushNotificationsAsync:', e);
    return null;
  }
}

// ─── Backend API ─────────────────────────────────────────────────────────────

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function syncPushTokenWithBackend(expoToken: string): Promise<boolean> {
  const headers = await authHeaders();
  if (!headers.Authorization) return false;
  try {
    const res = await fetch(`${API_BASE}/notifications/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ token: expoToken, platform: Platform.OS }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchNotificationPrefs(): Promise<NotificationPrefs | null> {
  const headers = await authHeaders();
  if (!headers.Authorization) return null;
  try {
    const res = await fetch(`${API_BASE}/notifications/preferences`, { headers });
    const json = await res.json();
    return res.ok ? (json.data ?? null) : null;
  } catch {
    return null;
  }
}

export async function updateNotificationPrefs(
  patch: Partial<Pick<NotificationPrefs, 'push_streak_reminder' | 'push_weekly_report'>>,
): Promise<NotificationPrefs | null> {
  const headers = await authHeaders();
  if (!headers.Authorization) return null;
  try {
    const res = await fetch(`${API_BASE}/notifications/preferences`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(patch),
    });
    const json = await res.json();
    return res.ok ? (json.data ?? null) : null;
  } catch {
    return null;
  }
}

/** Ask Laravel to send a test push to this user's registered token(s). */
export async function requestServerTestPush(): Promise<{ ok: boolean; message: string }> {
  const headers = await authHeaders();
  if (!headers.Authorization) {
    return { ok: false, message: 'Belum login.' };
  }
  try {
    const res = await fetch(`${API_BASE}/notifications/test-push`, {
      method: 'POST',
      headers,
    });
    const json = await res.json();
    return {
      ok: res.ok,
      message: json?.message ?? (res.ok ? 'Push terkirim.' : 'Gagal mengirim push.'),
    };
  } catch {
    return { ok: false, message: 'Koneksi ke server gagal.' };
  }
}

// ─── Apply prefs → device + server token ─────────────────────────────────────

/** Sync local schedules + remote token according to server preferences. */
export async function applyNotificationPreferences(
  prefs?: NotificationPrefs | null,
): Promise<{ tokenRegistered: boolean; localScheduled: boolean }> {
  try {
    const p = prefs ?? (await fetchNotificationPrefs());
    if (!p) return { tokenRegistered: false, localScheduled: false };

    // Remote push token — only on EAS builds
    let tokenRegistered = false;
    if (isNotificationsAvailable()) {
      const perm = await getPushPermissionStatus();
      if (perm === 'granted' || perm === 'undetermined') {
        const token = await registerForPushNotificationsAsync();
        if (token) tokenRegistered = await syncPushTokenWithBackend(token);
      }
    }

    // Local scheduled notifications — works in Expo Go too
    if (p.push_streak_reminder) await scheduleStreakReminders();
    else await cancelStreakReminders();

    if (p.push_weekly_report) await scheduleWeeklyReport();
    else await cancelWeeklyReport();

    return { tokenRegistered, localScheduled: p.push_streak_reminder || p.push_weekly_report };
  } catch (e) {
    console.warn('[notif] applyNotificationPreferences:', e);
    return { tokenRegistered: false, localScheduled: false };
  }
}

/** Called after login — register token & restore schedules from server prefs. */
export async function bootstrapNotifications(): Promise<void> {
  try {
    const prefs = await fetchNotificationPrefs();
    if (!prefs) return;
    const hasAnyEnabled = prefs.push_streak_reminder || prefs.push_weekly_report;
    if (!hasAnyEnabled && !prefs.has_token) return;
    await applyNotificationPreferences(prefs);
  } catch (e) {
    console.warn('[notif] bootstrapNotifications:', e);
  }
}

// ─── Navigation on tap ─────────────────────────────────────────────────────────

export function resolveNotificationRoute(
  data: Record<string, unknown> | undefined,
): string | null {
  if (!data?.screen) return null;
  const s = String(data.screen);
  if (s === 'latihan') return '/(tabs)/latihan';
  if (s === 'streak') return '/streak';
  if (s === 'explore') return '/(tabs)/explore';
  if (s === 'home') return '/(tabs)';
  return null;
}

export async function subscribeToNotificationResponses(
  onResponse: (data: Record<string, unknown> | undefined) => void,
): Promise<() => void> {
  const N = await getMod();
  if (!N) return () => {};

  const received = N.addNotificationReceivedListener(() => {});
  const sub = N.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as Record<string, unknown> | undefined;
    onResponse(data);
  });

  return () => {
    received.remove();
    sub.remove();
  };
}

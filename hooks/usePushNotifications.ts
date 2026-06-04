import { useEffect } from 'react';
import { InteractionManager } from 'react-native';
import { router } from 'expo-router';
import {
  bootstrapNotifications,
  isNotificationsAvailable,
  resolveNotificationRoute,
  subscribeToNotificationResponses,
} from '@/lib/push-notifications';

/**
 * Phase A: on login → restore prefs, register push token, listen for taps.
 * Deferred until after UI is ready to avoid startup crashes.
 */
export function usePushNotifications(isLoggedIn: boolean) {
  useEffect(() => {
    if (!isLoggedIn || !isNotificationsAvailable()) return;

    let unsub: (() => void) | undefined;
    let cancelled = false;

    const task = InteractionManager.runAfterInteractions(() => {
      (async () => {
        try {
          unsub = await subscribeToNotificationResponses((data) => {
            const route = resolveNotificationRoute(data);
            if (route) router.push(route as any);
          });
          if (!cancelled) await bootstrapNotifications();
        } catch (e) {
          console.warn('[usePushNotifications]', e);
        }
      })();
    });

    return () => {
      cancelled = true;
      task.cancel();
      unsub?.();
    };
  }, [isLoggedIn]);
}

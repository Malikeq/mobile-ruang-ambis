import { Stack, router, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Colors } from '@/constants/theme';
import { pengawasApi } from '@/lib/api';

function RootNavigator() {
  const { isLoading, isLoggedIn, user } = useAuth();
  const rootNavigation = useRootNavigationState();
  const navigationReady = !!rootNavigation?.key;

  usePushNotifications(isLoggedIn && user?.role === 'user');

  useEffect(() => {
    if (isLoading || !navigationReady) return;

    if (!isLoggedIn) {
      router.replace('/onboarding');
      return;
    }

    if (user?.role === 'pengamat') {
      (async () => {
        try {
          const statusRes = await pengawasApi.getStatus();
          const status = statusRes.data?.status;
          if (status === 'approved') {
            router.replace('/(pengawas)');
          } else {
            router.replace('/pengawas-pending');
          }
        } catch {
          router.replace('/pengawas-pending');
        }
      })();
    } else {
      router.replace('/(tabs)');
    }
  }, [isLoading, navigationReady, isLoggedIn, user?.role]);

  if (isLoading || !navigationReady) {
    return (
      <View style={styles.splash}>
        <View style={styles.splashLogo}>
          <View style={styles.splashDot} />
        </View>
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(pengawas)" />
      <Stack.Screen name="pengawas-pending" />
      <Stack.Screen name="pengawas-register" />
      <Stack.Screen name="streak"              options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      <Stack.Screen name="leaderboard"         options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="ai-chat"             options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="foto-soal"           options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="riwayat-latihan"     options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="notifikasi"          options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="latihan/[sesiId]"    options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="latihan/review"      options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}

export default function RootLayout() {
  // Pre-load all vector-icon fonts so they are bundled at startup
  // instead of being fetched lazily (which fails on physical devices)
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.splash}>
        <View style={styles.splashLogo}>
          <View style={styles.splashDot} />
        </View>
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <OnboardingProvider>
        <View style={{ flex: 1, backgroundColor: Colors.background }}>
          <StatusBar style="light" backgroundColor={Colors.background} />
          <ErrorBoundary>
            <RootNavigator />
          </ErrorBoundary>
        </View>
      </OnboardingProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 16,
  },
  splashDot: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.primaryDark,
  },
});

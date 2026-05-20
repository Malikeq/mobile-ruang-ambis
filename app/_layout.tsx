import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { Colors } from '@/constants/theme';

function RootNavigator() {
  const { isLoading, isLoggedIn, user } = useAuth();

  // Only run once — when the initial session restore finishes.
  // Login/register screens are responsible for their own post-auth navigation.
  useEffect(() => {
    if (isLoading) return;

    if (!isLoggedIn) {
      // Not authenticated → welcome slides
      router.replace('/onboarding');
    } else {
      // Already logged in (restored from storage) → dashboard
      router.replace('/(tabs)');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]); // ← intentionally NOT watching isLoggedIn/user

  if (isLoading) {
    // Splash / session restore
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
      <Stack.Screen name="streak" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      <Stack.Screen name="latihan/[sesiId]" options={{ animation: 'slide_from_right' }} />
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
          <RootNavigator />
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

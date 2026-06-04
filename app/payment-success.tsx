import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';

export default function PaymentSuccessScreen() {
  const { pkg } = useLocalSearchParams<{ pkg?: string }>();

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Glow */}
      <View style={styles.glow} />

      {/* Checkmark */}
      <Animated.View style={[styles.checkCircle, { transform: [{ scale: scaleAnim }] }]}>
        <Text style={styles.checkIcon}>✓</Text>
      </Animated.View>

      <Text style={styles.title}>Pembayaran Berhasil!</Text>
      {pkg && <Text style={styles.pkgName}>{pkg}</Text>}
      <Text style={styles.sub}>
        Akun kamu sudah diupgrade. Selamat belajar — semangat lolos PTN! 🚀
      </Text>

      <View style={styles.benefitList}>
        {[
          '🤖 AI Tutor siap membantumu',
          '📝 Soal latihan tidak terbatas',
          '📊 Analisis kelemahan aktif',
          '🎯 Tryout penuh SNBT tersedia',
        ].map((b, i) => (
          <View key={i} style={styles.benefitRow}>
            <Text style={styles.benefitText}>{b}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={styles.btn}
        onPress={() => router.replace('/(tabs)')}
        activeOpacity={0.85}
      >
        <Text style={styles.btnText}>🎯 Mulai Belajar Sekarang</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.btnSecondary}
        onPress={() => router.replace('/profile')}
      >
        <Text style={styles.btnSecondaryText}>Lihat Detail Langganan</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: Colors.background,
    paddingHorizontal: Spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    alignItems: 'center',
  },
  glow: {
    position: 'absolute', top: 80, left: '50%',
    marginLeft: -100, width: 200, height: 200, borderRadius: 100,
    backgroundColor: Colors.success + '15',
  },

  checkCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.success + '18',
    borderWidth: 2, borderColor: Colors.success + '50',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl,
    shadowColor: Colors.success, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
  },
  checkIcon: { fontSize: 48, color: Colors.success, fontWeight: '700', lineHeight: 54 },

  title: {
    fontSize: FontSize.xxl, fontWeight: '900',
    color: Colors.textPrimary, textAlign: 'center',
    letterSpacing: -0.4, marginBottom: 6,
  },
  pkgName: {
    fontSize: FontSize.base, fontWeight: '700',
    color: Colors.primary, marginBottom: 12,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 14, paddingVertical: 4,
    borderRadius: Radius.full,
  },
  sub: {
    fontSize: FontSize.sm, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl,
  },

  benefitList: {
    width: '100%', gap: 10, marginBottom: Spacing.xl,
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.lg,
  },
  benefitRow: { flexDirection: 'row', alignItems: 'center' },
  benefitText: { color: Colors.textSecondary, fontSize: FontSize.sm },

  btn: {
    backgroundColor: Colors.primary, borderRadius: Radius.xl,
    paddingVertical: 16, paddingHorizontal: 32,
    width: '100%', alignItems: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
    marginBottom: 12,
  },
  btnText: { color: '#fff', fontSize: FontSize.base, fontWeight: '800' },

  btnSecondary: { paddingVertical: 10 },
  btnSecondaryText: { color: Colors.textMuted, fontSize: FontSize.sm, textDecorationLine: 'underline' },
});

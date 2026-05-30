import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

// Floating particle component
function Particle({ delay, x, size, color }: {
  delay: number; x: number; size: number; color: string;
}) {
  const translateY = useRef(new Animated.Value(height + 60)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 3500 + delay,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, { toValue: 0.7, duration: 600, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 600, delay: 2200, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(scale, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 0.5, duration: 500, delay: 2000, useNativeDriver: true }),
          ]),
        ]),
        Animated.parallel([
          Animated.timing(translateY, { toValue: height + 60, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        bottom: 0,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }, { scale }],
      }}
    />
  );
}

const PARTICLES = [
  { x: 0.1, size: 8, color: Colors.primary + 'AA', delay: 0 },
  { x: 0.25, size: 5, color: Colors.secondary + 'BB', delay: 600 },
  { x: 0.4, size: 10, color: Colors.primaryLight + '88', delay: 200 },
  { x: 0.6, size: 6, color: Colors.secondary + 'AA', delay: 900 },
  { x: 0.75, size: 9, color: Colors.primary + 'BB', delay: 400 },
  { x: 0.88, size: 5, color: Colors.success + 'AA', delay: 1100 },
];

export default function WelcomeScreen() {
  // Main content animations
  const logoScale  = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const ring1Scale = useRef(new Animated.Value(0.5)).current;
  const ring2Scale = useRef(new Animated.Value(0.5)).current;
  const ring1Opacity = useRef(new Animated.Value(0)).current;
  const ring2Opacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY      = useRef(new Animated.Value(30)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity  = useRef(new Animated.Value(0)).current;
  const btnY        = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Sequence: rings pulse → logo pops in → title slides up → subtitle → btn
    Animated.sequence([
      // Rings expand
      Animated.parallel([
        Animated.timing(ring1Scale, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(ring1Opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.delay(100),
      ]),
      Animated.parallel([
        Animated.timing(ring2Scale, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(ring2Opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      // Logo pops in with spring feel
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 120, friction: 7, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      // Title
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      // Subtitle
      Animated.timing(subtitleOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      // Button
      Animated.parallel([
        Animated.timing(btnOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(btnY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]).start();

    // Continuously pulse rings
    setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(ring1Scale, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
          Animated.timing(ring1Scale, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    }, 1200);
  }, []);

  return (
    <View style={styles.container}>
      {/* Particles */}
      {PARTICLES.map((p, i) => (
        <Particle key={i} delay={p.delay} x={p.x * width} size={p.size} color={p.color} />
      ))}

      {/* Background glow rings */}
      <Animated.View style={[styles.glowRing2, { transform: [{ scale: ring2Scale }], opacity: ring2Opacity }]} />
      <Animated.View style={[styles.glowRing1, { transform: [{ scale: ring1Scale }], opacity: ring1Opacity }]} />

      {/* Center logo mark */}
      <Animated.View style={[styles.logoMark, { transform: [{ scale: logoScale }], opacity: logoOpacity }]}>
        <View style={styles.logoInner}>
          <Text style={styles.logoEmoji}>🎯</Text>
        </View>
      </Animated.View>

      {/* Title */}
      <Animated.View style={[styles.titleBlock, { opacity: titleOpacity, transform: [{ translateY: titleY }] }]}>
        <Text style={styles.titleSmall}>Selamat datang di</Text>
        <Text style={styles.titleBig}>AI Lolos PTN</Text>
        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
          Platform belajar SNBT paling cerdas di Indonesia.{'\n'}
          Kamu sudah selangkah lebih dekat ke PTN impianmu. 💪
        </Animated.Text>
      </Animated.View>

      {/* Feature highlights — benefit-based, no fake numbers */}
      <Animated.View style={[styles.statsRow, { opacity: subtitleOpacity }]}>
        {[
          { emoji: '🤖', label: 'Analisis AI\nPersonal' },
          { emoji: '📚', label: 'Soal SNBT\nTerstruktur' },
          { emoji: '🎯', label: 'Prediksi\nPeluang Lolos' },
        ].map((s, i) => (
          <View key={i} style={styles.statItem}>
            <Text style={styles.statEmoji}>{s.emoji}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </Animated.View>

      {/* CTA */}
      <Animated.View style={[styles.btnWrap, { opacity: btnOpacity, transform: [{ translateY: btnY }] }]}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.push('/onboarding/challenge')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Atur Profil Belajarku  →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          style={styles.skipBtn}
        >
          <Text style={styles.skipText}>Langsung masuk ke dashboard</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },

  // Glow rings
  glowRing1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: Colors.primary + '50',
    backgroundColor: Colors.primary + '08',
  },
  glowRing2: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    borderWidth: 1,
    borderColor: Colors.primary + '25',
    backgroundColor: 'transparent',
  },

  // Logo mark
  logoMark: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
    marginBottom: Spacing.xxl,
  },
  logoInner: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: { fontSize: 38 },

  // Title block
  titleBlock: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  titleSmall: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  titleBig: {
    color: Colors.textPrimary,
    fontSize: FontSize.hero,
    fontWeight: '900',
    letterSpacing: -1,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.base,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: Spacing.sm,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginBottom: Spacing.xxl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statItem: { alignItems: 'center', gap: 4, flex: 1 },
  statEmoji: {
    fontSize: 28,
    marginBottom: 2,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'center',
    lineHeight: 16,
  },

  // CTA
  btnWrap: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.md,
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 52 : 36,
    paddingHorizontal: Spacing.lg,
  },
  btn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: Radius.xl,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 10,
  },
  btnText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  skipBtn: { paddingVertical: Spacing.sm },
  skipText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textDecorationLine: 'underline',
  },
});

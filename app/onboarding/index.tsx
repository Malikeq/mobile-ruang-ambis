import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Animated,
  ViewToken,
  Platform,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

// ─── Slides Data ─────────────────────────────────────────────────────────────

const SLIDES = [
  {
    id: '1',
    emoji: '🎯',
    tag: 'Platform #1 SNBT',
    title: 'Hai, Calon\nMahasiswa!',
    subtitle: 'Platform belajar SNBT berbasis AI yang dirancang khusus untuk membantumu lolos PTN impian.',
    accent: Colors.primary,
    gradient1: '#0D1B3E',
    gradient2: '#1A2E5A',
    particles: ['⭐', '✨', '💡'],
  },
  {
    id: '2',
    emoji: '📚',
    tag: 'Latihan Soal',
    title: 'Latihan Soal\nTanpa Batas',
    subtitle: 'Ribuan soal SNBT berkualitas tinggi per bab, per mapel, atau full tryout — kapan pun kamu mau.',
    accent: '#3B82F6',
    gradient1: '#0A1628',
    gradient2: '#0F2040',
    particles: ['📖', '✏️', '📝'],
  },
  {
    id: '3',
    emoji: '📊',
    tag: 'Analisis AI',
    title: 'AI Deteksi\nKelemahanmu',
    subtitle: 'AI kami menganalisis pola jawaban dan memberikan rekomendasi belajar yang dipersonalisasi setiap hari.',
    accent: Colors.secondary,
    gradient1: '#1A0E00',
    gradient2: '#2A1800',
    particles: ['📈', '🔍', '💹'],
  },
  {
    id: '4',
    emoji: '🤖',
    tag: 'AI Chat 24/7',
    title: 'Tanya AI,\nDapat Jawaban',
    subtitle: 'Pembahasan soal langkah-demi-langkah, strategi belajar, dan motivasi — AI kami siap 24 jam.',
    accent: Colors.success,
    gradient1: '#061A10',
    gradient2: '#0A2818',
    particles: ['💬', '🧠', '⚡'],
  },
];

// ─── Floating Particles ───────────────────────────────────────────────────────

function FloatingParticle({ emoji, delay, startX }: { emoji: string; delay: number; startX: number }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0.6, duration: 800, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -40, duration: 2000, useNativeDriver: true }),
          Animated.timing(translateX, { toValue: (Math.random() - 0.5) * 30, duration: 2000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -60, duration: 1000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(translateY, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.timing(translateX, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.Text
      style={{
        position: 'absolute',
        left: startX,
        top: height * 0.28,
        fontSize: 22,
        opacity,
        transform: [{ translateY }, { translateX }],
      }}
    >
      {emoji}
    </Animated.Text>
  );
}

// ─── Slide Item ───────────────────────────────────────────────────────────────

function SlideItem({ item, index, scrollX }: {
  item: typeof SLIDES[0]; index: number; scrollX: Animated.Value;
}) {
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

  const scale = scrollX.interpolate({ inputRange, outputRange: [0.82, 1, 0.82], extrapolate: 'clamp' });
  const opacity = scrollX.interpolate({ inputRange, outputRange: [0, 1, 0], extrapolate: 'clamp' });
  const translateY = scrollX.interpolate({ inputRange, outputRange: [40, 0, 40], extrapolate: 'clamp' });
  const emojiScale = scrollX.interpolate({ inputRange, outputRange: [0.5, 1, 0.5], extrapolate: 'clamp' });
  const emojiRotate = scrollX.interpolate({
    inputRange, outputRange: ['-15deg', '0deg', '15deg'], extrapolate: 'clamp',
  });

  return (
    <View style={[styles.slide, { width }]}>
      {/* Background glow */}
      <Animated.View style={[styles.bgGlow, { backgroundColor: item.accent + '18', opacity }]} />

      {/* Floating particles */}
      {item.particles.map((emoji, i) => (
        <FloatingParticle
          key={i}
          emoji={emoji}
          delay={i * 700}
          startX={width * (0.25 + i * 0.25)}
        />
      ))}

      <Animated.View style={[styles.slideContent, { opacity, transform: [{ scale }, { translateY }] }]}>

        {/* Animated emoji orb */}
        <Animated.View style={[
          styles.emojiOrb,
          {
            borderColor: item.accent + '60',
            backgroundColor: item.accent + '18',
            shadowColor: item.accent,
            transform: [{ scale: emojiScale }, { rotate: emojiRotate }],
          },
        ]}>
          <View style={[styles.emojiOrbInner, { backgroundColor: item.accent + '28' }]}>
            <Text style={styles.emojiText}>{item.emoji}</Text>
          </View>
        </Animated.View>

        {/* Tag */}
        <View style={[styles.tagPill, { backgroundColor: item.accent + '20', borderColor: item.accent + '50' }]}>
          <View style={[styles.tagDot, { backgroundColor: item.accent }]} />
          <Text style={[styles.tagText, { color: item.accent }]}>{item.tag}</Text>
        </View>

        {/* Title */}
        <Text style={styles.slideTitle}>{item.title}</Text>

        {/* Underline accent */}
        <View style={[styles.titleAccent, { backgroundColor: item.accent }]} />

        {/* Subtitle */}
        <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
      </Animated.View>
    </View>
  );
}

// ─── Progress Dots ────────────────────────────────────────────────────────────

function ProgressDots({ scrollX, count }: { scrollX: Animated.Value; count: number }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: count }).map((_, i) => {
        const dotWidth = scrollX.interpolate({
          inputRange: [(i - 1) * width, i * width, (i + 1) * width],
          outputRange: [6, 28, 6],
          extrapolate: 'clamp',
        });
        const dotOpacity = scrollX.interpolate({
          inputRange: [(i - 1) * width, i * width, (i + 1) * width],
          outputRange: [0.25, 1, 0.25],
          extrapolate: 'clamp',
        });
        return (
          <Animated.View key={i} style={[styles.dot, { width: dotWidth, opacity: dotOpacity }]} />
        );
      })}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function OnboardingSlides() {
  const scrollX     = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const btnScale    = useRef(new Animated.Value(1)).current;

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) setCurrentIndex(viewableItems[0].index);
  }, []);

  const isLast = currentIndex === SLIDES.length - 1;

  const handleNext = () => {
    // Button press bounce
    Animated.sequence([
      Animated.timing(btnScale, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.timing(btnScale, { toValue: 1,    duration: 120, useNativeDriver: true }),
    ]).start();

    if (!isLast) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      router.push('/onboarding/welcome');
    }
  };

  const currentSlide = SLIDES[currentIndex];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={[styles.logoBadge, { backgroundColor: currentSlide.accent + '25' }]}>
            <Text style={[styles.logoText, { color: currentSlide.accent }]}>AI Lolos PTN</Text>
          </View>
        </View>
        {!isLast && (
          <TouchableOpacity onPress={() => router.push('/onboarding/welcome')} style={styles.skipBtn}>
            <Text style={styles.skipText}>Lewati</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={({ item, index }) => (
          <SlideItem item={item} index={index} scrollX={scrollX} />
        )}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      />

      {/* Bottom */}
      <View style={styles.bottom}>
        <ProgressDots scrollX={scrollX} count={SLIDES.length} />

        {/* Main CTA button */}
        <Animated.View style={{ transform: [{ scale: btnScale }], width: '100%' }}>
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              {
                backgroundColor: isLast ? Colors.secondary : currentSlide.accent,
                shadowColor: isLast ? Colors.secondary : currentSlide.accent,
              },
            ]}
            onPress={handleNext}
            activeOpacity={1}
          >
            <Text style={styles.primaryBtnText}>
              {isLast ? '🚀  Ayo Mulai!' : 'Lanjut  →'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Login link */}
        <TouchableOpacity
          style={styles.loginRow}
          onPress={() => router.push('/auth/login')}
        >
          <Text style={styles.loginText}>
            Sudah punya akun?{'  '}
            <Text style={[styles.loginAccent, { color: currentSlide.accent }]}>Masuk</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: Spacing.md,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoBadge: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: Radius.full,
  },
  logoText: { fontSize: FontSize.sm, fontWeight: '800', letterSpacing: 0.4 },
  skipBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: Radius.full, backgroundColor: Colors.surfaceElevated,
  },
  skipText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: '500' },

  // Slide
  slide: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  bgGlow: {
    position: 'absolute',
    width: width * 1.2, height: width * 1.2,
    borderRadius: width * 0.6,
    top: -width * 0.1, left: -width * 0.1,
  },
  slideContent: { alignItems: 'center', gap: Spacing.md },

  // Emoji orb
  emojiOrb: {
    width: 130, height: 130,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5, shadowRadius: 40,
    elevation: 20,
    marginBottom: Spacing.sm,
  },
  emojiOrbInner: {
    width: 100, height: 100,
    borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  emojiText: { fontSize: 52 },

  // Tag
  tagPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1,
  },
  tagDot: { width: 6, height: 6, borderRadius: 3 },
  tagText: { fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },

  // Text
  slideTitle: {
    color: Colors.textPrimary,
    fontSize: FontSize.xxl + 2,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 42,
    letterSpacing: -0.8,
  },
  titleAccent: {
    width: 48, height: 4, borderRadius: 2, marginTop: -Spacing.sm,
  },
  slideSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.base,
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 310,
    marginTop: Spacing.sm,
  },

  // Dots
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.lg },
  dot: { height: 6, borderRadius: 3, backgroundColor: Colors.primary },

  // Bottom
  bottom: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    alignItems: 'center',
  },
  primaryBtn: {
    width: '100%', paddingVertical: 17,
    borderRadius: Radius.xl, alignItems: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45, shadowRadius: 20, elevation: 10,
  },
  primaryBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '800', letterSpacing: 0.3 },
  loginRow: { marginTop: Spacing.md, paddingVertical: 4 },
  loginText: { color: Colors.textMuted, fontSize: FontSize.sm },
  loginAccent: { fontWeight: '700' },
});

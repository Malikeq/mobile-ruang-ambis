import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, Dimensions, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';

const { width } = Dimensions.get('window');

// ─── Feature Lists ────────────────────────────────────────────────────────────

const PLANS = [
  {
    id: 'premium',
    label: 'Premium',
    badge: '⚡ TERPOPULER',
    badgeColor: Colors.secondary,
    price: '49k',
    period: '/bulan',
    sub: 'atau Rp 399k/tahun · hemat 32%',
    accent: Colors.secondary,
    border: Colors.secondary,
    bg: '#0F1E3C',
    features: [
      { text: 'Soal latihan tidak terbatas', ok: true },
      { text: 'AI Chat 24/7 tanpa batas',   ok: true },
      { text: 'Semua 9 mapel SNBT',          ok: true },
      { text: 'Analisis AI mendalam (DCSEF)',ok: true },
      { text: 'Tryout penuh + ranking nasional', ok: true },
      { text: 'Pembahasan langkah-demi-langkah', ok: true },
      { text: 'Prediksi kelulusan real-time', ok: true },
    ],
    cta: '🎯  Mulai Premium',
    ctaColor: Colors.secondary,
    ctaText: '#000',
    hint: 'Uji coba 7 hari gratis · Batalkan kapan saja',
    featured: true,
  },
  {
    id: 'daypass',
    label: 'Day Pass',
    badge: '🔥 COBA DULU',
    badgeColor: Colors.primary,
    price: '5k',
    period: '/hari',
    sub: 'Akses premium selama 24 jam penuh',
    accent: Colors.primaryLight,
    border: Colors.primaryLight,
    bg: Colors.surface,
    features: [
      { text: 'Semua fitur Premium 24 jam', ok: true },
      { text: 'AI Chat & Analisis DCSEF',   ok: true },
      { text: 'Tryout penuh',               ok: true },
      { text: 'Tidak perlu langganan',      ok: true },
    ],
    cta: '⚡  Beli Day Pass',
    ctaColor: Colors.primary,
    ctaText: '#fff',
    hint: 'Cocok untuk malam sebelum ujian',
    featured: false,
  },
  {
    id: 'free',
    label: 'Gratis',
    badge: null,
    badgeColor: '',
    price: '0',
    period: '/selamanya',
    sub: 'Mulai tanpa kartu kredit',
    accent: Colors.textMuted,
    border: Colors.border,
    bg: Colors.surface,
    features: [
      { text: '10 soal latihan per hari',   ok: true },
      { text: '2 mapel pilihan',             ok: true },
      { text: 'Analisis basic per sesi',    ok: true },
      { text: 'AI Chat & Pembahasan',       ok: false },
      { text: 'Tryout lengkap',             ok: false },
    ],
    cta: 'Mulai Gratis',
    ctaColor: Colors.surfaceElevated,
    ctaText: Colors.textSecondary,
    hint: '',
    featured: false,
  },
];

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({ plan, pulse, onPress }: {
  plan: typeof PLANS[0]; pulse: Animated.Value; onPress: () => void;
}) {
  const card = plan.featured
    ? (
      <Animated.View style={[
        styles.card, styles.cardFeatured,
        { borderColor: plan.border, backgroundColor: plan.bg },
        { transform: [{ scale: pulse }] },
      ]}>
        {/* Badge */}
        <View style={[styles.featuredBadge, { backgroundColor: plan.badgeColor }]}>
          <Text style={styles.featuredBadgeText}>{plan.badge}</Text>
        </View>

        <CardContent plan={plan} onPress={onPress} />
      </Animated.View>
    )
    : (
      <View style={[styles.card, { borderColor: plan.border, backgroundColor: plan.bg }]}>
        {plan.badge && (
          <View style={[styles.smallBadge, { backgroundColor: plan.badgeColor + '25', borderColor: plan.badgeColor + '50' }]}>
            <Text style={[styles.smallBadgeText, { color: plan.badgeColor }]}>{plan.badge}</Text>
          </View>
        )}
        <CardContent plan={plan} onPress={onPress} />
      </View>
    );

  return card;
}

function CardContent({ plan, onPress }: { plan: typeof PLANS[0]; onPress: () => void }) {
  return (
    <>
      {/* Price header */}
      <View style={styles.priceHeader}>
        <Text style={[styles.planLabel, plan.featured && { color: Colors.textPrimary }]}>{plan.label}</Text>
        <View style={styles.priceRow}>
          <Text style={[styles.priceRp, { color: plan.accent }]}>Rp </Text>
          <Text style={[styles.priceNum, { color: plan.featured ? plan.accent : Colors.textPrimary }]}>{plan.price}</Text>
          <Text style={styles.pricePer}>{plan.period}</Text>
        </View>
        {!!plan.sub && <Text style={styles.priceSub}>{plan.sub}</Text>}
      </View>

      {/* Divider */}
      <View style={[styles.divider, plan.featured && { backgroundColor: plan.accent + '40' }]} />

      {/* Features */}
      <View style={styles.featureList}>
        {plan.features.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={[
              styles.featureIcon,
              f.ok
                ? { backgroundColor: plan.featured ? plan.accent : Colors.primary }
                : { backgroundColor: Colors.surfaceElevated },
            ]}>
              <Text style={styles.featureIconText}>{f.ok ? '✓' : '×'}</Text>
            </View>
            <Text style={[styles.featureText, !f.ok && styles.featureTextOff]}>{f.text}</Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={[styles.cta, { backgroundColor: plan.ctaColor },
          plan.featured && {
            shadowColor: plan.accent,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 6,
          },
          !plan.featured && { borderWidth: 1.5, borderColor: plan.border },
        ]}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <Text style={[styles.ctaText, { color: plan.ctaText }]}>{plan.cta}</Text>
      </TouchableOpacity>

      {!!plan.hint && <Text style={styles.hint}>{plan.hint}</Text>}
    </>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function PricingScreen() {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();

    // Gold card heartbeat
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.018, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,     duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const goRegister = () => router.push('/auth/register');

  return (
    <View style={styles.container}>
      <View style={styles.glowBlue} />
      <View style={styles.glowGold} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepText}>Langkah 3 dari 3  ·  Pilih Paket</Text>
            </View>
            <Text style={styles.title}>Pilih Rencana{'\n'}Belajarmu 🚀</Text>
            <Text style={styles.subtitle}>Semua paket bisa di-upgrade kapan saja.</Text>
          </View>

          {/* Plan cards */}
          <View style={styles.cards}>
            {PLANS.map(plan => (
              <PlanCard
                key={plan.id}
                plan={plan}
                pulse={pulseAnim}
                onPress={goRegister}
              />
            ))}
          </View>

          {/* Trust signals */}
          <View style={styles.trustRow}>
            {['🔒 Pembayaran Aman', '✅ 10K+ Pengguna', '🏆 92% Lolos PTN'].map((t, i) => (
              <View key={i} style={styles.trustBadge}>
                <Text style={styles.trustText}>{t}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: Platform.OS === 'ios' ? 40 : 24 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  glowBlue: {
    position: 'absolute', top: -40, left: -80,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: Colors.primary + '12',
  },
  glowGold: {
    position: 'absolute', top: 200, right: -80,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: Colors.secondary + '10',
  },
  scroll: {
    paddingTop: Platform.OS === 'ios' ? 68 : 52,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 32,
  },

  // Header
  header: { marginBottom: Spacing.xl, gap: Spacing.sm },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.success + '18', borderColor: Colors.success + '40',
    borderWidth: 1, borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  stepText: { color: Colors.success, fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 0.5 },
  title: {
    color: Colors.textPrimary, fontSize: FontSize.xxl, fontWeight: '800',
    lineHeight: 36, letterSpacing: -0.4,
  },
  subtitle: { color: Colors.textSecondary, fontSize: FontSize.sm },

  // Cards
  cards: { gap: Spacing.md, marginBottom: Spacing.xl },

  card: {
    borderRadius: Radius.xl, borderWidth: 1.5,
    padding: Spacing.lg, gap: Spacing.md,
    overflow: 'visible',
  },
  cardFeatured: {
    borderWidth: 2,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25, shadowRadius: 24, elevation: 12,
    marginTop: 14, // room for badge
  },

  featuredBadge: {
    position: 'absolute', top: -14, alignSelf: 'center',
    paddingHorizontal: 16, paddingVertical: 5,
    borderRadius: Radius.full,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 8, elevation: 6,
  },
  featuredBadgeText: { color: '#000', fontSize: FontSize.xs, fontWeight: '800', letterSpacing: 1 },

  smallBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: Radius.full, borderWidth: 1,
  },
  smallBadgeText: { fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 0.5 },

  // Price
  priceHeader: { gap: 4 },
  planLabel: { color: Colors.textSecondary, fontSize: FontSize.base, fontWeight: '700' },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  priceRp: { fontSize: FontSize.lg, fontWeight: '700', marginBottom: 4 },
  priceNum: { fontSize: 44, fontWeight: '900', lineHeight: 50, letterSpacing: -1 },
  pricePer: { color: Colors.textMuted, fontSize: FontSize.sm, marginBottom: 8 },
  priceSub: { color: Colors.textMuted, fontSize: FontSize.xs },

  divider: { height: 1, backgroundColor: Colors.border },

  // Features
  featureList: { gap: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureIcon: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  featureIconText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  featureText: { color: Colors.textSecondary, fontSize: FontSize.sm, flex: 1 },
  featureTextOff: { color: Colors.textMuted },

  // CTA
  cta: { paddingVertical: 15, borderRadius: Radius.xl, alignItems: 'center' },
  ctaText: { fontSize: FontSize.base, fontWeight: '800' },
  hint: { color: Colors.textMuted, fontSize: FontSize.xs, textAlign: 'center' },

  // Trust
  trustRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: 8,
  },
  trustBadge: {
    backgroundColor: Colors.surface, borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.border,
  },
  trustText: { color: Colors.textMuted, fontSize: FontSize.xs },
});

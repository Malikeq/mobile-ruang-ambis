import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';
import { useOnboarding } from '@/contexts/OnboardingContext';

const { width } = Dimensions.get('window');

// ─── Challenge Options ────────────────────────────────────────────────────────

const CHALLENGES = [
  { id: 'waktu', emoji: '⏱️', label: 'Waktu Terbatas', desc: 'Sulit mengatur waktu belajar di sela-sela kesibukan' },
  { id: 'susah', emoji: '🧩', label: 'Soal Terlalu Susah', desc: 'Materi SNBT terasa rumit dan bikin frustrasi' },
  { id: 'arah', emoji: '🧭', label: 'Belum Tau Arah', desc: 'Bingung harus mulai dari mana dan belajar apa dulu' },
  { id: 'motivasi', emoji: '😔', label: 'Krisis Motivasi', desc: 'Semangat naik turun, sulit konsisten belajar' },
  { id: 'nilai', emoji: '📉', label: 'Nilai Stagnan', desc: 'Sudah belajar tapi skor tryout tidak naik-naik' },
  { id: 'target', emoji: '🎯', label: 'Target Terlalu Tinggi', desc: 'PTN impian terasa sangat jauh dan tidak realistis' },
];

// ─── Challenge Card ───────────────────────────────────────────────────────────

function ChallengeCard({
  item,
  selected,
  onPress,
}: {
  item: typeof CHALLENGES[0];
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.94, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={1}
        style={[
          styles.card,
          selected && styles.cardSelected,
        ]}
      >
        <View style={[styles.cardEmoji, selected && styles.cardEmojiSelected]}>
          <Text style={styles.emojiText}>{item.emoji}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={[styles.cardLabel, selected && styles.cardLabelSelected]}>
            {item.label}
          </Text>
          <Text style={styles.cardDesc}>{item.desc}</Text>
        </View>
        <View style={[styles.check, selected && styles.checkSelected]}>
          {selected && <Text style={styles.checkMark}>✓</Text>}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ChallengeScreen() {
  const { setSekolah: saveSekolah } = useOnboarding();
  const [selected, setSelected] = useState<string[]>([]);
  const [sekolah,  setSekolah]  = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const toggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    // Save sekolah to OnboardingContext (in-memory, no AsyncStorage needed)
    saveSekolah(sekolah.trim());
    router.push('/onboarding/university');
  };

  return (
    <View style={styles.container}>
      {/* Header glow */}
      <View style={styles.glow} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
          {/* Title section */}
          <View style={styles.titleSection}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepText}>Langkah 1 dari 3</Text>
            </View>
            <Text style={styles.title}>Apa tantangan{'\n'}terbesar kamu?</Text>
            <Text style={styles.subtitle}>
              Pilih satu atau lebih — AI kami akan membuat{'\n'}program belajar yang tepat untukmu.
            </Text>
          </View>

          {/* Sekolah Input */}
          <View style={styles.sekolahSection}>
            <View style={styles.sekolahHeader}>
              <View style={styles.sekolahIcon}>
                <Ionicons name="school-outline" size={18} color={Colors.primaryLight} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sekolahTitle}>Asal Sekolah</Text>
                <Text style={styles.sekolahDesc}>Membantu kami mempersonalisasi rekomendasimu</Text>
              </View>
            </View>
            <TextInput
              style={styles.sekolahInput}
              value={sekolah}
              onChangeText={setSekolah}
              placeholder="Contoh: SMAN 1 Jakarta, MAN 2 Surabaya..."
              placeholderTextColor={Colors.textMuted}
              maxLength={200}
              returnKeyType="done"
            />
          </View>

          {/* Cards */}
          <View style={styles.cardsGrid}>
            {CHALLENGES.map(item => (
              <ChallengeCard
                key={item.id}
                item={item}
                selected={selected.includes(item.id)}
                onPress={() => toggle(item.id)}
              />
            ))}
          </View>

          {/* Skip hint */}
          <TouchableOpacity onPress={handleNext} style={styles.skipHint}>
            <Text style={styles.skipHintText}>Lewati langkah ini →</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottom}>
        <TouchableOpacity
          style={[styles.btn, selected.length === 0 && styles.btnDisabled]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>
            {selected.length > 0
              ? `Lanjut · ${selected.length} dipilih`
              : 'Lewati Langkah Ini'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  glow: {
    position: 'absolute',
    top: -60,
    left: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: Colors.primary + '15',
  },
  scroll: {
    paddingTop: Platform.OS === 'ios' ? 68 : 52,
    paddingBottom: 120,
    paddingHorizontal: Spacing.lg,
  },

  // Title
  titleSection: {
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary + '20',
    borderColor: Colors.primary + '40',
    borderWidth: 1,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: Spacing.sm,
  },
  stepText: {
    color: Colors.primaryLight,
    fontSize: FontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.xl,
    fontWeight: '800',
    lineHeight: 36,
    letterSpacing: -0.4,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 22,
  },

  // Cards
  cardsGrid: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '12',
  },
  cardEmoji: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmojiSelected: {
    backgroundColor: Colors.primary + '25',
  },
  emojiText: {
    fontSize: 24,
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  cardLabel: {
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    fontWeight: '600',
  },
  cardLabelSelected: {
    color: Colors.primaryLight,
  },
  cardDesc: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    lineHeight: 16,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkMark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },

  skipHint: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  skipHintText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },

  // Sekolah
  sekolahSection: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1.5, borderColor: Colors.primary + '30',
    padding: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.lg,
  },
  sekolahHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sekolahIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  sekolahTitle: { color: Colors.textPrimary, fontSize: FontSize.base, fontWeight: '700' },
  sekolahDesc: { color: Colors.textMuted, fontSize: FontSize.xs, lineHeight: 16, marginTop: 1 },
  sekolahInput: {
    backgroundColor: Colors.surfaceElevated, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    color: Colors.textPrimary, fontSize: FontSize.sm,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
  },

  // Bottom
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 44 : 28,
    paddingTop: Spacing.md,
    backgroundColor: Colors.background + 'EE',
  },
  btn: {
    paddingVertical: 16,
    borderRadius: Radius.xl,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  btnDisabled: {
    backgroundColor: Colors.surfaceElevated,
    shadowOpacity: 0,
    elevation: 0,
  },
  btnText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});

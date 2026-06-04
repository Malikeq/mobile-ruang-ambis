import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle, StyleProp } from 'react-native';
import { Colors, Radius, Spacing } from '@/constants/theme';

function useShimmer() {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return opacity;
}

export function SkeletonBox({
  width,
  height,
  borderRadius = Radius.md,
  style,
}: {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const opacity = useShimmer();
  return (
    <Animated.View
      style={[
        sk.box,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

/** Placeholder for analisis overall card */
export function SkeletonAnalisisCard() {
  return (
    <View style={sk.card}>
      <View style={sk.cardTop}>
        <View style={{ flex: 1, gap: Spacing.sm }}>
          <SkeletonBox width="45%" height={10} borderRadius={4} />
          <SkeletonBox width="35%" height={36} borderRadius={8} />
          <SkeletonBox width="55%" height={22} borderRadius={Radius.full} />
        </View>
        <SkeletonBox width={90} height={90} borderRadius={45} />
      </View>
      <SkeletonBox width="100%" height={8} borderRadius={4} style={{ marginTop: Spacing.md }} />
      <View style={sk.pillRow}>
        <SkeletonBox width="30%" height={48} borderRadius={Radius.md} />
        <SkeletonBox width="30%" height={48} borderRadius={Radius.md} />
        <SkeletonBox width="30%" height={48} borderRadius={Radius.md} />
      </View>
    </View>
  );
}

/** Home tab — streak, shortcuts, score hero */
export function SkeletonHome() {
  return (
    <>
      <View style={[sk.row, { marginBottom: Spacing.lg, paddingVertical: 0 }]}>
        <View style={{ flex: 1, gap: 8 }}>
          <SkeletonBox width="55%" height={12} />
          <SkeletonBox width="75%" height={20} />
        </View>
        <SkeletonBox width={46} height={46} borderRadius={23} />
      </View>
      <SkeletonBox width="100%" height={120} borderRadius={Radius.xl} style={{ marginBottom: Spacing.md }} />
      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md }}>
        <SkeletonBox width="48%" height={64} borderRadius={Radius.lg} />
        <SkeletonBox width="48%" height={64} borderRadius={Radius.lg} />
      </View>
      <SkeletonBox width="100%" height={100} borderRadius={Radius.xl} style={{ marginBottom: Spacing.lg }} />
      <SkeletonListRows count={2} />
    </>
  );
}

/** Profil — target PTN cards */
export function SkeletonProfileTargets({ count = 2 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[sk.card, { paddingVertical: Spacing.md }]}>
          <View style={sk.cardTop}>
            <SkeletonBox width={32} height={32} borderRadius={Radius.full} />
            <View style={{ flex: 1, gap: 6 }}>
              <SkeletonBox width="50%" height={14} />
              <SkeletonBox width="70%" height={10} />
            </View>
            <SkeletonBox width={40} height={24} />
          </View>
          <SkeletonBox width="100%" height={8} borderRadius={4} style={{ marginTop: Spacing.md }} />
        </View>
      ))}
    </>
  );
}

/** Riwayat latihan — card-shaped placeholders */
export function SkeletonRiwayatCards({ count = 4 }: { count?: number }) {
  return (
    <View style={{ padding: Spacing.md, gap: Spacing.md }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={sk.riwayatCard}>
          <View style={sk.cardTop}>
            <SkeletonBox width={90} height={24} borderRadius={Radius.full} />
            <SkeletonBox width={72} height={12} borderRadius={4} />
          </View>
          <SkeletonBox width="65%" height={16} borderRadius={6} />
          <View style={sk.riwayatStats}>
            {[0, 1, 2, 3].map(j => (
              <View key={j} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                <SkeletonBox width={36} height={18} borderRadius={4} />
                <SkeletonBox width={44} height={8} borderRadius={3} />
              </View>
            ))}
          </View>
          <SkeletonBox width="100%" height={5} borderRadius={3} />
          <SkeletonBox width="55%" height={10} borderRadius={4} />
        </View>
      ))}
    </View>
  );
}

/** Streak screen — banner + path nodes */
export function SkeletonStreak() {
  return (
    <View style={{ padding: Spacing.md, gap: Spacing.md }}>
      <SkeletonBox width="100%" height={96} borderRadius={Radius.lg} />
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <SkeletonBox width="31%" height={52} borderRadius={Radius.md} />
        <SkeletonBox width="31%" height={52} borderRadius={Radius.md} />
        <SkeletonBox width="31%" height={52} borderRadius={Radius.md} />
      </View>
      {[0, 1, 2, 3].map(i => (
        <View key={i} style={{ alignItems: 'center', paddingVertical: Spacing.sm }}>
          <SkeletonBox width={NODE_SIZE} height={NODE_SIZE} borderRadius={NODE_SIZE / 2} />
        </View>
      ))}
      <SkeletonBox width="100%" height={52} borderRadius={Radius.lg} />
    </View>
  );
}

const NODE_SIZE = 72;

/** Generic list rows */
export function SkeletonListRows({ count = 3 }: { count?: number }) {
  return (
    <View style={sk.card}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[sk.row, i < count - 1 && sk.rowBorder]}>
          <SkeletonBox width={40} height={40} borderRadius={Radius.md} />
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonBox width="60%" height={12} />
            <SkeletonBox width="85%" height={10} />
          </View>
        </View>
      ))}
    </View>
  );
}

const sk = StyleSheet.create({
  box: { backgroundColor: Colors.surfaceElevated },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  pillRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.md, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  riwayatCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 8,
  },
  riwayatStats: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
});

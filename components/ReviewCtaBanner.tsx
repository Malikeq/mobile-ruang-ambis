import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';

interface Props {
  onPress: () => void;
  subtitle?: string;
  compact?: boolean;
}

/** Reusable banner prompting user to open session review */
export function ReviewCtaBanner({ onPress, subtitle, compact }: Props) {
  return (
    <TouchableOpacity
      style={[st.wrap, compact && st.wrapCompact]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={st.iconBox}>
        <Ionicons name="document-text" size={compact ? 18 : 22} color={Colors.secondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={st.title}>Review Jawaban →</Text>
        <Text style={st.sub}>
          {subtitle ?? 'Lihat soal salah, pembahasan, dan opsi yang kamu pilih'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.secondary} />
    </TouchableOpacity>
  );
}

const st = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.secondary + '12',
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.secondary + '45',
    padding: Spacing.md,
    width: '100%',
  },
  wrapCompact: { padding: Spacing.sm, gap: Spacing.sm },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.secondary + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: '800' },
  sub: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2, lineHeight: 16 },
});

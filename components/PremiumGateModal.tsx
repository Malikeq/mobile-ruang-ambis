import React from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, FontSize } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  feature: string;
  description?: string;
}

export function PremiumGateModal({
  visible,
  onClose,
  feature,
  description,
}: Props) {
  const goPricing = () => {
    onClose();
    router.push('/onboarding/pricing');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={st.backdrop} onPress={onClose}>
        <Pressable style={st.card} onPress={e => e.stopPropagation()}>
          <View style={st.iconWrap}>
            <Ionicons name="sparkles" size={28} color={Colors.aiAccent} />
          </View>
          <Text style={st.title}>{feature}</Text>
          <Text style={st.desc}>
            {description ?? 'Fitur ini tersedia untuk paket Premium atau Daily Pass. Upgrade untuk akses penuh.'}
          </Text>
          <TouchableOpacity style={st.primaryBtn} onPress={goPricing} activeOpacity={0.88}>
            <Text style={st.primaryBtnText}>Lihat Paket →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={st.secondaryBtn} onPress={onClose}>
            <Text style={st.secondaryBtnText}>Nanti dulu</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const st = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.aiAccent + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: FontSize.lg,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  desc: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  primaryBtn: {
    width: '100%',
    backgroundColor: Colors.secondary,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  primaryBtnText: { color: '#1A1200', fontSize: FontSize.base, fontWeight: '800' },
  secondaryBtn: { paddingVertical: 10 },
  secondaryBtnText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },
});

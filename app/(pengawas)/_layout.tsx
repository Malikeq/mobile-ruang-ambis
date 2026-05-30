import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing } from '@/constants/theme';

// Pengawas brand colors — emerald green, distinct from student navy
export const PW_GREEN   = '#059669';
export const PW_GREEN_L = '#10B981';
export const PW_BG      = Colors.background;

const TABS = [
  { name: 'index',      label: 'Beranda',  icon: 'home',             iconActive: 'home' },
  { name: 'siswa',      label: 'Siswa',    icon: 'people-outline',   iconActive: 'people' },
  { name: 'ranking',    label: 'Ranking',  icon: 'trophy-outline',   iconActive: 'trophy' },
  { name: 'analisis',   label: 'Analisis', icon: 'bar-chart-outline', iconActive: 'bar-chart' },
  { name: 'pengaturan', label: 'Profil',   icon: 'person-outline',   iconActive: 'person' },
];

export default function PengawasLayout() {
  return (
    <Tabs
      tabBar={(props) => <PengawasTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"      options={{ title: 'Beranda' }} />
      <Tabs.Screen name="siswa"      options={{ title: 'Siswa' }} />
      <Tabs.Screen name="ranking"    options={{ title: 'Ranking' }} />
      <Tabs.Screen name="analisis"   options={{ title: 'Analisis' }} />
      <Tabs.Screen name="pengaturan" options={{ title: 'Profil' }} />
      {/* Hidden screens (navigated to from within tabs) */}
      <Tabs.Screen name="siswa/[id]" options={{ href: null }} />
      <Tabs.Screen name="at-risk"    options={{ href: null }} />
    </Tabs>
  );
}

function PengawasTabBar({ state, navigation }: any) {
  return (
    <View style={tb.wrap}>
      <View style={tb.pill}>
        {/* School indicator */}
        <View style={tb.indicator}>
          <Ionicons name="business" size={9} color={PW_GREEN} />
          <Text style={tb.indicatorText}>Mode Pengawas</Text>
        </View>

        {/* Tab items */}
        <View style={tb.tabRow}>
          {TABS.map((tab, i) => {
            const focused = state.index === i;
            return (
              <TouchableOpacity
                key={tab.name}
                style={tb.tabTouch}
                onPress={() => navigation.navigate(tab.name)}
                activeOpacity={0.75}
                accessibilityRole="tab"
                accessibilityLabel={`${tab.label}, ${focused ? 'dipilih' : ''}`}
                accessibilityState={{ selected: focused }}
              >
                <View style={[tb.tabInner, focused && { backgroundColor: PW_GREEN + '20' }]}>
                  <Ionicons
                    name={(focused ? tab.iconActive : tab.icon) as any}
                    size={20}
                    color={focused ? PW_GREEN : Colors.textMuted}
                  />
                  <Text style={[tb.tabLabel, focused && { color: PW_GREEN_L }]}>
                    {tab.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const tb = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    paddingHorizontal: Spacing.lg,
    backgroundColor: 'transparent',
  },
  pill: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: PW_GREEN,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 16,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 5,
    backgroundColor: PW_GREEN + '10',
    borderBottomWidth: 1,
    borderBottomColor: PW_GREEN + '25',
  },
  indicatorText: {
    color: PW_GREEN,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  tabTouch: {
    flex: 1,
    alignItems: 'center',
    minHeight: 44,
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    minWidth: 56,
  },
  tabLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
});

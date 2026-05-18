import { Tabs } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Platform, View, Text, StyleSheet,
  TouchableOpacity, Animated, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors, FontSize, Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { name: string; label: string; icon: IoniconName; activeIcon: IoniconName }[] = [
  { name: 'index',   label: 'Beranda',  icon: 'home-outline',     activeIcon: 'home'      },
  { name: 'latihan', label: 'Latihan',  icon: 'book-outline',     activeIcon: 'book'      },
  { name: 'explore', label: 'Analisis', icon: 'stats-chart-outline', activeIcon: 'stats-chart' },
  { name: 'profil',  label: 'Profil',   icon: 'person-outline',   activeIcon: 'person'    },
];

const PILL_H   = 64;
const PILL_PAD = 20;
const PILL_W   = width - PILL_PAD * 2;
// Each side has 2 tabs + center button
// Layout: [tab][tab][CENTER 80px][tab][tab]
const SIDE_TABS = 2;
const TAB_W    = (PILL_W - 80) / 4;   // 4 side tabs

function TabItem({ tab, focused, onPress }: {
  tab: typeof TABS[0]; focused: boolean; onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const press = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.82, duration: 70, useNativeDriver: true }),
      Animated.spring(scale,  { toValue: 1, useNativeDriver: true, tension: 200 }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={[st.tabItem, { transform: [{ scale }] }]}>
      <TouchableOpacity style={st.tabTouch} onPress={press} activeOpacity={1}>
        <Ionicons
          name={focused ? tab.activeIcon : tab.icon}
          size={22}
          color={focused ? Colors.primary : Colors.textMuted}
        />
        <Text style={[st.tabLabel, focused && st.tabLabelActive]}>{tab.label}</Text>
        {/* Static dot indicator — no animation to avoid JS-thread loop */}
        <View style={[st.dot, focused ? st.dotActive : st.dotInactive]} />
      </TouchableOpacity>
    </Animated.View>
  );
}

function AICenterButton() {
  const scale   = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1,   duration: 1200, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const press = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200 }),
    ]).start();
    router.push('/ai-chat');
  };

  return (
    <View style={st.centerWrap}>
      {/* Animated glow ring */}
      <Animated.View style={[st.glowRing, { opacity }]} />
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity onPress={press} activeOpacity={1} style={st.centerBtn}>
          <Ionicons name="sparkles" size={26} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
      <Text style={st.centerLabel}>AI Tutor</Text>
    </View>
  );
}

function FloatingTabBar({ state, navigation }: any) {
  const leftRoutes  = state.routes.slice(0, 2);
  const rightRoutes = state.routes.slice(2);

  const emit = (route: any, focused: boolean) => {
    const ev = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!focused && !ev.defaultPrevented) navigation.navigate(route.name);
  };

  return (
    <View style={st.wrapper} pointerEvents="box-none">
      <View style={st.pill}>
        {leftRoutes.map((route: any, i: number) => {
          const tab     = TABS.find(t => t.name === route.name) ?? TABS[0];
          const focused = state.index === i;
          return <TabItem key={route.key} tab={tab} focused={focused} onPress={() => emit(route, focused)} />;
        })}

        <AICenterButton />

        {rightRoutes.map((route: any, i: number) => {
          const realIdx = i + 2;
          const tab     = TABS.find(t => t.name === route.name) ?? TABS[2];
          const focused = state.index === realIdx;
          return <TabItem key={route.key} tab={tab} focused={focused} onPress={() => emit(route, focused)} />;
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs tabBar={(p) => <FloatingTabBar {...p} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index"   options={{ title: 'Beranda' }} />
      <Tabs.Screen name="latihan" options={{ title: 'Latihan' }} />
      <Tabs.Screen name="explore" options={{ title: 'Analisis' }} />
      <Tabs.Screen name="profil"  options={{ title: 'Profil' }} />
    </Tabs>
  );
}

const st = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 12,
    left: PILL_PAD, right: PILL_PAD,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 40,
    height: PILL_H,
    width: PILL_W,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.55,
    shadowRadius: 32,
    elevation: 28,
    overflow: 'visible',
  },
  tabItem: { flex: 1 },
  tabTouch: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 2 },
  tabLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: '600', letterSpacing: 0.1 },
  tabLabelActive: { color: Colors.primary, fontWeight: '800' },
  dot: { height: 3, borderRadius: 2, marginTop: 1 },
  dotActive: { width: 16, backgroundColor: Colors.primary },
  dotInactive: { width: 4, backgroundColor: 'transparent' },

  // Center AI button
  centerWrap: { width: 80, alignItems: 'center', justifyContent: 'center', marginTop: -28, gap: 3 },
  glowRing: {
    position: 'absolute', top: -8, width: 68, height: 68, borderRadius: 34,
    backgroundColor: '#8B5CF6', opacity: 0.35,
  },
  centerBtn: {
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: '#7C3AED',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#fff',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.65,
    shadowRadius: 18,
    elevation: 18,
  },
  centerLabel: { color: '#8B5CF6', fontSize: 9, fontWeight: '800' },
});

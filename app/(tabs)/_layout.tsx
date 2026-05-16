import { Tabs } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Platform, View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, FontSize, Spacing } from '@/constants/theme';

const { width } = Dimensions.get('window');

const TABS = [
  { name: 'index',   label: 'Beranda', icon: 'home'        as const },
  { name: 'latihan', label: 'Latihan', icon: 'book'        as const },
  { name: 'explore', label: 'Analisis',icon: 'bar-chart'   as const },
  { name: 'profil',  label: 'Profil',  icon: 'person'      as const },
];

function FloatingTabBar({ state, navigation }: any) {
  const indicatorAnim = useRef(new Animated.Value(state.index)).current;
  const TAB_W = (width - 40) / TABS.length;

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: state.index, useNativeDriver: true, tension: 80, friction: 12,
    }).start();
  }, [state.index]);

  return (
    <View style={st.wrapper} pointerEvents="box-none">
      <View style={st.pill}>
        {/* Sliding pill indicator */}
        <Animated.View style={[st.indicator, {
          width: TAB_W - 8,
          transform: [{
            translateX: indicatorAnim.interpolate({
              inputRange: [0, TABS.length - 1],
              outputRange: [4, (TABS.length - 1) * TAB_W + 4],
            }),
          }],
        }]} />

        {state.routes.map((route: any, i: number) => {
          const focused = state.index === i;
          const tab = TABS.find(t => t.name === route.name) ?? TABS[0];
          const scale = useRef(new Animated.Value(1)).current;

          const onPress = () => {
            Animated.sequence([
              Animated.timing(scale, { toValue: 0.85, duration: 70, useNativeDriver: true }),
              Animated.spring(scale,  { toValue: 1, useNativeDriver: true, tension: 150 }),
            ]).start();
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <Animated.View key={route.key} style={[st.tabItem, { transform: [{ scale }] }]}>
              <TouchableOpacity style={st.tabTouch} onPress={onPress} activeOpacity={1}>
                <Ionicons
                  name={focused ? tab.icon : `${tab.icon}-outline` as any}
                  size={22}
                  color={focused ? Colors.primary : Colors.textMuted}
                />
                <Text style={[st.tabLabel, focused && st.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index"   options={{ title: 'Beranda' }} />
      <Tabs.Screen name="latihan" options={{ title: 'Latihan' }} />
      <Tabs.Screen name="explore" options={{ title: 'Analisis' }} />
      <Tabs.Screen name="profil"  options={{ title: 'Profil' }} />
    </Tabs>
  );
}

const st = StyleSheet.create({
  wrapper: {
    position: 'absolute', bottom: Platform.OS === 'ios' ? 28 : 16,
    left: 20, right: 20, alignItems: 'center',
  },
  pill: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderRadius: 100, paddingVertical: 8, paddingHorizontal: 4,
    width: width - 40, borderWidth: 1, borderColor: Colors.borderLight,
    shadowColor: '#000', shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5, shadowRadius: 32, elevation: 20, position: 'relative',
  },
  indicator: {
    position: 'absolute', top: 8, height: 50, borderRadius: 90,
    backgroundColor: Colors.primary + '25', borderWidth: 1, borderColor: Colors.primary + '45',
  },
  tabItem: { flex: 1 },
  tabTouch: { alignItems: 'center', justifyContent: 'center', paddingVertical: 6, gap: 3 },
  tabLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: '600', letterSpacing: 0.2 },
  tabLabelActive: { color: Colors.primary, fontWeight: '800' },
});

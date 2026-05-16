import { Tabs } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Platform, View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions,
} from 'react-native';
import { Colors, Radius, FontSize } from '@/constants/theme';

const { width } = Dimensions.get('window');

const TABS = [
  { name: 'index',   label: 'Beranda', icon: '🏠' },
  { name: 'latihan', label: 'Latihan', icon: '📚' },
  { name: 'explore', label: 'Analisis', icon: '📊' },
  { name: 'profil',  label: 'Profil',  icon: '👤' },
];

function FloatingTabBar({ state, descriptors, navigation }: any) {
  const indicatorAnim = useRef(new Animated.Value(state.index)).current;
  const TAB_W = (width - 40) / TABS.length;

  useEffect(() => {
    Animated.spring(indicatorAnim, {
      toValue: state.index,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [state.index]);

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <View style={styles.pill}>
        {/* Sliding indicator */}
        <Animated.View
          style={[
            styles.indicator,
            {
              width: TAB_W - 8,
              transform: [{
                translateX: indicatorAnim.interpolate({
                  inputRange: [0, TABS.length - 1],
                  outputRange: [4, (TABS.length - 1) * TAB_W + 4],
                }),
              }],
            },
          ]}
        />

        {state.routes.map((route: any, i: number) => {
          const focused = state.index === i;
          const tab = TABS.find(t => t.name === route.name) ?? TABS[0];
          const scale = useRef(new Animated.Value(1)).current;

          const onPress = () => {
            Animated.sequence([
              Animated.timing(scale, { toValue: 0.82, duration: 70, useNativeDriver: true }),
              Animated.spring(scale,  { toValue: 1, useNativeDriver: true, tension: 120 }),
            ]).start();
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Animated.View key={route.key} style={[styles.tabItem, { transform: [{ scale }] }]}>
              <TouchableOpacity style={styles.tabTouch} onPress={onPress} activeOpacity={1}>
                <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{tab.icon}</Text>
                <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
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
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"   options={{ title: 'Beranda' }} />
      <Tabs.Screen name="latihan" options={{ title: 'Latihan' }} />
      <Tabs.Screen name="explore" options={{ title: 'Analisis' }} />
      <Tabs.Screen name="profil"  options={{ title: 'Profil' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 28 : 16,
    left: 20, right: 20,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 100,
    paddingVertical: 8,
    paddingHorizontal: 4,
    width: width - 40,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 20,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 8,
    height: 48,
    backgroundColor: Colors.primary + '30',
    borderRadius: 90,
    borderWidth: 1,
    borderColor: Colors.primary + '50',
  },
  tabItem: { flex: 1 },
  tabTouch: { alignItems: 'center', justifyContent: 'center', paddingVertical: 4, gap: 2 },
  tabIcon: { fontSize: 20, opacity: 0.4 },
  tabIconActive: { opacity: 1 },
  tabLabel: { fontSize: 9, color: Colors.textMuted, fontWeight: '600', letterSpacing: 0.2 },
  tabLabelActive: { color: Colors.primary, fontWeight: '800' },
});

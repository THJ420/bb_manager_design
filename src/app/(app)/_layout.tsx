import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { Colors } from '../../theme/colors';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false, // Strictly icons only per design specification
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Live Orders',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <Text style={styles.iconEmoji}>📋</Text>
              {focused && <View style={styles.glowIndicator} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="menu/index"
        options={{
          title: 'Menu & Stock',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <Text style={styles.iconEmoji}>🍔</Text>
              {focused && <View style={styles.glowIndicator} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="tables"
        options={{
          title: 'Dining Tables',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <Text style={styles.iconEmoji}>🪑</Text>
              {focused && <View style={styles.glowIndicator} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics & KPIs',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <Text style={styles.iconEmoji}>📊</Text>
              {focused && <View style={styles.glowIndicator} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="reservations"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="pickup-orders"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Store Settings',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
              <Text style={styles.iconEmoji}>⚙️</Text>
              {focused && <View style={styles.glowIndicator} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    height: 62,
    paddingBottom: 4,
    paddingTop: 4,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
  },
  iconWrapperActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
  },
  iconEmoji: {
    fontSize: 22,
  },
  glowIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
});

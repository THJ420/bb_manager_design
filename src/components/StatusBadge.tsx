import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing } from '../theme/colors';
import { OrderStatus } from '../types';

interface StatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getColors = () => {
    switch (status) {
      case 'new':
        return { bg: Colors.infoMuted, text: Colors.info, label: 'NEW' };
      case 'preparing':
        return { bg: Colors.warningMuted, text: Colors.warning, label: 'PREPARING' };
      case 'ready':
        return { bg: Colors.successMuted, text: Colors.success, label: 'READY' };
      case 'completed':
        return { bg: 'rgba(255, 255, 255, 0.08)', text: Colors.textSecondary, label: 'COMPLETED' };
      case 'cancelled':
        return { bg: Colors.errorMuted, text: Colors.error, label: 'CANCELLED' };
      default:
        return { bg: Colors.surfaceHighlight, text: Colors.textSecondary, label: String(status).toUpperCase() };
    }
  };

  const config = getColors();
  const isSm = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: config.bg, borderColor: `${config.text}40` }, isSm && styles.badgeSm]}>
      <View
        style={[
          styles.indicatorDot,
          {
            backgroundColor: config.text,
            shadowColor: config.text,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: 6,
          },
        ]}
      />
      <Text style={[styles.text, { color: config.text }, isSm && styles.textSm]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  badgeSm: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  indicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
    elevation: 3,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  textSm: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
});

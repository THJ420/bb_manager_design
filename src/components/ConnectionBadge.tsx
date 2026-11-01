import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing } from '../theme/colors';
import { ConnectionStatus } from '../types';

interface ConnectionBadgeProps {
  status: ConnectionStatus;
  pendingOutboxCount?: number;
}

export const ConnectionBadge: React.FC<ConnectionBadgeProps> = ({
  status,
  pendingOutboxCount = 0,
}) => {
  const getConfig = () => {
    switch (status) {
      case 'live':
        return {
          bg: Colors.successMuted,
          color: Colors.success,
          text: 'SSE LIVE',
        };
      case 'polling':
        return {
          bg: Colors.warningMuted,
          color: Colors.warning,
          text: 'POLLING',
        };
      case 'offline':
      default:
        return {
          bg: Colors.errorMuted,
          color: Colors.error,
          text: 'OFFLINE QUEUED',
        };
    }
  };

  const config = getConfig();

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { backgroundColor: config.bg, borderColor: config.color }]}>
        <View style={[styles.dot, { backgroundColor: config.color }]} />
        <Text style={[styles.text, { color: config.color }]}>{config.text}</Text>
      </View>
      {pendingOutboxCount > 0 && (
        <View style={styles.outboxBadge}>
          <Text style={styles.outboxText}>{pendingOutboxCount} pending</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 30,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 6,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  outboxBadge: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: 8,
    height: 24,
    borderRadius: Radius.full,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  outboxText: {
    fontSize: 11,
    color: Colors.warning,
    fontWeight: '600',
  },
});

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Radius, Spacing } from '../theme/colors';
import { Order, OrderStatus } from '../types';
import { StatusBadge } from './StatusBadge';

interface OrderCardProps {
  order: Order;
  onUpdateStatus: (orderId: string, nextStatus: OrderStatus) => void;
  onSelect?: (order: Order) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onUpdateStatus,
  onSelect,
}) => {
  // Format elapsed time or minutes ago
  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const mins = Math.max(1, Math.floor(diffMs / 60000));
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      return `${hrs}h ${mins % 60}m ago`;
    } catch {
      return 'Just now';
    }
  };

  const renderActionButtons = () => {
    switch (order.status) {
      case 'new':
        return (
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.actionButton, { backgroundColor: Colors.primary }]}
            onPress={() => onUpdateStatus(order.id, 'preparing')}
            accessibilityRole="button"
            accessibilityLabel={`Accept order ${order.orderNumber}`}
          >
            <Text style={styles.actionButtonText}>ACCEPT ORDER</Text>
          </TouchableOpacity>
        );
      case 'preparing':
        return (
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.actionButton, { backgroundColor: Colors.success }]}
            onPress={() => onUpdateStatus(order.id, 'ready')}
            accessibilityRole="button"
            accessibilityLabel={`Mark order ${order.orderNumber} as ready`}
          >
            <Text style={[styles.actionButtonText, { color: Colors.textInverse }]}>
              MARK READY FOR PICKUP
            </Text>
          </TouchableOpacity>
        );
      case 'ready':
        return (
          <TouchableOpacity
            activeOpacity={0.85}
            style={[styles.actionButton, { backgroundColor: Colors.slateDark, borderColor: Colors.surfaceBorder, borderWidth: 1 }]}
            onPress={() => onUpdateStatus(order.id, 'completed')}
            accessibilityRole="button"
            accessibilityLabel={`Complete pickup for order ${order.orderNumber}`}
          >
            <Text style={styles.actionButtonText}>COMPLETE PICKUP</Text>
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.card}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.idGroup}>
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          <View style={styles.pickupCodeBadge}>
            <Text style={styles.pickupCodeText}>PIN {order.pickupCode}</Text>
          </View>
        </View>
        <StatusBadge status={order.status} />
      </View>

      {/* Customer Info & Timer Row */}
      <View style={styles.metaRow}>
        <View style={styles.customerGroup}>
          <Text style={styles.customerName}>{order.customerName}</Text>
          <Text style={styles.customerPhone}>{order.customerPhone}</Text>
        </View>
        <View style={styles.timerGroup}>
          <Text style={styles.timerLabel}>Received</Text>
          <Text style={styles.timerValue}>{formatTimeAgo(order.createdAt)}</Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Itemized List */}
      <View style={styles.itemsContainer}>
        {order.items.map((item, idx) => (
          <View key={`${item.id}-${idx}`} style={styles.itemRow}>
            <View style={styles.qtyBadge}>
              <Text style={styles.qtyText}>{item.quantity}x</Text>
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>
              {item.specialInstructions ? (
                <Text style={styles.specialInstructions} numberOfLines={2}>
                  * Note: {item.specialInstructions}
                </Text>
              ) : null}
            </View>
            <Text style={styles.itemPrice}>
              ${(item.unitPrice * item.quantity).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      {/* Total & Action Footer */}
      <View style={styles.footerContainer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total ({order.items.reduce((s, i) => s + i.quantity, 0)} items)</Text>
          <Text style={styles.totalAmount}>${order.totalAmount.toFixed(2)}</Text>
        </View>

        {renderActionButtons()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  idGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  pickupCodeBadge: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  pickupCodeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  customerGroup: {
    flex: 1,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  customerPhone: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  timerGroup: {
    alignItems: 'flex-end',
  },
  timerLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  timerValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.warning,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceBorder,
    marginVertical: Spacing.sm,
  },
  itemsContainer: {
    gap: 8,
    marginBottom: Spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  qtyBadge: {
    backgroundColor: Colors.surfaceHighlight,
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  specialInstructions: {
    fontSize: 12,
    color: Colors.warning,
    marginTop: 2,
    fontStyle: 'italic',
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  footerContainer: {
    gap: Spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  totalAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  actionButton: {
    minHeight: 48,
    height: 48,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
  },
});

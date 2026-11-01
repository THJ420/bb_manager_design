import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Image } from 'react-native';
import { Colors, Radius, Spacing } from '../theme/colors';
import { MenuItem } from '../types';

interface MenuItemCardProps {
  item: MenuItem;
  onToggleStock: (itemId: string, inStock: boolean) => void;
  onEditPrice: (item: MenuItem) => void;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  onToggleStock,
  onEditPrice,
}) => {
  return (
    <View style={[styles.card, !item.inStock && styles.cardOutOfStock]}>
      {/* Category & Status Header */}
      <View style={styles.headerRow}>
        <View style={styles.badgeGroup}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category.toUpperCase()}</Text>
          </View>
          {item.isVisible === false && (
            <View style={styles.hiddenBadge}>
              <Text style={styles.hiddenText}>HIDDEN ON WEB</Text>
            </View>
          )}
        </View>

        <View
          style={[
            styles.stockPill,
            item.inStock ? styles.stockPillIn : styles.stockPillOut,
          ]}
        >
          <View
            style={[
              styles.stockDot,
              { backgroundColor: item.inStock ? Colors.success : Colors.error },
            ]}
          />
          <Text
            style={[
              styles.stockPillText,
              { color: item.inStock ? Colors.success : Colors.error },
            ]}
          >
            {item.inStock ? 'IN STOCK' : 'OUT OF STOCK'}
          </Text>
        </View>
      </View>

      {/* Main Content with Optional Photo */}
      <View style={styles.bodyRow}>
        <View style={styles.textContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {item.description || 'Fresh kitchen preparation'}
          </Text>
        </View>

        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
        ) : (
          <View style={styles.itemImagePlaceholder}>
            <Text style={styles.placeholderIcon}>🍽️</Text>
          </View>
        )}
      </View>

      {/* Footer: Price Button (tap to edit) & Stock Toggle */}
      <View style={styles.footerRow}>
        {/* Tappable Price Button */}
        <TouchableOpacity
          style={styles.priceButton}
          onPress={() => onEditPrice(item)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${item.name}, price $${item.price.toFixed(2)}`}
        >
          <Text style={styles.priceCurrency}>{item.currency}</Text>
          <Text style={styles.priceAmount}>${item.price.toFixed(2)}</Text>
          <Text style={styles.editPriceHint}>TAP TO EDIT</Text>
        </TouchableOpacity>

        {/* Accessible Stock Toggle Control */}
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleText}>
            {item.inStock ? 'Available' : 'Unavailable'}
          </Text>
          <Switch
            value={item.inStock}
            onValueChange={(val) => onToggleStock(item.id, val)}
            trackColor={{ false: '#3F3F46', true: Colors.successMuted }}
            thumbColor={item.inStock ? Colors.success : '#A1A1AA'}
            accessibilityLabel={`Stock status for ${item.name}`}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 2,
  },
  cardOutOfStock: {
    borderColor: 'rgba(239, 68, 68, 0.35)',
    opacity: 0.85,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.6,
  },
  hiddenBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  hiddenText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.warning,
  },
  stockPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  stockPillIn: {
    backgroundColor: Colors.successMuted,
  },
  stockPillOut: {
    backgroundColor: Colors.errorMuted,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  stockPillText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  itemImage: {
    width: 54,
    height: 54,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceHighlight,
  },
  itemImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  placeholderIcon: {
    fontSize: 22,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  priceButton: {
    minHeight: 48,
    justifyContent: 'center',
    paddingRight: Spacing.md,
  },
  priceCurrency: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '700',
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  editPriceHint: {
    fontSize: 9,
    color: Colors.primary,
    fontWeight: '700',
    marginTop: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
  },
  toggleText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
});

import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Colors, Radius, Spacing } from '../theme/colors';

export interface FilterChipOption<T extends string> {
  id: T;
  label: string;
  count?: number;
}

interface HorizontalFilterChipsProps<T extends string> {
  options: FilterChipOption<T>[];
  selectedId: T;
  onSelect: (id: T) => void;
}

export function HorizontalFilterChips<T extends string>({
  options,
  selectedId,
  onSelect,
}: HorizontalFilterChipsProps<T>) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {options.map((opt) => {
          const isSelected = opt.id === selectedId;
          return (
            <TouchableOpacity
              key={opt.id}
              activeOpacity={0.8}
              onPress={() => onSelect(opt.id)}
              style={[
                styles.chip,
                isSelected ? styles.chipSelected : styles.chipUnselected,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  styles.label,
                  isSelected ? styles.labelSelected : styles.labelUnselected,
                ]}
              >
                {opt.label}
              </Text>
              {typeof opt.count === 'number' && (
                <View
                  style={[
                    styles.countBadge,
                    isSelected ? styles.countBadgeSelected : styles.countBadgeUnselected,
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      isSelected ? styles.countTextSelected : styles.countTextUnselected,
                    ]}
                  >
                    {opt.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
    paddingVertical: Spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipUnselected: {
    backgroundColor: Colors.surface,
    borderColor: Colors.surfaceBorder,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  labelSelected: {
    color: Colors.white,
  },
  labelUnselected: {
    color: Colors.textSecondary,
  },
  countBadge: {
    marginLeft: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  countBadgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  countBadgeUnselected: {
    backgroundColor: Colors.surfaceHighlight,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
  },
  countTextSelected: {
    color: Colors.white,
  },
  countTextUnselected: {
    color: Colors.textMuted,
  },
});

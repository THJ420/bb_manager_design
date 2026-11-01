import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '../../theme/colors';
import { Order, OrderStatus } from '../../types';
import { HorizontalFilterChips, FilterChipOption } from '../../components/HorizontalFilterChips';
import { StatusBadge } from '../../components/StatusBadge';
import { enqueueOutboxAction } from '../../db/sqlite';

const INITIAL_LEDGER_ORDERS: Order[] = [
  {
    id: 'ord_101',
    orderNumber: '204',
    branchId: 'branch_dt_01',
    customerName: 'Marcus Sterling',
    customerPhone: '+1 (555) 234-8901',
    status: 'new',
    pickupCode: '8291',
    totalAmount: 34.5,
    createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    notes: 'Extra napkins and fork requested',
    items: [
      { id: 'i1', name: 'Smash Truffle Double Burger', quantity: 2, unitPrice: 14.0 },
      { id: 'i2', name: 'Parmesan Herb Crinkle Fries', quantity: 1, unitPrice: 6.5 },
    ],
  },
  {
    id: 'ord_102',
    orderNumber: '205',
    branchId: 'branch_dt_01',
    customerName: 'Elena Rostova',
    customerPhone: '+1 (555) 876-1234',
    status: 'preparing',
    pickupCode: '4410',
    totalAmount: 22.0,
    createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    items: [
      { id: 'i3', name: 'Crispy Nashville Hot Chicken Bun', quantity: 1, unitPrice: 13.5 },
      { id: 'i4', name: 'House Mango Iced Tea', quantity: 2, unitPrice: 4.25 },
    ],
  },
  {
    id: 'ord_103',
    orderNumber: '206',
    branchId: 'branch_dt_01',
    customerName: 'David K.',
    customerPhone: '+1 (555) 432-9087',
    status: 'ready',
    pickupCode: '9120',
    totalAmount: 16.75,
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    items: [
      { id: 'i5', name: 'Smoked Bacon Avocado Melt', quantity: 1, unitPrice: 12.0 },
      { id: 'i6', name: 'Loaded Queso Dip & Crisps', quantity: 1, unitPrice: 4.75 },
    ],
  },
  {
    id: 'ord_104',
    orderNumber: '207',
    branchId: 'branch_dt_01',
    customerName: 'Sarah Jenkins',
    customerPhone: '+1 (555) 789-0123',
    status: 'completed',
    pickupCode: '1098',
    totalAmount: 48.0,
    createdAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    items: [
      { id: 'i7', name: 'Family Combo Platter (4 Burgers)', quantity: 1, unitPrice: 42.0 },
      { id: 'i8', name: 'Salted Caramel Milkshake', quantity: 1, unitPrice: 6.0 },
    ],
  },
  {
    id: 'ord_105',
    orderNumber: '208',
    branchId: 'branch_dt_01',
    customerName: 'Tyler Vance',
    customerPhone: '+1 (555) 662-8902',
    status: 'completed',
    pickupCode: '3187',
    totalAmount: 29.5,
    createdAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    items: [
      { id: 'i9', name: 'Smash Truffle Double Burger', quantity: 1, unitPrice: 14.0 },
      { id: 'i10', name: 'Crispy Nashville Hot Chicken Bun', quantity: 1, unitPrice: 13.5 },
      { id: 'i11', name: 'House Mango Iced Tea', quantity: 1, unitPrice: 4.25 },
    ],
  },
];

type FilterType = 'all' | OrderStatus;

export default function PickupOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>(INITIAL_LEDGER_ORDERS);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filterOptions = useMemo<FilterChipOption<FilterType>[]>(() => {
    return [
      { id: 'all', label: 'All Ledger', count: orders.length },
      { id: 'new', label: 'Pending', count: orders.filter((o) => o.status === 'new').length },
      { id: 'preparing', label: 'Preparing', count: orders.filter((o) => o.status === 'preparing').length },
      { id: 'ready', label: 'Ready', count: orders.filter((o) => o.status === 'ready').length },
      { id: 'completed', label: 'Completed', count: orders.filter((o) => o.status === 'completed').length },
    ];
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesFilter = selectedFilter === 'all' || o.status === selectedFilter;
      const matchesQuery =
        searchQuery.trim() === '' ||
        o.orderNumber.includes(searchQuery) ||
        o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.pickupCode.includes(searchQuery);
      return matchesFilter && matchesQuery;
    });
  }, [orders, selectedFilter, searchQuery]);

  const advanceOrderStatus = async (orderId: string, nextStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );

    try {
      await enqueueOutboxAction('UPDATE_ORDER_STATUS', { orderId, nextStatus });
    } catch (e) {
      console.warn('Failed to enqueue order status update', e);
    }
  };

  const getNextAction = (status: OrderStatus) => {
    switch (status) {
      case 'new':
        return { label: 'START PREPARATION', next: 'preparing' as OrderStatus, color: Colors.primary };
      case 'preparing':
        return { label: 'MARK READY FOR PICKUP', next: 'ready' as OrderStatus, color: Colors.success };
      case 'ready':
        return { label: 'HAND OVER / COMPLETE', next: 'completed' as OrderStatus, color: Colors.slate };
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.headerTitle}>Pickup Orders Ledger</Text>
          <Text style={styles.subtitle}>Historical ledger & status progression audit</Text>
        </View>

        <View style={styles.ledgerCountPill}>
          <Text style={styles.ledgerCountText}>{orders.length} Records</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by #Order, Customer, or PIN..."
          placeholderTextColor={Colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Horizontal Status Chips */}
      <HorizontalFilterChips
        options={filterOptions}
        selectedId={selectedFilter}
        onSelect={(id) => setSelectedFilter(id)}
      />

      {/* Ledger FlatList */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              setTimeout(() => setIsRefreshing(false), 500);
            }}
            tintColor={Colors.primary}
          />
        }
        renderItem={({ item }) => {
          const action = getNextAction(item.status);
          return (
            <View style={styles.ledgerCard}>
              {/* Header row */}
              <View style={styles.cardHeader}>
                <View style={styles.idGroup}>
                  <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
                  <View style={styles.pinBadge}>
                    <Text style={styles.pinText}>PIN {item.pickupCode}</Text>
                  </View>
                </View>
                <StatusBadge status={item.status} />
              </View>

              {/* Customer Info */}
              <View style={styles.customerRow}>
                <View>
                  <Text style={styles.customerName}>{item.customerName}</Text>
                  <Text style={styles.customerPhone}>{item.customerPhone}</Text>
                </View>
                <Text style={styles.amountText}>${item.totalAmount.toFixed(2)}</Text>
              </View>

              {/* Ledger Items */}
              <View style={styles.itemsLedger}>
                {item.items.map((it, idx) => (
                  <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemQty}>{it.quantity}x</Text>
                    <Text style={styles.itemName}>{it.name}</Text>
                    <Text style={styles.itemPrice}>
                      ${(it.unitPrice * it.quantity).toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Status Advancement Action Button */}
              {action && (
                <TouchableOpacity
                  style={[styles.progressBtn, { backgroundColor: action.color }]}
                  onPress={() => advanceOrderStatus(item.id, action.next)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.progressBtnText}>{action.label}</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  ledgerCountPill: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 10,
    height: 32,
    borderRadius: Radius.full,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  ledgerCountText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  searchBarContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  searchInput: {
    backgroundColor: Colors.surfaceElevated,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 40,
    gap: Spacing.md,
  },
  ledgerCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  idGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  pinBadge: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  pinText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  customerPhone: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  amountText: {
    fontSize: 17,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  itemsLedger: {
    backgroundColor: Colors.surfaceHighlight,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    gap: 4,
    marginBottom: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemQty: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    width: 20,
  },
  itemName: {
    flex: 1,
    fontSize: 12,
    color: Colors.textPrimary,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  progressBtn: {
    minHeight: 46,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  progressBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
  },
});

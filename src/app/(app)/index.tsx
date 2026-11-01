import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  useWindowDimensions,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing } from '../../theme/colors';
import { Order, OrderStatus, ConnectionStatus } from '../../types';
import { HorizontalFilterChips, FilterChipOption } from '../../components/HorizontalFilterChips';
import { OrderCard } from '../../components/OrderCard';
import { ConnectionBadge } from '../../components/ConnectionBadge';
import {
  getCachedOrders,
  cacheOrders,
  enqueueOutboxAction,
  getPendingOutboxActions,
} from '../../db/sqlite';
import { getActiveBranchId } from '../../services/auth';

// Sample Seed Orders for initial restaurant floor demo
const INITIAL_DEMO_ORDERS: Order[] = [
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
    notes: 'Extra napkins and fork',
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
];

type FilterType = 'all' | OrderStatus;

export default function OrdersBoardScreen() {
  const { width } = useWindowDimensions();
  const isTabletSplit = width >= 768;

  const [orders, setOrders] = useState<Order[]>(INITIAL_DEMO_ORDERS);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('live');
  const [pendingOutboxCount, setPendingOutboxCount] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedOrderForSplit, setSelectedOrderForSplit] = useState<Order | null>(
    INITIAL_DEMO_ORDERS[0]
  );

  // Load from SQLite and set up sync
  useEffect(() => {
    loadOrders();
    const interval = setInterval(checkPendingOutbox, 4000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      const branchId = await getActiveBranchId();
      const cached = await getCachedOrders(branchId);
      if (cached && cached.length > 0) {
        setOrders(cached);
      } else {
        await cacheOrders(INITIAL_DEMO_ORDERS);
      }
    } catch {
      // Fallback in-memory
    }
  };

  const checkPendingOutbox = async () => {
    try {
      const actions = await getPendingOutboxActions();
      setPendingOutboxCount(actions.length);
    } catch {}
  };

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );

    try {
      // Queue into SQLite outbox
      await enqueueOutboxAction('UPDATE_ORDER_STATUS', { orderId, nextStatus });
      await checkPendingOutbox();
    } catch (e) {
      console.warn('Failed to enqueue status update', e);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadOrders();
    await checkPendingOutbox();
    setIsRefreshing(false);
  };

  // Status Chip Filters
  const filterOptions = useMemo<FilterChipOption<FilterType>[]>(() => {
    const counts: Record<FilterType, number> = {
      all: orders.length,
      new: orders.filter((o) => o.status === 'new').length,
      preparing: orders.filter((o) => o.status === 'preparing').length,
      ready: orders.filter((o) => o.status === 'ready').length,
      completed: orders.filter((o) => o.status === 'completed').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    };

    return [
      { id: 'all', label: 'All', count: counts.all },
      { id: 'new', label: 'New', count: counts.new },
      { id: 'preparing', label: 'Preparing', count: counts.preparing },
      { id: 'ready', label: 'Ready', count: counts.ready },
      { id: 'completed', label: 'Completed', count: counts.completed },
    ];
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (selectedFilter === 'all') return orders;
    return orders.filter((o) => o.status === selectedFilter);
  }, [orders, selectedFilter]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.headerTitle}>Orders Board</Text>
          <Text style={styles.branchSub}>Downtown Flagship • Station #01</Text>
        </View>
        <ConnectionBadge
          status={connectionStatus}
          pendingOutboxCount={pendingOutboxCount}
        />
      </View>

      {/* Mandatory Horizontal Scrolling Chip Bar (Pinned beneath header) */}
      <HorizontalFilterChips
        options={filterOptions}
        selectedId={selectedFilter}
        onSelect={(id) => setSelectedFilter(id)}
      />

      {/* Main Content Area: Split View for Tablets, Single List for Phones */}
      {isTabletSplit ? (
        <View style={styles.splitWrapper}>
          {/* Left Column: Order Cards List */}
          <View style={styles.splitList}>
            <FlatList
              data={filteredOrders}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <OrderCard
                  order={item}
                  onUpdateStatus={handleUpdateStatus}
                  onSelect={(o) => setSelectedOrderForSplit(o)}
                />
              )}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  tintColor={Colors.primary}
                />
              }
            />
          </View>

          {/* Right Column: Counter Detail & Pickup Verification Pane */}
          <View style={styles.splitDetail}>
            {selectedOrderForSplit ? (
              <View style={styles.detailPane}>
                <Text style={styles.detailHeader}>Counter Pickup Verification</Text>
                <View style={styles.pinBox}>
                  <Text style={styles.pinLabel}>Customer Verification PIN</Text>
                  <Text style={styles.pinCode}>{selectedOrderForSplit.pickupCode}</Text>
                </View>
                <Text style={styles.detailCustomer}>
                  {selectedOrderForSplit.customerName} ({selectedOrderForSplit.customerPhone})
                </Text>
                <View style={styles.detailMetaRow}>
                  <Text style={styles.detailMetaLabel}>Current Status:</Text>
                  <Text style={styles.detailMetaValue}>
                    {selectedOrderForSplit.status.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.detailItemsList}>
                  {selectedOrderForSplit.items.map((i) => (
                    <Text key={i.id} style={styles.detailItemText}>
                      • {i.quantity}x {i.name} (${(i.unitPrice * i.quantity).toFixed(2)})
                    </Text>
                  ))}
                </View>
              </View>
            ) : (
              <View style={styles.emptyDetail}>
                <Text style={styles.emptyDetailText}>Select an order to view pickup details</Text>
              </View>
            )}
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OrderCard order={item} onUpdateStatus={handleUpdateStatus} />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📦</Text>
              <Text style={styles.emptyTitle}>No orders in this stage</Text>
              <Text style={styles.emptySub}>
                All incoming pickup tickets for this filter will appear here immediately.
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
        />
      )}
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
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  branchSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: Spacing.md,
    paddingBottom: 40,
  },
  emptyState: {
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 280,
  },
  splitWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  splitList: {
    flex: 1.2,
    borderRightWidth: 1,
    borderRightColor: Colors.surfaceBorder,
  },
  splitDetail: {
    flex: 0.8,
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
  },
  detailPane: {
    gap: Spacing.md,
  },
  detailHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  pinBox: {
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  pinLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  pinCode: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.primary,
    letterSpacing: 4,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  detailCustomer: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  detailMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailMetaLabel: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  detailMetaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.success,
  },
  detailItemsList: {
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.md,
    borderRadius: 8,
    gap: 8,
  },
  detailItemText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  emptyDetail: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyDetailText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
});

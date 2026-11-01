import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '../../theme/colors';
import { Reservation, ReservationStatus } from '../../types';
import { HorizontalFilterChips, FilterChipOption } from '../../components/HorizontalFilterChips';
import { enqueueOutboxAction } from '../../db/sqlite';

const INITIAL_RESERVATIONS: Reservation[] = [
  {
    id: 'res_101',
    branchId: 'branch_dt_01',
    customerName: 'Jonathan Vance',
    customerPhone: '+1 (555) 781-9921',
    guestCount: 4,
    reservationTime: '6:30 PM (In 20m)',
    tableNumber: 'T-01',
    status: 'upcoming',
    specialRequests: 'High chair needed for toddler. Anniversary celebration.',
  },
  {
    id: 'res_102',
    branchId: 'branch_dt_01',
    customerName: 'Melissa Howard',
    customerPhone: '+1 (555) 349-8812',
    guestCount: 2,
    reservationTime: '7:00 PM (In 50m)',
    tableNumber: 'T-03',
    status: 'upcoming',
    specialRequests: 'Quiet booth requested if possible.',
  },
  {
    id: 'res_103',
    branchId: 'branch_dt_01',
    customerName: 'Derrick Campbell',
    customerPhone: '+1 (555) 912-3301',
    guestCount: 6,
    reservationTime: '6:15 PM',
    tableNumber: 'T-04',
    status: 'arrived',
    specialRequests: 'Separate checks requested.',
  },
  {
    id: 'res_104',
    branchId: 'branch_dt_01',
    customerName: 'Grace Lin',
    customerPhone: '+1 (555) 230-1199',
    guestCount: 3,
    reservationTime: '5:45 PM',
    tableNumber: 'T-02',
    status: 'seated',
  },
];

type FilterType = 'all' | ReservationStatus;

export default function ReservationsScreen() {
  const [reservations, setReservations] = useState<Reservation[]>(INITIAL_RESERVATIONS);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filterOptions = useMemo<FilterChipOption<FilterType>[]>(() => {
    return [
      { id: 'all', label: 'All', count: reservations.length },
      { id: 'upcoming', label: 'Upcoming', count: reservations.filter((r) => r.status === 'upcoming').length },
      { id: 'arrived', label: 'Arrived', count: reservations.filter((r) => r.status === 'arrived').length },
      { id: 'seated', label: 'Seated', count: reservations.filter((r) => r.status === 'seated').length },
    ];
  }, [reservations]);

  const filteredReservations = useMemo(() => {
    if (selectedFilter === 'all') return reservations;
    return reservations.filter((r) => r.status === selectedFilter);
  }, [reservations, selectedFilter]);

  const handleUpdateStatus = async (resId: string, nextStatus: ReservationStatus) => {
    setReservations((prev) =>
      prev.map((r) => (r.id === resId ? { ...r, status: nextStatus } : r))
    );

    try {
      await enqueueOutboxAction('UPDATE_RESERVATION_STATUS', { resId, nextStatus });
    } catch (e) {
      console.warn('Failed to enqueue reservation status update', e);
    }
  };

  const getStatusBadge = (status: ReservationStatus) => {
    switch (status) {
      case 'upcoming':
        return { bg: Colors.infoMuted, text: Colors.info, label: 'UPCOMING' };
      case 'arrived':
        return { bg: Colors.warningMuted, text: Colors.warning, label: 'ARRIVED IN LOBBY' };
      case 'seated':
        return { bg: Colors.successMuted, text: Colors.success, label: 'SEATED' };
      default:
        return { bg: Colors.surfaceHighlight, text: Colors.textMuted, label: status.toUpperCase() };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.headerTitle}>Guest Reservations</Text>
          <Text style={styles.subtitle}>Scheduled table bookings & arrival dispatch</Text>
        </View>

        <View style={styles.summaryBadge}>
          <Text style={styles.summaryBadgeText}>
            {reservations.filter((r) => r.status === 'arrived').length} Waiting in Lobby
          </Text>
        </View>
      </View>

      {/* Horizontal Status Chips */}
      <HorizontalFilterChips
        options={filterOptions}
        selectedId={selectedFilter}
        onSelect={(id) => setSelectedFilter(id)}
      />

      {/* View-Only Reservation Ledger */}
      <FlatList
        data={filteredReservations}
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
          const badge = getStatusBadge(item.status);
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.timeGroup}>
                  <Text style={styles.timeIcon}>⏰</Text>
                  <Text style={styles.timeText}>{item.reservationTime}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                    {badge.label}
                  </Text>
                </View>
              </View>

              <Text style={styles.customerName}>{item.customerName}</Text>
              <Text style={styles.customerPhone}>{item.customerPhone}</Text>

              <View style={styles.metaRow}>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>👥 {item.guestCount} Guests</Text>
                </View>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>🪑 Assigned: {item.tableNumber || 'Unassigned'}</Text>
                </View>
              </View>

              {item.specialRequests && (
                <View style={styles.notesBox}>
                  <Text style={styles.notesText}>Note: {item.specialRequests}</Text>
                </View>
              )}

              {/* Action Controls */}
              <View style={styles.actionsContainer}>
                {item.status === 'upcoming' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: Colors.warning }]}
                    onPress={() => handleUpdateStatus(item.id, 'arrived')}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.actionBtnText, { color: Colors.textInverse }]}>
                      MARK AS ARRIVED
                    </Text>
                  </TouchableOpacity>
                )}

                {item.status === 'arrived' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: Colors.success }]}
                    onPress={() => handleUpdateStatus(item.id, 'seated')}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.actionBtnText, { color: Colors.textInverse }]}>
                      CONFIRM SEATED AT {item.tableNumber || 'TABLE'}
                    </Text>
                  </TouchableOpacity>
                )}

                {item.status === 'seated' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: Colors.surfaceHighlight, borderWidth: 1, borderColor: Colors.surfaceBorder }]}
                    onPress={() => handleUpdateStatus(item.id, 'completed')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.actionBtnText}>COMPLETE DINING SESSION</Text>
                  </TouchableOpacity>
                )}
              </View>
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
  summaryBadge: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: Radius.full,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  summaryBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.warning,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 40,
    gap: Spacing.md,
  },
  card: {
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
  timeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeIcon: {
    fontSize: 16,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  customerPhone: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  pill: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  notesBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
    padding: 8,
    borderRadius: 4,
    marginTop: Spacing.sm,
  },
  notesText: {
    fontSize: 12,
    color: Colors.warning,
    fontStyle: 'italic',
  },
  actionsContainer: {
    marginTop: Spacing.md,
  },
  actionBtn: {
    minHeight: 48,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: Colors.white,
  },
});

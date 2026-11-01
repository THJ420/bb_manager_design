import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '../../theme/colors';
import { DiningTable } from '../../types';
import { enqueueOutboxAction } from '../../db/sqlite';

const INITIAL_TABLES: DiningTable[] = [
  {
    id: 'tbl_01',
    branchId: 'branch_dt_01',
    tableNumber: '1',
    name: 'Table 1',
    capacity: 4,
    isAvailable: true,
  },
  {
    id: 'tbl_02',
    branchId: 'branch_dt_01',
    tableNumber: '2',
    name: 'Table 2',
    capacity: 2,
    isAvailable: false,
    currentGuests: 2,
  },
  {
    id: 'tbl_03',
    branchId: 'branch_dt_01',
    tableNumber: '3',
    name: 'Patio 1',
    capacity: 6,
    isAvailable: true,
  },
  {
    id: 'tbl_04',
    branchId: 'branch_dt_01',
    tableNumber: '4',
    name: 'Patio 2',
    capacity: 4,
    isAvailable: false,
    currentGuests: 3,
  },
  {
    id: 'tbl_05',
    branchId: 'branch_dt_01',
    tableNumber: '5',
    name: 'Bar Booth 1',
    capacity: 2,
    isAvailable: true,
  },
  {
    id: 'tbl_06',
    branchId: 'branch_dt_01',
    tableNumber: '6',
    name: 'Bar Booth 2',
    capacity: 2,
    isAvailable: true,
  },
];

export default function DiningTablesScreen() {
  const { width } = useWindowDimensions();
  const numColumns = width >= 768 ? 2 : 1;

  const [tables, setTables] = useState<DiningTable[]>(INITIAL_TABLES);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTable, setEditingTable] = useState<DiningTable | null>(null);
  const [acceptingReservations, setAcceptingReservations] = useState(true);

  // Exactly two essential fields per specification: Name* and Seating Capacity*
  const [formName, setFormName] = useState('');
  const [formCapacity, setFormCapacity] = useState('4');

  const openCreateModal = () => {
    setEditingTable(null);
    setFormName(`Table ${tables.length + 1}`);
    setFormCapacity('4');
    setModalVisible(true);
  };

  const openEditModal = (table: DiningTable) => {
    setEditingTable(table);
    setFormName(table.name);
    setFormCapacity(table.capacity.toString());
    setModalVisible(true);
  };

  const handleToggleGlobalReservations = async (val: boolean) => {
    setAcceptingReservations(val);
    try {
      await enqueueOutboxAction('UPDATE_STORE_HOURS', { acceptingReservations: val });
      if (!val) {
        Alert.alert(
          'Table Bookings Suspended',
          'Online table reservations are now paused across all website and customer-facing booking portals.'
        );
      }
    } catch (e) {
      console.warn('Failed to enqueue reservation status update', e);
    }
  };

  const handleSaveTable = async () => {
    const capacityNum = parseInt(formCapacity, 10);
    if (!formName.trim()) {
      Alert.alert('Required Field', 'Please enter a valid table name (e.g. Table 4, Patio 1).');
      return;
    }
    if (isNaN(capacityNum) || capacityNum <= 0) {
      Alert.alert('Required Field', 'Please enter a valid seating capacity (e.g. 4, 6, 8).');
      return;
    }

    if (editingTable) {
      const updated: DiningTable = {
        ...editingTable,
        name: formName.trim(),
        capacity: capacityNum,
      };
      setTables((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      await enqueueOutboxAction('UPDATE_TABLE', updated);
    } else {
      const newTable: DiningTable = {
        id: `tbl_${Date.now()}`,
        branchId: 'branch_dt_01',
        tableNumber: (tables.length + 1).toString(),
        name: formName.trim(),
        capacity: capacityNum,
        isAvailable: true,
      };
      setTables((prev) => [...prev, newTable]);
      await enqueueOutboxAction('CREATE_TABLE', newTable);
    }

    setModalVisible(false);
  };

  const availableCount = tables.filter((t) => t.isAvailable).length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <View style={styles.headerTextGroup}>
          <Text style={styles.headerTitle}>Dining Tables</Text>
          <Text style={styles.subtitle}>
            {availableCount} of {tables.length} Tables Available • Branch Floor
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={openCreateModal}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Add dining table"
        >
          <Text style={styles.addBtnText}>+ ADD TABLE</Text>
        </TouchableOpacity>
      </View>

      {/* Prominent Global Reservation Master Switch */}
      <View
        style={[
          styles.globalSwitchBanner,
          !acceptingReservations && styles.globalSwitchBannerSuspended,
        ]}
      >
        <View style={styles.globalSwitchLeft}>
          <View style={styles.globalSwitchStatusRow}>
            <View
              style={[
                styles.globalStatusPill,
                acceptingReservations ? styles.pillLive : styles.pillSuspended,
              ]}
            >
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: acceptingReservations ? Colors.success : Colors.error,
                  },
                ]}
              />
              <Text
                style={[
                  styles.globalStatusText,
                  {
                    color: acceptingReservations ? Colors.success : Colors.error,
                  },
                ]}
              >
                {acceptingReservations ? 'BOOKINGS LIVE' : 'BOOKINGS SUSPENDED'}
              </Text>
            </View>
          </View>
          <Text style={styles.globalSwitchTitle}>Accept Website Table Bookings</Text>
          <Text style={styles.globalSwitchSub}>
            {acceptingReservations
              ? 'Web portal actively accepts online customer reservations.'
              : 'Suspended: Online table bookings disabled across backend.'}
          </Text>
        </View>

        <Switch
          value={acceptingReservations}
          onValueChange={handleToggleGlobalReservations}
          trackColor={{ false: '#3F3F46', true: Colors.successMuted }}
          thumbColor={acceptingReservations ? Colors.success : Colors.error}
        />
      </View>

      {/* Tables Grid */}
      <FlatList
        key={numColumns}
        data={tables}
        numColumns={numColumns}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={numColumns > 1 ? styles.gridCol : styles.singleCol}>
            <View style={[styles.card, !item.isAvailable && styles.cardOccupied]}>
              <View style={styles.cardHeader}>
                <Text style={styles.tableName}>{item.name}</Text>
                <View
                  style={[
                    styles.statusPill,
                    item.isAvailable ? styles.pillAvailable : styles.pillOccupied,
                  ]}
                >
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: item.isAvailable ? Colors.success : Colors.warning },
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusPillText,
                      { color: item.isAvailable ? Colors.success : Colors.warning },
                    ]}
                  >
                    {item.isAvailable ? 'AVAILABLE' : 'OCCUPIED'}
                  </Text>
                </View>
              </View>

              <Text style={styles.tableMeta}>
                Seating Capacity: {item.capacity} Guests
              </Text>

              {/* Action row: Edit specs button (individual switch removed per requirement) */}
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={styles.editSpecsBtn}
                  onPress={() => openEditModal(item)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.editSpecsText}>EDIT DETAILS</Text>
                </TouchableOpacity>

                <View style={styles.tableTagBadge}>
                  <Text style={styles.tableTagText}>TABLE #{item.tableNumber}</Text>
                </View>
              </View>
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
      />

      {/* Streamlined Create / Edit Modal (Exactly 2 Fields: Name* and Seating Capacity*) */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {editingTable ? 'Edit Dining Table' : 'Create Dining Table'}
            </Text>
            <Text style={styles.modalSubtitle}>
              Configure table name and guest seating capacity.
            </Text>

            {/* Field 1: Name* */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Name *</Text>
              <TextInput
                style={styles.input}
                value={formName}
                onChangeText={setFormName}
                placeholder="e.g. Table 4, Patio 1, Booth Alpha"
                placeholderTextColor={Colors.textMuted}
                autoFocus
              />
            </View>

            {/* Field 2: Seating Capacity* */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Seating Capacity *</Text>
              <TextInput
                style={styles.input}
                value={formCapacity}
                onChangeText={setFormCapacity}
                keyboardType="number-pad"
                placeholder="e.g. 4, 6, 8"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveTable}>
                <Text style={styles.saveBtnText}>
                  {editingTable ? 'Save Changes' : 'Create Table'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerTextGroup: {
    flex: 1,
    paddingRight: Spacing.md,
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
  addBtn: {
    flexShrink: 0,
    minWidth: 110,
    height: 44,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  columnWrapper: {
    gap: Spacing.md,
  },
  singleCol: {
    width: '100%',
  },
  gridCol: {
    flex: 1,
  },
  card: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  cardOccupied: {
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  tableName: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  pillAvailable: {
    backgroundColor: Colors.successMuted,
  },
  pillOccupied: {
    backgroundColor: Colors.warningMuted,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tableMeta: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  editSpecsBtn: {
    minHeight: 44,
    justifyContent: 'center',
  },
  editSpecsText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tableTagBadge: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  tableTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.5,
  },
  globalSwitchBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  globalSwitchBannerSuspended: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  globalSwitchLeft: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  globalSwitchStatusRow: {
    marginBottom: 4,
  },
  globalStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  pillLive: {
    backgroundColor: Colors.successMuted,
  },
  pillSuspended: {
    backgroundColor: Colors.errorMuted,
  },
  globalStatusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  globalSwitchTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  globalSwitchSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalBox: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Colors.surfaceElevated,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHighlight,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  saveBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
});

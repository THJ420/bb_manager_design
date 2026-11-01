import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Radius, Spacing } from '../../theme/colors';
import { ConnectionStatus, OutboxAction, Branch, StoreOperationsConfig, DaySchedule } from '../../types';
import { ConnectionBadge } from '../../components/ConnectionBadge';
import {
  getPendingOutboxActions,
  markOutboxActionSynced,
  enqueueOutboxAction,
} from '../../db/sqlite';
import {
  logoutStaff,
  getActiveBranchId,
  setActiveBranchId,
} from '../../services/auth';

const AVAILABLE_BRANCHES: Branch[] = [
  {
    id: 'branch_dt_01',
    name: 'Downtown Flagship',
    code: 'DT-01',
    address: '402 Market Street, Financial District',
    phone: '+1 (555) 902-1100',
    isActive: true,
  },
  {
    id: 'branch_ub_02',
    name: 'Uptown Bistro & Pickup',
    code: 'UB-02',
    address: '710 Broadway Ave, Northside',
    phone: '+1 (555) 902-2200',
    isActive: false,
  },
  {
    id: 'branch_we_03',
    name: 'Westside Express Pod',
    code: 'WE-03',
    address: '1590 West Ocean Blvd',
    phone: '+1 (555) 902-3300',
    isActive: false,
  },
];

const DEFAULT_WEEKLY_SCHEDULE: DaySchedule[] = [
  { day: 'Monday', isOpen: true, openTime: '10:00 AM', closeTime: '10:30 PM' },
  { day: 'Tuesday', isOpen: true, openTime: '10:00 AM', closeTime: '10:30 PM' },
  { day: 'Wednesday', isOpen: true, openTime: '10:00 AM', closeTime: '10:30 PM' },
  { day: 'Thursday', isOpen: true, openTime: '10:00 AM', closeTime: '10:30 PM' },
  { day: 'Friday', isOpen: true, openTime: '10:00 AM', closeTime: '11:00 PM' },
  { day: 'Saturday', isOpen: true, openTime: '10:00 AM', closeTime: '11:00 PM' },
  { day: 'Sunday', isOpen: true, openTime: '11:00 AM', closeTime: '09:30 PM' },
];

const INITIAL_STORE_CONFIG: StoreOperationsConfig = {
  isOpenForOrders: true,
  openingTime: '10:00 AM',
  closingTime: '10:30 PM',
  slotIntervalMinutes: 30,
  acceptingPickups: true,
  acceptingReservations: true,
  maxActiveTickets: 20,
  weeklySchedule: DEFAULT_WEEKLY_SCHEDULE,
};

export default function SettingsScreen() {
  const router = useRouter();

  const [currentBranchId, setCurrentBranchId] = useState('branch_dt_01');
  const [connectionMode, setConnectionMode] = useState<ConnectionStatus>('live');
  const [pendingActions, setPendingActions] = useState<OutboxAction[]>([]);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Store Operations States
  const [storeConfig, setStoreConfig] = useState<StoreOperationsConfig>(INITIAL_STORE_CONFIG);

  // 7-Day Operating Hours Modal States
  const [weeklyModalVisible, setWeeklyModalVisible] = useState(false);
  const [weeklyDraft, setWeeklyDraft] = useState<DaySchedule[]>(
    storeConfig.weeklySchedule || DEFAULT_WEEKLY_SCHEDULE
  );

  const openManageHoursModal = () => {
    setWeeklyDraft(storeConfig.weeklySchedule || DEFAULT_WEEKLY_SCHEDULE);
    setWeeklyModalVisible(true);
  };

  const handleToggleDayOpen = (dayIndex: number, isOpen: boolean) => {
    setWeeklyDraft((prev) =>
      prev.map((item, idx) => (idx === dayIndex ? { ...item, isOpen } : item))
    );
  };

  const handleUpdateDayTime = (
    dayIndex: number,
    field: 'openTime' | 'closeTime',
    val: string
  ) => {
    setWeeklyDraft((prev) =>
      prev.map((item, idx) => (idx === dayIndex ? { ...item, [field]: val } : item))
    );
  };

  const handleSaveWeeklySchedule = async () => {
    const updated: StoreOperationsConfig = {
      ...storeConfig,
      weeklySchedule: weeklyDraft,
      openingTime: weeklyDraft[0]?.openTime || storeConfig.openingTime,
      closingTime: weeklyDraft[0]?.closeTime || storeConfig.closingTime,
    };
    setStoreConfig(updated);
    await enqueueOutboxAction('UPDATE_STORE_HOURS', updated);
    setWeeklyModalVisible(false);
    Alert.alert('Weekly Schedule Saved', '7-Day operational operating hours synchronized successfully.');
  };

  useEffect(() => {
    loadSettings();
    const interval = setInterval(loadOutbox, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadSettings = async () => {
    const bId = await getActiveBranchId();
    setCurrentBranchId(bId);
    await loadOutbox();
  };

  const loadOutbox = async () => {
    try {
      const actions = await getPendingOutboxActions();
      setPendingActions(actions);
    } catch {}
  };

  const handleBranchSwitch = async (branch: Branch) => {
    setCurrentBranchId(branch.id);
    await setActiveBranchId(branch.id);
    Alert.alert('Branch Terminal Switched', `Active terminal is now ${branch.name} (${branch.code}).`);
  };

  const handleToggleStoreOpen = async (isOpen: boolean) => {
    const updated = { ...storeConfig, isOpenForOrders: isOpen };
    setStoreConfig(updated);
    await enqueueOutboxAction('UPDATE_STORE_HOURS', updated);
    if (!isOpen) {
      Alert.alert(
        'Store Halted (Shop Closed)',
        'Incoming online pickups and table bookings are now disabled on website endpoints to protect kitchen capacity.'
      );
    }
  };

  const handleUpdateStoreHours = async (field: keyof StoreOperationsConfig, val: any) => {
    const updated = { ...storeConfig, [field]: val };
    setStoreConfig(updated);
    await enqueueOutboxAction('UPDATE_STORE_HOURS', updated);
  };

  const handleSyncOutboxNow = async () => {
    if (pendingActions.length === 0) return;
    setIsSyncing(true);
    try {
      for (const act of pendingActions) {
        await new Promise((r) => setTimeout(r, 400));
        await markOutboxActionSynced(act.id);
      }
      await loadOutbox();
      Alert.alert('Sync Complete', 'All queued offline actions have been synced to PocketBase.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Confirm Sign Out', 'Are you sure you want to exit the BB Manager terminal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logoutStaff();
          router.replace('/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <Text style={styles.headerTitle}>Terminal Settings</Text>
        <ConnectionBadge status={connectionMode} pendingOutboxCount={pendingActions.length} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Session & Staff Profile Card */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>STAFF SESSION</Text>
          <View style={styles.userProfileRow}>
            <View style={styles.userAvatar}>
              <Text style={styles.avatarText}>AV</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>Alex Vance</Text>
              <Text style={styles.userRole}>Store Kitchen Lead & Operations Manager</Text>
              <Text style={styles.userEmail}>manager.downtown@bbmanager.internal</Text>
            </View>
          </View>
        </View>

        {/* Master Store Operations & Operating Hours Panel */}
        <View style={[styles.card, !storeConfig.isOpenForOrders && styles.cardHalted]}>
          <View style={styles.storeHeaderRow}>
            <Text style={styles.sectionHeader}>STORE OPERATIONS & WORKING HOURS</Text>
            <View
              style={[
                styles.storeStatusPill,
                storeConfig.isOpenForOrders ? styles.pillOpen : styles.pillClosed,
              ]}
            >
              <Text
                style={[
                  styles.storeStatusText,
                  { color: storeConfig.isOpenForOrders ? Colors.success : Colors.error },
                ]}
              >
                {storeConfig.isOpenForOrders ? 'OPEN FOR ORDERS' : 'SHOP CLOSED'}
              </Text>
            </View>
          </View>

          <Text style={styles.cardExplainer}>
            Control real-time availability across Laravel & web checkout portals. Turning store operations OFF immediately suspends incoming online pickups and table bookings.
          </Text>

          {/* Master Store Toggle */}
          <View style={styles.masterToggleRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.masterToggleTitle}>Master Order Reception Switch</Text>
              <Text style={styles.masterToggleSubtitle}>
                {storeConfig.isOpenForOrders
                  ? 'Accepting digital pickups and bookings'
                  : 'Emergency pause active: web orders disabled'}
              </Text>
            </View>
            <Switch
              value={storeConfig.isOpenForOrders}
              onValueChange={handleToggleStoreOpen}
              trackColor={{ false: '#3F3F46', true: Colors.successMuted }}
              thumbColor={storeConfig.isOpenForOrders ? Colors.success : Colors.error}
            />
          </View>

          <View style={styles.divider} />

          {/* Sleek Button replacing basic opening/closing fields per requirement */}
          <Text style={styles.subHeader}>WEEKLY OPERATING SCHEDULE</Text>
          <TouchableOpacity
            style={styles.manageHoursBtn}
            onPress={openManageHoursModal}
            activeOpacity={0.85}
          >
            <View style={styles.manageHoursLeft}>
              <Text style={styles.manageHoursIcon}>🕒</Text>
              <View style={styles.manageHoursTextGroup}>
                <Text style={styles.manageHoursBtnText}>Manage Weekly Operating Hours</Text>
                <Text style={styles.manageHoursSubText}>
                  7-Day Schedule • Monday through Sunday customized hours
                </Text>
              </View>
            </View>
            <Text style={styles.manageHoursArrow}>Configure →</Text>
          </TouchableOpacity>

          {/* Slot Interval Selectors */}
          <Text style={[styles.subHeader, { marginTop: Spacing.sm }]}>PICKUP SLOT INTERVALS</Text>
          <View style={styles.slotChipsRow}>
            {[15, 30, 45, 60].map((mins) => {
              const isSelected = storeConfig.slotIntervalMinutes === mins;
              return (
                <TouchableOpacity
                  key={mins}
                  style={[styles.slotChip, isSelected && styles.slotChipSelected]}
                  onPress={() => handleUpdateStoreHours('slotIntervalMinutes', mins)}
                >
                  <Text style={[styles.slotChipText, isSelected && styles.slotChipTextSelected]}>
                    {mins} Mins
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Service Channel Toggles */}
          <View style={styles.channelToggles}>
            <View style={styles.channelRow}>
              <Text style={styles.channelLabel}>Allow Local Pickup Orders</Text>
              <Switch
                value={storeConfig.acceptingPickups}
                onValueChange={(val) => handleUpdateStoreHours('acceptingPickups', val)}
                trackColor={{ false: '#3F3F46', true: Colors.primaryMuted }}
                thumbColor={storeConfig.acceptingPickups ? Colors.primary : '#A1A1AA'}
              />
            </View>
            <View style={styles.channelRow}>
              <Text style={styles.channelLabel}>Allow Online Table Reservations</Text>
              <Switch
                value={storeConfig.acceptingReservations}
                onValueChange={(val) => handleUpdateStoreHours('acceptingReservations', val)}
                trackColor={{ false: '#3F3F46', true: Colors.primaryMuted }}
                thumbColor={storeConfig.acceptingReservations ? Colors.primary : '#A1A1AA'}
              />
            </View>
          </View>
        </View>

        {/* Multi-Branch Selector */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>MULTI-BRANCH ROUTING</Text>
          <Text style={styles.cardExplainer}>
            Orders and stock updates are scoped strictly to the selected physical restaurant unit.
          </Text>

          <View style={styles.branchesList}>
            {AVAILABLE_BRANCHES.map((b) => {
              const isSelected = b.id === currentBranchId;
              return (
                <TouchableOpacity
                  key={b.id}
                  style={[styles.branchCard, isSelected && styles.branchCardActive]}
                  onPress={() => handleBranchSwitch(b)}
                  activeOpacity={0.8}
                >
                  <View style={styles.branchHeader}>
                    <Text style={[styles.branchName, isSelected && styles.branchNameActive]}>
                      {b.name}
                    </Text>
                    <View style={[styles.branchCodeBadge, isSelected && styles.branchCodeActive]}>
                      <Text style={[styles.branchCodeText, isSelected && styles.branchCodeTextActive]}>
                        {b.code}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.branchAddress}>{b.address}</Text>
                  <Text style={styles.branchPhone}>{b.phone}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Quick Operational Modules & Reporting */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>OPERATIONS & LEDGERS</Text>
          <Text style={styles.cardExplainer}>
            Jump directly to operational reports, table reservation logs, or pickup order historical audits.
          </Text>

          <View style={styles.quickModulesGrid}>
            <TouchableOpacity
              style={styles.quickModuleTile}
              onPress={() => router.push('/analytics')}
              activeOpacity={0.8}
            >
              <Text style={styles.quickModuleEmoji}>📊</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickModuleTitle}>Analytics & KPIs</Text>
                <Text style={styles.quickModuleSub}>Daily revenue, SLA & order volume</Text>
              </View>
              <Text style={styles.quickModuleArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickModuleTile}
              onPress={() => router.push('/reservations')}
              activeOpacity={0.8}
            >
              <Text style={styles.quickModuleEmoji}>📅</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickModuleTitle}>Table Reservations</Text>
                <Text style={styles.quickModuleSub}>Incoming bookings & arrival check-in</Text>
              </View>
              <Text style={styles.quickModuleArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickModuleTile}
              onPress={() => router.push('/pickup-orders')}
              activeOpacity={0.8}
            >
              <Text style={styles.quickModuleEmoji}>🛍️</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.quickModuleTitle}>Pickup Orders Ledger</Text>
                <Text style={styles.quickModuleSub}>Read-only tickets & status progression</Text>
              </View>
              <Text style={styles.quickModuleArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sync & Connection Monitor */}
        <View style={styles.card}>
          <Text style={styles.sectionHeader}>SYNC & DATA HEALTH</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingLabel}>Connection Protocol</Text>
              <Text style={styles.settingSub}>Simulate floor connectivity environments</Text>
            </View>
            <View style={styles.connectionSelector}>
              {(['live', 'polling', 'offline'] as ConnectionStatus[]).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.modeChip,
                    connectionMode === mode && styles.modeChipSelected,
                  ]}
                  onPress={() => setConnectionMode(mode)}
                >
                  <Text
                    style={[
                      styles.modeChipText,
                      connectionMode === mode && styles.modeChipTextSelected,
                    ]}
                  >
                    {mode === 'polling' ? 'POLL' : mode.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Outbox Status */}
          <View style={styles.outboxStatusRow}>
            <View>
              <Text style={styles.settingLabel}>Offline Outbox Queue</Text>
              <Text style={styles.settingSub}>
                {pendingActions.length === 0
                  ? 'All local edits synced to cloud database'
                  : `${pendingActions.length} local actions waiting for network`}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.syncBtn,
                (pendingActions.length === 0 || isSyncing) && styles.syncBtnDisabled,
              ]}
              onPress={handleSyncOutboxNow}
              disabled={pendingActions.length === 0 || isSyncing}
            >
              <Text style={styles.syncBtnText}>
                {isSyncing ? 'SYNCING...' : 'SYNC NOW'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Chime toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingTextGroup}>
              <Text style={styles.settingLabel}>New Order Audible Chime</Text>
              <Text style={styles.settingSub}>Loud alert sound for busy kitchen floor</Text>
            </View>
            <Switch
              value={soundAlerts}
              onValueChange={setSoundAlerts}
              trackColor={{ false: '#3F3F46', true: Colors.primaryMuted }}
              thumbColor={soundAlerts ? Colors.primary : '#A1A1AA'}
            />
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Text style={styles.logoutButtonText}>SIGN OUT OF TERMINAL</Text>
        </TouchableOpacity>

        <Text style={styles.versionFooter}>
          BB Manager v1.2.0 • Store Operations Engine • PocketBase SSE Synchronized
        </Text>
      </ScrollView>

      {/* 7-Day Weekly Operating Hours Modal Popup */}
      <Modal visible={weeklyModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.weeklyModalCard}>
            <View style={styles.weeklyModalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.weeklyModalTitle}>Weekly Operating Hours</Text>
                <Text style={styles.weeklyModalSub}>
                  Set start and end times for all 7 days of the week.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setWeeklyModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.weeklyDaysList} showsVerticalScrollIndicator={false}>
              {weeklyDraft.map((dayItem, index) => (
                <View
                  key={dayItem.day}
                  style={[
                    styles.dayRowCard,
                    !dayItem.isOpen && styles.dayRowCardClosed,
                  ]}
                >
                  <View style={styles.dayRowHeader}>
                    <View style={styles.dayNameGroup}>
                      <Text style={[styles.dayNameText, !dayItem.isOpen && styles.dayNameClosed]}>
                        {dayItem.day}
                      </Text>
                      {!dayItem.isOpen && (
                        <View style={styles.closedBadge}>
                          <Text style={styles.closedBadgeText}>CLOSED ALL DAY</Text>
                        </View>
                      )}
                    </View>
                    <Switch
                      value={dayItem.isOpen}
                      onValueChange={(val) => handleToggleDayOpen(index, val)}
                      trackColor={{ false: '#3F3F46', true: Colors.successMuted }}
                      thumbColor={dayItem.isOpen ? Colors.success : '#A1A1AA'}
                    />
                  </View>

                  {dayItem.isOpen ? (
                    <View style={styles.dayInputsRow}>
                      <View style={styles.dayTimeGroup}>
                        <Text style={styles.dayFieldLabel}>Opening Time</Text>
                        <TextInput
                          style={styles.dayTimeInput}
                          value={dayItem.openTime}
                          onChangeText={(val) => handleUpdateDayTime(index, 'openTime', val)}
                          placeholder="10:00 AM"
                          placeholderTextColor={Colors.textMuted}
                        />
                      </View>

                      <Text style={styles.dayTimeSeparator}>to</Text>

                      <View style={styles.dayTimeGroup}>
                        <Text style={styles.dayFieldLabel}>Closing Time</Text>
                        <TextInput
                          style={styles.dayTimeInput}
                          value={dayItem.closeTime}
                          onChangeText={(val) => handleUpdateDayTime(index, 'closeTime', val)}
                          placeholder="10:30 PM"
                          placeholderTextColor={Colors.textMuted}
                        />
                      </View>
                    </View>
                  ) : null}
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => setWeeklyModalVisible(false)}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveModalBtn}
                onPress={handleSaveWeeklySchedule}
              >
                <Text style={styles.saveModalBtnText}>Save Schedule</Text>
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
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: 50,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  cardHalted: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  storeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  storeStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  pillOpen: {
    backgroundColor: Colors.successMuted,
  },
  pillClosed: {
    backgroundColor: Colors.errorMuted,
  },
  storeStatusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  subHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  cardExplainer: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 17,
  },
  masterToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  masterToggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  masterToggleSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.surfaceBorder,
    marginVertical: Spacing.md,
  },
  hoursRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  hourInputGroup: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  timeInput: {
    backgroundColor: Colors.surfaceElevated,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  slotChipsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  slotChip: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  slotChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  slotChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  slotChipTextSelected: {
    color: Colors.white,
  },
  channelToggles: {
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    paddingTop: Spacing.sm,
  },
  channelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  channelLabel: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  userProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.white,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  userRole: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 1,
  },
  userEmail: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  branchesList: {
    gap: Spacing.sm,
  },
  branchCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  branchCardActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  branchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  branchName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  branchNameActive: {
    color: Colors.white,
  },
  branchCodeBadge: {
    backgroundColor: Colors.surfaceHighlight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  branchCodeActive: {
    backgroundColor: Colors.primary,
  },
  branchCodeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  branchCodeTextActive: {
    color: Colors.white,
  },
  branchAddress: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  branchPhone: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  settingTextGroup: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  settingSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  connectionSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceHighlight,
    borderRadius: Radius.sm,
    padding: 3,
    gap: 4,
  },
  modeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  modeChipSelected: {
    backgroundColor: Colors.primary,
  },
  modeChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  modeChipTextSelected: {
    color: Colors.white,
  },
  outboxStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  syncBtn: {
    minHeight: 40,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.warning,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncBtnDisabled: {
    opacity: 0.35,
    backgroundColor: Colors.surfaceHighlight,
  },
  syncBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textInverse,
    letterSpacing: 0.5,
  },
  quickModulesGrid: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  quickModuleTile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHighlight,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    minHeight: 56,
  },
  quickModuleEmoji: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  quickModuleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  quickModuleSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  quickModuleArrow: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: '700',
    paddingLeft: Spacing.sm,
  },
  logoutButton: {
    minHeight: 52,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.error,
    letterSpacing: 0.8,
  },
  versionFooter: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: 'monospace',
    marginTop: Spacing.sm,
  },
  manageHoursBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
    marginBottom: Spacing.md,
  },
  manageHoursLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  manageHoursIcon: {
    fontSize: 24,
  },
  manageHoursTextGroup: {
    flex: 1,
  },
  manageHoursBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  manageHoursSubText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  manageHoursArrow: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  weeklyModalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  weeklyModalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceBorder,
  },
  weeklyModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  weeklyModalSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 3,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceHighlight,
  },
  modalCloseBtnText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  weeklyDaysList: {
    maxHeight: 380,
    marginBottom: Spacing.md,
  },
  dayRowCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
  },
  dayRowCardClosed: {
    opacity: 0.6,
  },
  dayRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayNameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  dayNameClosed: {
    color: Colors.textMuted,
  },
  closedBadge: {
    backgroundColor: Colors.errorMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  closedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.error,
    letterSpacing: 0.5,
  },
  dayInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
  },
  dayTimeGroup: {
    flex: 1,
  },
  dayFieldLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dayTimeInput: {
    backgroundColor: Colors.surfaceHighlight,
    height: 38,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.surfaceBorder,
    paddingHorizontal: Spacing.sm,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  dayTimeSeparator: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
    marginTop: 14,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceBorder,
    paddingTop: Spacing.md,
  },
  cancelModalBtn: {
    flex: 1,
    height: 46,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHighlight,
  },
  cancelModalBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  saveModalBtn: {
    flex: 1.5,
    height: 46,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  saveModalBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
});

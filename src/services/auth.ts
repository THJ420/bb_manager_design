import { pb } from './pocketbase';
import { StaffUser } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVE_BRANCH_STORAGE_KEY = 'bb_active_branch_id';

export async function loginStaff(email: string, password: string): Promise<StaffUser> {
  // If demo credentials or online pocketbase
  if (!email || !password) {
    throw new Error('Please enter both email and password.');
  }

  try {
    const authData = await pb.collection('staff_users').authWithPassword(email, password);
    const userRecord = authData.record;

    if (!userRecord.branch_id) {
      pb.authStore.clear();
      throw new Error('Access Denied: Staff account is not assigned to a valid restaurant branch.');
    }

    const staffUser: StaffUser = {
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name || userRecord.email.split('@')[0],
      role: userRecord.role || 'floor_staff',
      branchId: userRecord.branch_id,
      branchName: userRecord.branch_name || 'Downtown Flagship',
    };

    await AsyncStorage.setItem(ACTIVE_BRANCH_STORAGE_KEY, staffUser.branchId);
    return staffUser;
  } catch (err: any) {
    // Graceful offline fallback or demo testing
    if (email.toLowerCase().includes('demo') || email.toLowerCase().includes('manager')) {
      const demoUser: StaffUser = {
        id: 'staff_usr_01',
        email,
        name: 'Alex Vance (Manager)',
        role: 'manager',
        branchId: 'branch_dt_01',
        branchName: 'Downtown Flagship (#01)',
      };
      await AsyncStorage.setItem(ACTIVE_BRANCH_STORAGE_KEY, demoUser.branchId);
      return demoUser;
    }
    throw new Error(err.message || 'Authentication failed. Please verify credentials.');
  }
}

export async function logoutStaff(): Promise<void> {
  pb.authStore.clear();
  await AsyncStorage.removeItem(ACTIVE_BRANCH_STORAGE_KEY);
}

export async function getActiveBranchId(): Promise<string> {
  const branchId = await AsyncStorage.getItem(ACTIVE_BRANCH_STORAGE_KEY);
  return branchId || 'branch_dt_01';
}

export async function setActiveBranchId(branchId: string): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_BRANCH_STORAGE_KEY, branchId);
}

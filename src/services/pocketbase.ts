import PocketBase, { AsyncAuthStore } from 'pocketbase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PB_AUTH_STORAGE_KEY = 'pb_staff_auth';
const DEFAULT_PB_URL = process.env.EXPO_PUBLIC_POCKETBASE_URL || 'https://pocketbase.example.internal';

// Custom persistent auth store backed by AsyncStorage for React Native
export const customAuthStore = new AsyncAuthStore({
  save: async (serialized: string) => {
    try {
      await AsyncStorage.setItem(PB_AUTH_STORAGE_KEY, serialized);
    } catch (e) {
      console.warn('Failed to save PocketBase auth session', e);
    }
  },
  initial: AsyncStorage.getItem(PB_AUTH_STORAGE_KEY).then((v) => v || '').catch(() => ''),
  clear: async () => {
    try {
      await AsyncStorage.removeItem(PB_AUTH_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear PocketBase auth session', e);
    }
  },
});

export const pb = new PocketBase(DEFAULT_PB_URL, customAuthStore);

/**
 * Configure PocketBase custom backend URL if self-hosted per enterprise branch
 */
export function setPocketBaseUrl(url: string) {
  if (url && url.startsWith('http')) {
    pb.baseUrl = url;
  }
}

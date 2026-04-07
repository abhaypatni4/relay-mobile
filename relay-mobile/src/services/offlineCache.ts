import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { createMMKV } from 'react-native-mmkv';

const mmkv = createMMKV({ id: 'relay-query-cache' });

const clientStorage = {
  getItem: (key: string): string | null => mmkv.getString(key) ?? null,
  setItem: (key: string, value: string): void => {
    mmkv.set(key, value);
  },
  removeItem: (key: string): void => {
    mmkv.remove(key);
  },
};

export const queryPersister = createSyncStoragePersister({
  storage: clientStorage,
  key: 'RELAY_REACT_QUERY',
});

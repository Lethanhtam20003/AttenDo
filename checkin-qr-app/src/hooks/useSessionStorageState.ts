import { useCallback, useSyncExternalStore } from 'react';

const SESSION_STORAGE_UPDATE_EVENT = 'session-storage-update';

export function useSessionStorageState(key: string, initialValue: string) {
  const subscribe = useCallback((onStoreChange: () => void) => {
    if (typeof window === 'undefined') {
      return () => {};
    }
    window.addEventListener(SESSION_STORAGE_UPDATE_EVENT, onStoreChange);
    return () => window.removeEventListener(SESSION_STORAGE_UPDATE_EVENT, onStoreChange);
  }, []);

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      return sessionStorage.getItem(key) ?? initialValue;
    } catch {
      return initialValue;
    }
  }, [initialValue, key]);

  const getServerSnapshot = useCallback(() => initialValue, [initialValue]);
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (nextValue: string) => {
      if (typeof window === 'undefined') {
        return;
      }
      try {
        sessionStorage.setItem(key, nextValue);
        window.dispatchEvent(new Event(SESSION_STORAGE_UPDATE_EVENT));
      } catch {
        // ignore storage errors (e.g. private mode quotas)
      }
    },
    [key]
  );

  return [value, setValue] as const;
}
